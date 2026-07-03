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

    // 4. Calculate GST (0% as requested)
    const gstCents = 0;

    // 5. Calculate Shipping (standard: 7.50, express: 14.95, freeAbove: 100)
    let shippingCents = 750; // standard shipping charge A$7.50
    if (shipping_type === "express") {
      shippingCents = 1495;
    } else {
      // standard shipping
      if (subtotalAfterDiscountCents >= 10000) { // Free shipping above A$100 (10000 cents)
        shippingCents = 0;
      }
    }

    // Add GST as a custom line item (only if > 0)
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

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const isMock = stripeKey === "mock_key" || stripeKey === "mock_secret";

    if (isMock) {
      console.log("Mock Stripe key active. Immediately inserting order into database to simulate webhook.");
      const mockSessionId = "cs_test_" + Math.random().toString(36).substring(7);

      const discountAmount = discountCents / 100;
      const gstAmount = gstCents / 100;
      const shippingAmount = shippingCents / 100;
      const totalAmount = (subtotalAfterDiscountCents + gstCents + shippingCents) / 100;
      const subtotalVal = subtotalCents / 100;

      // Insert Order record
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          country: "Australia",
          currency: "AUD",
          subtotal: subtotalVal,
          tax_amount: gstAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          coupon_code: validCouponCode || null,
          total_amount: totalAmount,
          order_status: "processing",
          payment_status: "paid",
          payment_method: "stripe",
          payment_provider: "stripe",
          market: "AU",
          gst: gstAmount,
          shipping_cost: shippingAmount,
          total: totalAmount,
          stripe_session_id: mockSessionId,
          delivery_estimate: shipping_type === "express" ? "2-4 business days" : "5-7 business days",
          shipping_address: shipping_address,
        } as any)
        .select()
        .single();

      if (orderError || !newOrder) {
        throw new Error(`Failed to create mock order: ${orderError?.message}`);
      }

      console.log("Mock Order created successfully:", newOrder.order_number);

      // Insert Order Items and update inventory
      for (const item of items) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
          const priceAud = Number(prices.price_aud) || 0;

          await supabase
            .from("order_items")
            .insert({
              order_id: newOrder.id,
              product_id: prod.id,
              product_name: prod.name,
              quantity: item.quantity,
              price: priceAud,
              currency: "AUD",
            } as any);

          // Deduct inventory
          const prevQty = prod.inventory_quantity_australia ?? 0;
          const newQty = Math.max(0, prevQty - item.quantity);
          await supabase
            .from("products")
            .update({ inventory_quantity_australia: newQty })
            .eq("id", prod.id);

          await supabase
            .from("inventory_logs")
            .insert({
              product_id: prod.id,
              change_amount: -item.quantity,
              previous_quantity: prevQty,
              new_quantity: newQty,
              reason: `Mock Stripe Order ${newOrder.order_number}`,
            } as any);
        }
      }

      return new Response(
        JSON.stringify({
          sessionId: mockSessionId,
          checkoutUrl: `${origin}/order-success?session_id=${mockSessionId}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    console.log("Stripe Session Creation Initiated. Total cents:", subtotalAfterDiscountCents + gstCents + shippingCents);

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

    console.log("Stripe Session Created Successfully. Session ID:", session.id);

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
