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

    const { items, totals, market } = await req.json();
    if (market !== "IN") {
      return new Response(
        JSON.stringify({ error: "Shiprocket checkout is only available for the India market (INR)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = user.id;
    const authEmail = user.email;

    // Map frontend productIds to their shiprocket_variant_ids
    const productIds = items.map((item: any) => item.productId);
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, name, shiprocket_variant_id")
      .in("id", productIds);

    if (prodError) throw prodError;

    const mappedItems = items.map((item: any) => {
      const prod = (products || []).find((p: any) => p.id === item.productId);
      if (!prod || !prod.shiprocket_variant_id) {
        throw new Error(`Product ${prod?.name || item.productId} is missing a valid Shiprocket Variant ID. Checkout aborted.`);
      }
      return {
        variant_id: String(prod.shiprocket_variant_id).trim(),
        quantity: Number(item.quantity)
      };
    });

    const origin = req.headers.get("origin") || "https://scalvea.com";
    let callbackRedirectUrl = origin.includes("localhost")
      ? `${origin}/shiprocket-callback`
      : "https://scalvea.com/shiprocket-callback";

    // Create checkout_sessions record
    const lineItemsToStore = items.map((item: any) => {
      const prod = (products || []).find((p: any) => p.id === item.productId);
      if (!prod) return null;
      return {
        product_id: prod.id,
        product_name: prod.name,
        quantity: item.quantity,
        price: null, // To be filled if needed, or fetched
        currency: "INR",
        image_url: null,
      };
    }).filter(Boolean);

    const { data: newSession, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        user_id: userId,
        status: "PENDING",
        total_amount: totals?.total || 0,
        subtotal: totals?.subtotal || 0,
        shipping_amount: totals?.shipping || 0,
        tax_amount: totals?.tax || 0,
        discount_amount: totals?.discount || 0,
        coupon_code: null, // Applied inside Shiprocket
        customer_email: authEmail, // Use auth email if available, otherwise null until Shiprocket fills it
        customer_phone: null,
        customer_name: null,
        shipping_address: null, // Collected inside Shiprocket
        line_items: lineItemsToStore,
        market: "IN",
        currency: "INR",
        totals: totals,
      } as any)
      .select()
      .single();

    if (sessionError || !newSession) {
      console.error("Failed to create checkout session:", sessionError?.message);
      return new Response(
        JSON.stringify({ error: "Failed to create checkout session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Append session_id to Shiprocket's redirect_url
    callbackRedirectUrl += `?session_id=${newSession.id}`;

    const isMock = apiKey === "mock_key" || secretKey === "mock_secret";

    if (isMock) {
      const mockToken = "mock_token_" + Math.random().toString(36).substring(7);
      return new Response(
        JSON.stringify({
          token: mockToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          order_id: "mock_order_123",
          redirect_url: `${callbackRedirectUrl}?token=${mockToken}&oid=mock_order_123&ost=SUCCESS`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build payload — only include cart_discount when coupon or fixed discount is
    // actually present. Do not send unnecessary catalog overrides.
    const payload: any = {
      cart_data: {
        items: mappedItems
      },
      redirect_url: callbackRedirectUrl,
      timestamp: new Date().toISOString()
    };

    // Note: We no longer send cart_discount or catalog_data.
    // Shiprocket headless checkout will handle coupons directly in their UI.

    const payloadString = JSON.stringify(payload);
    const signature = await generateHmacSha256(cleanSecret, payloadString);

    console.log("Shiprocket checkout request — cart items:", mappedItems.length, "| has_discount:", !!payload.cart_discount);

    // 15-second timeout to prevent hung edge functions
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

    console.log("Shiprocket access-token/checkout status:", response.status);
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

      if (orderId && newSession) {
         await supabase.from("checkout_sessions").update({ stripe_session_id: String(orderId) }).eq("id", newSession.id);
      }

      // Return ONLY the token, expires_at, and order_id to the browser.
      //
      // IMPORTANT: Do NOT construct or return any Shiprocket/Fastrr redirect URLs here.
      // The frontend always uses HeadlessCheckout.addToCart(event, token, { fallbackUrl })
      // via the official SDK. The redirect_url inside the Shiprocket API response is the
      // URL where Shiprocket sends the customer AFTER checkout (our /shiprocket-callback),
      // NOT a URL to launch checkout with.
      //
      // Leaking the token into a redirect URL would bypass the SDK and expose the token
      // in the browser's address bar.
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
