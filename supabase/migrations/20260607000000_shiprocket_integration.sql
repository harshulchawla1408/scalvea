-- Add Shiprocket product attributes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight numeric(10,3) DEFAULT 0.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shiprocket_variant_id text;

-- Create Shiprocket Orders mapping table
CREATE TABLE IF NOT EXISTS public.shiprocket_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  shiprocket_order_id text NOT NULL UNIQUE,
  tracking_id text,
  courier_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shiprocket_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage shiprocket_orders" ON public.shiprocket_orders;
DROP POLICY IF EXISTS "Users can read own shiprocket_orders" ON public.shiprocket_orders;

-- Create policies
CREATE POLICY "Admins can manage shiprocket_orders" ON public.shiprocket_orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own shiprocket_orders" ON public.shiprocket_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = shiprocket_orders.order_id
      AND orders.user_id = auth.uid()
  ));
