import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: "website" | "product";
  schema?: object;
  noindex?: boolean;
  canonical?: string;
}

export function useSEO({
  title,
  description,
  keywords,
  image = "https://scalvea.com/og-image.jpg",
  type = "website",
  schema,
  noindex = false,
  canonical,
}: SEOProps = {}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Dynamic Title
    const finalTitle = title 
      ? `${title} | Scalvea` 
      : "Scalvea | Premium Hair Growth Solutions";
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

    // 2. Canonical URL Setup (Normalize non-www, remove trailing slashes, support explicit override)
    const baseUrl = "https://scalvea.com";
    let canonicalUrl = "";
    if (canonical) {
      canonicalUrl = canonical.startsWith("http://") || canonical.startsWith("https://")
        ? canonical
        : `${baseUrl}${canonical.startsWith("/") ? "" : "/"}${canonical}`;
    } else {
      let path = location.pathname;
      // Remove trailing slash if path is longer than root
      if (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
      }
      canonicalUrl = `${baseUrl}${path}`;
    }
    setLinkTag("canonical", canonicalUrl);

    // 3. Description & Keywords & Robots & Image Normalization
    const finalDesc = description || "Premium hair growth solutions backed by clinical research. Featuring Redensyl, Baicapil, Procapil and AnaGain for healthier, fuller-looking hair.";
    setMetaTag("name", "description", finalDesc);
    
    const finalKeywords = keywords || "hair growth serum, hair growth spray, scalp treatment, hair regrowth, Scalvea, Redensyl, Baicapil, Procapil, AnaGain";
    setMetaTag("name", "keywords", finalKeywords);

    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow");
    }

    // Ensure absolute image URL for social previews
    let finalImage = image;
    if (finalImage && !finalImage.startsWith("http://") && !finalImage.startsWith("https://") && !finalImage.startsWith("data:")) {
      const cleanPath = finalImage.startsWith("/") ? finalImage.slice(1) : finalImage;
      finalImage = `${baseUrl}/${cleanPath}`;
    }

    // 4. Open Graph Tags (Dynamic)
    setMetaTag("property", "og:title", title ? `${title} | Scalvea` : "Scalvea | Premium Hair Growth Solutions");
    setMetaTag("property", "og:description", finalDesc);
    setMetaTag("property", "og:image", finalImage);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:type", type);
    setMetaTag("property", "og:image:width", "1200");
    setMetaTag("property", "og:image:height", "630");

    // 5. Twitter Card Tags (Dynamic)
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title ? `${title} | Scalvea` : "Scalvea | Premium Hair Growth Solutions");
    setMetaTag("name", "twitter:description", finalDesc);
    setMetaTag("name", "twitter:image", finalImage);

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
  }, [title, description, keywords, image, type, schema, noindex, location.pathname, canonical]);
}
