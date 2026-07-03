-- Update SELECT policies for public.orders to allow loading by stripe_session_id or fastrr_order_id
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders 
  FOR SELECT 
  USING (user_id = auth.uid() OR stripe_session_id IS NOT NULL OR fastrr_order_id IS NOT NULL);

-- Update SELECT policies for public.order_items to allow reading order item details
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items 
  FOR SELECT 
  USING (true);

-- Update SELECT policies for public.shiprocket_orders to allow mapping lookup
DROP POLICY IF EXISTS "Users can read own shiprocket_orders" ON public.shiprocket_orders;
CREATE POLICY "Users can read own shiprocket_orders" ON public.shiprocket_orders 
  FOR SELECT 
  USING (true);
