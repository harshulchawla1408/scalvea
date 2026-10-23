-- ==============================================================================
-- SCALVEA CART TRACKING & ABANDONED-CART REPORTING SYSTEM
-- Migration: 20261024000000_cart_tracking.sql
--
-- Features:
--  1. public.carts — Stores logged-in customer carts with status:
--     'active', 'checkout_started', 'abandoned', 'purchased'
--  2. public.cart_items — Line items in each cart (product ID, name, price, qty)
--  3. public.cart_events — Audit trail of cart events (add_to_cart, remove_from_cart,
--     update_quantity, begin_checkout, purchase) with Meta/GTM event ID deduplication
--  4. public.check_abandoned_carts() — Configurable database function to mark
--     inactive carts as abandoned (default 1 day)
--  5. public.v_carts_reporting — High-performance reporting view for Excel/Admin
--  6. Strict Row-Level Security (RLS): Customers can only manage their own cart;
--     Admins have full visibility and reporting access.
-- ==============================================================================

-- ── 1. CARTS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  country text NOT NULL DEFAULT 'Australia',
  currency text NOT NULL DEFAULT 'AUD',
  raw_total numeric(10,2) NOT NULL DEFAULT 0,
  bundle_discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checkout_started', 'abandoned', 'purchased')),
  last_event text DEFAULT 'add_to_cart',
  event_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  abandoned_at timestamptz,
  purchased_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for lightning-fast admin filtering and customer lookups
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_country ON public.carts(country);
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON public.carts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_created_at ON public.carts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_carts_customer_email ON public.carts(customer_email);

-- ── 2. CART ITEMS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  image text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT cart_items_cart_product_unique UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- ── 3. CART EVENTS TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_id text,
  value numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'AUD',
  items jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_events_cart_id ON public.cart_events(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_event_name ON public.cart_events(event_name);
CREATE INDEX IF NOT EXISTS idx_cart_events_created_at ON public.cart_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_events_event_id ON public.cart_events(event_id);

-- ── 4. AUTO-UPDATE UPDATED_AT TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_cart_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_cart_updated_at();

-- ── 5. ABANDONED CART CLASSIFICATION FUNCTION ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_abandoned_carts(abandoned_after_interval interval DEFAULT interval '1 day')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.carts
  SET 
    status = 'abandoned',
    abandoned_at = COALESCE(abandoned_at, now()),
    updated_at = now()
  WHERE status IN ('active', 'checkout_started')
    AND updated_at < (now() - abandoned_after_interval);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ── 6. REPORTING VIEW ─────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_carts_reporting CASCADE;
CREATE VIEW public.v_carts_reporting
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.user_id,
  c.session_id,
  c.customer_name,
  c.customer_email,
  c.customer_phone,
  c.country,
  c.currency,
  c.raw_total,
  c.bundle_discount,
  c.total,
  c.item_count,
  -- Dynamic status calculation: auto-treats older active/checkout_started carts as abandoned
  CASE 
    WHEN c.status IN ('active', 'checkout_started') AND c.updated_at < (now() - interval '1 day') 
      THEN 'abandoned'
    ELSE c.status
  END AS computed_status,
  c.status AS recorded_status,
  c.last_event,
  c.event_id,
  c.metadata,
  c.created_at,
  c.updated_at,
  c.abandoned_at,
  c.purchased_at,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'product_id', ci.product_id,
          'name', ci.name,
          'price', ci.price,
          'quantity', ci.quantity,
          'image', ci.image
        )
      )
      FROM public.cart_items ci
      WHERE ci.cart_id = c.id
    ),
    '[]'::jsonb
  ) AS items
FROM public.carts c;

-- ── 7. ROW LEVEL SECURITY (RLS) POLICIES ──────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;

-- Carts Policies:
DROP POLICY IF EXISTS "Users can manage own carts" ON public.carts;
CREATE POLICY "Users can manage own carts"
  ON public.carts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all carts" ON public.carts;
CREATE POLICY "Admins can view all carts"
  ON public.carts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all carts" ON public.carts;
CREATE POLICY "Admins can update all carts"
  ON public.carts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete carts" ON public.carts;
CREATE POLICY "Admins can delete carts"
  ON public.carts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- Cart Items Policies:
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items"
  ON public.cart_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE id = cart_items.cart_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE id = cart_items.cart_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all cart items" ON public.cart_items;
CREATE POLICY "Admins can view all cart items"
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- Cart Events Policies:
DROP POLICY IF EXISTS "Users can insert own cart events" ON public.cart_events;
CREATE POLICY "Users can insert own cart events"
  ON public.cart_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own cart events" ON public.cart_events;
CREATE POLICY "Users can view own cart events"
  ON public.cart_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all cart events" ON public.cart_events;
CREATE POLICY "Admins can view all cart events"
  ON public.cart_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- ── 8. REPORTING VIEW PERMISSIONS & SCHEMA CACHE ───────────────────────────────
REVOKE ALL ON public.v_carts_reporting FROM public, anon;
GRANT SELECT ON public.v_carts_reporting TO authenticated;

NOTIFY pgrst, 'reload schema';
