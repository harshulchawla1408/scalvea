/**
 * Image optimization utilities for Scalvea.
 * Maps known master packshots directly to high-performance local WebP responsive sets.
 * Safely normalizes remote Supabase Storage assets to direct public CDN objects
 * without distortion or serverless transform latency.
 */

import { prod1Set, prod2Set } from "@/assets/generated";

// Follicle 8 master packshot identifiers
const FOLLICLE_8_IDENTIFIERS = [
  "1786916747760",
  "prod1",
  "follicle_0",
  "follicle-8",
  "follicle 8",
];

// Scalp-5 master packshot identifiers
const SCALP_5_IDENTIFIERS = [
  "1786916700729",
  "prod2",
  "scalp_0",
  "scalp-5",
  "scalp 5",
];

export function isFollicle8Master(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return FOLLICLE_8_IDENTIFIERS.some((id) => url.toLowerCase().includes(id.toLowerCase()));
}

export function isScalp5Master(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  return SCALP_5_IDENTIFIERS.some((id) => url.toLowerCase().includes(id.toLowerCase()));
}

/**
 * Normalizes Supabase URLs to the direct public object storage endpoint.
 * Strips out `/storage/v1/render/image/public/` transforms and any trailing query parameters.
 */
export function normalizeSupabaseUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  let clean = url;
  if (clean.includes("/storage/v1/render/image/public/")) {
    clean = clean.replace("/storage/v1/render/image/public/", "/storage/v1/object/public/");
  }
  // Strip query parameters (?width=...&quality=...)
  if (clean.includes("?")) {
    clean = clean.split("?")[0];
  }
  return clean;
}

/**
 * Returns optimized image URL.
 * Maps known master packshots directly to ultra-fast local responsive WebP assets.
 * Other Supabase URLs are returned as clean, native public object URLs without serverless transform latency or distortion.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  width = 480,
  _quality = 82
): string {
  if (!url || typeof url !== "string") return "";

  // 1. Follicle 8 Master Packshot
  if (isFollicle8Master(url)) {
    if (width <= 480) {
      const parts = prod1Set.srcSet.split(",");
      const w480 = parts.find((p) => p.includes("480w"));
      return w480 ? w480.trim().split(" ")[0] : prod1Set.src;
    }
    return prod1Set.src;
  }

  // 2. Scalp-5 Master Packshot
  if (isScalp5Master(url)) {
    if (width <= 480) {
      const parts = prod2Set.srcSet.split(",");
      const w480 = parts.find((p) => p.includes("480w"));
      return w480 ? w480.trim().split(" ")[0] : prod2Set.src;
    }
    return prod2Set.src;
  }

  // 3. Direct public object URL without transform distortion or delay
  return normalizeSupabaseUrl(url);
}

/**
 * Returns responsive srcSet string.
 * High-density displays receive sharp variants instantly.
 */
export function getOptimizedImageSrcSet(
  url: string | undefined | null,
  _widths = [320, 480, 640],
  _quality = 82
): string {
  if (!url || typeof url !== "string") return "";

  if (isFollicle8Master(url)) {
    return prod1Set.srcSet;
  }

  if (isScalp5Master(url)) {
    return prod2Set.srcSet;
  }

  // Never return broken /render/image/ query strings for other images
  return "";
}
