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
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { items } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map frontend productIds to their shiprocket_variant_ids or fallbacks
    const productIds = items.map((item: any) => item.productId);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, shiprocket_variant_id, sku_india, sku")
      .in("id", productIds);

    if (prodError) {
      throw prodError;
    }

    const mappedItems = items.map((item: any) => {
      const prod = (products || []).find((p: any) => p.id === item.productId);
      return {
        variant_id: prod?.shiprocket_variant_id || prod?.sku_india || prod?.sku || item.productId,
        quantity: Number(item.quantity)
      };
    });

    const payload = {
      cart_data: {
        items: mappedItems
      }
    };

    const apiKey = Deno.env.get("SHIPROCKET_API_KEY") || "mock_key";
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY") || "mock_secret";

    let token = "mock_token_" + Math.random().toString(36).substring(2, 15);
    let redirectUrl = `https://checkout.shiprocket.com/checkout/${token}`;
    let signature = "";

    if (apiKey !== "mock_key" && secretKey !== "mock_secret") {
      const bodyText = JSON.stringify(payload);
      signature = await generateHmacSha256(secretKey, bodyText);

      const response = await fetch("https://checkout-api.shiprocket.com/api/v1/access-token/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-signature": signature
        },
        body: bodyText
      });

      if (response.ok) {
        const resData = await response.json();
        token = resData.token || token;
        redirectUrl = resData.redirect_url || redirectUrl;
      } else {
        const errText = await response.text();
        console.error("Shiprocket access token endpoint failed:", errText);
        throw new Error(`Shiprocket API failure: ${errText}`);
      }
    } else {
      console.log("Operating in MOCK mode for create-shiprocket-checkout-token");
      signature = await generateHmacSha256(secretKey, JSON.stringify(payload));
    }

    return new Response(
      JSON.stringify({
        token,
        redirect_url: redirectUrl,
        signature
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
