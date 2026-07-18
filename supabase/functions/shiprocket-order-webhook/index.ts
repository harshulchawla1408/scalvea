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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-signature-sha256, x-signature-hmac, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.text();
    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey) {
      console.error("Missing Shiprocket credentials");
      return new Response(
        JSON.stringify({ error: "Missing Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Incoming Shiprocket webhook body length:", rawBody.length);

    // ── Webhook Signature Verification ────────────────────────────────────────
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    const signatureHeader =
      req.headers.get("x-signature") ||
      req.headers.get("x-signature-sha256") ||
      req.headers.get("x-signature-hmac") ||
      req.headers.get("x-api-hmac-sha256") || "";

    let signatureVerified = false;
    if (isMock) {
      signatureVerified = true;
    } else {
      const computedBase64 = await generateHmacSha256(secretKey, rawBody, "base64");
      const computedHex = await generateHmacSha256(secretKey, rawBody, "hex");
      if (
        signatureHeader === computedBase64 ||
        signatureHeader.toLowerCase() === computedHex.toLowerCase()
      ) {
        signatureVerified = true;
        console.log("Signature verified successfully.");
      }
    }

    if (!signatureVerified) {
      console.error("Signature verification failed. Got header:", signatureHeader);
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = JSON.parse(rawBody);
    const { order_id: shiprocketOrderId, status, phone, email, payment_type, amount } = body;

    if (!shiprocketOrderId) {
      return new Response(
        JSON.stringify({ error: "Missing shiprocket order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check if order already exists (Initial Check) ─────────────────────────
    const { data: existingMapping, error: mappingError } = await supabase
      .from("shiprocket_orders")
      .select("*, orders(*)")
      .eq("shiprocket_order_id", String(shiprocketOrderId))
      .maybeSingle();

    if (mappingError) throw mappingError;

    if (existingMapping) {
      console.log(`Order ${shiprocketOrderId} already processed. Updating status.`);
      const mappedStatus = mapOrderStatus(status);
      const prevStatus = existingMapping.orders?.order_status;
      
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };
      
      if (mappedStatus && mappedStatus !== prevStatus) {
        updatePayload.order_status = mappedStatus;
      }
      
      if (body.tracking_id || body.courier_name) {
        if (body.tracking_id) {
          updatePayload.tracking_number = body.tracking_id;
          updatePayload.awb = body.awb_code || body.tracking_id;
        }
        if (body.courier_name) {
          updatePayload.courier = body.courier_name;
        }
      }

      await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", existingMapping.order_id);
        
      if (mappedStatus && mappedStatus !== prevStatus) {
        await supabase
          .from("order_status_history")
          .insert({
            order_id: existingMapping.order_id,
            previous_status: prevStatus,
            new_status: mappedStatus,
            changed_by: "Shiprocket Webhook"
          } as any);
      }

      if (body.tracking_id || body.courier_name) {
        await supabase
          .from("shiprocket_orders")
          .update({
            tracking_id: body.tracking_id || existingMapping.tracking_id,
            courier_name: body.courier_name || existingMapping.courier_name
          })
          .eq("id", existingMapping.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Order status updated successfully", order_id: existingMapping.order_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── New order: fetch details from Shiprocket (authoritative source) ───────
    let orderDetails: any = null;

    try {
      if (!isMock) {
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
          if (res.ok) {
            const rawData = await res.json();
            orderDetails = rawData.data || rawData;
          } else {
            console.error("Failed to fetch order details from Shiprocket. Using webhook payload fallbacks.");
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          console.error("Order Details fetch error:", fetchErr.name === "AbortError" ? "Timed out after 15s" : fetchErr.message);
        }
      }
    } catch (err) {
      console.error("Error calling Shiprocket Order Details API:", err);
    }

    // Fallback: construct orderDetails from webhook body when Details API fails
    if (!orderDetails) {
      // Parse financial amounts from the Shiprocket webhook body.
      // The webhook body contains the authoritative totals; never default to 0.
      const bodyTotal = Number(body.total_amount_payable || body.amount || body.subtotal_price || 0);
      const bodyShipping = Number(body.shipping_charges || body.shipping_amount || 0);
      const bodyDiscount = Number(body.total_discount || body.coupon_discount || body.prepaid_discount || 0);
      const bodyCod = Number(body.cod_charges || 0);
      const bodyTax = bodyTotal > 0 ? Number(body.tax_amount || 0) : 0;

      orderDetails = {
        order_id: String(shiprocketOrderId),
        status: body.status || status || "completed",
        amount: bodyTotal,
        tax_amount: bodyTax,
        shipping_amount: bodyShipping,
        discount_amount: bodyDiscount,
        cod_charges: bodyCod,
        payment_method: body.payment_type || payment_type || "cod",
        shipping_address: body.shipping_address ? {
          first_name: body.shipping_address.first_name || body.shipping_address.name || "Shiprocket",
          last_name: body.shipping_address.last_name || "",
          address_line1: body.shipping_address.address_line1 || body.shipping_address.address || "India Address Flow",
          address_line2: body.shipping_address.address_line2 || "",
          city: body.shipping_address.city || "Mumbai",
          state: body.shipping_address.state || "Maharashtra",
          postcode: body.shipping_address.pincode || body.shipping_address.postcode || "400001",
          phone: body.shipping_address.phone || phone || "9999999999",
          email: body.shipping_address.email || email || "customer@example.com"
        } : {
          first_name: "Shiprocket",
          last_name: "Customer",
          address_line1: "India Address Flow",
          address_line2: "",
          city: "Mumbai",
          state: "Maharashtra",
          postcode: "400001",
          phone: phone || "9999999999",
          email: email || "customer@example.com"
        },
        items: []
      };

      // Prefer cart_data.items from webhook body (contains variant_id)
      const cartItems = body.cart_data?.items || body.items;
      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        orderDetails.items = cartItems.map((it: any) => ({
          variant_id: String(it.variant_id || it.product_id || ""),
          quantity: Number(it.quantity || 1),
          price: Number(it.price || it.selling_price || 0),
          name: it.name || it.product_name || "Scalvea Product"
        }));
      } else {
        console.error("Critical: Webhook payload missing cart_data.items and API fetch failed. Order will have no items.");
        // Continue creating the order shell — at least record the payment amount.
        // Admin will need to manually reconcile items via shiprocket_webhook_logs.
      }

      if (body.billing_address) {
        orderDetails.billing_address = body.billing_address;
      }
    }


    // ── Resolve customer profile ───────────────────────────────────────────────
    let userId = null;
    if (orderDetails.shipping_address.email) {
      const { data: pEmail } = await supabase.from("profiles").select("id")
        .ilike("email", orderDetails.shipping_address.email.trim()).maybeSingle();
      if (pEmail) userId = pEmail.id;
    }
    if (!userId && orderDetails.shipping_address.phone) {
      const { data: pPhone } = await supabase.from("profiles").select("id")
        .eq("phone", orderDetails.shipping_address.phone).maybeSingle();
      if (pPhone) userId = pPhone.id;
    }

    // ── Map statuses ──────────────────────────────────────────────────────────
    const localStatus = mapOrderStatus(orderDetails.status || status);
    const mappedPayment = mapPaymentMethod(orderDetails.payment_method || payment_type);
    const localPaymentStatus = (mappedPayment === "shiprocket_cod" && localStatus !== "delivered") ? "unpaid" : "paid";

    const totalVal = Number(orderDetails.amount || 0);
    const taxVal = Number(orderDetails.tax_amount || (totalVal * 0.18));
    const shippingVal = Number(orderDetails.shipping_amount || 0);
    const discountVal = Number(orderDetails.discount_amount || 0);
    const subtotalVal = totalVal - taxVal - shippingVal + discountVal;
    
    // Add additional discount preservation from webhook body if available
    const extraCouponCode = body.coupon_codes && body.coupon_codes.length > 0 ? body.coupon_codes.join(",") : null;
    const finalCouponCode = orderDetails.coupon_code || body.coupon_code || extraCouponCode || null;
    
    const billingAddr = orderDetails.billing_address || orderDetails.shipping_address || body.billing_address || null;
    const fastrrId = orderDetails.fastrr_order_id || orderDetails.order_id || body.fastrr_order_id || null;
    const totalPayable = Number(orderDetails.total_amount_payable || orderDetails.amount || body.total_amount_payable || 0);

    // ── Create order record ───────────────────────────────────────────────────
    console.log("Inserting new India Order. Shiprocket order_id:", shiprocketOrderId);
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
        coupon_code: finalCouponCode,
        total_amount: totalPayable,
        order_status: localStatus,
        payment_status: localPaymentStatus,
        payment_method: mappedPayment,
        delivery_estimate: orderDetails.edd || body.edd || "3-5 business days",
        fastrr_order_id: fastrrId,
        billing_address: billingAddr,
        total_amount_payable: totalPayable,
        shipping_address: {
          firstName: orderDetails.shipping_address.first_name || body.shipping_address?.name,
          lastName: orderDetails.shipping_address.last_name,
          address: orderDetails.shipping_address.address_line1 + (orderDetails.shipping_address.address_line2 ? `, ${orderDetails.shipping_address.address_line2}` : ""),
          city: orderDetails.shipping_address.city,
          state: orderDetails.shipping_address.state,
          postcode: orderDetails.shipping_address.postcode || body.shipping_address?.pincode,
          country: "India",
          phone: orderDetails.shipping_address.phone,
          email: orderDetails.shipping_address.email,
          countryCode: body.shipping_address?.country_code,
          landmark: body.shipping_address?.landmark
        },
        customer_email: orderDetails.shipping_address.email,
        customer_phone: orderDetails.shipping_address.phone,
        customer_name: orderDetails.shipping_address.first_name ? `${orderDetails.shipping_address.first_name} ${orderDetails.shipping_address.last_name || ""}`.trim() : body.shipping_address?.name,
        is_guest: !userId,
        source: "Shiprocket",
        platform: "Web",
        gateway_response: body,
        market: "IN",
      } as any)
      .select()
      .single();

    if (orderCreateError) {
      console.error("Failed to insert India order:", orderCreateError);
      throw orderCreateError;
    }

    console.log(`India Order created: ${newOrder.order_number} (${newOrder.id})`);

    // ── IDEMPOTENCY PROTECTION (Race Condition Fix) ───────────────────────────
    // Insert mapping immediately to catch concurrent webhook deliveries.
    // The 'shiprocket_orders.shiprocket_order_id' column has a UNIQUE constraint.
    const { data: newMapping, error: finalMapError } = await supabase
      .from("shiprocket_orders")
      .insert({
        order_id: newOrder.id,
        shiprocket_order_id: String(shiprocketOrderId),
        tracking_id: body.tracking_id || orderDetails.tracking_id || null,
        courier_name: body.courier_name || orderDetails.courier_name || null
      } as any)
      .select()
      .single();

    if (finalMapError) {
      // 23505 is PostgreSQL unique_violation. If it fails here, another webhook already processed this.
      if (finalMapError.code === "23505" || finalMapError.message?.includes("duplicate key")) {
        console.warn(`Idempotency trigger: Concurrent webhook detected for ${shiprocketOrderId}. Deleting duplicate order.`);
        // Clean up the orphaned order we just created
        await supabase.from("orders").delete().eq("id", newOrder.id);
        
        return new Response(
          JSON.stringify({ success: true, message: "Order processed concurrently by another webhook request." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw finalMapError;
    }

    // ── Payment record (idempotent) ───────────────────────────────────────────
    // Store full combined webhook and details api payload into raw_response for lossless preservation
    const combinedResponse = {
      webhook_payload: body,
      details_api: orderDetails
    };

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("transaction_id", fastrrId)
      .eq("payment_status", localPaymentStatus)
      .maybeSingle();

    if (!existingPayment) {
      await supabase.from("payments").insert({
        order_id: newOrder.id,
        payment_method: mappedPayment,
        payment_status: localPaymentStatus,
        amount: totalPayable,
        transaction_id: fastrrId,
        raw_response: combinedResponse
      });
    }

    // ── Order items + inventory deduction ─────────────────────────────────────
    const createdItems = [];
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
        console.log(`Deducting India stock for product ${prod.id}: ${prevQty} → ${newQty}`);
        await supabase.from("products").update({ inventory_quantity: newQty }).eq("id", prod.id);
        await supabase.from("inventory_logs").insert({
          product_id: prod.id,
          change_amount: -item.quantity,
          previous_quantity: prevQty,
          new_quantity: newQty,
          reason: `Shiprocket Order ${shiprocketOrderId}`
        } as any);
      }
    }

    // Do not await email sending to prevent webhook timeout (Shiprocket expects quick 200 OK)
    // Edge Runtime allows Promises to resolve after the response is returned.
    sendOrderEmails(supabase, newOrder, createdItems).catch(err => {
      console.error("Failed to send order emails asynchronously:", err);
    });

    return new Response(
      JSON.stringify({ success: true, message: "Order processed successfully", order_id: newOrder.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
