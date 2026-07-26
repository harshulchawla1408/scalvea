// ─── Shiprocket Reconciler ────────────────────────────────────────────────────
// Scheduled cron (or manually triggered) to repair incomplete India orders.
//
// REPAIRS:
//   1. Orders in pending/processing state (may have incomplete data)
//   2. Orders with 0 order_items (cart data was lost)
//   3. Orders where payment_status is unpaid but should be paid (delayed webhook)
//
// All repairs use syncOrderFromDetails() — the single canonical sync function.
// Maximum 30-day window to avoid processing very old stale orders.
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
    const apiKey             = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey          = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase configuration");
    if (!apiKey || !secretKey)               throw new Error("Missing Shiprocket API credentials");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isMock   = apiKey === "mock_key" || secretKey === "mock_secret";

    // ── Query 1: Orders in incomplete states (last 30 days) ──────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: incompleteOrders, error: q1Error } = await supabase
      .from("orders")
      .select(`
        id, order_number, order_status, payment_status, payment_method,
        shiprocket_orders!inner(shiprocket_order_id)
      `)
      .like("payment_method", "shiprocket_%")
      .gte("created_at", thirtyDaysAgo)
      .or("order_status.in.(pending,processing),payment_status.eq.unpaid");

    if (q1Error) throw q1Error;

    // ── Query 2: Orders with ZERO items (incomplete order creation) ───────────
    // Uses a left join approach: find orders with no child order_items rows
    const { data: noItemOrders, error: q2Error } = await supabase
      .from("orders")
      .select(`
        id, order_number, order_status, payment_method,
        shiprocket_orders!inner(shiprocket_order_id),
        order_items(id)
      `)
      .like("payment_method", "shiprocket_%")
      .gte("created_at", thirtyDaysAgo);

    if (q2Error) {
      console.warn("Query 2 (no-items orders) failed:", q2Error.message);
    }

    // Filter: only orders with empty order_items array
    const emptyItemOrders = (noItemOrders || []).filter((o: any) =>
      !o.order_items || o.order_items.length === 0
    );

    // ── Deduplicate across both query results ─────────────────────────────────
    const seen = new Set<string>();
    const ordersToReconcile: any[] = [];

    for (const o of [...(incompleteOrders || []), ...emptyItemOrders]) {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        ordersToReconcile.push(o);
      }
    }

    if (ordersToReconcile.length === 0) {
      console.log("Reconciler: No orders to repair.");
      return new Response(
        JSON.stringify({ success: true, message: "No orders to reconcile.", reconciled_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Reconciler: Found ${ordersToReconcile.length} orders to repair.`);

    // ── Repair each order ─────────────────────────────────────────────────────
    const results: any[] = [];

    for (const order of ordersToReconcile) {
      const shiprocketOrderId: string = (order.shiprocket_orders as any)?.shiprocket_order_id;

      if (!shiprocketOrderId) {
        results.push({ order_id: order.id, order_number: order.order_number, status: "skipped", reason: "No Shiprocket order ID" });
        continue;
      }

      console.log(`Reconciler: Repairing order ${order.order_number} (srId=${shiprocketOrderId})`);

      try {
        let orderDetails: any;

        if (isMock) {
          orderDetails = { order_id: shiprocketOrderId, status: "completed", payment_type: "cod", total_amount_payable: 0 };
        } else {
          const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
          if (!result.ok || !result.data) {
            console.warn(`Reconciler: Order Details API failed for ${shiprocketOrderId}: ${result.error}`);
            results.push({ order_id: order.id, order_number: order.order_number, status: "api_error", error: result.error });
            continue;
          }
          orderDetails = result.data;
        }

        // Full sync — always pass existingOrderId to prevent new order creation
        const { orderId: syncedId, itemsCreated } = await syncOrderFromDetails(
          supabase,
          shiprocketOrderId,
          orderDetails,
          order.id,   // existingOrderId
          null
        );

        results.push({
          order_id:     order.id,
          order_number: order.order_number,
          status:       "repaired",
          items_created: itemsCreated.length,
        });

        console.log(`Reconciler: Repaired ${order.order_number} — items_created=${itemsCreated.length}`);

        // Throttle: 300ms between API calls to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        console.error(`Reconciler: Error repairing order ${order.order_number}:`, err.message);
        results.push({ order_id: order.id, order_number: order.order_number, status: "exception", error: err.message });
      }
    }

    const repairedCount = results.filter((r) => r.status === "repaired").length;
    const errorCount    = results.filter((r) => r.status !== "repaired" && r.status !== "skipped").length;

    console.log(`Reconciler: Complete. repaired=${repairedCount} errors=${errorCount} total=${ordersToReconcile.length}`);

    return new Response(
      JSON.stringify({
        success:          true,
        reconciled_count: ordersToReconcile.length,
        repaired_count:   repairedCount,
        error_count:      errorCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Reconciler: Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
