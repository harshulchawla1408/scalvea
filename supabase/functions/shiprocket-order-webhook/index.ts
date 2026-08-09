// ─── Shiprocket Order Webhook ─────────────────────────────────────────────────
// Receives POST from Shiprocket when an order is created / updated.
//
// FLOW (no shiprocket_orders mapping table — uses shiprocket_order_id column):
//   1. Read raw body, verify HMAC signature.
//   2. Return HTTP 200 IMMEDIATELY.
//   3. Background: Check if order already exists in orders table by shiprocket_order_id.
//   4. If YES: Update tracking/courier/status directly on the orders row.
//   5. If NO: Call Order Details API + syncOrderFromDetails() to create it.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import {
  generateHmacSha256,
  callOrderDetailsApi,
  syncOrderFromDetails,
  mapOrderStatus,
} from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-signature-sha256, x-signature-hmac, x-api-hmac-sha256, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Background Processor ─────────────────────────────────────────────────────

async function processWebhook(
  supabase: any,
  body: any,
  apiKey: string,
  secretKey: string,
  isMock: boolean
): Promise<void> {
  const shiprocketOrderId = String(body.order_id);
  console.log(`[Webhook] Received for Shiprocket order: ${shiprocketOrderId}`);

  // ── 1. Check if order exists by shiprocket_order_id column ───────────────
  const { data: existingOrder, error: lookupError } = await supabase
    .from("orders")
    .select("id, order_status, tracking_number, courier_name")
    .eq("shiprocket_order_id", shiprocketOrderId)
    .maybeSingle();

  if (lookupError) {
    console.error("[Webhook] Order lookup error:", lookupError.message);
    throw lookupError;
  }

  if (existingOrder) {
    // ── 2A. Order exists. Apply targeted updates only. ────────────────────
    console.log(`[Webhook] Order ${shiprocketOrderId} exists (local: ${existingOrder.id}). Applying updates.`);

    const localOrderId  = existingOrder.id;
    const mappedStatus  = mapOrderStatus(body.status);
    const newTrackingId = body.tracking_id || body.awb || null;
    const newCourier    = body.courier_name || null;

    const updates: any = { updated_at: new Date().toISOString() };
    if (newTrackingId) updates.tracking_number = newTrackingId;
    if (newCourier)    { updates.courier_name = newCourier; updates.courier = newCourier; }
    if (mappedStatus && mappedStatus !== existingOrder.order_status) {
      updates.order_status = mappedStatus;
    }

    if (Object.keys(updates).length > 1) { // more than just updated_at
      await supabase.from("orders").update(updates).eq("id", localOrderId)
        .catch((e: any) => console.warn("[Webhook] Order update failed:", e.message));
      console.log(`[Webhook] Updated order ${localOrderId}: ${JSON.stringify(updates)}`);
    } else {
      console.log(`[Webhook] No updates needed for ${localOrderId}.`);
    }
    return;
  }

  // ── 2B. Order DOES NOT exist. Webhook is the fallback creator. ───────────
  console.log(`[Webhook] No order found for ${shiprocketOrderId}. Creating via fallback.`);

  let orderDetails: any;

  if (isMock) {
    orderDetails = {
      order_id:             shiprocketOrderId,
      fastrr_order_id:      body.fastrr_order_id  || shiprocketOrderId,
      status:               body.status            || "completed",
      payment_type:         body.payment_type      || body.payment_method || "cod",
      payment_status:       body.payment_status    || null,
      subtotal_price:       body.subtotal_price    || body.amount        || 0,
      shipping_charges:     body.shipping_charges  || 0,
      coupon_discount:      body.coupon_discount   || 0,
      prepaid_discount:     body.prepaid_discount  || 0,
      total_discount:       body.total_discount    || body.coupon_discount || 0,
      cod_charges:          body.cod_charges       || 0,
      total_amount_payable: body.total_amount_payable || body.amount    || 0,
      gst_amount:           body.gst_amount        || body.tax_amount   || 0,
      edd:                  body.edd               || null,
      shipping_address:     body.shipping_address  || null,
      billing_address:      body.billing_address   || null,
      cart_data:            body.cart_data         || { items: body.items || [] },
      coupon_codes:         body.coupon_codes      || [],
      payments:             body.payments          || [],
      discount_detail:      body.discount_detail   || null,
      tags:                 body.tags              || [],
      customer:             body.customer          || null,
      shipping:             body.shipping          || null,
      billing:              body.billing           || null,
    };
  } else {
    const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
    if (result.ok && result.data) {
      orderDetails = result.data;
      console.log(`[Webhook] Order Details API success for ${shiprocketOrderId}`);
    } else {
      console.warn(`[Webhook] Order Details API failed (${result.error}). Using webhook payload as fallback.`);
      orderDetails = { ...body, order_id: shiprocketOrderId };
    }
  }

  const { orderId, created } = await syncOrderFromDetails(
    supabase,
    shiprocketOrderId,
    orderDetails,
    null,
    body
  );

  console.log(`[Webhook] Fallback creation complete. Local Order UUID: ${orderId} Created: ${created}`);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl        = Deno.env.get("SUPABASE_URL")            || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const apiKey             = Deno.env.get("SHIPROCKET_API_KEY");
  const secretKey          = Deno.env.get("SHIPROCKET_SECRET_KEY");

  if (!apiKey || !secretKey) {
    console.error("Missing Shiprocket credentials");
    return new Response(
      JSON.stringify({ error: "Missing Shiprocket credentials" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawBody = await req.text();
  const isMock  = apiKey === "mock_key" || secretKey === "mock_secret";

  const signatureHeader =
    req.headers.get("x-signature")        ||
    req.headers.get("x-signature-sha256") ||
    req.headers.get("x-signature-hmac")   ||
    req.headers.get("x-api-hmac-sha256")  || "";

  let signatureVerified = false;
  if (isMock) {
    signatureVerified = true;
  } else {
    const [computedBase64, computedHex] = await Promise.all([
      generateHmacSha256(secretKey, rawBody, "base64"),
      generateHmacSha256(secretKey, rawBody, "hex"),
    ]);
    if (
      signatureHeader === computedBase64 ||
      signatureHeader.toLowerCase() === computedHex.toLowerCase()
    ) {
      signatureVerified = true;
    }
  }

  if (!signatureVerified) {
    console.error("Webhook signature verification failed.");
    return new Response(
      JSON.stringify({ error: "Invalid webhook signature" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const shiprocketOrderId = body.order_id;
  if (!shiprocketOrderId) {
    return new Response(
      JSON.stringify({ error: "Missing order_id in webhook payload" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Return HTTP 200 IMMEDIATELY ───────────────────────────────────────────
  const supabase  = createClient(supabaseUrl, supabaseServiceKey);
  const bgPromise = processWebhook(supabase, body, apiKey, secretKey, isMock)
    .catch((err) => console.error("[Webhook] processWebhook unhandled error:", err?.message || err));

  try {
    // @ts-ignore
    EdgeRuntime.waitUntil(bgPromise);
  } catch {
    await bgPromise;
  }

  return new Response(
    JSON.stringify({ received: true, order_id: String(shiprocketOrderId) }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
