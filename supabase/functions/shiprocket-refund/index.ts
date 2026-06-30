import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateHmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  const u8 = new Uint8Array(signatureBuffer);
  
  // Base64 encode
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

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

      const response = await fetch("https://checkout-api.shiprocket.com/api/v1/external/refund/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-signature": sig,
          "X-Api-HMAC-SHA256": sig
        },
        body: payloadString
      });

      const responseText = await response.text();
      let resJson: any = {};
      try {
        resJson = JSON.parse(responseText);
      } catch (_) {
        resJson = { raw: responseText };
      }

      // If refund succeeds, log it in payments and update order status
      if (response.ok && resJson.ok === true) {
        // Query local order ID from shiprocket mapping
        const { data: mapping } = await supabase
          .from("shiprocket_orders")
          .select("order_id")
          .eq("shiprocket_order_id", String(order_id))
          .maybeSingle();

        if (mapping?.order_id) {
          // Log refund in payments
          await supabase.from("payments").insert({
            order_id: mapping.order_id,
            payment_method: "shiprocket_refund",
            payment_status: "refunded",
            amount: -Number(amount),
            transaction_id: resJson.result?.refund_id || `REF-${order_id}`,
            raw_response: resJson
          });

          // Update order status if fully refunded
          // In production, we'd query total payments to check if fully refunded
          await supabase.from("orders").update({
            payment_status: "refunded",
            order_status: "cancelled",
            updated_at: new Date().toISOString()
          }).eq("id", mapping.order_id);
        }
      }

      return new Response(JSON.stringify(resJson), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "report") {
      const payload = {
        page: Number(page || 1),
        from: from || null,
        to: to || null
      };

      const payloadString = JSON.stringify(payload);
      const sig = await generateHmacSha256(secretKey, payloadString);

      const response = await fetch("https://checkout-api.shiprocket.com/api/v1/external/refund/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-signature": sig,
          "X-Api-HMAC-SHA256": sig
        },
        body: payloadString
      });

      const responseText = await response.text();
      let resJson = {};
      try {
        resJson = JSON.parse(responseText);
      } catch (_) {
        resJson = { raw: responseText };
      }

      return new Response(JSON.stringify(resJson), {
        status: response.status,
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
