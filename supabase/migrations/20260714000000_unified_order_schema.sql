-- 20260714000000_unified_order_schema.sql
-- Sequence for Order Number SCV-YYYY-000001
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Update the existing trigger function to use the sequence
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Using year and a 6-digit zero-padded sequential number
  NEW.order_number := 'SCV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public.order_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$;

-- Add unified columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS is_guest boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS gateway_response jsonb,
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS platform text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS courier text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS awb text,
ADD COLUMN IF NOT EXISTS shipment_id text,
ADD COLUMN IF NOT EXISTS shipping_label_url text,
ADD COLUMN IF NOT EXISTS manifest_url text,
ADD COLUMN IF NOT EXISTS pickup_status text,
ADD COLUMN IF NOT EXISTS dispatch_date timestamptz,
ADD COLUMN IF NOT EXISTS delivery_date timestamptz,
ADD COLUMN IF NOT EXISTS invoice_number text,
ADD COLUMN IF NOT EXISTS invoice_url text,
ADD COLUMN IF NOT EXISTS tax_invoice boolean DEFAULT false;
