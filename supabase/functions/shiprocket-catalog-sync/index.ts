import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { mapProductRow, getCollectionId, slugify } from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── HMAC Signature ───────────────────────────────────────────────────────────

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

// ─── Webhook Delivery ─────────────────────────────────────────────────────────

/**
 * Posts a signed webhook payload to a Shiprocket endpoint with retry logic.
 *
 * Authentication:
 *   X-Api-Key          → SHIPROCKET_API_KEY
 *   X-Api-HMAC-SHA256  → Base64(HMAC_SHA256(requestBody, SHIPROCKET_SECRET_KEY))
 *
 * Error handling:
 *   - 511 Invalid authentication: stops immediately, no retry (wrong creds won't fix themselves).
 *   - Network / timeout failures: retried up to maxAttempts with exponential back-off.
 *   - Each fetch is guarded by a 10-second AbortController timeout.
 */
async function postWebhookWithRetries(
  url: string,
  payloadString: string,
  apiKey: string,
  secretKey: string
): Promise<{ success: boolean; attempts: number; responseText: string; statusCode?: number }> {
  const signature = await generateHmacBase64(secretKey, payloadString);
  let attempts = 0;
  const maxAttempts = 3;
  let success = false;
  let responseText = "";
  let statusCode: number | undefined;

  while (attempts < maxAttempts && !success) {
    attempts++;

    // 10-second fetch timeout per attempt
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
          "X-Api-HMAC-SHA256": signature,
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      statusCode = response.status;
      responseText = await response.text();

      // 511 = Invalid authentication — retrying with wrong credentials is pointless
      if (response.status === 511) {
        responseText = `511 Invalid authentication — verify SHIPROCKET_API_KEY and SHIPROCKET_SECRET_KEY. Server response: ${responseText}`;
        break; // exit retry loop immediately
      }

      if (response.ok) {
        try {
          const resJson = JSON.parse(responseText);
          if (resJson.ok === true && resJson.result === true) {
            success = true;
          }
        } catch (_) {
          // If JSON parse fails but status is 200, accept as success if body contains "true"
          if (responseText.includes("true")) {
            success = true;
          }
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        responseText = `Request timed out after 10s (attempt ${attempts})`;
      } else {
        responseText = err.message;
      }
    }

    // Back-off before next retry (skip on final attempt or after 511 break)
    if (!success && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempts * 2000));
    }
  }

  return { success, attempts, responseText, statusCode };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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
    const { type, table, record, old_record } = body;
    const targetRecord = record || old_record;

    if (!targetRecord) {
      return new Response(JSON.stringify({ error: "Missing record payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE path ─────────────────────────────────────────────────────────────
    // When a product is deleted, the OLD row arrives via record. We cannot re-fetch
    // from the DB (the row is gone). Build the payload directly from the record and
    // override status to "archived". Skip the collection webhook — the collection
    // may still contain other products.
    if (type === "DELETE") {
      const archivedPayload = mapProductRow(
        { ...targetRecord, product_prices: [] }, // no prices available for deleted rows
        { status: "archived" }             // override — marks product as unavailable
      );

      const productUrl = "https://checkout-api.shiprocket.com/wh/v1/custom/product";
      const productPayloadString = JSON.stringify(archivedPayload);
      const productResult = await postWebhookWithRetries(productUrl, productPayloadString, apiKey, secretKey);

      await supabase.from("shiprocket_webhook_logs").insert({
        webhook_type: "product_delete",
        payload: archivedPayload,
        response: productResult.responseText,
        status: productResult.statusCode === 511
          ? "auth_failure"
          : productResult.success
          ? "success"
          : "failed",
        attempts: productResult.attempts,
      });

      return new Response(
        JSON.stringify({
          success: true,
          product_delete_sync: {
            success: productResult.success,
            attempts: productResult.attempts,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── INSERT / UPDATE path ─────────────────────────────────────────────────────
    // Determine target product ID (price-change events carry product_id on the price row)
    let productId = targetRecord.id;
    if (table === "product_prices" && targetRecord.product_id) {
      productId = targetRecord.product_id;
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

    // ── Build product payload via shared mapper ───────────────────────────────
    const productPayload = mapProductRow(product);

    // ── Build collection payload ──────────────────────────────────────────────
    const category = product.category || "General";

    // Fetch category siblings to derive the collection's representative image and timestamps
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

    const collectionUpdatedAt =
      catProducts && catProducts.length > 0
        ? new Date(
            Math.max(
              ...catProducts.map((p) => new Date(p.updated_at || "").getTime())
            )
          ).toISOString()
        : new Date(product.updated_at || "").toISOString();

    const collectionCreatedAt =
      catProducts && catProducts.length > 0
        ? new Date(
            Math.min(
              ...catProducts.map((p) => new Date(p.created_at || "").getTime())
            )
          ).toISOString()
        : new Date(product.created_at || "").toISOString();

    const collectionImageSrc =
      catProducts?.find((p) => Array.isArray(p.images) && p.images.length > 0)
        ?.images[0] ||
      product.images?.[0] ||
      "";

    const collectionPayload = {
      id: collectionId,
      title: category,
      body_html: `${category} Products`,
      handle: slugify(category),
      image: { src: collectionImageSrc },
      created_at: collectionCreatedAt,
      updated_at: collectionUpdatedAt,
    };

    // ── Send Product Webhook ──────────────────────────────────────────────────
    const productUrl = "https://checkout-api.shiprocket.com/wh/v1/custom/product";
    const productPayloadString = JSON.stringify(productPayload);
    const productResult = await postWebhookWithRetries(productUrl, productPayloadString, apiKey, secretKey);

    await supabase.from("shiprocket_webhook_logs").insert({
      webhook_type: "product",
      payload: productPayload,
      response: productResult.responseText,
      status: productResult.statusCode === 511
        ? "auth_failure"
        : productResult.success
        ? "success"
        : "failed",
      attempts: productResult.attempts,
    });

    // ── Send Collection Webhook ───────────────────────────────────────────────
    const collectionUrl = "https://checkout-api.shiprocket.com/wh/v1/custom/collection";
    const collectionPayloadString = JSON.stringify(collectionPayload);
    const collectionResult = await postWebhookWithRetries(collectionUrl, collectionPayloadString, apiKey, secretKey);

    await supabase.from("shiprocket_webhook_logs").insert({
      webhook_type: "collection",
      payload: collectionPayload,
      response: collectionResult.responseText,
      status: collectionResult.statusCode === 511
        ? "auth_failure"
        : collectionResult.success
        ? "success"
        : "failed",
      attempts: collectionResult.attempts,
    });

    return new Response(
      JSON.stringify({
        success: true,
        product_sync: {
          success: productResult.success,
          attempts: productResult.attempts,
        },
        collection_sync: {
          success: collectionResult.success,
          attempts: collectionResult.attempts,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
