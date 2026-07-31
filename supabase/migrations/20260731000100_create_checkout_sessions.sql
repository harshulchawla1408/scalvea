-- 20260731000100_create_checkout_sessions.sql

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED')),
    stripe_session_id TEXT UNIQUE,
    total_amount NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    shipping_amount NUMERIC NOT NULL,
    tax_amount NUMERIC NOT NULL,
    discount_amount NUMERIC NOT NULL,
    coupon_code TEXT,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_name TEXT,
    shipping_address JSONB NOT NULL,
    line_items JSONB NOT NULL,
    market TEXT DEFAULT 'AU' NOT NULL,
    delivery_estimate TEXT
);

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own checkout sessions
CREATE POLICY "Users can view own checkout sessions" 
ON public.checkout_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Edge functions use the service role and will bypass RLS for inserts/updates.
