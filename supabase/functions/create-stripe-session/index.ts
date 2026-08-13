// ─── Create Stripe Checkout Session ──────────────────────────────────────────
// Australia-only payment flow.
//
// NEW FLOW (no pre-created order):
// 1. Verifies cart prices server-side against the database.
// 2. Calculates shipping / coupon discounts.
// 3. Creates a Stripe Checkout Session with full cart metadata.
// 4. Returns the Stripe Checkout URL to the frontend.
//
// The order is ONLY created in the database AFTER Stripe confirms
// the payment via the stripe-webhook function. This prevents orphaned
// "draft" orders from polluting the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import Stripe from "npm:stripe@^22";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Step 1: Verify environment variables ─────────────────────────────
    console.log("Step 1: Checking environment variables...");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("MISSING ENV: STRIPE_SECRET_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("MISSING ENV: SUPABASE_URL is not configured");

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) throw new Error("MISSING ENV: SUPABASE_SERVICE_ROLE_KEY is not configured");

    console.log("Step 1: All env vars present. Key prefix:", stripeKey.substring(0, 7));
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Step 2: Authenticate user ─────────────────────────────────────────
    console.log("Step 2: Authenticating user...");
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
    console.log("Step 2: User authenticated. user_id:", userId);

    // ── Step 3: Parse request body ────────────────────────────────────────
    console.log("Step 3: Parsing request body...");
    const body = await req.json();
    const {
      items,
      email,
      phone,
      firstName,
      lastName,
      coupon_code,
      shipping_type,
      address,
      address_line2,
      city,
      state,
      postcode,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "Missing contact details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Step 3: Body valid. Items count:", items.length);

    // ── Step 4: Fetch products and verify prices server-side ─────────────
    console.log("Step 4: Fetching products from database...");
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .in("id", productIds);

    if (prodError) throw new Error(`Could not load products: ${prodError.message}`);
    if (!dbProducts || dbProducts.length === 0) throw new Error("Could not load products from database");
    console.log("Step 4: Products fetched:", dbProducts.length);

    // ── Step 5: Build line items and calculate subtotal ──────────────────
    console.log("Step 5: Building Stripe line items...");
    let subtotalCents = 0;
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    // Store product info for metadata (name + price for webhook reconstruction)
    const cartDetails: Array<{ productId: string; name: string; priceAud: number; quantity: number }> = [];

    for (const item of items) {
      const prod = dbProducts.find((p: any) => p.id === item.productId);
      if (!prod) throw new Error(`Product not found: ${item.productId}`);
      if (prod.is_active_australia === false) throw new Error(`Product ${prod.name} is not available in Australia.`);

      const stock = prod.inventory_quantity_australia ?? 0;
      if (item.quantity > stock) throw new Error(`Insufficient stock for ${prod.name}. Available: ${stock}`);

      const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
      const priceAud = Number(prices?.price_aud) || 0;
      const priceCents = Math.round(priceAud * 100);

      if (priceCents <= 0) throw new Error(`Product ${prod.name} has invalid price (${priceAud} AUD).`);

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

      cartDetails.push({
        productId: prod.id,
        name: prod.name,
        priceAud,
        quantity: item.quantity,
      });
    }
    console.log("Step 5: subtotalCents =", subtotalCents, "| line items =", stripeLineItems.length);

    // ── Step 6: Process Coupon Discount ──────────────────────────────────
    let discountCents = 0;
    let validCouponCode = "";
    let discountPct = 0;

    if (coupon_code) {
      const codeUpper = coupon_code.toUpperCase();
      const { data: dbCoupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", codeUpper)
        .eq("is_active", true)
        .maybeSingle();

      if (dbCoupon) {
        const isNotExpired = !dbCoupon.expires_at || new Date(dbCoupon.expires_at) > new Date();
        const isUnderLimit = !dbCoupon.max_usage || (dbCoupon.usage_count || 0) < dbCoupon.max_usage;
        if (isNotExpired && isUnderLimit) {
          validCouponCode = dbCoupon.code;
          discountPct = Number(dbCoupon.discount_percentage) || 0;
        }
      }

      if (discountPct > 0) {
        discountCents = Math.round(subtotalCents * (discountPct / 100));
        console.log(`Step 6: Coupon "${validCouponCode}" applied (${discountPct}% off).`);
      }
    }

    const subtotalAfterDiscountCents = subtotalCents - discountCents;

    // ── Step 7: Calculate Shipping ───────────────────────────────────────
    let shippingCents = 750; // Standard: A$7.50
    let shippingDisplayName = "Standard Shipping";
    let deliveryMinDays = 5;
    let deliveryMaxDays = 7;

    if (shipping_type === "express") {
      shippingCents = 1495;
      shippingDisplayName = "Express Shipping";
      deliveryMinDays = 2;
      deliveryMaxDays = 4;
    } else {
      if (subtotalAfterDiscountCents >= 6000) {
        shippingCents = 0;
        shippingDisplayName = "Free Standard Shipping";
      }
    }

    // ── Step 8: Calculate final totals ───────────────────────────────────
    const discountAmount   = discountCents / 100;
    const shippingAmount   = shippingCents / 100;
    const totalAmount      = (subtotalAfterDiscountCents + shippingCents) / 100;
    const subtotalVal      = subtotalCents / 100;
    const deliveryEstimate = shipping_type === "express" ? "2-4 business days" : "5-7 business days";

    console.log(`Step 8: subtotal=${subtotalVal} discount=${discountAmount} shipping=${shippingAmount} total=${totalAmount}`);

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const isMock = stripeKey === "mock_key" || stripeKey === "mock_secret";

    // ── Mock mode (local development) ─────────────────────────────────────
    if (isMock) {
      // In mock mode, create the order directly since no real Stripe webhook fires
      const mockSessionId = "cs_test_" + Math.random().toString(36).substring(7);

      const { data: mockOrder } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          country: "Australia", currency: "AUD",
          subtotal: subtotalVal, tax_amount: 0,
          shipping_amount: shippingAmount, discount_amount: discountAmount,
          total_amount: totalAmount, coupon_code: validCouponCode || null,
          order_status: "processing", payment_status: "paid",
          payment_method: "stripe", payment_provider: "stripe",
          market: "AU", gst: 0, shipping_cost: shippingAmount, total: totalAmount,
          delivery_estimate: deliveryEstimate,
          shipping_address: {
            firstName, lastName, first_name: firstName, last_name: lastName,
            address: address || "", address_line1: address || "",
            address_line2: address_line2 || "", city: city || "",
            state: state || "", postcode: postcode || "", country: "AU",
            phone: phone || "", email,
          },
          customer_email: email, customer_phone: phone || null,
          customer_name: `${firstName} ${lastName}`.trim(),
          is_guest: false, source: "Stripe", platform: "Web",
          stripe_session_id: mockSessionId,
          order_source: "ONLINE",
        } as any)
        .select()
        .single();

      if (mockOrder) {
        // Insert order items
        const mockItems = cartDetails.map(cd => ({
          order_id: mockOrder.id, product_id: cd.productId,
          product_name: cd.name, quantity: cd.quantity,
          price: cd.priceAud, currency: "AUD",
        }));
        await supabase.from("order_items").insert(mockItems);

        // Deduct inventory
        for (const cd of cartDetails) {
          const prod = dbProducts.find((p: any) => p.id === cd.productId);
          if (prod) {
            const prevQty = prod.inventory_quantity_australia ?? 0;
            const newQty = Math.max(0, prevQty - cd.quantity);
            await supabase.from("products").update({ inventory_quantity_australia: newQty }).eq("id", prod.id);
            await supabase.from("inventory_logs").insert({
              product_id: prod.id, change_amount: -cd.quantity,
              previous_quantity: prevQty, new_quantity: newQty,
              reason: `Mock Stripe Order ${mockOrder.order_number}`,
            } as any);
          }
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

    // ── Step 9: Create Stripe Checkout Session ────────────────────────────
    // No DB order is created here. All order data is stored in Stripe metadata.
    // The stripe-webhook will create the real order on payment confirmation.
    console.log("Step 9: Creating Stripe Checkout Session (no DB order pre-created)...");
    const stripe = new Stripe(stripeKey);

    let stripeCouponId: string | null = null;
    if (discountPct > 0 && validCouponCode) {
      try {
        const coupon = await stripe.coupons.create({
          percent_off: discountPct,
          duration: "once",
          name: `${validCouponCode} (${discountPct}% OFF)`,
        });
        stripeCouponId = coupon.id;
        console.log("Step 9: Created Stripe coupon:", stripeCouponId);
      } catch (err: any) {
        console.warn("Step 9: Failed to create Stripe coupon:", err.message);
      }
    }

    // Build cart_items string for metadata: "productId:qty,productId:qty,..."
    const cartItemsMeta = items.map((i: any) => `${i.productId}:${i.quantity}`).join(",");

    let session: Stripe.Checkout.Session;
    try {
      const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: stripeLineItems,
        mode: "payment",
        customer_email: email,
        phone_number_collection: { enabled: true },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: shippingCents, currency: "aud" },
              display_name: shippingDisplayName,
              delivery_estimate: {
                minimum: { unit: "business_day", value: deliveryMinDays },
                maximum: { unit: "business_day", value: deliveryMaxDays },
              },
            },
          },
        ],
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${origin}/order-failed?reason=cancelled`,
        metadata: {
          // All data needed by stripe-webhook to create the order
          user_id:              userId,
          market:               "AU",
          coupon_code:          validCouponCode || "",
          cart_items:           cartItemsMeta,
          customer_phone:       phone || "",
          customer_first_name:  firstName || "",
          customer_last_name:   lastName || "",
          customer_email:       email,
          shipping_type:        shipping_type || "standard",
          delivery_estimate:    deliveryEstimate,
          address:              address || "",
          address_line2:        address_line2 || "",
          city:                 city || "",
          state:                state || "",
          postcode:             postcode || "",
          // Amounts for reference (Stripe session amounts are authoritative)
          subtotal:             subtotalVal.toString(),
          shipping_amount:      shippingAmount.toString(),
          discount_amount:      discountAmount.toString(),
        },
      };

      if (stripeCouponId) {
        sessionCreateParams.discounts = [{ coupon: stripeCouponId }];
      } else {
        sessionCreateParams.allow_promotion_codes = true;
      }

      session = await stripe.checkout.sessions.create(sessionCreateParams);
    } catch (stripeError: any) {
      console.error("Step 9: STRIPE API ERROR:", stripeError.message);
      throw new Error(`Stripe API error: ${stripeError.message}`);
    }

    console.log("Step 9: ✅ Stripe Session created:", session.id, "— order will be created in DB on payment confirmation.");

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ create-stripe-session FATAL ERROR:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
