// ─── Shiprocket Order Webhook ─────────────────────────────────────────────────
// Receives POST from Shiprocket when an order is created / updated.
//
// FLOW:
//   1. Read raw body (needed for HMAC verification)
//   2. Verify HMAC signature
//   3. Return HTTP 200 IMMEDIATELY (Shiprocket never times out)
//   4. Background: Check if order already mapped (via Callback)
//   5. If YES: Only update logistics/status directly (no expensive API/Sync calls)
//   6. If NO: Fallback to Order Details API + syncOrderFromDetails() to create it
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

  // ── 1. Check if order already exists (created by Callback) ───────────────
  const { data: existingMapping, error: mappingError } = await supabase
    .from("shiprocket_orders")
    .select("order_id, tracking_id, courier_name")
    .eq("shiprocket_order_id", shiprocketOrderId)
    .maybeSingle();

  if (mappingError) {
    console.error("[Webhook] Mapping lookup error:", mappingError.message);
    throw mappingError;
  }

  if (existingMapping) {
    // ── 2A. Order exists. Webhook is an asynchronous updater only. ────────
    console.log(`[Webhook] Order ${shiprocketOrderId} already exists (local: ${existingMapping.order_id}). Applying targeted updates only.`);
    
    const localOrderId = existingMapping.order_id;
    const mappedStatus = mapOrderStatus(body.status);
    
    // Update tracking info if provided
    const newTrackingId = body.tracking_id || body.awb;
    const newCourier    = body.courier_name;

    if (newTrackingId || newCourier) {
      await supabase.from("shiprocket_orders").update({
        tracking_id:  newTrackingId || existingMapping.tracking_id,
        courier_name: newCourier    || existingMapping.courier_name,
      }).eq("order_id", localOrderId)
        .catch((e: any) => console.warn("[Webhook] Tracking update failed:", e.message));
      console.log(`[Webhook] Tracking Updated for ${localOrderId}`);
    } else {
      console.log(`[Webhook] Ignored (Already Synced) — no tracking updates found.`);
    }

    // Update status if changed
    if (mappedStatus) {
      const { data: currentOrder } = await supabase
        .from("orders").select("order_status").eq("id", localOrderId).maybeSingle();

      if (currentOrder && mappedStatus !== currentOrder.order_status) {
        await supabase.from("orders").update({
          order_status: mappedStatus,
          updated_at: new Date().toISOString()
        }).eq("id", localOrderId);

        await supabase.from("order_status_history").insert({
          order_id:       localOrderId,
          previous_status: currentOrder.order_status,
          new_status:     mappedStatus,
          changed_by:     "Shiprocket Webhook",
        }).catch(() => {});
        console.log(`[Webhook] Status history recorded: ${currentOrder.order_status} → ${mappedStatus}`);
      }
    }
    return; // Exit early, no heavy syncing needed.
  }

  // ── 2B. Order DOES NOT exist. Webhook is the fallback creator. ──────────
  console.log(`[Webhook] No mapping found for ${shiprocketOrderId}. Callback may have failed or not fired. Proceeding with Fallback Creation.`);

  let orderDetails: any;

  if (isMock) {
    orderDetails = {
      order_id:            shiprocketOrderId,
      fastrr_order_id:     body.fastrr_order_id     || shiprocketOrderId,
      status:              body.status               || "completed",
      payment_type:        body.payment_type         || body.payment_method || "cod",
      payment_status:      body.payment_status       || null,
      subtotal_price:      body.subtotal_price       || body.amount         || 0,
      shipping_charges:    body.shipping_charges     || 0,
      coupon_discount:     body.coupon_discount      || 0,
      prepaid_discount:    body.prepaid_discount     || 0,
      total_discount:      body.total_discount       || body.coupon_discount || 0,
      cod_charges:         body.cod_charges          || 0,
      total_amount_payable:body.total_amount_payable || body.amount         || 0,
      gst_amount:          body.gst_amount           || body.tax_amount     || 0,
      edd:                 body.edd                  || null,
      shipping_address:    body.shipping_address     || null,
      billing_address:     body.billing_address      || null,
      cart_data:           body.cart_data            || { items: body.items || [] },
      coupon_codes:        body.coupon_codes         || [],
      payments:            body.payments             || [],
      discount_detail:     body.discount_detail      || null,
      tags:                body.tags                 || [],
      customer:            body.customer             || null,
      shipping:            body.shipping             || null,
      billing:             body.billing              || null,
    };
  } else {
    const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
    if (result.ok && result.data) {
      orderDetails = result.data;
      console.log(`[Webhook] Order Details API success for fallback creation of ${shiprocketOrderId}`);
    } else {
      console.warn(`[Webhook] Order Details API failed (${result.error}). Using webhook payload as fallback.`);
      orderDetails = { ...body, order_id: shiprocketOrderId };
    }
  }

  console.log(`[Sync] Order Created via Webhook Fallback for srId=${shiprocketOrderId}`);
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
  const isMock = apiKey === "mock_key" || secretKey === "mock_secret";

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
  const supabase   = createClient(supabaseUrl, supabaseServiceKey);
  const bgPromise  = processWebhook(supabase, body, apiKey, secretKey, isMock)
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
