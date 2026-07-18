-- =============================================================
-- Migration: Order Status History & Realtime Orders
-- Date: 2026-07-19
-- =============================================================

-- 1. Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can read/manage all history
CREATE POLICY "Admins can manage order_status_history" ON public.order_status_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read their own order history
CREATE POLICY "Users can read own order_status_history" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_status_history.order_id
        AND (orders.user_id = auth.uid() OR orders.customer_email = auth.jwt()->>'email')
    )
  );

-- 2. Enable Realtime on the orders table
DO $$
BEGIN
  -- We add the table to the realtime publication if it's not already there
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    -- Attempt to add it. (Requires the publication to exist, which Supabase provisions by default)
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if publication manipulation fails or doesn't exist locally
  RAISE NOTICE 'Realtime publication update skipped or failed: %', SQLERRM;
END $$;
