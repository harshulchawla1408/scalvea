import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { generateHmacSha256 } from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helper: outbound fetch with 15-second timeout ───────────────────────────

async function shiprocketFetch(
  url: string,
  payloadString: string,
  apiKey: string,
  sig: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "X-Api-HMAC-SHA256": sig
      },
      body: payloadString,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return { ok: false, status: 504, text: "Request timed out after 15s" };
    }
    throw err;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

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

    if (!apiKey || !secretKey || apiKey === "mock_key" || secretKey === "mock_secret") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, amount, order_id, page, from, to } = body;

    // ── Refund Initiate ───────────────────────────────────────────────────────
    if (action === "initiate") {
      if (!amount || !order_id) {
        return new Response(JSON.stringify({ error: "Missing amount or order_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const payload = {
        amount: Number(amount),
        order_id: String(order_id)
      };

      const payloadString = JSON.stringify(payload);
      const sig = await generateHmacSha256(secretKey, payloadString);

      const { ok, status, text: responseText } = await shiprocketFetch(
        "https://checkout-api.shiprocket.com/api/v1/external/refund/initiate",
        payloadString,
        apiKey,
        sig
      );

      let resJson: any = {};
      try {
        resJson = JSON.parse(responseText);
      } catch (_) {
        resJson = { raw: responseText };
      }

      // On success, log the refund in payments and update order status
      if (ok && resJson.ok === true) {
        const { data: mapping } = await supabase
          .from("shiprocket_orders")
          .select("order_id")
          .eq("shiprocket_order_id", String(order_id))
          .maybeSingle();

        if (mapping?.order_id) {
          await supabase.from("payments").insert({
            order_id: mapping.order_id,
            payment_method: "shiprocket_refund",
            payment_status: "refunded",
            amount: -Number(amount),
            transaction_id: resJson.result?.refund_id || `REF-${order_id}`,
            raw_response: resJson
          });

          await supabase.from("orders").update({
            payment_status: "refunded",
            order_status: "cancelled",
            updated_at: new Date().toISOString()
          }).eq("id", mapping.order_id);
        }
      }

      return new Response(JSON.stringify(resJson), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    // ── Refund Report ─────────────────────────────────────────────────────────
    } else if (action === "report") {
      const payload = {
        page: Number(page || 1),
        from: from || null,
        to: to || null
      };

      const payloadString = JSON.stringify(payload);
      const sig = await generateHmacSha256(secretKey, payloadString);

      const { status, text: responseText } = await shiprocketFetch(
        "https://checkout-api.shiprocket.com/api/v1/external/refund/reports",
        payloadString,
        apiKey,
        sig
      );

      let resJson = {};
      try {
        resJson = JSON.parse(responseText);
      } catch (_) {
        resJson = { raw: responseText };
      }

      return new Response(JSON.stringify(resJson), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'initiate' or 'report'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
