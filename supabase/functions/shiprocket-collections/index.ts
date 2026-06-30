import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

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
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const offset = (page - 1) * limit;

    // Fetch active products for India to group into collections
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("category, created_at, updated_at, images")
      .eq("is_active_india", true);

    if (productsError) throw productsError;

    const groups: { [key: string]: { category: string; created_at: string; updated_at: string; imageSrc: string } } = {};

    for (const p of (products || [])) {
      const cat = p.category || "General";
      const pImage = p.images && p.images.length > 0 ? p.images[0] : "";

      if (!groups[cat]) {
        groups[cat] = {
          category: cat,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
          imageSrc: pImage
        };
      } else {
        if (p.created_at && new Date(p.created_at) < new Date(groups[cat].created_at)) {
          groups[cat].created_at = p.created_at;
        }
        if (p.updated_at && new Date(p.updated_at) > new Date(groups[cat].updated_at)) {
          groups[cat].updated_at = p.updated_at;
        }
        if (!groups[cat].imageSrc && pImage) {
          groups[cat].imageSrc = pImage;
        }
      }
    }

    const collectionsList = Object.values(groups).map((g) => {
      return {
        id: getCollectionId(g.category),
        updated_at: new Date(g.updated_at).toISOString(),
        body_html: `${g.category} Products`,
        handle: slugify(g.category),
        image: {
          src: g.imageSrc || ""
        },
        title: g.category,
        created_at: new Date(g.created_at).toISOString()
      };
    });

    const total = collectionsList.length;
    const paginatedCollections = collectionsList.slice(offset, offset + limit);

    const responsePayload = {
      data: {
        total: total,
        collections: paginatedCollections
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
