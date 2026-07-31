import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { callOrderDetailsApi, parseOrderDetailsToSessionUpdate } from "../_shared/shiprocket-mapper.ts";

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey) {
      throw new Error("Missing Shiprocket credentials");
    }

    const { shiprocketOrderId, sessionId } = await req.json();

    if (!shiprocketOrderId || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing shiprocketOrderId or sessionId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[Process-Payment] Calling Shiprocket API for order_id: ${shiprocketOrderId}`);
    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";
    let isPaid = false;
    let paymentDetails: any = { payment_method: "shiprocket", transaction_id: shiprocketOrderId };

    if (isMock) {
      isPaid = true;
    } else {
      const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
      if (result.ok && result.data) {
        const data = result.data;
        if (data.status === "completed" || data.status === "NEW" || data.status === "processing" || data.status?.toUpperCase() === "SUCCESS") {
            isPaid = true;
        }
        
        if (data.payments && data.payments.length > 0) {
            paymentDetails.payment_method = data.payments[0].payment_method || "shiprocket";
            paymentDetails.transaction_id = data.payments[0].pg_transaction_id || shiprocketOrderId;
        }
      } else {
        throw new Error(`Failed to verify order via Shiprocket API: ${result.error}`);
      }
    }

    if (!isPaid) {
      return new Response(JSON.stringify({ success: false, error: "Order is not paid in Shiprocket." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!isMock) {
      const result = await callOrderDetailsApi(shiprocketOrderId, apiKey, secretKey);
      if (result.ok && result.data) {
        const sessionUpdate = parseOrderDetailsToSessionUpdate(result.data);
        console.log(`[Process-Payment] Updating session ${sessionId} with Shiprocket data.`);
        const { error: updateErr } = await supabase
          .from("checkout_sessions")
          .update(sessionUpdate)
          .eq("id", sessionId);
        
        if (updateErr) {
          console.error("[Process-Payment] Failed to update session:", updateErr);
        }
      }
    }

    console.log(`[Process-Payment] Calling RPC process_checkout_transaction for session ${sessionId}`);

    const { data: rpcResult, error: rpcError } = await supabase.rpc("process_checkout_transaction", {
      p_session_id: sessionId,
      p_payment_details: paymentDetails,
      p_order_source: "SHIPROCKET"
    });

    if (rpcError) {
      console.error(`[Process-Payment] RPC error:`, rpcError);
      await supabase.from("system_logs").insert({
        level: "ERROR",
        source: "process-shiprocket-payment",
        message: `Transaction failed for session ${sessionId}`,
        metadata: { error: rpcError.message || rpcError, session_id: sessionId }
      } as any);
      return new Response(JSON.stringify({ error: "Failed to process transaction" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!rpcResult || !rpcResult.success) {
      console.log(`[Process-Payment] RPC returned false:`, rpcResult);
      if (rpcResult?.error === "Session not found or already processed.") {
          const { data: session } = await supabase.from("checkout_sessions").select("stripe_session_id").eq("id", sessionId).single();
          if (session) {
             const { data: order } = await supabase.from("orders").select("id").eq("stripe_session_id", sessionId).maybeSingle();
             if (order) {
                 return new Response(JSON.stringify({ success: true, order_id: order.id, already_processed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
             }
          }
      }

      return new Response(JSON.stringify({ error: rpcResult?.error || "Transaction failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const localOrderId = rpcResult.order_id;
    console.log(`[Process-Payment] ✅ Order created successfully: ${localOrderId}`);

    // Create the mapping so webhook doesn't create it again
    await supabase.from("shiprocket_orders").insert({
      order_id: localOrderId,
      shiprocket_order_id: shiprocketOrderId,
      status: "NEW",
    });

    // Save sessionId in stripe_session_id so it can be located
    await supabase.from("orders").update({ stripe_session_id: sessionId, fastrr_order_id: shiprocketOrderId }).eq("id", localOrderId);



    return new Response(JSON.stringify({ success: true, order_id: localOrderId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[Process-Payment] FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
