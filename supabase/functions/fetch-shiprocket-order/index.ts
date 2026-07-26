// ─── Fetch Shiprocket Order (Callback Verification API) ────────────────────────
// Called by ShiprocketCallback.tsx immediately after checkout redirect.
//
// FLOW:
//   1. Receive Shiprocket order_id.
//   2. Call Shiprocket Order Details API as the Source of Truth.
//   3. Check if we already mapped this order (in case of retry/race).
//   4. Call syncOrderFromDetails() to atomically create/update the order.
//   5. Return the local order UUID and number back to the frontend.
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import {
  callOrderDetailsApi,
  syncOrderFromDetails,
} from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")              || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId: shiprocketOrderId } = await req.json();
    if (!shiprocketOrderId) {
      return new Response(
        JSON.stringify({ error: "Missing Shiprocket orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey    = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Missing Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Callback] Verification requested for Shiprocket Order ID: ${shiprocketOrderId}`);

    // ── 1. Call Order Details API (Authoritative Source) ─────────────────────
    console.log(`[Callback] Calling Order Details API for ${shiprocketOrderId}`);
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    let orderDetails: any;

    if (isMock) {
      orderDetails = {
        order_id:            String(shiprocketOrderId),
        fastrr_order_id:     String(shiprocketOrderId),
        status:              "completed",
        payment_type:        "cod",
        payment_status:      "paid",
        subtotal_price:      749,
        shipping_charges:    50,
        total_discount:      0,
        cod_charges:         0,
        total_amount_payable:799,
        gst_amount:          0,
        edd:                 null,
        shipping_address: {
          first_name: "Mock", last_name: "Customer",
          address_line1: "123 Mock Street", city: "Mumbai",
          state: "Maharashtra", postcode: "400001",
          phone: "9999999999", email: "mock@example.com",
        },
        cart_data: { items: [] },
        payments:  [],
      };
    } else {
      const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
      if (!result.ok || !result.data) {
        console.error(`[Callback] Order Details API failed: ${result.error}`);
        // Return 404/500 so frontend knows it failed and can apply exponential backoff
        return new Response(
          JSON.stringify({ error: "Order details not yet available from Shiprocket." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      orderDetails = result.data;
      console.log(`[Callback] Order Details API verified successfully for ${shiprocketOrderId}`);
    }

    // ── 2. Check if mapping already exists ──────────────────────────────────
    // In rare cases (e.g. frontend retry, or webhook fired incredibly fast), it might exist.
    const { data: mapping } = await supabase
      .from("shiprocket_orders")
      .select("order_id")
      .eq("shiprocket_order_id", String(shiprocketOrderId))
      .maybeSingle();

    const existingOrderId = mapping?.order_id || null;

    // ── 3. Atomically Create/Update Order ───────────────────────────────────
    console.log(`[Sync] Running syncOrderFromDetails (existingId: ${existingOrderId})`);
    
    const { orderId: localOrderId } = await syncOrderFromDetails(
      supabase,
      String(shiprocketOrderId),
      orderDetails,
      existingOrderId,
      null // No webhook body
    );

    // ── 4. Retrieve minimal response for redirect ───────────────────────────
    const { data: finalOrder, error: finalErr } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", localOrderId)
      .maybeSingle();

    if (finalErr || !finalOrder) {
      console.error("[Callback] Error fetching final verified order:", finalErr?.message);
      return new Response(
        JSON.stringify({ error: "Order verified but failed to retrieve final record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Callback] Verification Complete. Local Order UUID: ${finalOrder.id} (${finalOrder.order_number})`);

    return new Response(
      JSON.stringify({ success: true, order: finalOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Callback] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
