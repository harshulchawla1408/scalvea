-- ============================================================================
-- SCALVEA STORAGE CACHE OPTIMIZATION
-- Sets public access and 1-year (31536000s) cacheControl for all product images
-- ============================================================================

-- 1. Ensure product-images bucket is public with 1-year cache control
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- 2. Update existing product-images objects to have max-age=31536000
UPDATE storage.objects
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{cacheControl}',
  '"max-age=31536000, public"'
)
WHERE bucket_id = 'product-images';
