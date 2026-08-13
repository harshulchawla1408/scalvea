// ─── Stripe Webhook Handler ──────────────────────────────────────────────────
// Production-grade webhook for Australia Stripe Checkout.
//
// NEW FLOW:
// 1. Verifies Stripe signature.
// 2. On payment success: Creates the order IN THE DATABASE for the first time.
//    No "draft" order exists beforehand — the order only appears after payment.
// 3. Inserts order_items, deducts inventory, sends emails.
// 4. Handles idempotency: skips if order with this session_id already exists.
// 5. On payment failure: No order exists to update (nothing to do).
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
        body, signature, webhookSecret, undefined, cryptoProvider
      );
      console.log(`✅ Webhook verified. Event: ${event.type} (${event.id})`);
    } catch (err: any) {
      console.error(`❌ Signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase       = createClient(supabaseUrl, supabaseKey);

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

      default:
        console.log(`Unhandled event type: ${event.type}. Acknowledging.`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: any) {
    console.error("Webhook unexpected error:", error.message || error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// ─── Payment Success: Create order in DB ─────────────────────────────────────

async function handlePaymentSuccess(event: Stripe.Event, supabase: any) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.market !== "AU") {
    console.log("Ignoring non-AU session.");
    return;
  }

  if (session.payment_status !== "paid") {
    console.log(`Session ${session.id} not yet paid. Waiting for async payment.`);
    return;
  }

  const stripeSessionId = session.id;

  // ── Idempotency: check if this order was already created ─────────────────
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (existingOrder) {
    console.log(`Order ${existingOrder.order_number} already exists for session ${stripeSessionId}. Skipping.`);
    return;
  }

  // ── Extract metadata ──────────────────────────────────────────────────────
  const meta = session.metadata || {};
  const userId          = meta.user_id || null;
  const couponCode      = meta.coupon_code || null;
  const cartItemsMeta   = meta.cart_items || "";        // "productId:qty,productId:qty"
  const deliveryEst     = meta.delivery_estimate || "5-7 business days";

  // ── Build authoritative shipping address from Stripe ─────────────────────
  const stripeShipping    = session.shipping_details;
  const customerDetails   = session.customer_details;
  const stripeName        = stripeShipping?.name || customerDetails?.name || "";
  const nameParts         = stripeName.trim().split(" ");
  const firstName         = meta.customer_first_name || nameParts[0] || "";
  const lastName          = meta.customer_last_name  || nameParts.slice(1).join(" ") || "";
  const customerEmail     = customerDetails?.email || meta.customer_email || "";
  const customerPhone     = customerDetails?.phone || meta.customer_phone || "";

  const shippingAddress = {
    firstName,   lastName,
    first_name:  firstName, last_name: lastName,
    address:       meta.address_line1 || stripeShipping?.address?.line1 || "",
    address_line1: meta.address_line1 || stripeShipping?.address?.line1 || "",
    address_line2: meta.address_line2 || stripeShipping?.address?.line2 || "",
    city:          meta.city || stripeShipping?.address?.city || "",
    state:         meta.state || stripeShipping?.address?.state || "",
    postcode:      meta.postcode || stripeShipping?.address?.postal_code || "",
    country:       "AU",
    phone:         customerPhone,
    email:         customerEmail,
  };

  // ── Parse amounts from Stripe (authoritative) ─────────────────────────────
  // session.amount_total is in cents (includes shipping, after discount)
  const totalAmount    = (session.amount_total    ?? 0) / 100;
  const shippingAmount = (session.total_details?.amount_shipping ?? 0) / 100;
  const discountAmount = (session.total_details?.amount_discount ?? 0) / 100;
  const subtotal       = Number(meta.subtotal || "0");

  const stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  console.log(`Creating order: customer=${customerEmail}, total=A$${totalAmount}, session=${stripeSessionId}`);

  // ── Create Order in DB ────────────────────────────────────────────────────
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id:                  userId,
      country:                  "Australia",
      currency:                 "AUD",
      market:                   "AU",
      subtotal:                 subtotal,
      tax_amount:               0,
      shipping_amount:          shippingAmount,
      discount_amount:          discountAmount,
      total_amount:             totalAmount,
      gst:                      0,
      shipping_cost:            shippingAmount,
      total:                    totalAmount,
      coupon_code:              couponCode || null,
      order_status:             "processing",
      payment_status:           "paid",
      payment_method:           "stripe",
      payment_provider:         "stripe",
      stripe_session_id:        stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      transaction_id:           stripePaymentIntentId,
      shipping_address:         shippingAddress,
      billing_address:          shippingAddress,
      customer_email:           customerEmail,
      customer_phone:           customerPhone || null,
      customer_name:            `${firstName} ${lastName}`.trim(),
      is_guest:                 !userId,
      source:                   "Stripe",
      platform:                 "Web",
      order_source:             "ONLINE",
      delivery_estimate:        deliveryEst,
    } as any)
    .select()
    .single();

  if (orderError || !newOrder) {
    throw new Error(`Failed to create order from Stripe webhook: ${orderError?.message}`);
  }
  console.log(`✅ Order created: ${newOrder.order_number} (ID: ${newOrder.id})`);

  // ── Parse cart items from metadata & fetch product details ───────────────
  // cart_items format: "productId:qty,productId:qty"
  const parsedCart: Array<{ productId: string; quantity: number }> = cartItemsMeta
    .split(",")
    .filter(Boolean)
    .map((entry: string) => {
      const [productId, qty] = entry.trim().split(":");
      return { productId, quantity: parseInt(qty, 10) || 1 };
    });

  if (parsedCart.length === 0) {
    console.warn("No cart items found in metadata for session:", stripeSessionId);
  }

  // Fetch product details from DB for names and prices
  const productIds = parsedCart.map((i) => i.productId);
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, name, images, inventory_quantity_australia, product_prices(*)")
    .in("id", productIds);

  const productMap = new Map((dbProducts || []).map((p: any) => [p.id, p]));

  // ── Insert order_items ────────────────────────────────────────────────────
  const orderItemsToInsert = parsedCart.map(({ productId, quantity }) => {
    const prod = productMap.get(productId) as any;
    if (!prod) return null;
    const prices  = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
    const priceAud = Number(prices?.price_aud) || 0;
    return {
      order_id:     newOrder.id,
      product_id:   productId,
      product_name: prod.name,
      quantity,
      price:        priceAud,
      currency:     "AUD",
      image_url:    prod.images?.[0] || null,
    };
  }).filter(Boolean);

  if (orderItemsToInsert.length > 0) {
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItemsToInsert);
    if (itemsErr) {
      console.error("Failed to insert order_items:", itemsErr.message);
      // Non-fatal: order exists, items can be added manually
    } else {
      console.log(`✅ ${orderItemsToInsert.length} order items inserted.`);
    }
  }

  // ── Deduct inventory ──────────────────────────────────────────────────────
  for (const { productId, quantity } of parsedCart) {
    const prod = productMap.get(productId) as any;
    if (!prod) continue;

    const prevQty = prod.inventory_quantity_australia ?? 0;
    const newQty  = Math.max(0, prevQty - quantity);

    await supabase
      .from("products")
      .update({ inventory_quantity_australia: newQty })
      .eq("id", productId);

    await supabase.from("inventory_logs").insert({
      product_id:        productId,
      change_amount:     -quantity,
      previous_quantity: prevQty,
      new_quantity:      newQty,
      reason:            `Stripe Order ${newOrder.order_number}`,
    } as any);
  }

  // ── Increment coupon usage ────────────────────────────────────────────────
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

  // ── Send Emails ───────────────────────────────────────────────────────────
  try {
    await sendOrderEmails(supabase, newOrder, orderItemsToInsert);
    console.log("✅ Order emails sent.");
  } catch (emailErr: any) {
    console.error("Email sending failed (non-fatal):", emailErr.message);
  }
}

// ─── Payment Failure ──────────────────────────────────────────────────────────
// With the new flow, no DB order exists before payment, so there's nothing
// to cancel. We log it and return. If by any chance a mock order exists, clean it.

async function handlePaymentFailure(event: Stripe.Event, supabase: any) {
  let stripeSessionId: string | null = null;

  if (event.type !== "payment_intent.payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.market !== "AU") return;
    stripeSessionId = session.id;
  }

  if (!stripeSessionId) {
    console.log("Payment failed event with no session ID — nothing to clean up.");
    return;
  }

  // In case a mock/test order was pre-created, cancel it
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, order_number, payment_status")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (existingOrder && existingOrder.payment_status === "pending") {
    await supabase
      .from("orders")
      .update({ payment_status: "failed", order_status: "cancelled" })
      .eq("id", existingOrder.id);
    console.log(`Cancelled pending order ${existingOrder.order_number} after payment failure.`);
  } else {
    console.log(`Payment failed for session ${stripeSessionId} — no DB order to cancel (expected).`);
  }
}
