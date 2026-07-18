-- =============================================================
-- Migration: Fix Orders RLS to include Guest Orders mapping
-- Date: 2026-07-19
--
-- Fixes issue where "User Orders" showed "No orders yet" for 
-- guest orders or users who created accounts post-checkout.
-- Authenticated users can read their own orders via user_id 
-- or if the customer_email matches their auth email.
-- =============================================================

DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR customer_email = auth.jwt()->>'email'
  );

-- For completeness, verify the order items can also be read if they belong to this order
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;

CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.customer_email = auth.jwt()->>'email')
    )
  );
