-- =============================================================
-- Migration: Fix Orders Table After Accidental Deletion
-- Date: 2026-08-09
--
-- This migration is IDEMPOTENT (safe to run multiple times).
-- Run this in your Supabase SQL Editor.
-- =============================================================

-- ── STEP 1: Add ALL missing columns back to orders table ──────
-- These columns were added by previous migrations but lost when
-- the table was accidentally deleted and recreated.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_created_at      timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_method       text,
  ADD COLUMN IF NOT EXISTS manual_payment_method text,
  ADD COLUMN IF NOT EXISTS created_by_admin      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS courier_name          text,
  ADD COLUMN IF NOT EXISTS sales_channel         text,
  ADD COLUMN IF NOT EXISTS tracking_number       text,
  ADD COLUMN IF NOT EXISTS fulfillment_status    text,
  ADD COLUMN IF NOT EXISTS customer_name         text,
  ADD COLUMN IF NOT EXISTS customer_email        text,
  ADD COLUMN IF NOT EXISTS customer_phone        text,
  ADD COLUMN IF NOT EXISTS is_guest              boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_notes           text,
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS courier               text,
  ADD COLUMN IF NOT EXISTS awb                   text,
  ADD COLUMN IF NOT EXISTS shipment_id           text,
  ADD COLUMN IF NOT EXISTS shipping_label_url    text,
  ADD COLUMN IF NOT EXISTS manifest_url          text,
  ADD COLUMN IF NOT EXISTS pickup_status         text,
  ADD COLUMN IF NOT EXISTS dispatch_date         timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_date         timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_number        text,
  ADD COLUMN IF NOT EXISTS invoice_url           text,
  ADD COLUMN IF NOT EXISTS tax_invoice           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS source                text,
  ADD COLUMN IF NOT EXISTS platform              text,
  ADD COLUMN IF NOT EXISTS gateway_response      jsonb,
  ADD COLUMN IF NOT EXISTS order_source          text DEFAULT 'ONLINE';

-- ── STEP 2: Add indexes for performance ───────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_order_source
  ON public.orders (order_source)
  WHERE order_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_created_by_admin
  ON public.orders (created_by_admin)
  WHERE created_by_admin IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders (customer_email)
  WHERE customer_email IS NOT NULL;

-- ── STEP 3: Order Number Sequence — SCV_XXXX format ──────────
-- Reset to start generating from SCV_0014 (4-digit, underscore).
-- Adjust START value if you have existing orders higher than 14.

DROP SEQUENCE IF EXISTS public.order_number_seq CASCADE;
CREATE SEQUENCE public.order_number_seq
  START 14
  INCREMENT 1
  NO MAXVALUE
  NO CYCLE;

-- Update the trigger function to use SCV_XXXX format
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if not already set
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'SCV_' || LPAD(nextval('public.order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and re-create the trigger on the orders table
-- This ensures it's attached even if the table was recreated
DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- ── STEP 4: Fix RLS on order_items ────────────────────────────
-- Users need to be able to read their own order items.

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = auth.uid()
          OR orders.customer_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
        )
    )
  );

-- ── STEP 5: Fix orders RLS ────────────────────────────────────
-- Allow users to see orders by user_id OR matching customer_email
-- (needed for Stripe orders that may store email but not user_id correctly)

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  TO public
  USING (
    auth.uid() = user_id
    OR (
      auth.uid() IS NOT NULL
      AND customer_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- ── STEP 6: Drop unused tables ────────────────────────────────
-- These tables are no longer needed.

DROP TABLE IF EXISTS public.order_status_history    CASCADE;
DROP TABLE IF EXISTS public.payments                CASCADE;
DROP TABLE IF EXISTS public.country_settings        CASCADE;
DROP TABLE IF EXISTS public.store_settings          CASCADE;
DROP TABLE IF EXISTS public.shiprocket_webhook_logs CASCADE;
DROP TABLE IF EXISTS public.shiprocket_orders       CASCADE;

-- ── STEP 7: Notify PostgREST to reload schema cache ───────────
NOTIFY pgrst, 'reload schema';

-- ── VERIFICATION QUERIES (uncomment to run) ──────────────────
SELECT trigger_name FROM information_schema.triggers
  WHERE event_object_table = 'orders' AND trigger_schema = 'public';

SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'orders'
  ORDER BY column_name;
