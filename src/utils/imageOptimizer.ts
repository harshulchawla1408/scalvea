/**
 * Image optimization utilities for Scalvea.
 * Supports Supabase Storage Image Transformation API and responsive srcSets.
 */

export function getOptimizedImageUrl(url: string | undefined | null, width = 480, quality = 82): string {
  if (!url) return "";
  if (typeof url !== "string") return "";

  // If it's a Supabase storage URL, route through the transform render endpoint
  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${base}?width=${width}&quality=${quality}`;
  }

  return url;
}

export function getOptimizedImageSrcSet(url: string | undefined | null, widths = [320, 480, 640], quality = 82): string {
  if (!url) return "";
  if (typeof url !== "string") return "";

  if (url.includes("supabase.co/storage/v1/object/public/")) {
    const base = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return widths.map((w) => `${base}?width=${w}&quality=${quality} ${w}w`).join(", ");
  }

  return "";
}
