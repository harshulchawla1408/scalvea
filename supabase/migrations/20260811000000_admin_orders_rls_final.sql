-- =============================================================
-- COMPLETE FIX: Admin Orders Visibility + Country NULL Fix
-- Date: 2026-08-11
--
-- INSTRUCTIONS: Copy ALL of this and paste into your Supabase
-- SQL Editor, then click "Run".
--
-- This script is SAFE TO RUN MULTIPLE TIMES (fully idempotent).
-- =============================================================

-- ── STEP 1: Ensure has_role function exists ───────────────────
-- user_roles.role is an app_role enum — cast it to text
-- for comparison so there is no type mismatch error.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- ── STEP 2: Admin SELECT policy on orders ────────────────────
-- The core fix: admins can read ALL orders.

DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── STEP 3: Admin UPDATE policy on orders ────────────────────

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── STEP 4: Admin DELETE policy on orders ────────────────────

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── STEP 5: Admin SELECT policy on order_items ───────────────

DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── STEP 6: Fix NULL country on existing orders ───────────────
-- Old orders saved without country field will now be classified
-- correctly so they appear in admin filtered views.

UPDATE public.orders
SET country = CASE
  WHEN currency = 'INR' THEN 'India'
  WHEN currency = 'AUD' THEN 'Australia'
  ELSE 'Australia'
END
WHERE country IS NULL OR country = '';

-- ── STEP 7: Reload PostgREST schema cache ─────────────────────
NOTIFY pgrst, 'reload schema';

-- ── VERIFICATION ──────────────────────────────────────────────
-- You should see your admin user_id in user_roles with role = 'admin'
-- and orders should now be readable.

SELECT
  'RLS Policies on orders' AS check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'orders' AND schemaname = 'public'
ORDER BY policyname;

SELECT
  'RLS Policies on order_items' AS check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'order_items' AND schemaname = 'public'
ORDER BY policyname;

SELECT
  'Total orders in DB' AS check_type,
  COUNT(*) AS total_orders,
  COUNT(CASE WHEN country IS NULL THEN 1 END) AS null_country_count
FROM public.orders;
