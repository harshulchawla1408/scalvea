import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string; // Kept for backwards compatibility but ignored
  image?: string;
  type?: "website" | "product";
  schema?: object;
  noindex?: boolean;
  noImagePreview?: boolean;
  canonical?: string;
}

export function useSEO({
  title,
  description,
  image = "https://scalvea.com/og-image.webp",
  type = "website",
  schema,
  noindex = false,
  noImagePreview = false,
  canonical,
}: SEOProps = {}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic Title — fallback to clean brand line
    const finalTitle = title
      ? title.endsWith("| Scalvea")
        ? title
        : `${title} | Scalvea`
      : "Scalvea | Care You Deserve";
    document.title = finalTitle;

    // Helper: Find or create meta tag
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper: Find or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Canonical URL Setup
    const baseUrl = "https://scalvea.com";
    let canonicalUrl = "";
    if (canonical) {
      canonicalUrl = canonical.startsWith("http://") || canonical.startsWith("https://")
        ? canonical
        : `${baseUrl}${canonical.startsWith("/") ? "" : "/"}${canonical}`;
    } else {
      let path = location.pathname;
      if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
      }
      canonicalUrl = `${baseUrl}${path}`;
    }
    setLinkTag("canonical", canonicalUrl);

    const finalDesc = description || "Science-backed hair care powered by clinically researched ingredients. Discover transparent formulations for healthier scalp, stronger hair, and everyday confidence. Care You Deserve.";
    setMetaTag("name", "description", finalDesc);

    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else if (noImagePreview) {
      setMetaTag("name", "robots", "index, follow, max-image-preview:none");
    } else {
      setMetaTag("name", "robots", "index, follow, max-image-preview:large");
    }

    // Ensure absolute image URL for social previews
    let finalImage = image;
    if (finalImage && !finalImage.startsWith("http://") && !finalImage.startsWith("https://") && !finalImage.startsWith("data:")) {
      const cleanPath = finalImage.startsWith("/") ? finalImage.slice(1) : finalImage;
      finalImage = `${baseUrl}/${cleanPath}`;
    }

    // 4. Open Graph Tags
    setMetaTag("property", "og:title", finalTitle);
    setMetaTag("property", "og:description", finalDesc);
    setMetaTag("property", "og:image", finalImage);
    setMetaTag("property", "og:image:alt", finalTitle);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:site_name", "Scalvea");
    setMetaTag("property", "og:image:width", "1200");
    setMetaTag("property", "og:image:height", "630");

    // 5. Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", finalTitle);
    setMetaTag("name", "twitter:description", finalDesc);
    setMetaTag("name", "twitter:image", finalImage);
    setMetaTag("name", "twitter:site", "@scalvea");

    // 6. Structured Schema.org markup Injection
    const existingScripts = document.querySelectorAll("script[data-seo-jsonld]");
    existingScripts.forEach((script) => script.remove());

    if (schema) {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo-jsonld", "true");
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [title, description, image, type, schema, noindex, noImagePreview, location.pathname, canonical]);
}
