import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import {
  generateHmacSha256,
  mapOrderStatus,
  mapPaymentMethod,
  findProductIdByVariantId,
  sendOrderEmails
} from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Order Details API call with 15-second timeout ───────────────────────────

async function fetchShiprocketOrderDetails(
  shiprocketOrderId: string,
  apiKey: string,
  secretKey: string
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const detailPayload = {
    order_id: String(shiprocketOrderId),
    timestamp: new Date().toISOString()
  };
  const sig = await generateHmacSha256(secretKey, JSON.stringify(detailPayload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(
      "https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Api-HMAC-SHA256": sig
        },
        body: JSON.stringify(detailPayload),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch (_) { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data, text };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return { ok: false, status: 504, data: null, text: "Shiprocket Order Details request timed out after 15s" };
    }
    throw err;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Missing Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve existing mapping (UUID → local order, or Shiprocket ID string)
    let mapping = null;
    if (orderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data } = await supabase
        .from("shiprocket_orders")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      mapping = data;
    } else {
      const { data } = await supabase
        .from("shiprocket_orders")
        .select("*")
        .eq("shiprocket_order_id", String(orderId))
        .maybeSingle();
      mapping = data;
    }

    // ── Self-healing: mapping not yet created by webhook ──────────────────────
    if (!mapping) {
      console.log(`Mapping not found for orderId: ${orderId}. Attempting self-healing order creation.`);

      const shiprocketOrderId = String(orderId);
      const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
      let orderDetails: any = null;

      if (isMock) {
        orderDetails = {
          order_id: shiprocketOrderId,
          status: "completed",
          amount: 749,
          payment_method: "cod",
          tax_amount: 0,
          shipping_amount: 50,
          discount_amount: 0,
          shipping_address: {
            first_name: "Mock", last_name: "Customer",
            address_line1: "123 Mock Street", address_line2: "",
            city: "Mumbai", state: "Maharashtra", postcode: "400001",
            phone: "9999999999", email: "mockcustomer@example.com"
          },
          items: [{ variant_id: "default", quantity: 1, price: 749, name: "Follicle 8 Hair Growth Serum" }]
        };
      } else {
        const result = await fetchShiprocketOrderDetails(shiprocketOrderId, apiKey, secretKey);
        if (!result.ok) {
          console.error("Failed to fetch order details during self-healing:", result.text);
          return new Response(
            JSON.stringify({ error: `No Shiprocket mapping found and failed to fetch details (Status: ${result.status})` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        orderDetails = result.data?.data || result.data;
      }

      // Double-check in case webhook created the mapping in the meantime
      const { data: doubleCheckMap } = await supabase
        .from("shiprocket_orders")
        .select("*")
        .eq("shiprocket_order_id", shiprocketOrderId)
        .maybeSingle();

      if (doubleCheckMap) {
        mapping = doubleCheckMap;
      } else {
        // Resolve customer profile
        let userId = null;
        if (orderDetails.shipping_address?.email) {
          const { data: pEmail } = await supabase.from("profiles").select("id")
            .ilike("email", orderDetails.shipping_address.email.trim()).maybeSingle();
          if (pEmail) userId = pEmail.id;
        }
        if (!userId && orderDetails.shipping_address?.phone) {
          const { data: pPhone } = await supabase.from("profiles").select("id")
            .eq("phone", orderDetails.shipping_address.phone).maybeSingle();
          if (pPhone) userId = pPhone.id;
        }

        const localStatus = mapOrderStatus(orderDetails.status);
        const mappedPayment = mapPaymentMethod(orderDetails.payment_method);
        const localPaymentStatus = (mappedPayment === "shiprocket_cod" && localStatus !== "delivered") ? "unpaid" : "paid";

        const totalVal = Number(orderDetails.amount || 0);
        const taxVal = Number(orderDetails.tax_amount || (totalVal * 0.18));
        const shippingVal = Number(orderDetails.shipping_amount || 0);
        const discountVal = Number(orderDetails.discount_amount || 0);
        const subtotalVal = totalVal - taxVal - shippingVal + discountVal;
        const billingAddr = orderDetails.billing_address || orderDetails.shipping_address || null;
        const fastrrId = orderDetails.fastrr_order_id || orderDetails.order_id || null;
        const totalPayable = Number(orderDetails.total_amount_payable || orderDetails.amount || 0);

        const { data: newOrder, error: orderCreateError } = await supabase
          .from("orders")
          .insert({
            user_id: userId,
            country: "India",
            currency: "INR",
            subtotal: subtotalVal,
            tax_amount: taxVal,
            shipping_amount: shippingVal,
            discount_amount: discountVal,
            coupon_code: orderDetails.coupon_code || null,
            total_amount: totalVal,
            order_status: localStatus,
            payment_status: localPaymentStatus,
            payment_method: mappedPayment,
            delivery_estimate: orderDetails.edd || "3-5 business days",
            fastrr_order_id: fastrrId,
            billing_address: billingAddr,
            total_amount_payable: totalPayable,
            shipping_address: orderDetails.shipping_address ? {
              firstName: orderDetails.shipping_address.first_name,
              lastName: orderDetails.shipping_address.last_name,
              address: orderDetails.shipping_address.address_line1 + (orderDetails.shipping_address.address_line2 ? `, ${orderDetails.shipping_address.address_line2}` : ""),
              city: orderDetails.shipping_address.city,
              state: orderDetails.shipping_address.state,
              postcode: orderDetails.shipping_address.postcode,
              country: "India",
              phone: orderDetails.shipping_address.phone,
              email: orderDetails.shipping_address.email
            } : null,
            customer_email: orderDetails.shipping_address?.email,
            customer_phone: orderDetails.shipping_address?.phone,
            customer_name: orderDetails.shipping_address?.first_name ? `${orderDetails.shipping_address.first_name} ${orderDetails.shipping_address.last_name || ""}`.trim() : null,
            is_guest: !userId,
            source: "Shiprocket",
            platform: "Web",
            gateway_response: orderDetails,
            market: "IN",
          } as any)
          .select()
          .single();

        if (orderCreateError) throw orderCreateError;

        // Payment record
        await supabase.from("payments").insert({
          order_id: newOrder.id,
          payment_method: mappedPayment,
          payment_status: localPaymentStatus,
          amount: totalPayable,
          transaction_id: fastrrId,
          raw_response: orderDetails
        });

        // Order items + inventory deduction
        const createdItems = [];
        if (orderDetails.items && Array.isArray(orderDetails.items)) {
          for (const item of orderDetails.items) {
            const prod = await findProductIdByVariantId(supabase, item.variant_id);
            const orderItemPayload = {
              order_id: newOrder.id,
              product_id: prod?.id || null,
              product_name: item.name || prod?.name || "Scalvea Product",
              quantity: item.quantity,
              price: item.price,
              currency: "INR"
            };
            await supabase.from("order_items").insert(orderItemPayload as any);
            createdItems.push(orderItemPayload);

            if (prod) {
              const prevQty = prod.inventory_quantity ?? 0;
              const newQty = Math.max(0, prevQty - item.quantity);
              await supabase.from("products").update({ inventory_quantity: newQty }).eq("id", prod.id);
              await supabase.from("inventory_logs").insert({
                product_id: prod.id,
                change_amount: -item.quantity,
                previous_quantity: prevQty,
                new_quantity: newQty,
                reason: `Shiprocket Order ${shiprocketOrderId} (Self-Healed)`
              } as any);
            }
          }
        }

        // Mapping record
        const { data: newMapping, error: finalMapError } = await supabase
          .from("shiprocket_orders")
          .insert({
            order_id: newOrder.id,
            shiprocket_order_id: shiprocketOrderId,
            tracking_id: orderDetails.tracking_id || null,
            courier_name: orderDetails.courier_name || null
          } as any)
          .select()
          .single();

        if (finalMapError) throw finalMapError;

        mapping = newMapping;
        await sendOrderEmails(supabase, newOrder, createdItems);
      }
    }

    // ── Fetch latest order details (authoritative source) ─────────────────────
    const shiprocketOrderId = mapping.shiprocket_order_id;
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    let orderDetails: any = null;

    if (isMock) {
      orderDetails = {
        order_id: String(shiprocketOrderId),
        status: "completed",
        amount: 749,
        payment_method: "cod",
        tax_amount: 0,
        shipping_amount: 50,
        discount_amount: 0,
        shipping_address: {
          first_name: "Mock", last_name: "Customer",
          address_line1: "123 Mock Street", address_line2: "",
          city: "Mumbai", state: "Maharashtra", postcode: "400001",
          phone: "9999999999", email: "mockcustomer@example.com"
        },
        items: []
      };
    } else {
      const result = await fetchShiprocketOrderDetails(shiprocketOrderId, apiKey, secretKey);
      if (!result.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch order details from Shiprocket" }),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      orderDetails = result.data;
    }

    // Update local order with latest values from Shiprocket (authoritative)
    const localStatus = mapOrderStatus(orderDetails.status);
    const mappedPayment = mapPaymentMethod(orderDetails.payment_method);
    const localPaymentStatus = (mappedPayment === "shiprocket_cod" && localStatus !== "delivered") ? "unpaid" : "paid";
    const billingAddr = orderDetails.billing_address || orderDetails.shipping_address || null;
    const fastrrId = orderDetails.fastrr_order_id || orderDetails.order_id || null;
    const totalPayable = Number(orderDetails.total_amount_payable || orderDetails.amount || 0);

    await supabase
      .from("orders")
      .update({
        order_status: localStatus,
        payment_status: localPaymentStatus,
        payment_method: mappedPayment,
        fastrr_order_id: fastrrId,
        billing_address: billingAddr,
        total_amount_payable: totalPayable,
        updated_at: new Date().toISOString()
      })
      .eq("id", mapping.order_id);

    // Idempotent payment record
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("transaction_id", fastrrId)
      .eq("payment_status", localPaymentStatus)
      .maybeSingle();

    if (!existingPayment) {
      await supabase.from("payments").insert({
        order_id: mapping.order_id,
        payment_method: mappedPayment,
        payment_status: localPaymentStatus,
        amount: totalPayable,
        transaction_id: fastrrId,
        raw_response: orderDetails
      });
    }

    const { data: updatedMapping } = await supabase
      .from("shiprocket_orders")
      .update({
        tracking_id: orderDetails.tracking_id || mapping.tracking_id,
        courier_name: orderDetails.courier_name || mapping.courier_name
      })
      .eq("id", mapping.id)
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        order_details: orderDetails,
        mapping: updatedMapping
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
