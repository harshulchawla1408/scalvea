import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the user calling the function
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

    // Parse request body
    const { items, email, shipping_address, coupon_code, shipping_type } = await req.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !shipping_address) {
      return new Response(
        JSON.stringify({ error: "Missing contact email or shipping address details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch products and prices from database to prevent price tampering
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .in("id", productIds);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      throw new Error("Could not load products from database for verification");
    }

    // 2. Recalculate subtotal
    let subtotalCents = 0;
    const stripeLineItems = [];

    for (const item of items) {
      const prod = dbProducts.find((p: any) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      // Verify active status for Australia
      if (prod.is_active_australia === false) {
        throw new Error(`Product ${prod.name} is not available for purchase in Australia.`);
      }

      // Check stock
      const stock = prod.inventory_quantity_australia ?? 0;
      if (item.quantity > stock) {
        throw new Error(`Insufficient stock for product ${prod.name}. Available: ${stock}`);
      }

      const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
      const priceAud = Number(prices.price_aud) || 0;
      const priceCents = Math.round(priceAud * 100);

      subtotalCents += priceCents * item.quantity;

      stripeLineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: prod.name,
            images: prod.images && prod.images.length > 0 ? [prod.images[0]] : [],
          },
          unit_amount: priceCents,
        },
        quantity: item.quantity,
      });
    }

    // 3. Process Coupon Discount
    let discountCents = 0;
    let validCouponCode = "";
    if (coupon_code) {
      const { data: dbCoupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .eq("country", "Australia")
        .maybeSingle();

      if (dbCoupon) {
        // Validate expiry
        const isNotExpired = !dbCoupon.expires_at || new Date(dbCoupon.expires_at) > new Date();
        // Validate usage
        const isUnderLimit = !dbCoupon.max_usage || (dbCoupon.usage_count || 0) < dbCoupon.max_usage;

        if (isNotExpired && isUnderLimit) {
          validCouponCode = dbCoupon.code;
          const discountPct = Number(dbCoupon.discount_percentage) || 0;
          discountCents = Math.round(subtotalCents * (discountPct / 100));
        }
      }
    }

    const subtotalAfterDiscountCents = subtotalCents - discountCents;

    // 4. Calculate GST (10% on subtotal after discount)
    const gstCents = Math.round(subtotalAfterDiscountCents * 0.10);

    // 5. Calculate Shipping (standard: 9.95, express: 14.95, freeAbove: 80)
    let shippingCents = 995; // default standard shipping
    if (shipping_type === "express") {
      shippingCents = 1495;
    } else {
      // standard shipping
      if (subtotalAfterDiscountCents >= 8000) {
        shippingCents = 0;
      }
    }

    // Add GST as a custom line item
    if (gstCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "GST (10%)",
          },
          unit_amount: gstCents,
        },
        quantity: 1,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      customer_email: email,
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCents,
              currency: "aud",
            },
            display_name: shipping_type === "express" ? "Express Shipping" : "Standard Shipping",
          },
        },
      ],
      metadata: {
        user_id: userId,
        market: "AU",
        coupon_code: validCouponCode,
        discount_amount: String(discountCents),
        gst: String(gstCents),
        shipping_cost: String(shippingCents),
        shipping_type: shipping_type || "standard",
        cart_items: items.map((i: any) => `${i.productId}:${i.quantity}`).join(","),
        shipping_address: JSON.stringify(shipping_address),
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
