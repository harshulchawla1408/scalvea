// ─── Fetch Shiprocket Order (Callback Polling API) ───────────────────────────
// Called by ShiprocketCallback.tsx polling loop every 2 seconds after checkout.
//
// FLOW:
//   1. Accept orderId (local UUID OR Shiprocket order_id string)
//   2. Look up shiprocket_orders mapping
//   3. If mapping found: run syncOrderFromDetails() for complete repair
//   4. If mapping not found: return 404 so frontend keeps polling
//
// This function is the SECOND call path into syncOrderFromDetails(), after the
// webhook. It ensures the order is fully populated even when the webhook fires
// before all Order Details API data is available.
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

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl        = Deno.env.get("SUPABASE_URL")              || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase           = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
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

    console.log(`fetch-shiprocket-order: looking up orderId=${orderId}`);

    // ── Step 1: Resolve shiprocket_orders mapping ──────────────────────────
    // Accept either a local UUID or a Shiprocket order_id string
    let mapping: any = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    if (isUuid) {
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

    // ── Step 2: If no mapping yet, webhook hasn't processed it → 404 ───────
    // The frontend ShiprocketCallback.tsx polls until it receives non-404.
    if (!mapping) {
      console.log(`fetch-shiprocket-order: No mapping found for ${orderId} — webhook not yet processed. Frontend should keep polling.`);
      return new Response(
        JSON.stringify({ error: "Order not yet processed. Please wait..." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shiprocketOrderId = mapping.shiprocket_order_id;
    const localOrderId      = mapping.order_id;
    const isMock            = apiKey === "mock_key" || secretKey === "mock_secret";

    console.log(`fetch-shiprocket-order: Found mapping. srOrderId=${shiprocketOrderId} localId=${localOrderId}`);

    // ── Step 3: Call Order Details API ─────────────────────────────────────
    let orderDetails: any;

    if (isMock) {
      orderDetails = {
        order_id:            shiprocketOrderId,
        fastrr_order_id:     shiprocketOrderId,
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
      if (result.ok && result.data) {
        orderDetails = result.data;
        console.log("fetch-shiprocket-order: Order Details API success");
      } else {
        // Soft failure: return existing order data without full sync
        console.warn(`fetch-shiprocket-order: Order Details API failed (${result.error}). Returning existing order.`);
        const { data: existingOrder } = await supabase
          .from("orders")
          .select("*, order_items(*), shiprocket_orders(*)")
          .eq("id", localOrderId)
          .maybeSingle();
        return new Response(
          JSON.stringify({ success: true, order: existingOrder, partial: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Step 4: Full sync via canonical function ────────────────────────────
    console.log("fetch-shiprocket-order: Running syncOrderFromDetails...");
    const { orderId: syncedOrderId } = await syncOrderFromDetails(
      supabase,
      shiprocketOrderId,
      orderDetails,
      localOrderId,   // existingOrderId — always update, never create
      null
    );

    // ── Step 5: Return the fully-populated order ────────────────────────────
    const { data: finalOrder, error: finalErr } = await supabase
      .from("orders")
      .select("*, order_items(*), shiprocket_orders(*)")
      .eq("id", syncedOrderId)
      .maybeSingle();

    if (finalErr || !finalOrder) {
      console.error("fetch-shiprocket-order: Could not fetch updated order:", finalErr?.message);
      return new Response(
        JSON.stringify({ error: "Order updated but failed to retrieve final record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`fetch-shiprocket-order: Complete. order=${finalOrder.order_number} status=${finalOrder.order_status} payment=${finalOrder.payment_status}`);

    return new Response(
      JSON.stringify({ success: true, order: finalOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("fetch-shiprocket-order: Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
