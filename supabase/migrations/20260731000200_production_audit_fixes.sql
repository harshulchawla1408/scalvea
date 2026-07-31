-- 20260731000200_production_audit_fixes.sql

-- 1. Add currency to checkout_sessions
ALTER TABLE public.checkout_sessions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AUD' NOT NULL;

-- 2. Add image_url to order_items
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Cleanup pg_cron job for abandoned sessions
-- Requires pg_cron extension, which Supabase enables by default.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-abandoned-checkout-sessions',
  '0 2 * * *', -- Every day at 2am
  $$ DELETE FROM public.checkout_sessions WHERE status IN ('PENDING', 'EXPIRED', 'FAILED') AND created_at < now() - interval '48 hours'; $$
);
