import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateHmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  const u8 = new Uint8Array(signatureBuffer);
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

function mapPaymentMethod(rawPaymentType: string): string {
  const clean = String(rawPaymentType || "").toLowerCase().trim();
  if (clean.includes("upi")) return "shiprocket_upi";
  if (clean.includes("card") || clean.includes("visa") || clean.includes("mastercard")) return "shiprocket_card";
  if (clean.includes("cod") || clean.includes("cash") || clean.includes("delivery")) return "shiprocket_cod";
  if (clean.includes("bnpl") || clean.includes("emi") || clean.includes("lazy") || clean.includes("paylater")) return "shiprocket_bnpl";
  if (clean.includes("stripe")) return "stripe";
  return "shiprocket_cod";
}

async function findProductIdByVariantId(supabase: any, variantId: string) {
  if (!variantId) return null;

  // 1. Try shiprocket_variant_id
  if (/^\d+$/.test(variantId)) {
    const { data } = await supabase
      .from("products")
      .select("id, name, inventory_quantity")
      .eq("shiprocket_variant_id", Number(variantId))
      .maybeSingle();
    if (data) return data;
  }

  // 2. Try sku_india
  let { data } = await supabase
    .from("products")
    .select("id, name, inventory_quantity")
    .eq("sku_india", variantId)
    .maybeSingle();
  if (data) return data;

  // 3. Try sku
  ({ data } = await supabase
    .from("products")
    .select("id, name, inventory_quantity")
    .eq("sku", variantId)
    .maybeSingle());
  if (data) return data;

  // 4. Try UUID matches
  if (variantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    ({ data } = await supabase
      .from("products")
      .select("id, name, inventory_quantity")
      .eq("id", variantId)
      .maybeSingle());
    if (data) return data;
  }

  // 5. Fallback: get first active product
  ({ data } = await supabase
    .from("products")
    .select("id, name, inventory_quantity")
    .eq("is_active_india", true)
    .limit(1)
    .maybeSingle());
  
  return data;
}

async function sendOrderEmails(supabase: any, order: any, orderItems: any[]) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email notifications.");
    return;
  }

  const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
  const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@scalvea.com";
  let emailToUse = order.shipping_address?.email;

  if (!emailToUse && order.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();
    if (profile?.email) {
      emailToUse = profile.email;
    }
  }

  if (!emailToUse) {
    console.warn("No customer email found for order:", order.order_number);
    return;
  }

  const currencySymbol = order.currency === "INR" ? "₹" : "A$";
  const formattedItems = orderItems
    .map((item) => `<li>${item.product_name} x ${item.quantity} - ${currencySymbol}${Number(item.price * item.quantity).toFixed(2)}</li>`)
    .join("");

  const emailHtml = `
    <h1>Thank you for your order!</h1>
    <p>Your order <strong>${order.order_number}</strong> has been received and is being processed.</p>
    <h2>Order Summary</h2>
    <ul>
      ${formattedItems}
    </ul>
    <p><strong>Subtotal:</strong> ${currencySymbol}${Number(order.subtotal).toFixed(2)}</p>
    <p><strong>Tax:</strong> ${currencySymbol}${Number(order.tax_amount).toFixed(2)}</p>
    <p><strong>Shipping:</strong> ${currencySymbol}${Number(order.shipping_amount).toFixed(2)}</p>
    ${order.discount_amount > 0 ? `<p><strong>Discount:</strong> -${currencySymbol}${Number(order.discount_amount).toFixed(2)}</p>` : ""}
    <p><strong>Total:</strong> ${currencySymbol}${Number(order.total_amount).toFixed(2)}</p>
    <p><strong>Delivery Estimate:</strong> ${order.delivery_estimate || "3-5 business days"}</p>
  `;

  const adminHtml = `
    <h1>New Order Received</h1>
    <p>Order Number: <strong>${order.order_number}</strong></p>
    <p>Customer: ${order.shipping_address?.firstName || ""} ${order.shipping_address?.lastName || ""}</p>
    <p>Email: ${emailToUse}</p>
    <p>Market: ${order.market || order.country}</p>
    <h2>Order Items</h2>
    <ul>
      ${formattedItems}
    </ul>
    <p><strong>Total Amount:</strong> ${currencySymbol}${Number(order.total_amount).toFixed(2)}</p>
  `;

  try {
    // Send to Customer
    const customerRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: emailToUse,
        subject: `Order Confirmation - ${order.order_number}`,
        html: emailHtml,
      }),
    });

    if (!customerRes.ok) {
      console.error("Failed to send customer email confirmation:", await customerRes.text());
    } else {
      console.log("Customer email confirmation sent successfully.");
    }

    // Send to Admin
    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: senderEmail,
        to: adminEmail,
        subject: `[New Order] ${order.order_number} - ${order.market || order.country}`,
        html: adminHtml,
      }),
    });

    if (!adminRes.ok) {
      console.error("Failed to send admin email notification:", await adminRes.text());
    } else {
      console.log("Admin email notification sent successfully.");
    }
  } catch (error) {
    console.error("Error sending order emails:", error);
  }
}

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

    // Self-healing flow: Webhook might not have fired yet. Query Shiprocket details & create order.
    if (!mapping) {
      console.log(`Mapping not found for orderId: ${orderId}. Attempting self-healing order creation.`);

      const shiprocketOrderId = String(orderId);
      const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
      let orderDetails: any = null;

      if (isMock) {
        console.log("Mock keys active. Creating mock orderDetails for self-healing.");
        orderDetails = {
          order_id: shiprocketOrderId,
          status: "completed",
          amount: 749,
          payment_method: "cod",
          tax_amount: 0,
          shipping_amount: 50,
          discount_amount: 0,
          shipping_address: {
            first_name: "Mock",
            last_name: "Customer",
            address_line1: "123 Mock Street",
            address_line2: "",
            city: "Mumbai",
            state: "Maharashtra",
            postcode: "400001",
            phone: "9999999999",
            email: "mockcustomer@example.com"
          },
          items: [
            {
              variant_id: "default",
              quantity: 1,
              price: 749,
              name: "Follicle 8 Hair Growth Serum"
            }
          ]
        };
      } else {
        const detailPayload = {
          order_id: shiprocketOrderId,
          timestamp: new Date().toISOString()
        };
        const sig = await generateHmacSha256(secretKey, JSON.stringify(detailPayload));

        const res = await fetch("https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "x-signature": sig,
            "X-Api-HMAC-SHA256": sig
          },
          body: JSON.stringify(detailPayload)
        });

        if (!res.ok) {
          console.error("Failed to fetch order details from Shiprocket during self-healing:", await res.text());
          return new Response(
            JSON.stringify({ error: `No Shiprocket mapping found and failed to fetch details from Shiprocket (Status: ${res.status})` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        orderDetails = await res.json();
      }

      // Double check if mapping was created by webhook in the meantime
      const { data: doubleCheckMap } = await supabase
        .from("shiprocket_orders")
        .select("*")
        .eq("shiprocket_order_id", shiprocketOrderId)
        .maybeSingle();

      if (doubleCheckMap) {
        mapping = doubleCheckMap;
      } else {
        // Provision order in local database
        let userId = null;
        if (orderDetails.shipping_address?.email) {
          const { data: pEmail } = await supabase
            .from("profiles")
            .select("id")
            .ilike("email", orderDetails.shipping_address.email.trim())
            .maybeSingle();
          if (pEmail) userId = pEmail.id;
        }

        if (!userId && orderDetails.shipping_address?.phone) {
          const { data: pPhone } = await supabase
            .from("profiles")
            .select("id")
            .eq("phone", orderDetails.shipping_address.phone)
            .maybeSingle();
          if (pPhone) userId = pPhone.id;
        }

        let localStatus = "processing";
        if (orderDetails.status === "shipped") localStatus = "shipped";
        if (orderDetails.status === "delivered") localStatus = "delivered";
        if (orderDetails.status === "cancelled") localStatus = "cancelled";

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
            delivery_estimate: "3-5 business days",
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
            } : null
          } as any)
          .select()
          .single();

        if (orderCreateError) {
          throw orderCreateError;
        }

        // Insert payment details
        await supabase
          .from("payments")
          .insert({
            order_id: newOrder.id,
            payment_method: mappedPayment,
            payment_status: localPaymentStatus,
            amount: totalPayable,
            transaction_id: fastrrId,
            raw_response: orderDetails
          });

        // Insert order items & deduct inventory
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

            await supabase
              .from("order_items")
              .insert(orderItemPayload as any);

            createdItems.push(orderItemPayload);

            if (prod) {
              const prevQty = prod.inventory_quantity ?? 0;
              const newQty = Math.max(0, prevQty - item.quantity);

              await supabase
                .from("products")
                .update({ inventory_quantity: newQty })
                .eq("id", prod.id);

              await supabase
                .from("inventory_logs")
                .insert({
                  product_id: prod.id,
                  change_amount: -item.quantity,
                  previous_quantity: prevQty,
                  new_quantity: newQty,
                  reason: `Shiprocket Order ${shiprocketOrderId} (Self-Healed)`
                } as any);
            }
          }
        }

        // Insert mapping
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

        if (finalMapError) {
          throw finalMapError;
        }

        mapping = newMapping;

        // Send emails
        await sendOrderEmails(supabase, newOrder, createdItems);
      }
    }

    const shiprocketOrderId = mapping.shiprocket_order_id;
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    let orderDetails: any = null;

    if (isMock) {
      console.log("Mock keys active. Generating mock order details for mapped retrieval.");
      orderDetails = {
        order_id: String(shiprocketOrderId),
        status: "completed",
        amount: 749,
        payment_method: "cod",
        tax_amount: 0,
        shipping_amount: 50,
        discount_amount: 0,
        shipping_address: {
          first_name: "Mock",
          last_name: "Customer",
          address_line1: "123 Mock Street",
          address_line2: "",
          city: "Mumbai",
          state: "Maharashtra",
          postcode: "400001",
          phone: "9999999999",
          email: "mockcustomer@example.com"
        },
        items: []
      };
    } else {
      const detailPayload = {
        order_id: String(shiprocketOrderId),
        timestamp: new Date().toISOString()
      };
      const sig = await generateHmacSha256(secretKey, JSON.stringify(detailPayload));

      const res = await fetch("https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-signature": sig,
          "X-Api-HMAC-SHA256": sig
        },
        body: JSON.stringify(detailPayload)
      });

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch order details from Shiprocket" }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      orderDetails = await res.json();
    }

    let localStatus = "processing";
    if (orderDetails.status === "shipped") localStatus = "shipped";
    if (orderDetails.status === "delivered") localStatus = "delivered";
    if (orderDetails.status === "cancelled") localStatus = "cancelled";

    const mappedPayment = mapPaymentMethod(orderDetails.payment_method);
    const localPaymentStatus = (mappedPayment === "shiprocket_cod" && localStatus !== "delivered") ? "unpaid" : "paid";

    // Map billing address
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

    // Save detailed payment transaction idempotently
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("transaction_id", fastrrId)
      .eq("payment_status", localPaymentStatus)
      .maybeSingle();

    if (!existingPayment) {
      await supabase
        .from("payments")
        .insert({
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
