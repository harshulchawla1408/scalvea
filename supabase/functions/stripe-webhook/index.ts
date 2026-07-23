// ─── Stripe Webhook Handler ──────────────────────────────────────────────────
// Production-grade webhook for Australia Stripe Checkout.
// 1. Verifies Stripe signature asynchronously.
// 2. Extracts metadata.order_id to locate the pending order.
// 3. Handles idempotency: ignores if already paid.
// 4. On payment success: Updates order to paid, inserts order_items, 
//    deducts inventory, and sends emails.
// 5. On payment failure: Marks order as cancelled.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendOrderEmails } from "../_shared/shiprocket-mapper.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured.");
      return new Response(JSON.stringify({ error: "Configuration error" }), { status: 500 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
      console.log(`✅ Webhook signature verified. Event: ${event.type} (${event.id})`);
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handlePaymentSuccess(event, supabase);
        break;

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event, supabase);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}. Acknowledging.`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: any) {
    console.error("Webhook unexpected error:", error.message || error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ─── Event Handlers ─────────────────────────────────────────────────────────

async function handlePaymentSuccess(event: Stripe.Event, supabase: any) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.market !== "AU") {
    console.log("Ignoring non-AU order.");
    return;
  }

  if (session.payment_status !== "paid") {
    console.log(`Session ${session.id} not paid yet. Waiting for async payment.`);
    return;
  }

  const orderId = session.metadata?.order_id;
  const stripeSessionId = session.id;

  // 1. Locate pending order
  let orderQuery = supabase.from("orders").select("*");
  if (orderId) {
    orderQuery = orderQuery.eq("id", orderId);
  } else {
    orderQuery = orderQuery.eq("stripe_session_id", stripeSessionId);
  }

  const { data: order, error: orderError } = await orderQuery.maybeSingle();

  if (orderError || !order) {
    console.error(`Could not locate pending order. Order ID: ${orderId}, Session: ${stripeSessionId}`);
    return;
  }

  // 2. Idempotency Check
  if (order.payment_status === "paid") {
    console.log(`Order ${order.order_number} is already paid. Skipping duplicate processing.`);
    return;
  }

  console.log(`Finalizing payment for order: ${order.order_number}`);

  // 3. Build authoritative shipping address
  const stripeShipping = session.shipping_details;
  const customerDetails = session.customer_details;
  
  const shippingAddress = stripeShipping?.address ? {
    firstName: (stripeShipping.name || "").split(" ")[0] || order.shipping_address?.firstName || "",
    lastName: (stripeShipping.name || "").split(" ").slice(1).join(" ") || order.shipping_address?.lastName || "",
    first_name: (stripeShipping.name || "").split(" ")[0] || order.shipping_address?.first_name || "",
    last_name: (stripeShipping.name || "").split(" ").slice(1).join(" ") || order.shipping_address?.last_name || "",
    address: stripeShipping.address.line1 + (stripeShipping.address.line2 ? `, ${stripeShipping.address.line2}` : ""),
    address_line1: stripeShipping.address.line1 || "",
    address_line2: stripeShipping.address.line2 || "",
    city: stripeShipping.address.city || "",
    state: stripeShipping.address.state || "",
    postcode: stripeShipping.address.postal_code || "",
    country: stripeShipping.address.country || "AU",
    phone: customerDetails?.phone || order.shipping_address?.phone || "",
    email: customerDetails?.email || order.shipping_address?.email || "",
  } : order.shipping_address;

  const stripePaymentIntentId = typeof session.payment_intent === "string" 
    ? session.payment_intent 
    : session.payment_intent?.id || null;

  // 4. Update order to paid
  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "processing",
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      shipping_address: shippingAddress,
      customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
    })
    .eq("id", order.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update order payment status: ${updateError.message}`);
  }

  // 5. Parse cart items and insert order_items & deduct inventory
  const cartItemsStr = session.metadata?.cart_items;
  let createdItems = [];

  if (cartItemsStr) {
    const cartItems = cartItemsStr.split(",").map((part: string) => {
      const [productId, quantity] = part.split(":");
      return { productId, quantity: parseInt(quantity) || 1 };
    });

    const productIds = cartItems.map((item: any) => item.productId);
    const { data: dbProducts } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .in("id", productIds);

    if (dbProducts && dbProducts.length > 0) {
      for (const item of cartItems) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (!prod) continue;

        const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
        const priceAud = Number(prices.price_aud) || 0;

        const orderItemPayload = {
          order_id: order.id,
          product_id: prod.id,
          product_name: prod.name,
          quantity: item.quantity,
          price: priceAud,
          currency: "AUD",
        };

        await supabase.from("order_items").insert(orderItemPayload as any);
        createdItems.push(orderItemPayload);

        // Deduct Inventory EXACTLY ONCE
        const prevQty = prod.inventory_quantity_australia ?? 0;
        const newQty = Math.max(0, prevQty - item.quantity);

        await supabase
          .from("products")
          .update({ inventory_quantity_australia: newQty })
          .eq("id", prod.id);

        await supabase.from("inventory_logs").insert({
          product_id: prod.id,
          change_amount: -item.quantity,
          previous_quantity: prevQty,
          new_quantity: newQty,
          reason: `Stripe Order ${updatedOrder.order_number}`,
        } as any);
      }
    }
  }

  // 6. Increment coupon usage
  const couponCode = session.metadata?.coupon_code;
  if (couponCode) {
    const { data: coupon } = await supabase.from("coupons").select("usage_count").eq("code", couponCode).maybeSingle();
    if (coupon) {
      await supabase.from("coupons").update({ usage_count: (coupon.usage_count || 0) + 1 } as any).eq("code", couponCode);
    }
  }

  // 7. Send Emails
  try {
    await sendOrderEmails(supabase, updatedOrder, createdItems);
    console.log("✅ Order emails sent successfully.");
  } catch (emailErr: any) {
    console.error("Email sending failed (non-fatal):", emailErr.message);
  }
}

async function handlePaymentFailure(event: Stripe.Event, supabase: any) {
  let session: any;
  let orderId: string | null = null;
  let stripeSessionId: string | null = null;
  let stripePaymentIntentId: string | null = null;

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    stripePaymentIntentId = paymentIntent.id;
  } else {
    session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.market !== "AU") return;
    orderId = session.metadata?.order_id;
    stripeSessionId = session.id;
  }

  let orderQuery = supabase.from("orders").select("id, order_number, payment_status");
  if (orderId) {
    orderQuery = orderQuery.eq("id", orderId);
  } else if (stripeSessionId) {
    orderQuery = orderQuery.eq("stripe_session_id", stripeSessionId);
  } else if (stripePaymentIntentId) {
    orderQuery = orderQuery.eq("stripe_payment_intent_id", stripePaymentIntentId);
  } else {
    return;
  }

  const { data: existingOrder } = await orderQuery.maybeSingle();

  if (existingOrder && existingOrder.payment_status === "pending") {
    await supabase
      .from("orders")
      .update({ payment_status: "failed", order_status: "Cancelled" })
      .eq("id", existingOrder.id);
    console.log(`Marked pending order ${existingOrder.order_number} as cancelled.`);
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabase: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const stripePaymentIntentId = paymentIntent.id;

  const { data: updated } = await supabase
    .from("orders")
    .update({ payment_status: "paid", order_status: "processing" })
    .eq("stripe_payment_intent_id", stripePaymentIntentId)
    .eq("payment_status", "pending") // Only update if pending
    .select("id, order_number");

  if (updated && updated.length > 0) {
    console.log(`Payment confirmed via payment_intent.succeeded for order: ${updated[0].order_number}`);
  }
}
