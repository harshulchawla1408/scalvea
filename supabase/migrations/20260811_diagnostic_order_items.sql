-- =============================================================
-- DIAGNOSTIC: Check order_items linkage
-- Run this in Supabase SQL Editor to see the current state.
-- =============================================================

-- 1. How many order_items exist total?
SELECT COUNT(*) AS total_order_items FROM public.order_items;

-- 2. Show all order_items with their linked order info
SELECT
  oi.id AS item_id,
  oi.order_id,
  oi.product_name,
  oi.quantity,
  oi.price,
  o.order_number,
  o.total_amount,
  o.country,
  o.order_status
FROM public.order_items oi
LEFT JOIN public.orders o ON o.id = oi.order_id
ORDER BY o.created_at DESC;

-- 3. Orders that have NO items linked
SELECT
  o.id,
  o.order_number,
  o.total_amount,
  o.currency,
  o.order_status,
  o.created_at,
  COUNT(oi.id) AS item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.total_amount, o.currency, o.order_status, o.created_at
ORDER BY o.created_at DESC;

-- 4. Check RLS policies currently on order_items
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'order_items' AND schemaname = 'public'
ORDER BY policyname;
