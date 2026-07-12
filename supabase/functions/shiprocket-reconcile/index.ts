import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find pending Shiprocket orders (unpaid or still processing)
    // We select orders linked to Shiprocket mappings created in the last 7 days.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingOrders, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id,
        order_status,
        payment_status,
        payment_method,
        shiprocket_orders!inner(shiprocket_order_id)
      `)
      .like("payment_method", "shiprocket_%")
      .gte("created_at", sevenDaysAgo)
      .or("order_status.eq.processing,payment_status.eq.unpaid");

    if (fetchError) throw fetchError;

    if (!pendingOrders || pendingOrders.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending orders to reconcile." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingOrders.length} pending Shiprocket orders to reconcile.`);

    const results = [];

    // Invoke fetch-shiprocket-order for each pending order sequentially to avoid rate limits
    for (const order of pendingOrders) {
      console.log(`Reconciling order: ${order.id}`);
      try {
        const { data, error } = await supabase.functions.invoke("fetch-shiprocket-order", {
          body: { orderId: order.id }
        });
        
        if (error) {
          results.push({ order_id: order.id, status: "error", error: error.message });
        } else {
          results.push({ order_id: order.id, status: "success", data });
        }
      } catch (err: any) {
        results.push({ order_id: order.id, status: "exception", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reconciled_count: pendingOrders.length,
        results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
