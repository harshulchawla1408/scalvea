import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";

export interface DBProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  ingredients: string | null;
  how_to_use: string | null;
  key_ingredients: string[];
  size: string | null;
  images: string[];
  is_active: boolean;
  featured: boolean;
  badge: string | null;
  inventory_quantity: number;
  inventory?: number;
  rating?: number;
  reviews_count?: number;
  price_aud: number;
  price_inr: number;
  price_usd: number;
  mrp_aud?: number;
  mrp_inr?: number;
  // Raw fields for admin dashboard use
  inventory_quantity_india?: number;
  inventory_quantity_australia?: number;
  is_active_india?: boolean;
  is_active_australia?: boolean;
  sku_india?: string | null;
  sku_australia?: string | null;
}

/**
 * Static baseline product catalog.
 * Guarantees zero-delay, instantaneous rendering for Shop, ProductDetail,
 * and SSG prerendering without waiting for network roundtrips to Supabase.
 */
export const INITIAL_PRODUCTS: DBProduct[] = [
  {
    id: "dddcad97-e154-4860-87ca-8a67450e1e4f",
    name: "Follicle 8 Hair Growth Serum",
    slug: "follicle-8-hair-growth-serum",
    description:
      "Follicle 8 Hair Growth Serum by Scalvea is a premium hair growth treatment formulated to support stronger, thicker, and healthier-looking hair. Powered by clinically inspired ingredients including 4% Anagain, 3% Redensyl, 3% Baicapil, and 3% Procapil, this advanced serum helps reduce hair fall, improve scalp health, and promote visible hair density with consistent use.\n\nDesigned for both men and women, Follicle 8 targets weak hair roots, thinning areas, and excessive shedding by nourishing the scalp and supporting healthier hair follicles. Its lightweight, non-greasy formula absorbs quickly into the scalp and is suitable for all hair types.\n\nKey Benefits:\n• Helps reduce hair fall\n• Supports healthier hair growth\n• Improves scalp nourishment\n• Promotes thicker-looking hair\n• Suitable for all hair types\n\nFor best results, apply daily on a clean, dry scalp and massage gently.",
    category: "Serums",
    ingredients: "4% Anagain, 3% Redensyl, 3% Baicapil, 3% Procapil",
    how_to_use:
      "1. Apply a few drops daily to a clean, dry scalp.\n2. Gently massage into the scalp and leave on.\n3. Use consistently for best results.",
    key_ingredients: ["Anagain", "Redensyl", "Baicapil", "Procapil"],
    size: "30 mL / 1.01 fl oz",
    images: [
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916747760-4yc3rutwbyo.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916758993-41c7fbwgp0y.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916772073-hzbfhlwa1k9.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916778514-hl4q3grn0sd.webp",
    ],
    is_active: true,
    featured: true,
    badge: "BEST SELLER",
    inventory_quantity: 100,
    price_aud: 34.5,
    price_inr: 999,
    price_usd: 0,
    mrp_aud: 40,
    mrp_inr: 1399,
    inventory_quantity_india: 0,
    inventory_quantity_australia: 100,
    is_active_india: true,
    is_active_australia: true,
    sku_india: "F8-INR-01",
    sku_australia: "F8-AUD-01",
  },
  {
    id: "b5ec8213-a8d1-4419-b27c-44af1c2e59e5",
    name: "Scalp-5 Anti Dandruff Hair Serum",
    slug: "scalp-5-anti-dandruff-hair-serum",
    description:
      "Scalp-5 Anti Dandruff Hair Serum by Scalvea is an advanced scalp treatment formulated to target dandruff, excess oil, scalp irritation, and unhealthy scalp buildup while supporting a cleaner, healthier scalp environment. Powered by clinically inspired ingredients including Rosemary Oil, Piroctone Olamine, Salicylic Acid, and Vitamin E (Tocopherol), this lightweight serum helps reduce visible flakes, soothe irritation, and restore scalp balance for healthier-looking hair.\n\nDesigned for both men and women, Scalp-5 works directly on the scalp to control dandruff-causing factors, gently exfoliate dead skin cells, and nourish the scalp without leaving a greasy residue. Its fast-absorbing formula is suitable for all hair and scalp types and integrates easily into any hair care routine.\n\nKey Benefits\n\n• Helps reduce dandruff and visible flakes\n• Controls excess scalp oil production\n• Gently exfoliates scalp buildup\n• Helps relieve scalp irritation and itching\n• Nourishes and supports a healthier scalp barrier\n• Lightweight, non-greasy formula\n• Suitable for all hair and scalp types",
    category: "Serums",
    ingredients: "Rosemary Oil, Piroctone Olamine (0.8%), Salicylic Acid, Vitamin E (Tocopherol)",
    how_to_use:
      "1. Apply directly onto a clean, dry scalp before shampooing.\n2. Part your hair into sections and apply a few drops to affected areas.\n3. Massage gently using your fingertips for 2–3 minutes.\n4. Leave on for approximately 1 hour.\n5. Wash thoroughly with a mild shampoo.\n6. Use 3–4 times per week or as recommended for best results.",
    key_ingredients: ["Rosemary Oil", "Piroctone Olamine", "Salicylic Acid", "Vitamin E"],
    size: "30 mL / 1.01 fl oz",
    images: [
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916700729-ljfbb8n052q.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916707525-lylu7o6oiv8.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916721520-rb86f7iii7.webp",
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/product-images/products/1786916729792-tt9o7nydmga.webp",
    ],
    is_active: true,
    featured: true,
    badge: "LATEST",
    inventory_quantity: 125,
    price_aud: 34.5,
    price_inr: 899,
    price_usd: 0,
    mrp_aud: 40,
    mrp_inr: 1299,
    inventory_quantity_india: 0,
    inventory_quantity_australia: 125,
    is_active_india: true,
    is_active_australia: true,
    sku_india: "S5-INR-01",
    sku_australia: "S5-AUD-01",
  },
];

export function useProducts() {
  const { selectedCountry } = useCountry();
  const [products, setProducts] = useState<DBProduct[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_prices(*)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[useProducts] Fetch error (using fallback):", error.message);
        return;
      }

      if (data && isMountedRef.current) {
        const mapped: DBProduct[] = data.map((p: any) => {
          const prices = Array.isArray(p.product_prices)
            ? p.product_prices[0]
            : p.product_prices || {};

          const isIndia = selectedCountry === "india";
          const inventory_quantity = isIndia
            ? p.inventory_quantity ?? 0
            : p.inventory_quantity_australia ?? 0;
          const is_active = isIndia
            ? p.is_active_india ?? true
            : p.is_active_australia ?? true;

          const price_aud = Number(prices.price_aud) || 0;
          const price_inr = Number(prices.price_inr) || 0;

          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            category: p.category,
            ingredients: p.ingredients,
            how_to_use: p.how_to_use,
            key_ingredients: p.key_ingredients || [],
            size: p.size,
            images: p.images || [],
            is_active,
            featured: p.featured,
            badge: p.badge,
            inventory_quantity,
            price_aud,
            price_inr,
            price_usd: Number(prices.price_usd) || 0,
            mrp_aud:
              prices.mrp_aud !== undefined && prices.mrp_aud !== null
                ? Number(prices.mrp_aud)
                : price_aud,
            mrp_inr:
              prices.mrp_inr !== undefined && prices.mrp_inr !== null
                ? Number(prices.mrp_inr)
                : price_inr,
            inventory_quantity_india: p.inventory_quantity ?? 0,
            inventory_quantity_australia: p.inventory_quantity_australia ?? 0,
            is_active_india: p.is_active_india ?? true,
            is_active_australia: p.is_active_australia ?? true,
            sku_india: p.sku_india || "",
            sku_australia: p.sku_australia || "",
          };
        });

        // Filter active products for current country
        const activeOnly = mapped.filter((p) => p.is_active);
        if (activeOnly.length > 0) {
          setProducts(activeOnly);
        }
      }
    } catch (err) {
      console.warn("[useProducts] Unexpected error in fetchProducts:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProducts();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
}

export function useProduct(slug: string) {
  const { selectedCountry } = useCountry();

  const getInitialProduct = useCallback((targetSlug: string): DBProduct | null => {
    if (!targetSlug) return null;
    const lower = targetSlug.toLowerCase();
    const found = INITIAL_PRODUCTS.find(
      (p) =>
        p.slug.toLowerCase() === lower ||
        p.id.toLowerCase() === lower ||
        (lower.includes("follicle") && p.slug.includes("follicle")) ||
        (lower.includes("scalp") && p.slug.includes("scalp"))
    );
    return found || null;
  }, []);

  const [product, setProduct] = useState<DBProduct | null>(() => getInitialProduct(slug));
  const [loading, setLoading] = useState<boolean>(() => !getInitialProduct(slug));
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    const initial = getInitialProduct(slug);
    if (initial) {
      setProduct(initial);
      setLoading(false);
    } else {
      setLoading(true);
    }

    supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isMountedRef.current) return;
        if (error) {
          console.warn("[useProduct] Fetch error for slug:", slug, error.message);
          return;
        }

        if (data) {
          const prices = Array.isArray((data as any).product_prices)
            ? (data as any).product_prices[0]
            : (data as any).product_prices || {};

          const isIndia = selectedCountry === "india";
          const inventory_quantity = isIndia
            ? data.inventory_quantity ?? 0
            : data.inventory_quantity_australia ?? 0;
          const is_active = isIndia
            ? data.is_active_india ?? true
            : data.is_active_australia ?? true;

          const price_aud = Number(prices.price_aud) || 0;
          const price_inr = Number(prices.price_inr) || 0;

          setProduct({
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            category: data.category,
            ingredients: data.ingredients,
            how_to_use: data.how_to_use,
            key_ingredients: data.key_ingredients || [],
            size: data.size,
            images: data.images || [],
            is_active,
            featured: data.featured,
            badge: data.badge,
            inventory_quantity,
            price_aud,
            price_inr,
            price_usd: Number(prices.price_usd) || 0,
            mrp_aud:
              prices.mrp_aud !== undefined && prices.mrp_aud !== null
                ? Number(prices.mrp_aud)
                : price_aud,
            mrp_inr:
              prices.mrp_inr !== undefined && prices.mrp_inr !== null
                ? Number(prices.mrp_inr)
                : price_inr,
            inventory_quantity_india: data.inventory_quantity ?? 0,
            inventory_quantity_australia: data.inventory_quantity_australia ?? 0,
            is_active_india: data.is_active_india ?? true,
            is_active_australia: data.is_active_australia ?? true,
            sku_india: data.sku_india || "",
            sku_australia: data.sku_australia || "",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.warn("[useProduct] Catch error:", err);
          setLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [slug, selectedCountry, getInitialProduct]);

  return { product, loading };
}
