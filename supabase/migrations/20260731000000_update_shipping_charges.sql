-- =============================================================
-- Migration: Update Shipping Charges and Remove Free Shipping
-- Date: 2026-07-31
--
-- Updates shipping charges for Australia to A$9.50.
-- Sets free shipping thresholds to a massive value or 0, 
-- since all logic will ignore it. We will use NULL/0 for clean state.
-- =============================================================

UPDATE public.country_settings
SET shipping_charge = 9.50,
    free_shipping_above = 0.00
WHERE LOWER(country) = 'australia';

UPDATE public.country_settings
SET free_shipping_above = 0.00
WHERE LOWER(country) = 'india';
