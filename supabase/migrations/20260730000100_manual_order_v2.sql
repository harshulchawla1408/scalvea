-- =============================================================
-- Migration: Manual Order V2 Improvements
-- Date: 2026-07-30
--
-- Adds sales_channel column to orders table.
-- ALL existing rows default to 'WEBSITE' (backward compatible).
-- =============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sales_channel text NOT NULL DEFAULT 'WEBSITE';

-- Valid values: WEBSITE | ADMIN | PHONE | WHATSAPP | INSTAGRAM | FACEBOOK | EXHIBITION | SALON | OTHER

CREATE INDEX IF NOT EXISTS idx_orders_sales_channel
  ON public.orders (sales_channel)
  WHERE sales_channel IS NOT NULL;

COMMENT ON COLUMN public.orders.sales_channel IS 
  'Sales channel origin: WEBSITE (default online orders) | ADMIN | PHONE | WHATSAPP | INSTAGRAM | FACEBOOK | EXHIBITION | SALON | OTHER';
