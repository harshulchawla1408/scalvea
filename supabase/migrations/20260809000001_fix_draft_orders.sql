-- =============================================================
-- Migration: Fix Draft Orders & Remove Draft Status
-- Date: 2026-08-09 (Part 2)
--
-- 1. Upgrade all paid-but-draft orders to 'processing'
-- 2. Cancel all abandoned draft orders (never paid, >1h old)
-- 3. Remove order_status 'draft' concept going forward
--    (we no longer pre-create orders — only create on confirmation)
-- =============================================================

-- ── STEP 1: Fix paid orders stuck as "draft" ──────────────────
-- These are orders where Stripe confirmed payment but the webhook
-- updated payment_status='paid' but left order_status='draft'.

UPDATE public.orders
SET
  order_status = 'processing',
  updated_at   = NOW()
WHERE
  order_status = 'draft'
  AND payment_status IN ('paid', 'completed');

-- ── STEP 2: Clean up truly abandoned draft orders ─────────────
-- These are orders that were pre-created but never paid for.
-- Mark them as cancelled so they don't pollute dashboards.

UPDATE public.orders
SET
  order_status = 'cancelled',
  updated_at   = NOW()
WHERE
  order_status = 'draft'
  AND payment_status IN ('pending', 'unpaid')
  AND created_at < NOW() - INTERVAL '2 hours';

-- ── STEP 3: Reload schema cache ───────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── VERIFY: Check remaining drafts (should be near 0 now) ─────
SELECT order_status, payment_status, COUNT(*) AS cnt
FROM public.orders
GROUP BY order_status, payment_status
ORDER BY order_status;
