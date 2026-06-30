import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

async function generateHmacBase64(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return base64Encode(new Uint8Array(signatureBuffer));
}

async function postWebhookWithRetries(
  url: string,
  payloadString: string,
  apiKey: string,
  secretKey: string
): Promise<{ success: boolean; attempts: number; responseText: string }> {
  const signature = await generateHmacBase64(secretKey, payloadString);
  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let responseText = "";

  while (attempts < maxAttempts && !success) {
    attempts++;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Api-HMAC-SHA256": signature,
        },
        body: payloadString,
      });

      responseText = await response.text();
      if (response.ok) {
        try {
          const resJson = JSON.parse(responseText);
          if (resJson.ok === true && resJson.result === true) {
            success = true;
          }
        } catch (_) {
          // If JSON parse fails but status is 200, check if we got raw true/ok
          if (responseText.includes("true")) {
            success = true;
          }
        }
      }
    } catch (err: any) {
      responseText = err.message;
    }

    if (!success && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempts * 2000));
    }
  }

  return { success, attempts, responseText };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const apiKey = Deno.env.get("SHIPROCKET_API_KEY");
    const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY");

    if (!apiKey || !secretKey || apiKey === "mock_key" || secretKey === "mock_secret") {
      return new Response(JSON.stringify({ error: "Missing or invalid Shiprocket credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, record } = body;

    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine target product ID
    let productId = record.id;
    if (type === "price" && record.product_id) {
      productId = record.product_id;
    }

    // Fetch full product details with prices
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("id", productId)
      .maybeSingle();

    if (productError) throw productError;

    if (!product) {
      return new Response(
        JSON.stringify({ error: `Product not found: ${productId}` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare Product Payload
    const prices = Array.isArray(product.product_prices)
      ? product.product_prices[0]
      : product.product_prices;

    const priceInr = Number(prices?.price_inr || prices?.india_price || 0);
    const compareAtPriceVal = (priceInr * 1.3).toFixed(2);
    
    const imageSrc = product.images && product.images.length > 0 ? product.images[0] : "";
    const sizeVal = product.size || "Default";
    const weightVal = Number(product.weight) || 0;
    const gramsVal = Math.round(weightVal * 1000);

    const productPayload = {
      id: Number(product.shiprocket_product_id),
      title: product.name || "",
      body_html: product.description || "",
      vendor: "Scalvea",
      product_type: product.category || "Hair Care",
      created_at: product.created_at ? new Date(product.created_at).toISOString() : new Date().toISOString(),
      handle: product.slug || "",
      updated_at: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
      tags: product.category ? `${product.category}, Serum` : "Serum",
      status: product.is_active_india ? "active" : "draft",
      variants: [
        {
          id: Number(product.shiprocket_variant_id),
          title: "Default",
          price: priceInr.toFixed(2),
          compare_at_price: compareAtPriceVal,
          sku: product.sku || product.sku_india || `SCAL-${product.shiprocket_variant_id}`,
          quantity: Number(product.inventory_quantity ?? 0),
          created_at: product.created_at ? new Date(product.created_at).toISOString() : new Date().toISOString(),
          updated_at: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
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

    // Prepare Collection Payload
    const category = product.category || "General";
    
    // Fetch all active products in this category to calculate collection dates and image
    let catQuery = supabase
      .from("products")
      .select("created_at, updated_at, images")
      .eq("is_active_india", true);
      
    if (product.category) {
      catQuery = catQuery.eq("category", product.category);
    } else {
      catQuery = catQuery.is("category", null);
    }
    
    const { data: catProducts } = await catQuery;

    const collectionId = getCollectionId(category);
    const collectionUpdatedAt = catProducts && catProducts.length > 0 
      ? new Date(Math.max(...catProducts.map(p => new Date(p.updated_at || "").getTime()))).toISOString()
      : new Date(product.updated_at || "").toISOString();
      
    const collectionCreatedAt = catProducts && catProducts.length > 0 
      ? new Date(Math.min(...catProducts.map(p => new Date(p.created_at || "").getTime()))).toISOString()
      : new Date(product.created_at || "").toISOString();

    const collectionImageSrc = catProducts?.find(p => p.images && p.images.length > 0)?.images[0] || product.images?.[0] || "";

    const collectionPayload = {
      id: collectionId,
      updated_at: collectionUpdatedAt,
      body_html: `${category} Products`,
      handle: slugify(category),
      image: {
        src: collectionImageSrc
      },
      title: category,
      created_at: collectionCreatedAt
    };

    // 1. Sync Product Webhook
    const productUrl = "https://checkout-api.shiprocket.com/wh/v1/custom/product";
    const productPayloadString = JSON.stringify(productPayload);
    const productResult = await postWebhookWithRetries(productUrl, productPayloadString, apiKey, secretKey);

    await supabase.from("shiprocket_webhook_logs").insert({
      webhook_type: "product",
      payload: productPayload,
      response: productResult.responseText,
      status: productResult.success ? "success" : "failed",
      attempts: productResult.attempts
    });

    // 2. Sync Collection Webhook
    const collectionUrl = "https://checkout-api.shiprocket.com/wh/v1/custom/collection";
    const collectionPayloadString = JSON.stringify(collectionPayload);
    const collectionResult = await postWebhookWithRetries(collectionUrl, collectionPayloadString, apiKey, secretKey);

    await supabase.from("shiprocket_webhook_logs").insert({
      webhook_type: "collection",
      payload: collectionPayload,
      response: collectionResult.responseText,
      status: collectionResult.success ? "success" : "failed",
      attempts: collectionResult.attempts
    });

    return new Response(
      JSON.stringify({
        success: true,
        product_sync: { success: productResult.success, attempts: productResult.attempts },
        collection_sync: { success: collectionResult.success, attempts: collectionResult.attempts }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
