-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Anyone can read store settings'
    ) THEN
        CREATE POLICY "Anyone can read store settings" ON public.store_settings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Admins can manage store settings'
    ) THEN
        CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
END
$$;

-- Insert initial default values if they don't exist
INSERT INTO public.store_settings (key, value)
VALUES 
    ('au_business_name', 'SCALVEA GROUPS PTY LTD'),
    ('au_abn', '99 696 417 679'),
    ('au_owner_name', 'Puneet'),
    ('au_address', '17 Travers St, Craigieburn VIC 3064, Australia'),
    ('au_phone', '+61 460 309 333'),
    ('in_owner_name', 'Bimla Rani'),
    ('in_address', 'R-6 Tej Bagh Colony, Sanour Road, Patiala, Punjab, India'),
    ('in_phone', '+91 98771 91114'),
    ('in_email', 'scalvea.operations@gmail.com'),
    ('cancellation_policy', 'Orders can be cancelled only before dispatch.

Once an order has been shipped or delivered, cancellation is not allowed.

Customers may request cancellation by contacting our support team immediately after placing the order.

SCALVEA reserves the right to approve or reject cancellation requests depending on order status.'),
    ('refund_policy', 'SCALVEA does NOT accept returns for used, opened, or partially used products.

Due to hygiene and safety reasons, products once opened cannot be returned.

Refund or replacement is ONLY applicable in the following cases:

1. Product received damaged
2. Wrong product delivered
3. Customer rejects delivery before acceptance
4. Product missing in shipment

No refund for:
- Change of mind
- Used product
- Opened packaging
- Dissatisfaction after usage

Refund approval process:
Customer must contact support within 48 hours of delivery with:
- Order ID
- Photos/videos
- Reason for issue

After verification, refund/replacement will be processed.

Refund timeline:
Approved refunds are processed within 5–10 business days.

Support Contact:
Email: scalvea.operations@gmail.com
Phone: +91 98771 91114')
ON CONFLICT (key) DO NOTHING;
