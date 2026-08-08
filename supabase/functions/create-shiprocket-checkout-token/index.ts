import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { generateHmacSha256 } from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Missing Shiprocket credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanSecret = secretKey.trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const bodyData = await req.json();
    const { items, couponCode, discountAmount, catalogData, email, phone, firstName, lastName, address, city, state, postcode, subtotal, shippingAmount, taxAmount } = bodyData;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map frontend productIds to their shiprocket_variant_ids and get actual prices
    const productIds = items.map((item: any) => item.productId);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .in("id", productIds);

    if (prodError) throw prodError;

    const mappedItems = items.map((item: any) => {
      const prod = (products || []).find((p: any) => p.id === item.productId);
      if (!prod || !prod.shiprocket_variant_id) {
        throw new Error(`Product ${prod?.name || item.productId} is missing a valid Shiprocket Variant ID. Checkout aborted.`);
      }
      return {
        variant_id: String(prod.shiprocket_variant_id).trim(),
        quantity: Number(item.quantity),
        prodDetails: prod
      };
    });

    // Resolve user account
    let userId: string | null = null;
    if (email) {
      const { data: pEmail } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (pEmail) userId = pEmail.id;
    }
    if (!userId && phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^\+91/, "");
      const { data: pPhone } = await supabase.from("profiles").select("id").or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`).maybeSingle();
      if (pPhone) userId = pPhone.id;
    }

    // Build shipping address (stored in session, not DB yet)
    const shippingAddress = {
      first_name: firstName, last_name: lastName, firstName, lastName,
      address: address, city: city, state: state, postcode: postcode,
      country: "India", country_code: "IN", phone: phone, email: email
    };

    // Calculate total
    const totalAmount = (subtotal || 0) + (taxAmount || 0) + (shippingAmount || 0) - (discountAmount || 0);

    const origin = req.headers.get("origin") || "https://scalvea.com";
    const callbackRedirectUrl = origin.includes("localhost")
      ? `${origin}/shiprocket-callback`
      : "https://scalvea.com/shiprocket-callback";

    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";

    if (isMock) {
      const mockToken = "mock_token_" + Math.random().toString(36).substring(7);
      const mockOrderId = "mock_order_123";

      return new Response(
        JSON.stringify({
          token: mockToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          order_id: mockOrderId,
          redirect_url: `${callbackRedirectUrl}?token=${mockToken}&oid=${mockOrderId}&ost=SUCCESS`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: any = {
      cart_data: {
        items: mappedItems.map(m => ({ variant_id: m.variant_id, quantity: m.quantity }))
      },
      redirect_url: callbackRedirectUrl,
      timestamp: new Date().toISOString()
    };

    if (couponCode || (discountAmount && Number(discountAmount) > 0)) {
      payload.cart_discount = {
        ...(couponCode ? { coupon_code: String(couponCode).trim() } : {}),
        ...(discountAmount && Number(discountAmount) > 0 ? { amount: Number(discountAmount) } : {})
      };
    }

    if (catalogData && Array.isArray(catalogData) && catalogData.length > 0) {
      payload.catalog_data = catalogData;
    }

    const payloadString = JSON.stringify(payload);
    const signature = await generateHmacSha256(cleanSecret, payloadString);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let response: Response;
    try {
      response = await fetch("https://checkout-api.shiprocket.com/api/v1/access-token/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Api-HMAC-SHA256": signature
        },
        body: payloadString,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Shiprocket checkout request timed out after 15s" }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    const responseBody = await response.text();

    if (response.ok) {
      const resData = JSON.parse(responseBody);
      const token = resData.result?.token;
      const expiresAt = resData.result?.expires_at;
      const orderId = resData.result?.data?.order_id;

      if (!token) {
        return new Response(
          JSON.stringify({ error: "Shiprocket returned success but no token", raw: resData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store shiprocket order ID on the orders table (no shiprocket_orders table)
      if (orderId) {
        // The order doesn't exist in DB yet — it will be created by the shiprocket webhook.
        // We pass the shiprocket orderId back to the frontend so it can be tracked.
        console.log("Shiprocket order_id:", orderId, "— DB order will be created on payment confirmation.");
      }

      return new Response(
        JSON.stringify({
          token,
          expires_at: expiresAt,
          order_id: orderId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
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
