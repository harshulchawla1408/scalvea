import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { mapProductRow, getCollectionId } from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const collectionIdParam = url.searchParams.get("collection_id");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = (page - 1) * limit;

    if (!collectionIdParam) {
      return new Response(
        JSON.stringify({ error: "Missing collection_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetCollectionId = parseInt(collectionIdParam, 10);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve the category that matches this collection ID
    const { data: allProducts, error: listError } = await supabase
      .from("products")
      .select("category")
      .eq("is_active_india", true);

    if (listError) throw listError;

    const uniqueCategories = Array.from(
      new Set((allProducts || []).map((p: any) => p.category || "General"))
    );
    const matchedCategory = uniqueCategories.find(
      (cat) => getCollectionId(cat) === targetCollectionId
    );

    if (!matchedCategory) {
      return new Response(
        JSON.stringify({ data: { total: 0, products: [] } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Total count for pagination
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active_india", true);

    if (matchedCategory === "General") {
      countQuery = countQuery.or("category.eq.General,category.is.null");
    } else {
      countQuery = countQuery.eq("category", matchedCategory);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Fetch products with prices (single query — no N+1)
    let productsQuery = supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("is_active_india", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchedCategory === "General") {
      productsQuery = productsQuery.or("category.eq.General,category.is.null");
    } else {
      productsQuery = productsQuery.eq("category", matchedCategory);
    }

    const { data: products, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    // Use shared mapper — same output as the webhook payload
    const mappedProducts = (products || []).map((p: any) => mapProductRow(p));

    return new Response(
      JSON.stringify({ data: { total: count || 0, products: mappedProducts } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
