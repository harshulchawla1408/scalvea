/**
 * shiprocket-catalog-resync
 *
 * Admin-only endpoint to force-push all active India products to Shiprocket's
 * Product Update Webhook. This ensures every product in the Scalvea catalog
 * is present in Shiprocket's checkout catalog.
 *
 * Usage:
 *   POST https://<project>.supabase.co/functions/v1/shiprocket-catalog-resync
 *   Authorization: Bearer <SUPABASE_ADMIN_TOKEN>
 *   Body: {} (empty)
 *
 * Returns:
 *   { success: true, synced: number, failed: number, results: [...] }
 *
 * Idempotent — safe to run multiple times. Shiprocket's Product Update Webhook
 * creates or updates the product based on the product_id field.
 *
 * This is the ONLY path to force Shiprocket to ingest new or updated products
 * if the automatic DB trigger failed (e.g., due to the payload schema bug that
 * was present before migration 20260719000000_fix_catalog_trigger_schema.sql).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { mapProductRow, postWebhookWithRetries } from "../_shared/shiprocket-mapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const apiKey = Deno.env.get("SHIPROCKET_API_KEY") || "";
  const secretKey = Deno.env.get("SHIPROCKET_SECRET_KEY") || "";

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!apiKey || !secretKey) {
    return new Response(
      JSON.stringify({ error: "Missing Shiprocket credentials" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Admin check ─────────────────────────────────────────────────────────────
  // Verify the caller is an authenticated admin.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || serviceKey);
  const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: valid authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(
      JSON.stringify({ error: "Forbidden: admin role required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Fetch all active India products ─────────────────────────────────────────
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select(`
      id, name, slug, description, category, images, sku, sku_india, size, weight,
      shiprocket_product_id, shiprocket_variant_id,
      is_active_india, inventory_quantity,
      created_at, updated_at,
      product_prices(price_inr, india_price)
    `)
    .eq("is_active_india", true)
    .not("shiprocket_product_id", "is", null)
    .not("shiprocket_variant_id", "is", null)
    .order("created_at", { ascending: true });


  if (fetchError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch products", detail: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: "No active India products with Shiprocket IDs found", synced: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Starting catalog resync for ${products.length} product(s)...`);

  const results = [];
  let synced = 0;
  let failed = 0;

  for (const product of products) {
    try {
      // Build the product webhook payload using the shared mapper
      const productPayload = mapProductRow(product);

      // Invoke the Shiprocket Product Update Webhook
      const result = await postWebhookWithRetries(
        apiKey,
        secretKey,
        "product",
        productPayload,
        supabase
      );

      if (result.success) {
        synced++;
        console.log(`✓ Synced: ${product.name} (variant_id=${product.shiprocket_variant_id})`);
        results.push({
          product_id: product.id,
          name: product.name,
          shiprocket_product_id: product.shiprocket_product_id,
          shiprocket_variant_id: product.shiprocket_variant_id,
          status: "synced",
          response: result.response
        });
      } else {
        failed++;
        console.error(`✗ Failed: ${product.name} — ${result.error}`);
        results.push({
          product_id: product.id,
          name: product.name,
          shiprocket_product_id: product.shiprocket_product_id,
          shiprocket_variant_id: product.shiprocket_variant_id,
          status: "failed",
          error: result.error
        });
      }
    } catch (err: any) {
      failed++;
      console.error(`✗ Exception for ${product.name}:`, err.message);
      results.push({
        product_id: product.id,
        name: product.name,
        shiprocket_product_id: product.shiprocket_product_id,
        shiprocket_variant_id: product.shiprocket_variant_id,
        status: "exception",
        error: err.message
      });
    }

    // Small delay between requests to avoid Shiprocket rate limiting
    if (products.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return new Response(
    JSON.stringify({
      success: failed === 0,
      total: products.length,
      synced,
      failed,
      results
    }),
    {
      status: failed === products.length ? 500 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
});
