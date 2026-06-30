-- Drop old text shiprocket_variant_id column if it exists to prevent type conflict
ALTER TABLE public.products DROP COLUMN IF EXISTS shiprocket_variant_id;

-- Create sequences for Shiprocket IDs starting from their respective offsets
CREATE SEQUENCE IF NOT EXISTS shiprocket_prod_id_seq START WITH 100001;
CREATE SEQUENCE IF NOT EXISTS shiprocket_var_id_seq START WITH 200001;

-- Add numeric unique columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shiprocket_product_id bigint UNIQUE DEFAULT nextval('shiprocket_prod_id_seq');
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shiprocket_variant_id bigint UNIQUE DEFAULT nextval('shiprocket_var_id_seq');

-- Ensure sku is text and weight is numeric with default 0
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight numeric(10,3) DEFAULT 0.000;
