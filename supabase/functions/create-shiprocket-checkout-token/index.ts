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
  
  // Base64 encode the byte array
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
    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    // TASK 1 — VERIFY SUPABASE SECRETS
    console.log("API Key exists:", !!apiKey);
    console.log("Secret Key exists:", !!secretKey);

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({
          error: "Missing Shiprocket credentials"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TASK 3 — SANITIZE SECRET KEY
    const cleanSecret = secretKey.trim();
    console.log("Secret length:", cleanSecret.length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { items, couponCode, discountAmount, catalogData } = await req.json();
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

    // TASK 7 — VERIFY PAYLOAD FORMAT (variant_id MUST be string, nested cart_data and top-level fields)
    const mappedItems = items.map((item: any) => {
      const prod = (products || []).find((p: any) => p.id === item.productId);
      const rawVariantId = prod?.shiprocket_variant_id || prod?.sku_india || prod?.sku;
      const finalVariantIdStr = rawVariantId ? String(rawVariantId).trim() : "200001";
      
      return {
        variant_id: finalVariantIdStr,
        quantity: Number(item.quantity)
      };
    });

    const origin = req.headers.get("origin") || "https://scalvea.com";
    const callbackRedirectUrl = origin.includes("localhost")
      ? `${origin}/shiprocket-callback`
      : "https://scalvea.com/shiprocket-callback";

    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";

    if (isMock) {
      console.log("Mock credentials active. Returning simulated checkout details.");
      const mockToken = "mock_token_" + Math.random().toString(36).substring(7);
      return new Response(
        JSON.stringify({
          token: mockToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          order_id: "mock_order_123",
          redirect_url: `${callbackRedirectUrl}?token=${mockToken}&oid=mock_order_123&ost=SUCCESS`,
          signature: "mock_signature"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      cart_data: {
        items: mappedItems
      },
      redirect_url: callbackRedirectUrl,
      timestamp: new Date().toISOString()
    };

    // TASK 1 — VERIFY RAW PAYLOAD STRING
    const payloadString = JSON.stringify(payload);

    // GENERATE BASE64 HMAC SHA256
    const signature = await generateHmacSha256(cleanSecret, payloadString);

    // TASK 4 — ADD DEBUG LOGS
    console.log("Full payload object:", payload);
    console.log("Full payload string:", payloadString);
    console.log("BASE64 Signature:", signature);
    console.log("Headers:", {
      "X-Api-Key": apiKey ? "present" : "missing",
      "X-Api-HMAC-SHA256": signature ? "present" : "missing"
    });

    // TASK 3 — SEND EXACT SAME PAYLOAD STRING
    const response = await fetch("https://checkout-api.shiprocket.com/api/v1/access-token/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "X-Api-HMAC-SHA256": signature
      },
      body: payloadString
    });

    console.log("Shiprocket status:", response.status);
    const responseBody = await response.text();
    console.log("Shiprocket response body:", responseBody);

    if (response.ok) {
      const resData = JSON.parse(responseBody);
      const token = resData.result?.token;
      const expiresAt = resData.result?.expires_at;
      const orderId = resData.result?.data?.order_id;

      // CRITICAL: Log the full result structure to understand what redirect_url looks like
      console.log("Shiprocket result keys:", Object.keys(resData.result || {}));
      console.log("Shiprocket redirect_url from API:", resData.result?.redirect_url);
      console.log("Shiprocket full result JSON:", JSON.stringify(resData.result, null, 2));
      console.log("Shiprocket token:", token);

      if (!token) {
        return new Response(
          JSON.stringify({ error: "Shiprocket returned success but no token", raw: resData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build redirect_url from the token.
      // NOTE: checkout.shiprocket.in/goto/{token} is DEPRECATED (returns 404 - Fastrr rebrand).
      // The Shiprocket SDK (shopify.js) uses https://fastrr-boost-ui.pickrr.com/ as its
      // checkoutBuyer base URL and constructs the checkout URL with customCheckoutToken.
      // We replicate that here for the fallback redirect path.
      let redirectUrl = resData.result?.redirect_url || "";

      // Fix any legacy domain typos (shiprocket.co -> shiprocket.in)
      if (redirectUrl.includes("checkout.shiprocket.co")) {
        redirectUrl = redirectUrl.replace("checkout.shiprocket.co", "checkout.shiprocket.in");
      }

      // If Shiprocket API didn't return a redirect_url, construct it from the token
      // using the Fastrr checkout URL format (sourced from the SDK source code)
      if (!redirectUrl) {
        const channelParams = btoa(encodeURIComponent(JSON.stringify({
          shop_name: "company-logo",
          shop_url: "scalvea.com",
          redirectUrl: callbackRedirectUrl,
          credInstalled: false,
          gpayInstalled: "NO"
        })));
        redirectUrl = `https://fastrr-boost-ui.pickrr.com/?customCheckoutToken=${token}&type=cart&platform=CUSTOM&channel=${channelParams}&isInitiatedFromApp=true`;
      }

      // Log what we are returning to the frontend
      console.log("Final redirect URL to frontend:", redirectUrl);

      return new Response(
        JSON.stringify({
          token,
          expires_at: expiresAt,
          order_id: orderId,
          redirect_url: redirectUrl,
          signature
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // TASK 6 — RETURN BETTER ERROR
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          shiprocket_error: responseBody
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
