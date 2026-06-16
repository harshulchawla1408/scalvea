-- Add Stripe Checkout and pricing support columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS market text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total numeric(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add UNIQUE constraint to stripe_session_id to prevent duplicate order creation
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS unique_stripe_session_id;
ALTER TABLE public.orders ADD CONSTRAINT unique_stripe_session_id UNIQUE (stripe_session_id);

-- Add price alias columns to product_prices table
ALTER TABLE public.product_prices ADD COLUMN IF NOT EXISTS india_price numeric(10,2);
ALTER TABLE public.product_prices ADD COLUMN IF NOT EXISTS australia_price numeric(10,2);

-- Trigger function for bi-directional synchronization of price fields
CREATE OR REPLACE FUNCTION public.sync_product_price_aliases()
RETURNS trigger AS $$
BEGIN
  -- Sync price_inr to india_price and price_aud to australia_price if updated/inserted
  IF (TG_OP = 'INSERT') THEN
    NEW.india_price := COALESCE(NEW.india_price, NEW.price_inr, 0.00);
    NEW.australia_price := COALESCE(NEW.australia_price, NEW.price_aud, 0.00);
    NEW.price_inr := NEW.india_price;
    NEW.price_aud := NEW.australia_price;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.india_price IS DISTINCT FROM OLD.india_price) THEN
      NEW.price_inr := NEW.india_price;
    ELSIF (NEW.price_inr IS DISTINCT FROM OLD.price_inr) THEN
      NEW.india_price := NEW.price_inr;
    END IF;

    IF (NEW.australia_price IS DISTINCT FROM OLD.australia_price) THEN
      NEW.price_aud := NEW.australia_price;
    ELSIF (NEW.price_aud IS DISTINCT FROM OLD.price_aud) THEN
      NEW.australia_price := NEW.price_aud;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to product_prices table
DROP TRIGGER IF EXISTS sync_product_price_aliases_trigger ON public.product_prices;
CREATE TRIGGER sync_product_price_aliases_trigger
  BEFORE INSERT OR UPDATE ON public.product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_price_aliases();

-- Backfill price alias columns for existing products
UPDATE public.product_prices SET 
  india_price = COALESCE(india_price, price_inr), 
  australia_price = COALESCE(australia_price, price_aud);

-- Backfill market and payment_provider for existing orders
UPDATE public.orders SET 
  market = 'IN', 
  payment_provider = 'shiprocket' 
WHERE country = 'India' AND market IS NULL;

UPDATE public.orders SET 
  market = 'AU', 
  payment_provider = 'stripe' 
WHERE country = 'Australia' AND market IS NULL;

-- Backfill values for total, shipping_cost, gst on existing orders if they are null
UPDATE public.orders SET 
  total = total_amount, 
  shipping_cost = shipping_amount, 
  gst = tax_amount 
WHERE total IS NULL OR total = 0;
