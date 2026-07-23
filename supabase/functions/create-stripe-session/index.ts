// ─── Create Stripe Checkout Session ──────────────────────────────────────────
// Australia-only payment flow.
// 1. Verifies cart prices server-side.
// 2. Creates a PENDING order in the database.
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Authenticate user ─────────────────────────────────────────────────
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

    // ── Parse request body ────────────────────────────────────────────────
    const { items, email, phone, firstName, lastName, coupon_code, shipping_type } = await req.json();
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

    // ── 1. Fetch products and verify prices server-side ──────────────────
    const productIds = items.map((item: any) => item.productId);
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .in("id", productIds);

    if (prodError || !dbProducts || dbProducts.length === 0) {
      throw new Error("Could not load products from database for verification");
    }

    // ── 2. Build line items and calculate subtotal ───────────────────────
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

    // ── 3. Process Coupon Discount ───────────────────────────────────────
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
        }
      }
    }

    const subtotalAfterDiscountCents = subtotalCents - discountCents;

    if (discountCents > 0) {
      stripeLineItems.push({
        price_data: {
          currency: "aud",
          product_data: { name: `Discount (${validCouponCode})` },
          unit_amount: -discountCents,
        },
        quantity: 1,
      });
    }

    // ── 4. Calculate Shipping ───────────────────────────────────────────
    const gstCents = 0;
    let shippingCents = 750; // Standard: A$7.50
    let shippingDisplayName = "Standard Shipping";
    let deliveryMinDays = 5;
    let deliveryMaxDays = 7;

    if (shipping_type === "express") {
      shippingCents = 1495; // Express: A$14.95
      shippingDisplayName = "Express Shipping";
      deliveryMinDays = 2;
      deliveryMaxDays = 4;
    } else {
      if (subtotalAfterDiscountCents >= 10000) {
        shippingCents = 0;
        shippingDisplayName = "Free Standard Shipping";
      }
    }

    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
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
    ];

    const origin = req.headers.get("origin") || "http://localhost:5173";
    const isMock = stripeKey === "mock_key" || stripeKey === "mock_secret";

    const discountAmount = discountCents / 100;
    const gstAmount = gstCents / 100;
    const shippingAmount = shippingCents / 100;
    const totalAmount = (subtotalAfterDiscountCents + gstCents + shippingCents) / 100;
    const subtotalVal = subtotalCents / 100;

    // ── 5. Create Pending Order ──────────────────────────────────────────
    // Insert order BEFORE Stripe checkout redirect. 
    // This allows the frontend to track order status immediately.
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
        order_status: "Pending Payment",
        payment_status: "pending", // IMPORTANT: pending until webhook
        payment_method: "stripe",
        payment_provider: "stripe",
        market: "AU",
        gst: gstAmount,
        shipping_cost: shippingAmount,
        total: totalAmount,
        delivery_estimate: shipping_type === "express" ? "2-4 business days" : "5-7 business days",
        // Store pre-filled address. Will be overwritten by webhook with authoritative Stripe address.
        shipping_address: {
          firstName,
          lastName,
          first_name: firstName,
          last_name: lastName,
          address: "Address pending confirmation...",
          address_line1: "Address pending confirmation...",
          city: "",
          state: "",
          postcode: "",
          country: "AU",
          phone: phone || "",
          email: email,
        },
        customer_email: email,
        customer_phone: phone,
        customer_name: `${firstName} ${lastName}`.trim(),
        is_guest: !userId,
        source: "Stripe",
        platform: "Web",
      } as any)
      .select()
      .single();

    if (orderError || !newOrder) {
      throw new Error(`Failed to create pending order: ${orderError?.message}`);
    }

    console.log(`✅ Pending order created: ${newOrder.order_number} (ID: ${newOrder.id})`);

    // ── Mock mode (local development) ───────────────────────────────────
    if (isMock) {
      const mockSessionId = "cs_test_" + Math.random().toString(36).substring(7);

      // Update order with mock session ID and mark as paid (mocking webhook)
      await supabase
        .from("orders")
        .update({ 
          stripe_session_id: mockSessionId,
          payment_status: "paid",
          order_status: "processing"
        })
        .eq("id", newOrder.id);

      // Insert order items
      for (const item of items) {
        const prod = dbProducts.find((p: any) => p.id === item.productId);
        if (prod) {
          const prices = Array.isArray(prod.product_prices) ? prod.product_prices[0] : prod.product_prices || {};
          const priceAud = Number(prices.price_aud) || 0;

          await supabase.from("order_items").insert({
            order_id: newOrder.id,
            product_id: prod.id,
            product_name: prod.name,
            quantity: item.quantity,
            price: priceAud,
            currency: "AUD",
          } as any);

          const prevQty = prod.inventory_quantity_australia ?? 0;
          const newQty = Math.max(0, prevQty - item.quantity);
          await supabase
            .from("products")
            .update({ inventory_quantity_australia: newQty })
            .eq("id", prod.id);

          await supabase.from("inventory_logs").insert({
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

    // ── 6. Create Stripe Checkout Session ────────────────────────────────
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: stripeLineItems,
      mode: "payment",
      customer_email: email,
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: shippingOptions,
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        order_id: newOrder.id, // CRITICAL: Link Stripe Session back to database Order ID
        user_id: userId,
        market: "AU",
        coupon_code: validCouponCode,
        cart_items: items.map((i: any) => `${i.productId}:${i.quantity}`).join(","),
        customer_phone: phone || "",
        customer_first_name: firstName || "",
        customer_last_name: lastName || "",
      },
    });

    console.log(`Stripe Session created: ${session.id}. Updating pending order...`);

    // ── 7. Update Pending Order with Session ID ──────────────────────────
    // This allows the frontend to poll for order status immediately.
    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", newOrder.id);

    if (updateError) {
      console.warn(`Warning: Failed to update order ${newOrder.id} with stripe_session_id. Webhook fallback will be used.`);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
