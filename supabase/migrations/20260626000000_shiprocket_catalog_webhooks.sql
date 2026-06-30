-- Create shiprocket_webhook_logs table
CREATE TABLE IF NOT EXISTS public.shiprocket_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type text NOT NULL,
  payload jsonb NOT NULL,
  response text,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shiprocket_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Admins can manage shiprocket_webhook_logs" ON public.shiprocket_webhook_logs;

-- Create policy for admins
CREATE POLICY "Admins can manage shiprocket_webhook_logs" ON public.shiprocket_webhook_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger function for Shiprocket catalog synchronization
CREATE OR REPLACE FUNCTION public.trigger_shiprocket_catalog_sync()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', CASE WHEN TG_TABLE_NAME = 'products' THEN 'product' ELSE 'price' END,
    'event', TG_OP,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := 'https://dtehgajreecaonqalxlf.supabase.co/functions/v1/shiprocket-catalog-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers
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
