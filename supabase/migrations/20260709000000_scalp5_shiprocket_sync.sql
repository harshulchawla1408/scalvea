-- =============================================================
-- Migration: Scalp-5 Shiprocket Catalog Sync
-- Date: 2026-07-09
--
-- Goals:
--  1. Ensure shiprocket_product_id = 100002 for Scalp-5
--  2. Ensure shiprocket_variant_id = 200002 for Scalp-5
--  3. Advance sequences so no future product re-uses these IDs
--  4. Add CHECK constraints preventing 0 or negative IDs
--  5. Create get_next_shiprocket_ids() RPC for admin auto-preview
-- =============================================================

-- ── Step 1: Ensure sequences exist (idempotent) ──────────────
CREATE SEQUENCE IF NOT EXISTS shiprocket_prod_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS shiprocket_var_id_seq  START WITH 200001;

-- ── Step 2: Ensure columns exist (idempotent) ────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shiprocket_product_id bigint UNIQUE DEFAULT nextval('shiprocket_prod_id_seq');
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shiprocket_variant_id bigint UNIQUE DEFAULT nextval('shiprocket_var_id_seq');

-- ── Step 3: Assign exact IDs to Scalp-5 ─────────────────────
-- Handles BOTH cases:
--   A) Product already exists → UPDATE its IDs
--   B) Product does not exist → no-op (will get IDs on INSERT via sequence)
--
-- Uses a DO block to avoid constraint conflicts if the IDs are already
-- assigned to another row (shouldn't happen, but safe).
DO $$
DECLARE
  v_scalp5_id uuid;
  v_existing_prod_holder uuid;
  v_existing_var_holder  uuid;
BEGIN
  -- Find the Scalp-5 product UUID
  SELECT id INTO v_scalp5_id
  FROM public.products
  WHERE slug = 'scalp-5-anti-dandruff-hair-serum'
  LIMIT 1;

  IF v_scalp5_id IS NOT NULL THEN

    -- Check if 100002 is already taken by a DIFFERENT product
    SELECT id INTO v_existing_prod_holder
    FROM public.products
    WHERE shiprocket_product_id = 100002
      AND id <> v_scalp5_id
    LIMIT 1;

    -- Check if 200002 is already taken by a DIFFERENT product
    SELECT id INTO v_existing_var_holder
    FROM public.products
    WHERE shiprocket_variant_id = 200002
      AND id <> v_scalp5_id
    LIMIT 1;

    IF v_existing_prod_holder IS NOT NULL THEN
      RAISE EXCEPTION
        'shiprocket_product_id 100002 is already assigned to product %',
        v_existing_prod_holder;
    END IF;

    IF v_existing_var_holder IS NOT NULL THEN
      RAISE EXCEPTION
        'shiprocket_variant_id 200002 is already assigned to product %',
        v_existing_var_holder;
    END IF;

    -- Safe to assign
    UPDATE public.products
    SET
      shiprocket_product_id = 100002,
      shiprocket_variant_id = 200002,
      sku = COALESCE(NULLIF(sku, ''), 'S5-GLOBAL-01'),
      weight = CASE WHEN (weight IS NULL OR weight = 0) THEN 0.120 ELSE weight END,
      updated_at = now()
    WHERE id = v_scalp5_id;

    RAISE NOTICE 'Scalp-5 (%) updated: shiprocket_product_id=100002, shiprocket_variant_id=200002', v_scalp5_id;
  ELSE
    RAISE NOTICE 'Scalp-5 not found in products table. IDs will be assigned automatically on INSERT.';
  END IF;
END $$;

-- ── Step 4: Advance sequences past 100002 / 200002 ──────────
-- setval(seq, val, is_called=true) means the NEXT nextval() call
-- returns val+1, so 100003 / 200003.
-- We only advance if the sequence current value is below 100002.
DO $$
DECLARE
  v_prod_last bigint;
  v_var_last  bigint;
BEGIN
  SELECT last_value INTO v_prod_last FROM shiprocket_prod_id_seq;
  SELECT last_value INTO v_var_last  FROM shiprocket_var_id_seq;

  IF v_prod_last < 100002 THEN
    PERFORM setval('shiprocket_prod_id_seq', 100002, true);
    RAISE NOTICE 'Advanced shiprocket_prod_id_seq to 100002 (next = 100003)';
  ELSE
    RAISE NOTICE 'shiprocket_prod_id_seq already at %, no change needed', v_prod_last;
  END IF;

  IF v_var_last < 200002 THEN
    PERFORM setval('shiprocket_var_id_seq', 200002, true);
    RAISE NOTICE 'Advanced shiprocket_var_id_seq to 200002 (next = 200003)';
  ELSE
    RAISE NOTICE 'shiprocket_var_id_seq already at %, no change needed', v_var_last;
  END IF;
END $$;

-- ── Step 5: Validation constraints ───────────────────────────
-- Prevent 0 or negative Shiprocket IDs from ever being stored.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS chk_shiprocket_product_id_positive;
ALTER TABLE public.products
  ADD CONSTRAINT chk_shiprocket_product_id_positive
    CHECK (shiprocket_product_id IS NULL OR shiprocket_product_id > 0);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS chk_shiprocket_variant_id_positive;
ALTER TABLE public.products
  ADD CONSTRAINT chk_shiprocket_variant_id_positive
    CHECK (shiprocket_variant_id IS NULL OR shiprocket_variant_id > 0);

-- ── Step 6: RPC for Admin auto-preview of next IDs ───────────
-- Returns what the NEXT nextval() calls would produce, without
-- consuming the sequence values.
CREATE OR REPLACE FUNCTION public.get_next_shiprocket_ids()
RETURNS TABLE(next_product_id bigint, next_variant_id bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END
     FROM shiprocket_prod_id_seq) AS next_product_id,
    (SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END
     FROM shiprocket_var_id_seq)  AS next_variant_id;
$$;

-- Grant execute to authenticated (admins only use this but anon is fine since it's read-only)
GRANT EXECUTE ON FUNCTION public.get_next_shiprocket_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_shiprocket_ids() TO anon;

-- ── Step 7: Verify result ─────────────────────────────────────
DO $$
DECLARE
  v_prod_id bigint;
  v_var_id  bigint;
  v_seq_prod bigint;
  v_seq_var  bigint;
BEGIN
  SELECT shiprocket_product_id, shiprocket_variant_id
  INTO v_prod_id, v_var_id
  FROM public.products
  WHERE slug = 'scalp-5-anti-dandruff-hair-serum'
  LIMIT 1;

  SELECT last_value INTO v_seq_prod FROM shiprocket_prod_id_seq;
  SELECT last_value INTO v_seq_var  FROM shiprocket_var_id_seq;

  IF v_prod_id IS NOT NULL THEN
    RAISE NOTICE '✓ Scalp-5 shiprocket_product_id = %', v_prod_id;
    RAISE NOTICE '✓ Scalp-5 shiprocket_variant_id = %', v_var_id;
    IF v_prod_id <> 100002 THEN
      RAISE WARNING '⚠ Expected 100002, got %', v_prod_id;
    END IF;
    IF v_var_id <> 200002 THEN
      RAISE WARNING '⚠ Expected 200002, got %', v_var_id;
    END IF;
  ELSE
    RAISE NOTICE '⚠ Scalp-5 not in DB yet — will auto-receive IDs on INSERT';
  END IF;

  RAISE NOTICE '✓ Sequence shiprocket_prod_id_seq current = % (next INSERT gets %)', v_seq_prod, v_seq_prod + 1;
  RAISE NOTICE '✓ Sequence shiprocket_var_id_seq  current = % (next INSERT gets %)', v_seq_var,  v_seq_var  + 1;
END $$;
