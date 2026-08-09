// ─── Fetch Shiprocket Order (Callback Verification API) ───────────────────────
// Called by ShiprocketCallback.tsx immediately after checkout redirect.
//
// NEW FLOW (no shiprocket_orders mapping table):
//   1. Receive Shiprocket order_id from Shiprocket checkout callback.
//   2. Check if order already exists in DB by shiprocket_order_id column.
//   3. If not: call Shiprocket Order Details API → create order via syncOrderFromDetails.
//   4. Return the local order UUID, number, and customer details to the frontend.
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

    // ── 1. Check if order already exists in DB (idempotency via shiprocket_order_id column) ──
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number, customer_email, customer_name, customer_phone, order_status, payment_status, total_amount, currency, shipping_address, order_items(*)")
      .eq("shiprocket_order_id", String(shiprocketOrderId))
      .maybeSingle();

    if (existingOrder) {
      console.log(`[Callback] Order ${existingOrder.order_number} already exists for Shiprocket ID ${shiprocketOrderId}. Returning.`);
      return new Response(
        JSON.stringify({ success: true, order: existingOrder }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Call Shiprocket Order Details API ─────────────────────────────────
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    let orderDetails: any;

    if (isMock) {
      orderDetails = {
        order_id:            String(shiprocketOrderId),
        fastrr_order_id:     String(shiprocketOrderId),
        status:              "completed",
        payment_type:        "prepaid",
        payment_status:      "paid",
        subtotal_price:      749,
        shipping_charges:    50,
        total_discount:      0,
        cod_charges:         0,
        total_amount_payable: 799,
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
        // Return 404 so frontend knows to keep retrying (Shiprocket needs a few seconds)
        return new Response(
          JSON.stringify({ error: "Order details not yet available from Shiprocket. Please retry." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      orderDetails = result.data;
      console.log(`[Callback] Shiprocket Order Details API success for ${shiprocketOrderId}`);
    }

    // ── 3. Create order in DB via syncOrderFromDetails ───────────────────────
    console.log(`[Callback] Creating order from Shiprocket details for ${shiprocketOrderId}`);
    const { orderId: localOrderId } = await syncOrderFromDetails(
      supabase,
      String(shiprocketOrderId),
      orderDetails,
      null, // No pre-existing order
      null  // No webhook body
    );

    // ── 4. Return the full order for the success page ────────────────────────
    const { data: finalOrder, error: finalErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_email, customer_name, customer_phone, order_status, payment_status, total_amount, currency, shipping_address, order_items(*)")
      .eq("id", localOrderId)
      .maybeSingle();

    if (finalErr || !finalOrder) {
      console.error("[Callback] Error fetching final order:", finalErr?.message);
      return new Response(
        JSON.stringify({ error: "Order created but failed to retrieve details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Callback] Verification Complete. Order: ${finalOrder.order_number} (${finalOrder.id})`);
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
