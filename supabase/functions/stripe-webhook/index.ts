// ─── Stripe Webhook Handler ──────────────────────────────────────────────────
// Production-grade webhook for Australia Stripe Checkout.
// 1. Verifies Stripe signature asynchronously.
// 2. Extracts metadata.order_id to locate the pending order.
// 3. Handles idempotency: ignores if already paid.
// 4. On payment success: Updates order to paid, inserts order_items, 
//    deducts inventory.
// 5. On payment failure: Marks order as cancelled.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

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

  const checkoutSessionId = session.metadata?.checkout_session_id;
  const stripeSessionId = session.id;

  // 1. Locate pending checkout session
  let sessionQuery = supabase.from("checkout_sessions").select("*");
  if (checkoutSessionId) {
    sessionQuery = sessionQuery.eq("id", checkoutSessionId);
  } else {
    sessionQuery = sessionQuery.eq("stripe_session_id", stripeSessionId);
  }

  const { data: checkoutSession, error: sessionError } = await sessionQuery.maybeSingle();

  if (sessionError || !checkoutSession) {
    console.error(`Could not locate pending checkout session. Checkout Session ID: ${checkoutSessionId}, Stripe Session: ${stripeSessionId}`);
    return;
  }

  // 2. Atomic Idempotency Check & Update & Transaction via Postgres RPC
  const stripePaymentIntentId = typeof session.payment_intent === "string" 
    ? session.payment_intent 
    : session.payment_intent?.id || null;

  const paymentDetails = {
    payment_method: "stripe",
    payment_intent_id: stripePaymentIntentId,
    transaction_id: stripePaymentIntentId,
  };

  const { data: rpcResult, error: rpcError } = await supabase.rpc("process_checkout_transaction", {
    p_session_id: checkoutSession.id,
    p_payment_details: paymentDetails,
    p_order_source: "Stripe"
  });

  if (rpcError) {
    console.error(`RPC transaction failed for session ${checkoutSession.id}:`, rpcError.message || rpcError);
    await supabase.from("system_logs").insert({
      level: "ERROR",
      source: "stripe-webhook",
      message: `Transaction failed for session ${checkoutSession.id}`,
      metadata: { error: rpcError.message || rpcError, session_id: checkoutSession.id }
    } as any);
    return;
  }

  if (!rpcResult || !rpcResult.success) {
    console.log(`Checkout Session ${checkoutSession.id} transaction returned false (already processed or failed).`, rpcResult);
    if (rpcResult?.error) {
      await supabase.from("system_logs").insert({
        level: "ERROR",
        source: "stripe-webhook",
        message: `Transaction error for session ${checkoutSession.id}: ${rpcResult.error}`,
        metadata: { error: rpcResult.error, session_id: checkoutSession.id }
      } as any);
    }
    return;
  }

  console.log(`✅ Transaction successful for checkout session: ${checkoutSession.id}. Order ID: ${rpcResult.order_id}`);

  // 3. (Emails removed globally from Scalvea as per requirements)
}

async function handlePaymentFailure(event: Stripe.Event, supabase: any) {
  let session: any;
  let checkoutSessionId: string | null = null;
  let stripeSessionId: string | null = null;

  if (event.type === "payment_intent.payment_failed") {
    // Cannot easily map payment_intent_id to checkout_session, so ignore
    // as the checkout session will expire anyway.
    return;
  } else {
    session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.market !== "AU") return;
    checkoutSessionId = session.metadata?.checkout_session_id;
    stripeSessionId = session.id;
  }

  let sessionQuery = supabase.from("checkout_sessions").select("id, status");
  if (checkoutSessionId) {
    sessionQuery = sessionQuery.eq("id", checkoutSessionId);
  } else if (stripeSessionId) {
    sessionQuery = sessionQuery.eq("stripe_session_id", stripeSessionId);
  } else {
    return;
  }

  const { data: existingSession } = await sessionQuery.maybeSingle();

  if (existingSession && existingSession.status === "PENDING") {
    await supabase
      .from("checkout_sessions")
      .update({ status: event.type === "checkout.session.expired" ? "EXPIRED" : "FAILED" })
      .eq("id", existingSession.id);
    console.log(`Marked checkout session ${existingSession.id} as failed/expired.`);
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
