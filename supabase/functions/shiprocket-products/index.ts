import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getCollectionId(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  return 300000 + (Math.abs(hash) % 100000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const collectionIdParam = url.searchParams.get("collection_id");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = (page - 1) * limit;

    let matchedCategory: string | null = null;
    if (collectionIdParam) {
      const targetCollectionId = parseInt(collectionIdParam, 10);
      if (!isNaN(targetCollectionId)) {
        // Fetch all active products in India to find categories
        const { data: allProducts, error: listError } = await supabase
          .from("products")
          .select("category")
          .eq("is_active_india", true);

        if (listError) throw listError;

        const uniqueCategories = Array.from(new Set((allProducts || []).map((p: any) => p.category || "General")));
        matchedCategory = uniqueCategories.find((cat) => getCollectionId(cat) === targetCollectionId) || null;

        if (!matchedCategory) {
          // Return empty response since collection_id didn't match any category
          return new Response(
            JSON.stringify({
              data: {
                total: 0,
                products: []
              }
            }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
              }
            }
          );
        }
      }
    }

    // Get total count of active products for India
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active_india", true);

    if (matchedCategory) {
      if (matchedCategory === "General") {
        countQuery = countQuery.or("category.eq.General,category.is.null");
      } else {
        countQuery = countQuery.eq("category", matchedCategory);
      }
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Fetch the products with prices
    let productsQuery = supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("is_active_india", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchedCategory) {
      if (matchedCategory === "General") {
        productsQuery = productsQuery.or("category.eq.General,category.is.null");
      } else {
        productsQuery = productsQuery.eq("category", matchedCategory);
      }
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) throw productsError;

    const mappedProducts = (products || []).map((p: any) => {
      const prices = Array.isArray(p.product_prices)
        ? p.product_prices[0]
        : p.product_prices;

      const priceInr = Number(prices?.price_inr || prices?.india_price || 0);
      const compareAtPriceVal = (priceInr * 1.3).toFixed(2);
      
      const imageSrc = p.images && p.images.length > 0 ? p.images[0] : "";
      const sizeVal = p.size || "Default";
      const weightVal = Number(p.weight) || 0;
      const gramsVal = Math.round(weightVal * 1000);

      return {
        id: Number(p.shiprocket_product_id),
        title: p.name || "",
        body_html: p.description || "",
        vendor: "Scalvea",
        product_type: p.category || "Hair Care",
        created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
        handle: p.slug || "",
        updated_at: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString(),
        tags: p.category ? `${p.category}, Serum` : "Serum",
        status: "active",
        variants: [
          {
            id: Number(p.shiprocket_variant_id),
            title: "Default",
            price: priceInr.toFixed(2),
            compare_at_price: compareAtPriceVal,
            sku: p.sku || p.sku_india || `SCAL-${p.shiprocket_variant_id}`,
            quantity: Number(p.inventory_quantity ?? 0),
            created_at: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
            updated_at: p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString(),
            taxable: true,
            option_values: {
              Size: sizeVal
            },
            grams: gramsVal,
            image: {
              src: imageSrc
            },
            weight: gramsVal,
            weight_unit: "g"
          }
        ],
        image: {
          src: imageSrc
        },
        options: [
          {
            name: "Size",
            values: [sizeVal]
          }
        ]
      };
    });

    const responsePayload = {
      data: {
        total: count || 0,
        products: mappedProducts
      }
    };

    return new Response(
      JSON.stringify(responsePayload),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
