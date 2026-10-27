/**
 * Image optimization utilities for Scalvea.
 * Maps known master packshots and gallery images directly to high-performance local WebP responsive sets.
 * Safely normalizes remote Supabase Storage assets to direct public CDN objects
 * without distortion or serverless transform latency.
 */

import {
  prod1Set,
  prod2Set,
  follicle2Set,
  follicle3Set,
  follicle4Set,
  scalp2Set,
  scalp3Set,
  scalp4Set,
  type ResponsiveImageSet,
} from "@/assets/generated";

interface ImageMapping {
  identifiers: string[];
  set: ResponsiveImageSet;
}

const PRODUCT_IMAGE_MAPPINGS: ImageMapping[] = [
  // Follicle 8
  {
    identifiers: ["1786916747760", "prod1", "follicle_0", "follicle-8", "follicle 8", "follicle1"],
    set: prod1Set,
  },
  {
    identifiers: ["1786916758993", "follicle2"],
    set: follicle2Set,
  },
  {
    identifiers: ["1786916772073", "follicle3"],
    set: follicle3Set,
  },
  {
    identifiers: ["1786916778514", "follicle4"],
    set: follicle4Set,
  },
  // Scalp-5
  {
    identifiers: ["1786916700729", "prod2", "scalp_0", "scalp-5", "scalp 5", "scalp1"],
    set: prod2Set,
  },
  {
    identifiers: ["1786916707525", "scalp2"],
    set: scalp2Set,
  },
  {
    identifiers: ["1786916721520", "scalp3"],
    set: scalp3Set,
  },
  {
    identifiers: ["1786916729792", "scalp4"],
    set: scalp4Set,
  },
];

function findMatchingSet(url: string | undefined | null): ResponsiveImageSet | null {
  if (!url || typeof url !== "string") return null;
  const lower = url.toLowerCase();
  for (const mapping of PRODUCT_IMAGE_MAPPINGS) {
    if (mapping.identifiers.some((id) => lower.includes(id.toLowerCase()))) {
      return mapping.set;
    }
  }
  return null;
}

export function isFollicle8Master(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return ["1786916747760", "prod1", "follicle_0", "follicle-8", "follicle 8", "follicle1"].some((id) =>
    lower.includes(id.toLowerCase())
  );
}

export function isScalp5Master(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return ["1786916700729", "prod2", "scalp_0", "scalp-5", "scalp 5", "scalp1"].some((id) =>
    lower.includes(id.toLowerCase())
  );
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
 * Maps known packshots and gallery images directly to ultra-fast local responsive WebP assets.
 * Other Supabase URLs are returned as clean, native public object URLs without serverless transform latency or distortion.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  width = 480,
  _quality = 82
): string {
  if (!url || typeof url !== "string") return "";

  const matched = findMatchingSet(url);
  if (matched) {
    if (width <= 480) {
      const parts = matched.srcSet.split(",");
      const w480 = parts.find((p) => p.includes("480w"));
      return w480 ? w480.trim().split(" ")[0] : matched.src;
    }
    return matched.src;
  }

  // Fallback to direct normalized public object URL
  return normalizeSupabaseUrl(url);
}

/**
 * Returns responsive srcSet string.
 * High-density displays receive sharp variants instantly.
 */
export function getOptimizedImageSrcSet(
  url: string | undefined | null,
  _widths = [320, 480, 800],
  _quality = 82
): string {
  if (!url || typeof url !== "string") return "";

  const matched = findMatchingSet(url);
  if (matched) {
    return matched.srcSet;
  }

  // Never return broken /render/image/ query strings for other images
  return "";
}

/**
 * Returns the fallback master packshot URL in case a remote image ever fails to load.
 */
export function getFallbackProductImageUrl(productSlugOrName?: string): string {
  if (productSlugOrName && productSlugOrName.toLowerCase().includes("scalp")) {
    return prod2Set.src;
  }
  return prod1Set.src;
}
