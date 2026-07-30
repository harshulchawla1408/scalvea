-- =============================================================
-- Migration: Admin Manual Order Support
-- Date: 2026-07-30
--
-- Adds nullable metadata columns to the existing orders table
-- to support admin-created manual orders.
-- ALL columns are nullable so existing online orders are unaffected.
-- =============================================================

-- ── New columns on orders table ───────────────────────────────

ALTER TABLE public.orders
  -- Source of order: ONLINE (default) or MANUAL (admin-created)
  ADD COLUMN IF NOT EXISTS order_source text NOT NULL DEFAULT 'ONLINE',

  -- Delivery method chosen by admin for manual orders
  -- Values: SHIPROCKET | STRIPE | HAND_DELIVERY | STORE_PICKUP | MANUAL_COURIER
  ADD COLUMN IF NOT EXISTS delivery_method text,

  -- Offline/manual payment method chosen by admin
  -- Values: Cash | UPI | Bank Transfer | Card Machine | Stripe Manual | Other
  ADD COLUMN IF NOT EXISTS manual_payment_method text,

  -- Admin user who created this manual order (FK to auth.users)
  ADD COLUMN IF NOT EXISTS created_by_admin uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Courier name for MANUAL_COURIER delivery method
  ADD COLUMN IF NOT EXISTS courier_name text,

  -- Audit: exact timestamp when admin created/last edited
  ADD COLUMN IF NOT EXISTS admin_created_at timestamptz;

-- Index for quick filtering by order source
CREATE INDEX IF NOT EXISTS idx_orders_order_source
  ON public.orders (order_source)
  WHERE order_source IS NOT NULL;

-- Index for admin audit trail
CREATE INDEX IF NOT EXISTS idx_orders_created_by_admin
  ON public.orders (created_by_admin)
  WHERE created_by_admin IS NOT NULL;

-- ── RLS: Allow admins to INSERT orders for any user ───────────

-- The existing "Users can create orders" policy requires user_id = auth.uid(),
-- which blocks admins from creating orders on behalf of other users (or guests).
-- We add an admin-override INSERT policy.

DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert order_items for any order (not just their own)
DROP POLICY IF EXISTS "Admins can insert order_items" ON public.order_items;
CREATE POLICY "Admins can insert order_items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Comments ──────────────────────────────────────────────────
COMMENT ON COLUMN public.orders.order_source          IS 'Source of order: ONLINE (default) or MANUAL (admin-created).';
COMMENT ON COLUMN public.orders.delivery_method       IS 'Delivery method for manual orders: SHIPROCKET | STRIPE | HAND_DELIVERY | STORE_PICKUP | MANUAL_COURIER.';
COMMENT ON COLUMN public.orders.manual_payment_method IS 'Offline/manual payment method: Cash | UPI | Bank Transfer | Card Machine | Stripe Manual | Other.';
COMMENT ON COLUMN public.orders.created_by_admin      IS 'UUID of the admin user who created this manual order.';
COMMENT ON COLUMN public.orders.courier_name          IS 'Courier name for MANUAL_COURIER delivery method.';
COMMENT ON COLUMN public.orders.admin_created_at      IS 'Timestamp when admin created/last edited the order.';
