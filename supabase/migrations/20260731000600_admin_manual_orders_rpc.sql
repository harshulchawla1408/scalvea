CREATE OR REPLACE FUNCTION public.create_admin_manual_order(
    p_order_data jsonb,
    p_line_items jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_item jsonb;
    v_inventory_col text;
    v_current_inventory int;
    v_market text;
    v_is_india boolean;
BEGIN
    -- 1. Extract market to determine inventory column
    v_market := p_order_data->>'market';
    v_is_india := v_market = 'IN';

    -- 2. Insert Order
    INSERT INTO public.orders (
        customer_name, customer_email, customer_phone, is_guest,
        source, order_source, sales_channel, delivery_method, manual_payment_method,
        courier_name, tracking_number, created_by_admin, admin_notes, courier,
        total_amount, tax_amount, shipping_amount, discount_amount, subtotal,
        order_status, payment_status, payment_method, payment_provider,
        shipping_address, market, country, user_id
    ) VALUES (
        p_order_data->>'customer_name',
        p_order_data->>'customer_email',
        p_order_data->>'customer_phone',
        (p_order_data->>'is_guest')::boolean,
        p_order_data->>'source',
        p_order_data->>'order_source',
        p_order_data->>'sales_channel',
        p_order_data->>'delivery_method',
        p_order_data->>'manual_payment_method',
        p_order_data->>'courier_name',
        p_order_data->>'tracking_number',
        (p_order_data->>'created_by_admin')::uuid,
        p_order_data->>'admin_notes',
        p_order_data->>'courier',
        (p_order_data->>'total_amount')::numeric,
        (p_order_data->>'tax_amount')::numeric,
        (p_order_data->>'shipping_amount')::numeric,
        (p_order_data->>'discount_amount')::numeric,
        (p_order_data->>'subtotal')::numeric,
        p_order_data->>'order_status',
        p_order_data->>'payment_status',
        p_order_data->>'payment_method',
        p_order_data->>'payment_provider',
        p_order_data->'shipping_address',
        v_market,
        CASE WHEN v_is_india THEN 'India' ELSE 'Australia' END,
        (p_order_data->>'user_id')::uuid
    ) RETURNING id, order_number INTO v_order_id, v_order_number;

    -- 3. Process Items and Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
    LOOP
        -- Inventory Deduction
        IF v_is_india THEN
            v_inventory_col := 'inventory_quantity';
        ELSE
            v_inventory_col := 'inventory_quantity_australia';
        END IF;

        -- Fetch and lock the product row
        EXECUTE format('SELECT %I FROM public.products WHERE id = $1 FOR UPDATE', v_inventory_col)
        INTO v_current_inventory USING (v_item->>'product_id')::uuid;

        IF v_current_inventory IS NULL THEN
            RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
        END IF;

        IF v_current_inventory < (v_item->>'quantity')::int THEN
            RAISE EXCEPTION 'Insufficient stock for product % (Available: %, Requested: %)', 
                v_item->>'product_name', v_current_inventory, v_item->>'quantity';
        END IF;

        -- Update inventory
        EXECUTE format('UPDATE public.products SET %I = %I - $1 WHERE id = $2', v_inventory_col, v_inventory_col)
        USING (v_item->>'quantity')::int, (v_item->>'product_id')::uuid;

        -- Create Order Item
        INSERT INTO public.order_items (
            order_id, product_id, product_name, quantity, price, currency
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::uuid,
            v_item->>'product_name',
            (v_item->>'quantity')::int,
            (v_item->>'price')::numeric,
            v_item->>'currency'
        );

        -- Audit Log for Inventory
        INSERT INTO public.inventory_logs (
            product_id, change_amount, previous_quantity, new_quantity, reason
        ) VALUES (
            (v_item->>'product_id')::uuid,
            -(v_item->>'quantity')::int,
            v_current_inventory,
            v_current_inventory - (v_item->>'quantity')::int,
            'Manual Order ' || v_order_number || ' (' || v_market || ')'
        );
    END LOOP;

    -- 4. Audit Logging
    INSERT INTO public.order_status_history (
        order_id, previous_status, new_status, changed_by
    ) VALUES (
        v_order_id, NULL, p_order_data->>'order_status', 'Admin (' || (p_order_data->>'sales_channel') || ')'
    );

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
