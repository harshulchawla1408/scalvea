import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { sendOrderEmails } from "../_shared/shiprocket-mapper.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-01-28.clover" as any });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), { status: 400 });
    }

    const rawBody = await req.text();
    console.log("Stripe Webhook raw body received, length:", rawBody.length);
    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log("Stripe webhook signature verified successfully.");
      } catch (err: any) {
        console.error("Stripe signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: `Signature verification failed: ${err.message}` }), { status: 400 });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET is not configured. Skipping signature verification in development.");
      event = JSON.parse(rawBody);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing Stripe webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Ensure this is an Australia market order
      if (session.metadata?.market !== "AU") {
        console.log("Not an Australia order. Skipping.");
        return new Response(JSON.stringify({ success: true, message: "Ignored non-AU order" }), { status: 200 });
      }

      const stripeSessionId = session.id;
      const stripePaymentIntentId = session.payment_intent || null;

      // 1. Prevent duplicate order creation by checking stripe_session_id
      console.log(`Checking duplicate order for Stripe session ID: ${stripeSessionId}`);
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("stripe_session_id", stripeSessionId)
        .maybeSingle();

      if (existingOrder) {
        console.log(`Order already exists for session ${stripeSessionId}: Order ID ${existingOrder.id}. Skipping creation.`);
        
        // If payment intent was populated late, make sure it is updated
        if (stripePaymentIntentId) {
          console.log(`Updating late payment intent ID ${stripePaymentIntentId} for Order ID ${existingOrder.id}`);
          await supabase
            .from("orders")
            .update({ stripe_payment_intent_id: stripePaymentIntentId, payment_status: "paid", order_status: "processing" })
            .eq("id", existingOrder.id);
        }

        return new Response(JSON.stringify({ success: true, message: "Order already processed" }), { status: 200 });
      }

      // Extract metadata values
      const userId = session.metadata.user_id || null;
      const couponCode = session.metadata.coupon_code || null;
      const discountCents = Number(session.metadata.discount_amount || 0);
      const gstCents = Number(session.metadata.gst || 0);
      const shippingCents = Number(session.metadata.shipping_cost || 0);
      const cartItemsStr = session.metadata.cart_items;
      const shippingType = session.metadata.shipping_type || "standard";
      const rawShippingAddress = session.metadata.shipping_address;

      const discountAmount = discountCents / 100;
      const gstAmount = gstCents / 100;
      const shippingAmount = shippingCents / 100;
      const totalAmount = (session.amount_total || 0) / 100;

      let parsedShippingAddress: any = {};
      try {
        parsedShippingAddress = JSON.parse(rawShippingAddress || "{}");
      } catch {
        console.error("Failed to parse shipping address metadata");
      }

      // Prioritize Stripe's finalized shipping details if they exist
      if (session.shipping_details?.address) {
        const stripeAddress = session.shipping_details.address;
        const nameParts = (session.shipping_details.name || "").split(" ");
        parsedShippingAddress = {
          firstName: nameParts[0] || parsedShippingAddress.firstName,
          lastName: nameParts.slice(1).join(" ") || parsedShippingAddress.lastName,
          address: stripeAddress.line1 + (stripeAddress.line2 ? `, ${stripeAddress.line2}` : ""),
          city: stripeAddress.city,
          state: stripeAddress.state,
          postcode: stripeAddress.postal_code,
          country: stripeAddress.country,
          phone: session.customer_details?.phone || parsedShippingAddress.phone,
          email: session.customer_details?.email || parsedShippingAddress.email,
        };
      }

      // 2. Reconstruct cart items list
      if (!cartItemsStr) {
        throw new Error("Missing cart items in metadata");
      }

      const cartItems = cartItemsStr.split(",").map((part: string) => {
        const [productId, quantity] = part.split(":");
        return { productId, quantity: parseInt(quantity) || 1 };
      });

      // Load products from DB to compile order details
      const productIds = cartItems.map((item: any) => item.productId);
      const { data: dbProducts } = await supabase
        .from("products")
        .select("*, product_prices(*)")
        .in("id", productIds);

      if (!dbProducts || dbProducts.length === 0) {
        throw new Error("Could not find matching products in database");
      }

      // Calculate Subtotal (price before discount)
      let subtotalAmount = 0;
      for (const item of cartItems) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
          const priceAud = Number(prices.price_aud) || 0;
          subtotalAmount += priceAud * item.quantity;
        }
      }

      // 3. Create Order Record
      const orderPayload = {
        user_id: userId,
        country: "Australia",
        currency: "AUD",
        subtotal: subtotalAmount,
        tax_amount: gstAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        coupon_code: couponCode,
        total_amount: totalAmount,
        order_status: "processing",
        payment_status: "paid",
        payment_method: "stripe",
        payment_provider: "stripe",
        market: "AU",
        gst: gstAmount,
        shipping_cost: shippingAmount,
        total: totalAmount,
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        delivery_estimate: shippingType === "express" ? "2-4 business days" : "5-7 business days",
        shipping_address: parsedShippingAddress,
        customer_email: parsedShippingAddress.email || session.customer_details?.email,
        customer_phone: parsedShippingAddress.phone || session.customer_details?.phone,
        customer_name: parsedShippingAddress.firstName ? `${parsedShippingAddress.firstName} ${parsedShippingAddress.lastName || ""}`.trim() : session.customer_details?.name,
        is_guest: !userId,
        source: "Stripe",
        platform: "Web",
        gateway_response: session,
      };

      console.log("Inserting new Order record into database. Payload:", JSON.stringify(orderPayload));
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload as any)
        .select()
        .single();

      if (orderError || !newOrder) {
        // Handle concurrent duplicate webhook gracefully (Postgres Unique Violation on stripe_session_id)
        if (orderError?.code === "23505") {
          console.log(`Concurrent webhook detected. Order already exists for session ${stripeSessionId}. Returning 200.`);
          return new Response(JSON.stringify({ success: true, message: "Order already processed concurrently" }), { status: 200 });
        }
        console.error("Order insertion failed. Error:", orderError);
        throw new Error(`Failed to create order: ${orderError?.message}`);
      }

      console.log(`Order created successfully: ${newOrder.order_number}. Order ID: ${newOrder.id}`);

      // 4. Create Order Items & Deduct Australia Stock
      const createdItems = [];
      for (const item of cartItems) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (!prod) continue;

        const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
        const priceAud = Number(prices.price_aud) || 0;

        const orderItemPayload = {
          order_id: newOrder.id,
          product_id: prod.id,
          product_name: prod.name,
          quantity: item.quantity,
          price: priceAud,
          currency: "AUD",
        };

        // Create Order Item
        console.log("Creating Order Item:", JSON.stringify(orderItemPayload));
        await supabase
          .from("order_items")
          .insert(orderItemPayload as any);

        createdItems.push(orderItemPayload);

        // Deduct inventory from Australia specific inventory column
        const prevQty = prod.inventory_quantity_australia ?? 0;
        const newQty = Math.max(0, prevQty - item.quantity);
        console.log(`Deducting Australia stock for product ${prod.id}. Prev Qty: ${prevQty}, New Qty: ${newQty}`);

        await supabase
          .from("products")
          .update({ inventory_quantity_australia: newQty })
          .eq("id", prod.id);

        // Insert inventory log
        await supabase
          .from("inventory_logs")
          .insert({
            product_id: prod.id,
            change_amount: -item.quantity,
            previous_quantity: prevQty,
            new_quantity: newQty,
            reason: `Stripe Order ${newOrder.order_number}`,
          } as any);
      }

      // 5. Increment Coupon usage count
      if (couponCode) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("usage_count")
          .eq("code", couponCode)
          .maybeSingle();

        if (coupon) {
          await supabase
            .from("coupons")
            .update({ usage_count: (coupon.usage_count || 0) + 1 } as any)
            .eq("code", couponCode);
        }
      }

      // 6. Send email notifications
      await sendOrderEmails(supabase, newOrder, createdItems);
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const stripePaymentIntentId = paymentIntent.id;

      // Update order status if order was created earlier or by session.completed
      const { data: updated } = await supabase
        .from("orders")
        .update({ payment_status: "paid", order_status: "processing" })
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .select("id, order_number");

      if (updated && updated.length > 0) {
        console.log(`Payment confirmed for Order: ${updated[0].order_number}`);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const stripePaymentIntentId = paymentIntent.id;

      const { data: updated } = await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .select("id, order_number");

      if (updated && updated.length > 0) {
        console.warn(`Payment failed for Order: ${updated[0].order_number}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Webhook event handling error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
