-- =============================================================
-- Migration: Fix Critical RLS Security Policies
-- Date: 2026-07-19
--
-- Problem (20260702000000_checkout_rls_fixes.sql):
--
--   1. orders SELECT policy:
--      USING (user_id = auth.uid() OR stripe_session_id IS NOT NULL OR fastrr_order_id IS NOT NULL)
--      → Any authenticated user could read EVERY Stripe order (all have stripe_session_id)
--        and EVERY Shiprocket order (all have fastrr_order_id). This exposed all customer
--        PII (addresses, phones, emails) to any registered user.
--
--   2. order_items SELECT policy:
--      USING (true)
--      → All order items were globally readable by any authenticated user.
--
--   3. shiprocket_orders SELECT policy:
--      USING (true)
--      → All Shiprocket order mappings were globally readable.
--
-- Fix:
--   Restore proper user-scoped access:
--   - Authenticated users can read their own orders (user_id = auth.uid())
--   - Admin users can read all orders
--   - Guest order lookup for success pages goes through service-role edge functions,
--     NOT through a global SELECT policy
--   - order_items scoped through join to user's own orders
--   - shiprocket_orders scoped through join to user's own orders
--
-- Note on Guest Orders:
--   Guest checkout (is_guest=true) orders have user_id=NULL. These rows are NOT
--   readable via the user-scoped SELECT policy. The OrderSuccess page reads guest orders
--   through fetch-shiprocket-order (service role), which is correct. The
--   ShiprocketCallback page also uses fetch-shiprocket-order (service role).
--   There is no need for a global policy to enable guest order reading.
-- =============================================================

-- ── orders ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;

-- Authenticated users read ONLY their own orders.
-- Service-role edge functions bypass RLS entirely (correct).
-- Admin policy (from original migration) is preserved separately.
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Guest order SELECT for success page: not exposed via RLS.
-- Use service-role edge function (fetch-shiprocket-order) for guest order lookup.

-- ── order_items ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;

-- Scoped through join to user's own orders only.
CREATE POLICY "Users can read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── shiprocket_orders ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own shiprocket_orders" ON public.shiprocket_orders;

-- Scoped through join to user's own orders only.
-- This means guest orders' Shiprocket mappings are NOT directly readable by
-- the frontend — which is correct, since the mapping lookup for guests goes
-- through service-role edge functions.
CREATE POLICY "Users can read own shiprocket_orders" ON public.shiprocket_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = shiprocket_orders.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- ── Verify policies ──────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated. Verifying...';

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
      AND policyname = 'Users can read own orders'
  ) THEN
    RAISE NOTICE 'OK: orders SELECT policy is user-scoped';
  ELSE
    RAISE WARNING 'MISSING: orders SELECT policy not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'order_items'
      AND policyname = 'Users can read own order items'
  ) THEN
    RAISE NOTICE 'OK: order_items SELECT policy is user-scoped via join';
  ELSE
    RAISE WARNING 'MISSING: order_items SELECT policy not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'shiprocket_orders'
      AND policyname = 'Users can read own shiprocket_orders'
  ) THEN
    RAISE NOTICE 'OK: shiprocket_orders SELECT policy is user-scoped via join';
  ELSE
    RAISE WARNING 'MISSING: shiprocket_orders SELECT policy not found';
  END IF;
END $$;
