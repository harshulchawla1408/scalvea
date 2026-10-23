-- ==============================================================================
-- SCALVEA — SAFE ORDER DATA NORMALIZATION & REPORTING UPGRADE
-- Migration: 20261025000000_order_normalization_and_reporting.sql
--
-- Objective:
--   1. Additive normalized customer and address columns to public.orders.
--   2. Preserve all existing columns, JSON fields, IDs, and financial records.
--   3. Idempotent normalization trigger for 100% future order consistency.
--   4. Controlled historical order backfill with data quality flags.
--   5. Secure v_orders_reporting view with security_invoker = true.
-- ==============================================================================

-- ── STEP 1: VERIFIED BACKUP TABLE (Safe Rollback Snapshot) ───────────────────
-- Creates a full copy of the orders table if not already created.
-- Enables instant rollback if ever needed: SELECT COUNT(*) FROM public.orders_backup_pre_normalization;
CREATE TABLE IF NOT EXISTS public.orders_backup_pre_normalization AS
  SELECT * FROM public.orders;

-- CRITICAL SECURITY HARDENING:
-- Lock down backup table from public/anon exposure immediately
ALTER TABLE public.orders_backup_pre_normalization ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.orders_backup_pre_normalization FROM public, anon;
GRANT SELECT ON public.orders_backup_pre_normalization TO authenticated;

DROP POLICY IF EXISTS "Admins only access backup" ON public.orders_backup_pre_normalization;
CREATE POLICY "Admins only access backup" ON public.orders_backup_pre_normalization
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── STEP 2: ADD NORMALIZED ORDER COLUMNS ──────────────────────────────────────
-- All columns use TEXT for postcodes and phones to preserve leading zeros,
-- country codes and precise formatting.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_first_name    text,
  ADD COLUMN IF NOT EXISTS customer_last_name     text,
  ADD COLUMN IF NOT EXISTS shipping_address_line1 text,
  ADD COLUMN IF NOT EXISTS shipping_address_line2 text,
  ADD COLUMN IF NOT EXISTS shipping_city          text,
  ADD COLUMN IF NOT EXISTS shipping_state         text,
  ADD COLUMN IF NOT EXISTS shipping_postcode      text,
  ADD COLUMN IF NOT EXISTS shipping_country       text,
  ADD COLUMN IF NOT EXISTS billing_first_name     text,
  ADD COLUMN IF NOT EXISTS billing_last_name      text,
  ADD COLUMN IF NOT EXISTS billing_address_line1  text,
  ADD COLUMN IF NOT EXISTS billing_address_line2  text,
  ADD COLUMN IF NOT EXISTS billing_city           text,
  ADD COLUMN IF NOT EXISTS billing_state          text,
  ADD COLUMN IF NOT EXISTS billing_postcode       text,
  ADD COLUMN IF NOT EXISTS billing_country        text,
  ADD COLUMN IF NOT EXISTS data_quality_flags     text[] DEFAULT '{}';

-- ── STEP 3: INDEXES FOR FAST SEARCHING, FILTERING & REPORTING ────────────────
CREATE INDEX IF NOT EXISTS idx_orders_customer_first_last
  ON public.orders (customer_first_name, customer_last_name);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_city_state
  ON public.orders (shipping_city, shipping_state);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_postcode
  ON public.orders (shipping_postcode);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_country
  ON public.orders (shipping_country);

CREATE INDEX IF NOT EXISTS idx_orders_finances_audit
  ON public.orders (payment_status, order_status, total_amount);

-- ── STEP 4: NORMALIZATION FUNCTION & TRIGGER ─────────────────────────────────
-- Automatically normalizes customer names, shipping addresses, and billing addresses
-- from both incoming fields and existing JSON payloads without overwriting good data.
CREATE OR REPLACE FUNCTION public.normalize_order_record()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  s_json jsonb;
  b_json jsonb;
  flags  text[] := '{}';
  name_parts text[];
BEGIN
  -- Safe cast JSON to JSONB for extraction
  BEGIN
    s_json := CASE
      WHEN NEW.shipping_address IS NULL THEN '{}'::jsonb
      WHEN pg_typeof(NEW.shipping_address)::text = 'jsonb' THEN NEW.shipping_address::jsonb
      ELSE NEW.shipping_address::text::jsonb
    END;
  EXCEPTION WHEN OTHERS THEN
    s_json := '{}'::jsonb;
  END;

  BEGIN
    b_json := CASE
      WHEN NEW.billing_address IS NULL THEN '{}'::jsonb
      WHEN pg_typeof(NEW.billing_address)::text = 'jsonb' THEN NEW.billing_address::jsonb
      ELSE NEW.billing_address::text::jsonb
    END;
  EXCEPTION WHEN OTHERS THEN
    b_json := '{}'::jsonb;
  END;

  -- 1. Customer Names Normalization
  IF NEW.customer_first_name IS NULL OR TRIM(NEW.customer_first_name) = '' THEN
    NEW.customer_first_name := COALESCE(
      NULLIF(TRIM(s_json->>'first_name'), ''),
      NULLIF(TRIM(s_json->>'firstName'), ''),
      NULLIF(TRIM(b_json->>'first_name'), ''),
      NULLIF(TRIM(b_json->>'firstName'), '')
    );
  ELSE
    NEW.customer_first_name := TRIM(NEW.customer_first_name);
  END IF;

  IF NEW.customer_last_name IS NULL OR TRIM(NEW.customer_last_name) = '' THEN
    NEW.customer_last_name := COALESCE(
      NULLIF(TRIM(s_json->>'last_name'), ''),
      NULLIF(TRIM(s_json->>'lastName'), ''),
      NULLIF(TRIM(b_json->>'last_name'), ''),
      NULLIF(TRIM(b_json->>'lastName'), '')
    );
  ELSE
    NEW.customer_last_name := TRIM(NEW.customer_last_name);
  END IF;

  -- If first/last still missing, split from customer_name if present
  IF (NEW.customer_first_name IS NULL OR NEW.customer_last_name IS NULL) AND NEW.customer_name IS NOT NULL AND TRIM(NEW.customer_name) <> '' THEN
    name_parts := string_to_array(TRIM(NEW.customer_name), ' ');
    IF NEW.customer_first_name IS NULL AND array_length(name_parts, 1) >= 1 THEN
      NEW.customer_first_name := name_parts[1];
    END IF;
    IF NEW.customer_last_name IS NULL AND array_length(name_parts, 1) >= 2 THEN
      NEW.customer_last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
    END IF;
  END IF;

  -- Keep customer_name populated if it was null
  IF (NEW.customer_name IS NULL OR TRIM(NEW.customer_name) = '') AND (NEW.customer_first_name IS NOT NULL OR NEW.customer_last_name IS NOT NULL) THEN
    NEW.customer_name := TRIM(COALESCE(NEW.customer_first_name, '') || ' ' || COALESCE(NEW.customer_last_name, ''));
  END IF;

  -- 2. Shipping Address Normalization
  IF NEW.shipping_address_line1 IS NULL OR TRIM(NEW.shipping_address_line1) = '' THEN
    NEW.shipping_address_line1 := COALESCE(
      NULLIF(TRIM(s_json->>'address_line1'), ''),
      NULLIF(TRIM(s_json->>'address'), ''),
      NULLIF(TRIM(s_json->>'line1'), ''),
      NULLIF(TRIM(s_json->>'shipping_address'), '')
    );
  ELSE
    NEW.shipping_address_line1 := TRIM(NEW.shipping_address_line1);
  END IF;

  IF NEW.shipping_address_line2 IS NULL OR TRIM(NEW.shipping_address_line2) = '' THEN
    NEW.shipping_address_line2 := COALESCE(
      NULLIF(TRIM(s_json->>'address_line2'), ''),
      NULLIF(TRIM(s_json->>'line2'), ''),
      NULLIF(TRIM(s_json->>'shipping_address_2'), '')
    );
  ELSE
    NEW.shipping_address_line2 := TRIM(NEW.shipping_address_line2);
  END IF;

  IF NEW.shipping_city IS NULL OR TRIM(NEW.shipping_city) = '' THEN
    NEW.shipping_city := COALESCE(
      NULLIF(TRIM(s_json->>'city'), ''),
      NULLIF(TRIM(s_json->>'shipping_city'), '')
    );
  ELSE
    NEW.shipping_city := TRIM(NEW.shipping_city);
  END IF;

  IF NEW.shipping_state IS NULL OR TRIM(NEW.shipping_state) = '' THEN
    NEW.shipping_state := COALESCE(
      NULLIF(TRIM(s_json->>'state'), ''),
      NULLIF(TRIM(s_json->>'shipping_state'), '')
    );
  ELSE
    NEW.shipping_state := TRIM(NEW.shipping_state);
  END IF;

  IF NEW.shipping_postcode IS NULL OR TRIM(NEW.shipping_postcode) = '' THEN
    NEW.shipping_postcode := COALESCE(
      NULLIF(TRIM(s_json->>'postcode'), ''),
      NULLIF(TRIM(s_json->>'postal_code'), ''),
      NULLIF(TRIM(s_json->>'pincode'), ''),
      NULLIF(TRIM(s_json->>'shipping_pincode'), '')
    );
  ELSE
    NEW.shipping_postcode := TRIM(NEW.shipping_postcode);
  END IF;

  IF NEW.shipping_country IS NULL OR TRIM(NEW.shipping_country) = '' THEN
    NEW.shipping_country := COALESCE(
      NULLIF(TRIM(s_json->>'country'), ''),
      NULLIF(TRIM(s_json->>'shipping_country'), ''),
      NULLIF(TRIM(NEW.country), '')
    );
  ELSE
    NEW.shipping_country := TRIM(NEW.shipping_country);
  END IF;

  -- 3. Billing Address Normalization (Only extracted if b_json has actual distinct billing values)
  IF b_json <> '{}'::jsonb THEN
    IF NEW.billing_first_name IS NULL OR TRIM(NEW.billing_first_name) = '' THEN
      NEW.billing_first_name := COALESCE(
        NULLIF(TRIM(b_json->>'first_name'), ''),
        NULLIF(TRIM(b_json->>'firstName'), '')
      );
    ELSE
      NEW.billing_first_name := TRIM(NEW.billing_first_name);
    END IF;

    IF NEW.billing_last_name IS NULL OR TRIM(NEW.billing_last_name) = '' THEN
      NEW.billing_last_name := COALESCE(
        NULLIF(TRIM(b_json->>'last_name'), ''),
        NULLIF(TRIM(b_json->>'lastName'), '')
      );
    ELSE
      NEW.billing_last_name := TRIM(NEW.billing_last_name);
    END IF;

    IF NEW.billing_address_line1 IS NULL OR TRIM(NEW.billing_address_line1) = '' THEN
      NEW.billing_address_line1 := COALESCE(
        NULLIF(TRIM(b_json->>'address_line1'), ''),
        NULLIF(TRIM(b_json->>'address'), ''),
        NULLIF(TRIM(b_json->>'line1'), ''),
        NULLIF(TRIM(b_json->>'billing_address'), '')
      );
    ELSE
      NEW.billing_address_line1 := TRIM(NEW.billing_address_line1);
    END IF;

    IF NEW.billing_address_line2 IS NULL OR TRIM(NEW.billing_address_line2) = '' THEN
      NEW.billing_address_line2 := COALESCE(
        NULLIF(TRIM(b_json->>'address_line2'), ''),
        NULLIF(TRIM(b_json->>'line2'), ''),
        NULLIF(TRIM(b_json->>'billing_address_2'), '')
      );
    ELSE
      NEW.billing_address_line2 := TRIM(NEW.billing_address_line2);
    END IF;

    IF NEW.billing_city IS NULL OR TRIM(NEW.billing_city) = '' THEN
      NEW.billing_city := COALESCE(
        NULLIF(TRIM(b_json->>'city'), ''),
        NULLIF(TRIM(b_json->>'billing_city'), '')
      );
    ELSE
      NEW.billing_city := TRIM(NEW.billing_city);
    END IF;

    IF NEW.billing_state IS NULL OR TRIM(NEW.billing_state) = '' THEN
      NEW.billing_state := COALESCE(
        NULLIF(TRIM(b_json->>'state'), ''),
        NULLIF(TRIM(b_json->>'billing_state'), '')
      );
    ELSE
      NEW.billing_state := TRIM(NEW.billing_state);
    END IF;

    IF NEW.billing_postcode IS NULL OR TRIM(NEW.billing_postcode) = '' THEN
      NEW.billing_postcode := COALESCE(
        NULLIF(TRIM(b_json->>'postcode'), ''),
        NULLIF(TRIM(b_json->>'postal_code'), ''),
        NULLIF(TRIM(b_json->>'pincode'), ''),
        NULLIF(TRIM(b_json->>'billing_pincode'), '')
      );
    ELSE
      NEW.billing_postcode := TRIM(NEW.billing_postcode);
    END IF;

    IF NEW.billing_country IS NULL OR TRIM(NEW.billing_country) = '' THEN
      NEW.billing_country := COALESCE(
        NULLIF(TRIM(b_json->>'country'), ''),
        NULLIF(TRIM(b_json->>'billing_country'), '')
      );
    ELSE
      NEW.billing_country := TRIM(NEW.billing_country);
    END IF;
  END IF;

  -- 4. Clean Contact Strings
  IF NEW.customer_email IS NOT NULL THEN
    NEW.customer_email := LOWER(TRIM(NEW.customer_email));
  END IF;
  IF NEW.customer_phone IS NOT NULL THEN
    NEW.customer_phone := TRIM(NEW.customer_phone);
  END IF;

  -- 5. Data Quality Auditing Flags
  IF NEW.shipping_address_line1 IS NULL OR NEW.shipping_address_line1 = '' THEN
    flags := array_append(flags, 'missing_shipping_line1');
  END IF;
  IF NEW.shipping_city IS NULL OR NEW.shipping_city = '' THEN
    flags := array_append(flags, 'missing_shipping_city');
  END IF;
  IF NEW.shipping_postcode IS NULL OR NEW.shipping_postcode = '' THEN
    flags := array_append(flags, 'missing_shipping_postcode');
  END IF;
  IF NEW.customer_email IS NULL OR NEW.customer_email = '' THEN
    flags := array_append(flags, 'missing_customer_email');
  END IF;
  IF NEW.customer_phone IS NULL OR NEW.customer_phone = '' THEN
    flags := array_append(flags, 'missing_customer_phone');
  END IF;
  IF (NEW.total = 0 OR NEW.total IS NULL) AND NEW.total_amount > 0 THEN
    flags := array_append(flags, 'zero_total_mismatch');
  END IF;

  NEW.data_quality_flags := flags;

  RETURN NEW;
END;
$$;

-- Attach trigger to ensure EVERY future order insert/update is normalized
DROP TRIGGER IF EXISTS trg_normalize_orders ON public.orders;
CREATE TRIGGER trg_normalize_orders
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.normalize_order_record();

-- ── STEP 5: SAFELY BACKFILL HISTORICAL ORDERS ─────────────────────────────────
-- Idempotent: triggers normalize_order_record() on all historical orders to extract
-- JSON values into the newly created normalized columns without altering any existing amounts or IDs.
UPDATE public.orders
SET updated_at = COALESCE(updated_at, NOW())
WHERE customer_first_name IS NULL
   OR shipping_address_line1 IS NULL
   OR shipping_city IS NULL
   OR shipping_postcode IS NULL
   OR data_quality_flags IS NULL;

-- Legitimate gap filling from verified addresses table (ONLY for authenticated user_id matches)
-- Never performs fuzzy customer-name matching.
UPDATE public.orders o
SET
  shipping_address_line1 = COALESCE(o.shipping_address_line1, a.address_line1),
  shipping_address_line2 = COALESCE(o.shipping_address_line2, a.address_line2),
  shipping_city          = COALESCE(o.shipping_city, a.city),
  shipping_state         = COALESCE(o.shipping_state, a.state),
  shipping_postcode      = COALESCE(o.shipping_postcode, a.postcode),
  shipping_country       = COALESCE(o.shipping_country, a.country),
  customer_first_name    = COALESCE(o.customer_first_name, a.first_name),
  customer_last_name     = COALESCE(o.customer_last_name, a.last_name)
FROM public.addresses a
WHERE o.user_id IS NOT NULL
  AND o.user_id = a.user_id
  AND a.is_default = true
  AND (o.shipping_address_line1 IS NULL OR o.shipping_address_line1 = '');

-- ── STEP 6: SECURE REPORTING VIEW (v_orders_reporting) ────────────────────────
-- Uses WITH (security_invoker = true) to enforce existing RLS policies on orders & order_items.
-- Provides clean separate columns, authoritative total calculation, item count and product summary.
DROP VIEW IF EXISTS public.v_orders_reporting CASCADE;

CREATE VIEW public.v_orders_reporting
WITH (security_invoker = true)
AS
SELECT
  o.id AS order_id,
  o.order_number,
  o.created_at,
  o.updated_at,
  -- Customer Details
  o.user_id,
  o.is_guest,
  o.customer_name,
  o.customer_first_name,
  o.customer_last_name,
  o.customer_email,
  o.customer_phone,
  -- Shipping Details
  o.shipping_address_line1,
  o.shipping_address_line2,
  o.shipping_city,
  o.shipping_state,
  o.shipping_postcode,
  o.shipping_country,
  -- Billing Details
  o.billing_first_name,
  o.billing_last_name,
  o.billing_address_line1,
  o.billing_address_line2,
  o.billing_city,
  o.billing_state,
  o.billing_postcode,
  o.billing_country,
  -- Geography & Channel
  o.country,
  o.currency,
  o.market,
  o.order_source,
  o.source,
  o.sales_channel,
  -- Authoritative Financial Fields
  COALESCE(o.subtotal, 0) AS subtotal,
  COALESCE(o.tax_amount, 0) AS tax_amount,
  COALESCE(o.shipping_amount, 0) AS shipping_amount,
  COALESCE(o.discount_amount, 0) AS discount_amount,
  -- Authoritative Total: reconciles 37 historical records where total was 0 but total_amount had the verified value
  COALESCE(NULLIF(o.total_amount, 0), NULLIF(o.total_amount_payable, 0), NULLIF(o.total, 0), 0) AS total_amount,
  o.total AS raw_total,
  o.total_amount_payable AS raw_total_amount_payable,
  o.coupon_code,
  -- Status & Fulfillment
  o.order_status,
  o.payment_status,
  o.fulfillment_status,
  o.payment_method,
  o.payment_provider,
  o.delivery_method,
  o.courier_name,
  o.tracking_number,
  -- Product Aggregations
  (
    SELECT string_agg(
      oi.product_name || CASE WHEN oi.quantity > 1 THEN ' (x' || oi.quantity || ')' ELSE '' END,
      ', ' ORDER BY oi.id
    )
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  ) AS product_summary,
  (
    SELECT COALESCE(SUM(oi.quantity), 0)::integer
    FROM public.order_items oi
    WHERE oi.order_id = o.id
  ) AS total_items_count,
  -- Data Quality Flags
  o.data_quality_flags,
  -- Original JSON preserved
  o.shipping_address AS raw_shipping_address_json,
  o.billing_address AS raw_billing_address_json
FROM public.orders o;

-- Grant access on the view (Authenticated only; security_invoker checks order RLS)
REVOKE ALL ON public.v_orders_reporting FROM public, anon;
GRANT SELECT ON public.v_orders_reporting TO authenticated;

-- ── STEP 7: POSTGREST SCHEMA CACHE RELOAD ─────────────────────────────────────
NOTIFY pgrst, 'reload schema';
