
-- Allow authenticated users to update coupon usage_count when placing orders
CREATE POLICY "Authenticated users can update coupon usage"
ON public.coupons FOR UPDATE
TO authenticated
USING (is_active = true)
WITH CHECK (is_active = true);

-- Add cascade delete for product_prices -> products
ALTER TABLE public.product_prices 
DROP CONSTRAINT IF EXISTS product_prices_product_id_fkey,
ADD CONSTRAINT product_prices_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add cascade delete for inventory_logs -> products  
ALTER TABLE public.inventory_logs
DROP CONSTRAINT IF EXISTS inventory_logs_product_id_fkey,
ADD CONSTRAINT inventory_logs_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add cascade delete for reviews -> products
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_product_id_fkey,
ADD CONSTRAINT reviews_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Add cascade delete for order_items -> orders
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
