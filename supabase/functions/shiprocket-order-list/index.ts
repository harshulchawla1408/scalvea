import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey || apiKey === "mock_key" || secretKey === "mock_secret") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { startDate, endDate, status, limit, page } = body;

    const timestamp = new Date().toISOString();
    const payload = {
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || null,
      limit: Number(limit || 100),
      page: Number(page || 1),
      timestamp
    };

    const payloadString = JSON.stringify(payload);
    const sig = await generateHmacSha256(secretKey, payloadString);

    const response = await fetch("https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details/list", {
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

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
