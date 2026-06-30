-- Add missing Shiprocket checkout fields to public.orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fastrr_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount_payable numeric(10,2);

-- Create a public.payments table if it does not exist to support detailed payment records
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL,
  amount numeric(10,2) NOT NULL,
  transaction_id text,
  raw_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

-- Create policy for admins
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
