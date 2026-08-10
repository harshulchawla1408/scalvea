-- =============================================================
-- Migration: Admin RLS Policies for Orders
-- Date: 2026-08-10
--
-- Problem: Admins (users with role='admin' in user_roles) can
-- insert orders (manual order policy exists) but cannot SELECT
-- or UPDATE them because the only SELECT policy is scoped to
-- user_id = auth.uid(). This causes the admin Orders section
-- to show "0 orders" even though analytics (which also uses
-- the same query) may work if RLS is not yet enforced.
--
-- Fix: Add admin-scoped SELECT and UPDATE policies.
-- =============================================================

-- ── Admin can read ALL orders ─────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── Admin can read ALL order items ────────────────────────────
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── Admin can UPDATE any order (status changes, tracking) ─────
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Admin can DELETE orders (cancellation cleanup) ────────────
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── Fix: Ensure orders with NULL country get a default ────────
-- Some old orders may have NULL country, preventing them from
-- showing in filtered views. Set a sensible default.
UPDATE public.orders
SET country = CASE
  WHEN currency = 'INR' THEN 'India'
  WHEN currency = 'AUD' THEN 'Australia'
  ELSE 'Australia'
END
WHERE country IS NULL OR country = '';
