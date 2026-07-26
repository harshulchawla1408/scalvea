-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Shiprocket Order Details API — Full Field Storage
-- Adds columns to persist every field returned by
-- POST /api/v1/custom-platform-order/details so the merchant DB becomes the
-- authoritative OMS with complete order information.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── orders table: Shiprocket-specific detail columns ─────────────────────────

ALTER TABLE public.orders
  -- Direct lookup without joining shiprocket_orders
  ADD COLUMN IF NOT EXISTS shiprocket_order_id    text,
  -- COD surcharge (separate from shipping_charges)
  ADD COLUMN IF NOT EXISTS cod_charges            numeric(10,2) DEFAULT 0,
  -- Predicted likelihood of RTO (Return To Origin)
  ADD COLUMN IF NOT EXISTS rto_prediction         text,
  -- Shiprocket shipping plan (e.g. "express", "surface")
  ADD COLUMN IF NOT EXISTS shipping_plan          text,
  -- Shiprocket internal cart / session ID
  ADD COLUMN IF NOT EXISTS cart_id               text,
  -- Platform-level order ID (merchant's own order reference)
  ADD COLUMN IF NOT EXISTS platform_order_id      text,
  -- Tags array from Order Details API
  ADD COLUMN IF NOT EXISTS order_tags             jsonb DEFAULT '[]'::jsonb,
  -- Full discount breakdown object from Order Details API
  ADD COLUMN IF NOT EXISTS discount_detail        jsonb,
  -- Array of applied coupon codes from Order Details API
  ADD COLUMN IF NOT EXISTS coupon_codes           jsonb DEFAULT '[]'::jsonb,
  -- Full payments[] array from Order Details API
  ADD COLUMN IF NOT EXISTS shiprocket_payments    jsonb DEFAULT '[]'::jsonb,
  -- Raw EDD string from Order Details API (delivery_estimate may be formatted)
  ADD COLUMN IF NOT EXISTS edd_date               text,
  -- GST amount (India tax)
  ADD COLUMN IF NOT EXISTS gst_amount            numeric(10,2) DEFAULT 0;

-- Fast lookup of India orders by Shiprocket's own order ID
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id
  ON public.orders (shiprocket_order_id)
  WHERE shiprocket_order_id IS NOT NULL;

-- ── payments table: additional PG transaction detail ─────────────────────────

ALTER TABLE public.payments
  -- Payment Gateway transaction ID (e.g. Razorpay txn_id)
  ADD COLUMN IF NOT EXISTS pg_transaction_id      text,
  -- Amount actually received (may differ from charged amount due to refunds)
  ADD COLUMN IF NOT EXISTS amount_received        numeric(10,2),
  -- Payment gateway name (e.g. "razorpay", "payu")
  ADD COLUMN IF NOT EXISTS gateway                text;

-- ── Comments ──────────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.orders.shiprocket_order_id  IS 'Shiprocket order_id from Order Details API. Allows lookup without join.';
COMMENT ON COLUMN public.orders.cod_charges          IS 'Cash-on-Delivery surcharge from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.rto_prediction       IS 'Shiprocket RTO risk prediction (low/medium/high).';
COMMENT ON COLUMN public.orders.shipping_plan        IS 'Shiprocket shipping plan name (express/surface/air).';
COMMENT ON COLUMN public.orders.order_tags           IS 'Tags array from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.discount_detail      IS 'Full discount breakdown object from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.coupon_codes         IS 'Array of applied coupon codes from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.shiprocket_payments  IS 'Full payments[] array from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.edd_date             IS 'Estimated Delivery Date string from Shiprocket Order Details API.';
COMMENT ON COLUMN public.orders.gst_amount           IS 'GST amount (India tax) from Shiprocket Order Details API.';
COMMENT ON COLUMN public.payments.pg_transaction_id  IS 'Payment gateway transaction ID.';
COMMENT ON COLUMN public.payments.amount_received    IS 'Actual amount received by payment gateway.';
COMMENT ON COLUMN public.payments.gateway            IS 'Payment gateway name (razorpay, payu, etc).';
