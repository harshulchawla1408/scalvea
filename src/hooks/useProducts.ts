import { useEffect, useState } from "react";
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
  price_aud: number;
  price_inr: number;
  price_usd: number;
  // Raw fields for admin dashboard use
  inventory_quantity_india?: number;
  inventory_quantity_australia?: number;
  is_active_india?: boolean;
  is_active_australia?: boolean;
  sku_india?: string | null;
  sku_australia?: string | null;
}

export function useProducts() {
  const { selectedCountry } = useCountry();
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .order("created_at", { ascending: false });

    if (data) {
      const mapped = data.map((p: any) => {
        const prices = Array.isArray(p.product_prices) ? p.product_prices[0] : p.product_prices || {};
        
        const isIndia = selectedCountry === "india";
        const inventory_quantity = isIndia 
          ? (p.inventory_quantity_india ?? 0) 
          : (p.inventory_quantity_australia ?? 0);
        const is_active = isIndia 
          ? (p.is_active_india ?? true) 
          : (p.is_active_australia ?? true);

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
          price_aud: Number(prices.price_aud) || 0,
          price_inr: Number(prices.price_inr) || 0,
          price_usd: Number(prices.price_usd) || 0,
          inventory_quantity_india: p.inventory_quantity_india ?? 0,
          inventory_quantity_australia: p.inventory_quantity_australia ?? 0,
          is_active_india: p.is_active_india ?? true,
          is_active_australia: p.is_active_australia ?? true,
          sku_india: p.sku_india || "",
          sku_australia: p.sku_australia || "",
        };
      });
      // Return only the products that are active for the current country
      setProducts(mapped.filter(p => p.is_active));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCountry]);

  return { products, loading, refetch: fetchProducts };
}

export function useProduct(slug: string) {
  const { selectedCountry } = useCountry();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const prices = Array.isArray((data as any).product_prices) ? (data as any).product_prices[0] : (data as any).product_prices || {};
          
          const isIndia = selectedCountry === "india";
          const inventory_quantity = isIndia 
            ? (data.inventory_quantity_india ?? 0) 
            : (data.inventory_quantity_australia ?? 0);
          const is_active = isIndia 
            ? (data.is_active_india ?? true) 
            : (data.is_active_australia ?? true);

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
            price_aud: Number(prices.price_aud) || 0,
            price_inr: Number(prices.price_inr) || 0,
            price_usd: Number(prices.price_usd) || 0,
            inventory_quantity_india: data.inventory_quantity_india ?? 0,
            inventory_quantity_australia: data.inventory_quantity_australia ?? 0,
            is_active_india: data.is_active_india ?? true,
            is_active_australia: data.is_active_australia ?? true,
            sku_india: data.sku_india || "",
            sku_australia: data.sku_australia || "",
          });
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [slug, selectedCountry]);

  return { product, loading };
}
