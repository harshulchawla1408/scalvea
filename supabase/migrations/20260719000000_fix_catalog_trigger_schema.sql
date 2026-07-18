-- =============================================================
-- Migration: Fix Shiprocket Catalog Sync Trigger Payload Schema
-- Date: 2026-07-19
--
-- Problem:
--   The original trigger (20260626000000_shiprocket_catalog_webhooks.sql)
--   sent the WRONG payload schema to shiprocket-catalog-sync:
--     { "type": "product", "event": "INSERT", "record": {...} }
--   But the edge function destructures:
--     const { type, table, record, old_record } = body;
--   and uses:
--     type === "DELETE"          → archived product path
--     table === "product_prices" → price change routing
--   Both of these checks always failed with the old trigger because:
--     "type" was "product"/"price" not the TG_OP value
--     "table" was never sent at all
--
--   As a result:
--   1. Product-prices changes silently failed (price updates never synced)
--   2. DELETE path never fired (products were never archived on Shiprocket)
--
--   Also: no Authorization header was sent, which may cause the edge function
--   to receive a 401 from Supabase on some project configurations.
--
-- Fix:
--   Replace both trigger functions to send:
--     { "type": TG_OP, "table": TG_TABLE_NAME, "record": row_to_json(NEW), "old_record": ... }
--   This exactly matches what the edge function expects.
--
--   Add "Authorization: Bearer <ANON_KEY>" header to net.http_post.
--   The anon key is the public publishable key and is safe to include here.
--   The edge function uses its own SUPABASE_SERVICE_ROLE_KEY for all DB access.
-- =============================================================

-- ── Shared INSERT / UPDATE trigger function ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_shiprocket_catalog_sync()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Payload schema that shiprocket-catalog-sync/index.ts expects:
  --   type      = TG_OP  ("INSERT" or "UPDATE")
  --   table     = TG_TABLE_NAME  ("products" or "product_prices")
  --   record    = the NEW row
  --   old_record = NULL for INSERT, OLD row for UPDATE
  payload := jsonb_build_object(
    'type',       TG_OP,
    'table',      TG_TABLE_NAME,
    'record',     row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url     := 'https://dtehgajreecaonqalxlf.supabase.co/functions/v1/shiprocket-catalog-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZWhnamFqcmVlY2FvbnFhbHhsZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzMjc5MDE5LCJleHAiOjIwNTg4NTUwMTl9.jqYb-bCWxLhcQBfJFPT4sS0nS9aeGjVE1hXEDTtR_qM'
    ),
    body    := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── DELETE trigger function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_shiprocket_product_delete()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  -- For DELETE, send the OLD row as both "record" and "old_record".
  -- The edge function checks: if (type === "DELETE")
  -- and uses: targetRecord = record || old_record (whichever exists)
  payload := jsonb_build_object(
    'type',       TG_OP,
    'table',      TG_TABLE_NAME,
    'record',     row_to_json(OLD),
    'old_record', row_to_json(OLD)
  );

  PERFORM net.http_post(
    url     := 'https://dtehgajreecaonqalxlf.supabase.co/functions/v1/shiprocket-catalog-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0ZWhnamFqcmVlY2FvbnFhbHhsZiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzMjc5MDE5LCJleHAiOjIwNTg4NTUwMTl9.jqYb-bCWxLhcQBfJFPT4sS0nS9aeGjVE1hXEDTtR_qM'
    ),
    body    := payload
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Re-attach all triggers (idempotent) ─────────────────────────────────────
DROP TRIGGER IF EXISTS shiprocket_product_sync_trigger ON public.products;
CREATE TRIGGER shiprocket_product_sync_trigger
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_shiprocket_catalog_sync();

DROP TRIGGER IF EXISTS shiprocket_price_sync_trigger ON public.product_prices;
CREATE TRIGGER shiprocket_price_sync_trigger
  AFTER INSERT OR UPDATE ON public.product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_shiprocket_catalog_sync();

DROP TRIGGER IF EXISTS shiprocket_product_delete_trigger ON public.products;
CREATE TRIGGER shiprocket_product_delete_trigger
  AFTER DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_shiprocket_product_delete();

-- ── Verify all triggers are present ─────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'shiprocket_product_sync_trigger') THEN
    RAISE NOTICE 'OK: shiprocket_product_sync_trigger (INSERT/UPDATE on products) is active';
  ELSE
    RAISE WARNING 'MISSING: shiprocket_product_sync_trigger — check for errors above';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'shiprocket_price_sync_trigger') THEN
    RAISE NOTICE 'OK: shiprocket_price_sync_trigger (INSERT/UPDATE on product_prices) is active';
  ELSE
    RAISE WARNING 'MISSING: shiprocket_price_sync_trigger — check for errors above';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'shiprocket_product_delete_trigger') THEN
    RAISE NOTICE 'OK: shiprocket_product_delete_trigger (DELETE on products) is active';
  ELSE
    RAISE WARNING 'MISSING: shiprocket_product_delete_trigger — check for errors above';
  END IF;
END $$;
