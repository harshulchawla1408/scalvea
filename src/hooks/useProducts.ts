import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
}

export function useProducts() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped = data.map((p: any) => {
        const prices = Array.isArray(p.product_prices) ? p.product_prices[0] : p.product_prices || {};
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
          is_active: p.is_active,
          featured: p.featured,
          badge: p.badge,
          inventory_quantity: p.inventory_quantity,
          price_aud: Number(prices.price_aud) || 0,
          price_inr: Number(prices.price_inr) || 0,
          price_usd: Number(prices.price_usd) || 0,
        };
      });
      setProducts(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, refetch: fetchProducts };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) {
          const prices = Array.isArray((data as any).product_prices) ? (data as any).product_prices[0] : (data as any).product_prices || {};
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
            is_active: data.is_active,
            featured: data.featured,
            badge: data.badge,
            inventory_quantity: data.inventory_quantity,
            price_aud: Number(prices.price_aud) || 0,
            price_inr: Number(prices.price_inr) || 0,
            price_usd: Number(prices.price_usd) || 0,
          });
        }
        setLoading(false);
      });
  }, [slug]);

  return { product, loading };
}
