-- =============================================================
-- Migration: Shiprocket Product Delete Webhook Trigger
-- Date: 2026-07-13
--
-- Purpose:
--   When an admin deletes a product, Shiprocket must be notified
--   so it can remove / archive the product from its catalog.
--
--   The existing INSERT/UPDATE triggers cover all mutation events.
--   This migration adds the missing DELETE trigger.
--
-- Implementation:
--   A separate trigger function fires AFTER DELETE on public.products.
--   It sends the OLD row (the deleted record) to the catalog-sync
--   edge function with event = 'DELETE'. The edge function handles
--   the DELETE event by pushing status: "archived" to Shiprocket
--   and skipping the collection webhook.
--
-- Safety:
--   Uses PERFORM net.http_post (fire-and-forget async).
--   Failure to reach the edge function does NOT roll back the delete.
-- =============================================================

-- ── Delete trigger function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trigger_shiprocket_product_delete()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type',   'product',
    'event',  'DELETE',
    'record', row_to_json(OLD)  -- OLD row contains all columns before deletion
  );

  PERFORM net.http_post(
    url     := 'https://dtehgajreecaonqalxlf.supabase.co/functions/v1/shiprocket-catalog-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := payload
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Attach trigger ───────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS shiprocket_product_delete_trigger ON public.products;

CREATE TRIGGER shiprocket_product_delete_trigger
  AFTER DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_shiprocket_product_delete();

-- ── Verify trigger exists ────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'shiprocket_product_delete_trigger'
  ) THEN
    RAISE NOTICE '✓ shiprocket_product_delete_trigger created successfully on public.products';
  ELSE
    RAISE WARNING '⚠ shiprocket_product_delete_trigger was NOT created — check for errors above';
  END IF;
END $$;
