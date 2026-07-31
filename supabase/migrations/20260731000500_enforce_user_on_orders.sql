CREATE OR REPLACE FUNCTION public.process_checkout_transaction(
    p_session_id uuid,
    p_payment_details jsonb,
    p_order_source text
)
RETURNS jsonb AS $$
DECLARE
    v_session public.checkout_sessions%ROWTYPE;
    v_order_id uuid;
    v_item jsonb;
    v_inventory_col text;
    v_current_inventory int;
    v_country text;
BEGIN
    -- 1. Lock the session row to prevent race conditions
    SELECT * INTO v_session
    FROM public.checkout_sessions
    WHERE id = p_session_id AND status = 'PENDING'
    FOR UPDATE;

    IF NOT FOUND THEN
        -- If session is already COMPLETED, check if an order exists and return it
        SELECT id INTO v_order_id FROM public.orders WHERE stripe_session_id = p_session_id::text OR transaction_id = p_payment_details->>'transaction_id';
        IF FOUND THEN
            RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'message', 'Already processed');
        END IF;

        RETURN jsonb_build_object('success', false, 'error', 'Session not found or already processed.');
    END IF;

    -- 2. Mark session as COMPLETED
    UPDATE public.checkout_sessions
    SET status = 'COMPLETED', updated_at = now()
    WHERE id = p_session_id;

    -- Extract country to determine inventory column
    v_country := v_session.customer_details->>'country';
    IF v_country IS NULL THEN
        IF p_order_source = 'SHIPROCKET' THEN
            v_country := 'India';
        ELSE
            v_country := 'Australia';
        END IF;
    END IF;

    -- 3. Insert Order
    INSERT INTO public.orders (
        user_id, is_guest,
        customer_name, customer_email, customer_phone,
        total_amount, shipping_amount, tax_amount, discount_amount,
        subtotal, coupon_code, order_status, payment_status,
        payment_method, payment_provider, order_source, country, market, currency,
        shipping_address, billing_address,
        stripe_session_id, stripe_payment_intent_id, transaction_id
    ) VALUES (
        v_session.user_id, false,
        v_session.customer_details->>'firstName' || ' ' || (v_session.customer_details->>'lastName'),
        v_session.customer_details->>'email',
        v_session.customer_details->>'phone',
        (v_session.totals->>'total')::numeric,
        (v_session.totals->>'shipping')::numeric,
        (v_session.totals->>'tax')::numeric,
        (v_session.totals->>'discount')::numeric,
        (v_session.totals->>'subtotal')::numeric,
        v_session.coupon,
        'processing',
        'paid',
        p_payment_details->>'payment_method',
        p_order_source,
        'ONLINE',
        v_country,
        v_session.market,
        v_session.currency,
        v_session.shipping_address,
        v_session.billing_address,
        v_session.stripe_session_id,
        p_payment_details->>'payment_intent_id',
        p_payment_details->>'transaction_id'
    ) RETURNING id INTO v_order_id;

    -- 4. Process Items and Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_session.cart)
    LOOP
        -- Inventory Deduction
        IF v_country ILIKE 'India' THEN
            v_inventory_col := 'inventory_quantity';
        ELSE
            v_inventory_col := 'inventory_quantity_australia';
        END IF;

        -- We use dynamic SQL to fetch and lock the product row
        EXECUTE format('SELECT %I FROM public.products WHERE id = $1 FOR UPDATE', v_inventory_col)
        INTO v_current_inventory USING (v_item->>'productId')::uuid;

        IF v_current_inventory IS NULL THEN
            RAISE EXCEPTION 'Product % not found', v_item->>'productId';
        END IF;

        IF v_current_inventory < (v_item->>'quantity')::int THEN
            RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'productId';
        END IF;

        EXECUTE format('UPDATE public.products SET %I = %I - $1 WHERE id = $2', v_inventory_col, v_inventory_col)
        USING (v_item->>'quantity')::int, (v_item->>'productId')::uuid;

        -- Create Order Item
        INSERT INTO public.order_items (
            order_id, product_id, product_name, quantity, price, currency
        ) VALUES (
            v_order_id,
            (v_item->>'productId')::uuid,
            v_item->>'name',
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric,
            v_session.currency
        );

        -- Audit Log for Inventory
        INSERT INTO public.inventory_logs (
            product_id, change_amount, previous_quantity, new_quantity, reason
        ) VALUES (
            (v_item->>'productId')::uuid,
            -(v_item->>'quantity')::int,
            v_current_inventory,
            v_current_inventory - (v_item->>'quantity')::int,
            'Order ' || v_order_id || ' placed via ' || p_order_source
        );
    END LOOP;

    -- 5. Create Payment Record
    INSERT INTO public.payments (
        order_id, amount, currency, status,
        payment_method, provider,
        transaction_id, provider_status,
        shiprocket_order_id
    ) VALUES (
        v_order_id,
        (v_session.totals->>'total')::numeric,
        v_session.currency,
        'completed',
        p_payment_details->>'payment_method',
        p_order_source,
        p_payment_details->>'transaction_id',
        p_payment_details->>'provider_status',
        p_payment_details->>'shiprocket_order_id'
    );

    -- 6. Coupon Usage
    IF v_session.coupon IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = COALESCE(usage_count, 0) + 1
        WHERE code = v_session.coupon;
    END IF;

    -- 7. Audit Logging
    INSERT INTO public.order_status_history (
        order_id, previous_status, new_status, changed_by
    ) VALUES (
        v_order_id, NULL, 'processing', 'SYSTEM_' || p_order_source
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
