// ─── Create Stripe Checkout Session ──────────────────────────────────────────
// Australia-only payment flow.
// 1. Verifies cart prices server-side.
// 2. Creates a PENDING order in the database (with full address from form).
// 3. Creates a Stripe Checkout Session.
// 4. Updates the pending order with the stripe_session_id.
// 5. Returns the Stripe Checkout URL to the frontend.
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
    if (!stripeKey) {
      throw new Error("MISSING ENV: STRIPE_SECRET_KEY is not configured");
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("MISSING ENV: SUPABASE_URL is not configured");
    }
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      throw new Error("MISSING ENV: SUPABASE_SERVICE_ROLE_KEY is not configured");
    }
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
      // Address fields from checkout form
      address,
      address_line2,
      city,
      state,
      postcode,
      market,
    } = body;

    console.log("Step 3: Body keys:", Object.keys(body).join(", "));

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
    if (market !== "AU") {
      return new Response(
        JSON.stringify({ error: "Stripe checkout is only available for the Australia market (AUD)." }),
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

    if (prodError) {
      console.error("Step 4: DB error fetching products:", prodError.message);
      throw new Error(`Could not load products: ${prodError.message}`);
    }
    if (!dbProducts || dbProducts.length === 0) {
      throw new Error("Could not load products from database for verification");
    }
    console.log("Step 4: Products fetched:", dbProducts.length);

    // ── Step 5: Build line items and calculate subtotal ──────────────────
    console.log("Step 5: Building Stripe line items...");
    let subtotalCents = 0;
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const prod = dbProducts.find((p: any) => p.id === item.productId);
      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (prod.is_active_australia === false) {
        throw new Error(`Product ${prod.name} is not available for purchase in Australia.`);
      }
      const stock = prod.inventory_quantity_australia ?? 0;
      if (item.quantity > stock) {
        throw new Error(`Insufficient stock for product ${prod.name}. Available: ${stock}`);
      }

      const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
      const priceAud = Number(prices?.price_aud) || 0;
      const priceCents = Math.round(priceAud * 100);

      console.log(`Step 5: "${prod.name}" price_aud=${priceAud} priceCents=${priceCents} qty=${item.quantity}`);

      if (priceCents <= 0) {
        throw new Error(`Product ${prod.name} has an invalid price (${priceAud} AUD). Cannot create Stripe session.`);
      }

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
    console.log("Step 5: subtotalCents =", subtotalCents, "| line items =", stripeLineItems.length);

    // ── Step 6: Process Coupon Discount ──────────────────────────────────
    // IMPORTANT: Stripe does NOT allow negative unit_amount in line items.
    // Discount is stored in the DB order record only and displayed to customer
    // via allow_promotion_codes on the Stripe Checkout session.
    console.log("Step 6: Processing coupon discount...");
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
        const isNotExpired = !dbCoupon.expires_at || new Date(dbCoupon.expires_at) > new Date();
        const isUnderLimit = !dbCoupon.max_usage || (dbCoupon.usage_count || 0) < dbCoupon.max_usage;
        if (isNotExpired && isUnderLimit) {
          validCouponCode = dbCoupon.code;
          const discountPct = Number(dbCoupon.discount_percentage) || 0;
          discountCents = Math.round(subtotalCents * (discountPct / 100));
          console.log(`Step 6: Coupon "${validCouponCode}" applied. discountCents=${discountCents}`);
        } else {
          console.log("Step 6: Coupon found but expired/exceeded limit.");
        }
      } else {
        console.log("Step 6: Coupon not found or inactive.");
      }
    } else {
      console.log("Step 6: No coupon provided.");
    }

    const subtotalAfterDiscountCents = subtotalCents - discountCents;

    // ── Step 7: Calculate Shipping ───────────────────────────────────────
    console.log("Step 7: Calculating shipping...");
    const gstCents = 0;
    let shippingCents = 950; // Standard: A$9.50
    let shippingDisplayName = "Standard Shipping";
    let deliveryMinDays = 5;
    let deliveryMaxDays = 7;

    if (shipping_type === "express") {
      shippingCents = 1495; // Express: A$14.95
      shippingDisplayName = "Express Shipping";
      deliveryMinDays = 2;
      deliveryMaxDays = 4;
    }
    console.log(`Step 7: shippingCents=${shippingCents} (${shippingDisplayName})`);

    // ── Step 8: Calculate final totals ───────────────────────────────────
    const discountAmount = discountCents / 100;
    const gstAmount = gstCents / 100;
    const shippingAmount = shippingCents / 100;
    const totalAmount = (subtotalAfterDiscountCents + gstCents + shippingCents) / 100;
    const subtotalVal = subtotalCents / 100;

    console.log(`Step 8: subtotal=${subtotalVal} discount=${discountAmount} shipping=${shippingAmount} total=${totalAmount}`);

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const isMock = stripeKey === "mock_key" || stripeKey === "mock_secret";

    // ── Step 9: Build shipping address from form fields ──────────────────
    // Address collected at checkout; Stripe will confirm the final address
    // at payment time, which overwrites this via the webhook.
    console.log("Step 9: Building shipping address object...");
    const shippingAddress = {
      firstName: firstName || "",
      lastName: lastName || "",
      first_name: firstName || "",
      last_name: lastName || "",
      address: address || "",
      address_line1: address || "",
      address_line2: address_line2 || "",
      city: city || "",
      state: state || "",
      postcode: postcode || "",
      country: "AU",
      phone: phone || "",
      email: email,
    };
    console.log(`Step 9: Address — city="${shippingAddress.city}" state="${shippingAddress.state}" postcode="${shippingAddress.postcode}"`);

    // ── Step 10: Create Checkout Session Record ──────────────────────────────
    console.log("Step 10: Inserting checkout_session into database...");
    
    // Structure line items for storage
    const lineItemsToStore = items.map((item: any) => {
      const prod = dbProducts.find((p: any) => p.id === item.productId);
      if (!prod) return null;
      const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
      const priceAud = Number(prices?.price_aud) || 0;
      
      return {
        product_id: prod.id,
        product_name: prod.name,
        quantity: item.quantity,
        price: priceAud,
        currency: "AUD",
        image_url: prod.images && prod.images.length > 0 ? prod.images[0] : null,
        sku: prod.sku || item.sku || null,
        variant: prod.variant || item.variant || null,
      };
    }).filter(Boolean);

    const { data: newSession, error: sessionError } = await supabase
      .from("checkout_sessions")
      .insert({
        user_id: userId,
        status: "PENDING",
        total_amount: totalAmount,
        subtotal: subtotalVal,
        shipping_amount: shippingAmount,
        tax_amount: gstAmount,
        discount_amount: discountAmount,
        coupon_code: validCouponCode || null,
        customer_email: email,
        customer_phone: phone || null,
        customer_name: `${firstName} ${lastName}`.trim(),
        shipping_address: shippingAddress,
        line_items: lineItemsToStore,
        market: "AU",
        currency: "AUD",
        delivery_estimate: shipping_type === "express" ? "2-4 business days" : "5-7 business days",
      } as any)
      .select()
      .single();

    if (sessionError) {
      console.error("Step 10: CHECKOUT SESSION INSERT FAILED. Message:", sessionError.message);
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }
    if (!newSession) {
      throw new Error("Failed to create checkout session: insert returned no data");
    }
    console.log(`Step 10: ✅ Checkout session created: ${newSession.id}`);

    // ── Mock mode (local development) ─────────────────────────────────────
    if (isMock) {
      const mockSessionId = "cs_test_" + Math.random().toString(36).substring(7);
      
      // Complete checkout session
      await supabase
        .from("checkout_sessions")
        .update({
          stripe_session_id: mockSessionId,
          status: "COMPLETED"
        })
        .eq("id", newSession.id);

      // Create order
      const { data: mockOrder } = await supabase
        .from("orders")
        .insert({
          user_id: newSession.user_id,
          country: "Australia",
          currency: "AUD",
          subtotal: newSession.subtotal,
          tax_amount: newSession.tax_amount,
          shipping_amount: newSession.shipping_amount,
          discount_amount: newSession.discount_amount,
          coupon_code: newSession.coupon_code,
          total_amount: newSession.total_amount,
          order_status: "processing",
          payment_status: "paid",
          payment_method: "stripe",
          payment_provider: "stripe",
          market: "AU",
          gst: newSession.tax_amount,
          shipping_cost: newSession.shipping_amount,
          total: newSession.total_amount,
          delivery_estimate: shipping_type === "express" ? "2-4 business days" : "5-7 business days",
          shipping_address: newSession.shipping_address,
          customer_email: newSession.customer_email,
          customer_phone: newSession.customer_phone,
          customer_name: newSession.customer_name,
          is_guest: false,
          source: "Stripe",
          platform: "Web",
          stripe_session_id: mockSessionId,
        } as any)
        .select()
        .single();
        
      // Create order items
      if (mockOrder) {
        const orderItemsToInsert = lineItemsToStore.map((item: any) => ({
          ...item,
          order_id: mockOrder.id
        }));
        await supabase.from("order_items").insert(orderItemsToInsert);
      }

      for (const item of items) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const prevQty = prod.inventory_quantity_australia ?? 0;
          const newQty = Math.max(0, prevQty - item.quantity);
          await supabase.from("products").update({ inventory_quantity_australia: newQty }).eq("id", prod.id);
          await supabase.from("inventory_logs").insert({
            product_id: prod.id,
            change_amount: -item.quantity,
            previous_quantity: prevQty,
            new_quantity: newQty,
            reason: `Mock Stripe Order ${mockOrder?.order_number || mockOrder?.id}`,
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

    // ── Step 11: Create Stripe Checkout Session ───────────────────────────
    // KEY RULES:
    //   1. shipping_options and shipping_address_collection are MUTUALLY EXCLUSIVE
    //      in Stripe Checkout. When shipping_options is provided, Stripe automatically
    //      collects the shipping address — do NOT also set shipping_address_collection.
    //   2. Negative unit_amount in line items is NOT supported by Stripe. Discounts
    //      must be applied via Stripe Coupons/Promotion Codes or tracked in DB only.
    console.log("Step 11: Calling stripe.checkout.sessions.create...");
    const stripe = new Stripe(stripeKey);

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: stripeLineItems,
        mode: "payment",
        customer_email: email,
        phone_number_collection: { enabled: true },
        // shipping_options causes Stripe to collect address; do NOT add
        // shipping_address_collection alongside it.
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
        // Allow promotion codes so customers can apply discounts at checkout
        allow_promotion_codes: true,
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
        metadata: {
          checkout_session_id: newSession.id,
          user_id: userId,
          market: "AU",
          coupon_code: validCouponCode,
          cart_items: items.map((i: any) => `${i.productId}:${i.quantity}`).join(","),
          customer_phone: phone || "",
          customer_first_name: firstName || "",
          customer_last_name: lastName || "",
        },
      });
    } catch (stripeError: any) {
      console.error("Step 11: STRIPE API ERROR:", stripeError.message, "| type:", stripeError.type, "| code:", stripeError.code, "| param:", stripeError.param);
      throw new Error(`Stripe API error: ${stripeError.message}`);
    }

    console.log(`Step 11: ✅ Stripe Session created: ${session.id}`);

    // ── Step 12: Update Checkout Session with Session ID ─────────────────────
    console.log("Step 12: Updating checkout session with stripe_session_id...");
    const { error: updateError } = await supabase
      .from("checkout_sessions")
      .update({ stripe_session_id: session.id })
      .eq("id", newSession.id);

    if (updateError) {
      console.warn(`Step 12: WARNING — could not update checkout session ${newSession.id} with stripe_session_id: ${updateError.message}. Webhook fallback active.`);
    } else {
      console.log("Step 12: ✅ Checkout session updated with stripe_session_id.");
    }

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
