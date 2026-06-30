-- Enable pg_net and pg_cron extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop cron job if exists to prevent duplication on multiple migrations runs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'shiprocket-order-sync-job';
  END IF;
END $$;

-- Schedule a cron job to call the shiprocket-order-list Edge Function every 30 minutes
-- This pulls the latest orders list from Shiprocket to synchronize any pending or initiated orders
SELECT cron.schedule(
  'shiprocket-order-sync-job',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://dtehgajreecaonqalxlf.supabase.co/functions/v1/shiprocket-order-list',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"limit": 50, "page": 1, "status": "initiated"}'::jsonb
  );
  $$
);
