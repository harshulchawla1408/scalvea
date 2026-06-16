-- Add separate inventory, active status, and SKU columns for India and Australia in the products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_quantity_australia integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active_india boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active_australia boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku_india text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku_australia text;

-- Add country constraint and field to coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';

-- Seed/Insert country settings for India and Australia
INSERT INTO public.country_settings (country, currency, currency_symbol, tax_percentage, shipping_charge, free_shipping_above, delivery_time, is_enabled)
VALUES
('India', 'INR', '₹', 18.00, 100.00, 999.00, '3-5 business days', true),
('Australia', 'AUD', 'A$', 10.00, 10.00, 100.00, '5-7 business days', true)
ON CONFLICT (country) DO UPDATE SET
  currency = EXCLUDED.currency,
  currency_symbol = EXCLUDED.currency_symbol,
  tax_percentage = EXCLUDED.tax_percentage,
  shipping_charge = EXCLUDED.shipping_charge,
  free_shipping_above = EXCLUDED.free_shipping_above,
  delivery_time = EXCLUDED.delivery_time,
  is_enabled = EXCLUDED.is_enabled;
