-- =============================================================
-- FIX: order_items RLS policy — "permission denied for table users"
-- Date: 2026-08-11
--
-- ROOT CAUSE: The "Users can read own order items" policy uses:
--   SELECT email FROM auth.users WHERE id = auth.uid()
-- The 'authenticated' role CANNOT directly query auth.users.
-- This causes a 403 on ALL order_items queries — including admin.
--
-- FIX: Use auth.email() built-in instead of querying auth.users.
-- SAFE TO RUN MULTIPLE TIMES.
-- =============================================================

-- Rewrite the user-facing order_items policy to avoid auth.users
DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = auth.uid()
          OR orders.customer_email = auth.email()
        )
    )
  );

-- Also re-ensure the admin policy is correct (idempotent)
DROP POLICY IF EXISTS "Admins can read all order items" ON public.order_items;
CREATE POLICY "Admins can read all order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'admin'
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify: both policies should now be present
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'order_items' AND schemaname = 'public'
ORDER BY policyname;
