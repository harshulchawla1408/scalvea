/**
 * Shared Shiprocket Catalog Mapper
 *
 * Single source of truth for all product and collection payload mapping.
 * Used by:
 *   - shiprocket-products          (Catalog Pull API)
 *   - shiprocket-products-by-collection (Catalog Pull API)
 *   - shiprocket-collections        (Catalog Pull API)
 *   - shiprocket-catalog-sync       (Webhook Push)
 *
 * Keeping the mapper here prevents the webhook and API payloads from diverging.
 */

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface ShiprocketVariantPayload {
  id: number;
  title: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  /**
   * option_values MUST be a JSON OBJECT (LinkedHashMap<String, Object> on Shiprocket's Java backend).
   * e.g. { "Size": "30 mL / 1.01 fl oz" }
   * DO NOT use an array — Shiprocket's Jackson deserializer will throw
   * MismatchedInputException: Cannot deserialize LinkedHashMap from START_ARRAY.
   */
  option_values: Record<string, string>;
  grams: number;
  image: { src: string };
  weight: number;
  weight_unit: string;
}

export interface ShiprocketProductPayload {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  tags: string;
  status: string;
  variants: ShiprocketVariantPayload[];
  image: { src: string };
  options: { name: string; values: string[] }[];
}

export interface ShiprocketCollectionPayload {
  id: number;
  title: string;
  body_html: string;
  handle: string;
  image: { src: string };
  created_at: string;
  updated_at: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Generates a stable, deterministic numeric collection ID from a category string.
 * Must remain identical across all functions — never change this algorithm
 * without migrating all Shiprocket collection references simultaneously.
 */
export function getCollectionId(category: string): number {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash << 5) - hash + category.charCodeAt(i);
    hash |= 0;
  }
  return 300000 + (Math.abs(hash) % 100000);
}

/**
 * Converts a plain-text string into a URL-safe, SEO-friendly handle.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// ─── Product Mapper ───────────────────────────────────────────────────────────

/**
 * Maps a raw Supabase product row (with optional nested product_prices) to a
 * Shiprocket-compliant product payload.
 *
 * @param p        - Raw DB row from the `products` table (with product_prices joined).
 * @param overrides - Optional field overrides, e.g. { status: "archived" } for deletes.
 */
export function mapProductRow(
  p: any,
  overrides: Partial<ShiprocketProductPayload> = {}
): ShiprocketProductPayload {
  // Resolve the first price record whether it arrived as an array or a single object
  const prices = Array.isArray(p.product_prices)
    ? p.product_prices[0]
    : p.product_prices;

  // Price: numeric (not string), rounded to 2 decimal places
  const priceInr = parseFloat(
    Number(prices?.price_inr || prices?.india_price || 0).toFixed(2)
  );

  // compare_at_price: must be the MRP from DB. No MRP column exists → null per spec.
  const compareAtPrice: number | null = null;

  // Primary product image (first element of the images array)
  const imageSrc =
    Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "";

  // Size option value (e.g. "30ml", "Default")
  const sizeVal = p.size || "Default";

  // Weight: DB stores in kg; grams is the integer conversion
  const weightKg = parseFloat(Number(p.weight || 0).toFixed(3));
  const gramsVal = Math.round(weightKg * 1000);

  const now = new Date().toISOString();
  const createdAt = p.created_at ? new Date(p.created_at).toISOString() : now;
  const updatedAt = p.updated_at ? new Date(p.updated_at).toISOString() : now;

  const payload: ShiprocketProductPayload = {
    id: Number(p.shiprocket_product_id),
    title: p.name || "",
    body_html: p.description || "",
    vendor: "Scalvea",
    product_type: p.category || "Hair Care",
    created_at: createdAt,
    handle: p.slug || "",
    updated_at: updatedAt,
    tags: p.category ? `${p.category}, Serum` : "Serum",
    status: p.is_active_india ? "active" : "draft",
    variants: [
      {
        id: Number(p.shiprocket_variant_id),
        title: "Default",
        price: priceInr,
        compare_at_price: compareAtPrice,
        sku: p.sku || p.sku_india || `SCAL-${p.shiprocket_variant_id}`,
        quantity: Number(p.inventory_quantity ?? 0),
        created_at: createdAt,
        updated_at: updatedAt,
        taxable: true,
        // option_values MUST be a JSON OBJECT, not an array.
        // Shiprocket's catalog-service deserializes this as:
        //   LinkedHashMap<String, Object>
        // which requires JSON token START_OBJECT `{`, not START_ARRAY `[`.
        // Correct: { "Size": "30 mL / 1.01 fl oz" }
        // Wrong:  [{ "name": "Size", "value": "30 mL / 1.01 fl oz" }]
        option_values: { "Size": sizeVal },
        grams: gramsVal,
        image: { src: imageSrc },
        // weight in kg; weight_unit "kg"
        weight: weightKg,
        weight_unit: "kg",
      },
    ],
    image: { src: imageSrc },
    options: [{ name: "Size", values: [sizeVal] }],
  };

  // Apply caller-supplied overrides (e.g. status: "archived" for DELETE events)
  return { ...payload, ...overrides };
}

// ─── Shared Checkout Utilities ────────────────────────────────────────────────
// Used by: create-shiprocket-checkout-token, fetch-shiprocket-order,
//          shiprocket-order-webhook, shiprocket-order-list, shiprocket-refund

/**
 * Computes HMAC-SHA256 of `data` using `secret`.
 * Returns Base64 (default) or lowercase hex.
 *
 * Shiprocket header:
 *   X-Api-HMAC-SHA256: await generateHmacSha256(secretKey, JSON.stringify(payload))
 */
export async function generateHmacSha256(
  secret: string,
  data: string,
  encoding: "base64" | "hex" = "base64"
): Promise<string> {
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
  const u8 = new Uint8Array(signatureBuffer);
  if (encoding === "hex") {
    return Array.from(u8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

/**
 * Maps a Shiprocket order status to a local order_status value.
 * "completed" is a valid Shiprocket terminal state equivalent to "delivered".
 * "returned" maps to "cancelled" locally.
 */
export function mapOrderStatus(shiprocketStatus: string): string {
  const s = String(shiprocketStatus || "").toLowerCase().trim();
  if (s === "shipped") return "shipped";
  if (s === "delivered" || s === "completed") return "delivered";
  if (s === "cancelled" || s === "returned" || s === "failed") return "cancelled";
  return "processing";
}

/**
 * Maps raw Shiprocket payment_type / payment_method to a local payment method enum.
 */
export function mapPaymentMethod(rawPaymentType: string): string {
  const clean = String(rawPaymentType || "").toLowerCase().trim();
  if (clean.includes("upi")) return "shiprocket_upi";
  if (clean.includes("card") || clean.includes("visa") || clean.includes("mastercard"))
    return "shiprocket_card";
  if (clean.includes("cod") || clean.includes("cash") || clean.includes("delivery"))
    return "shiprocket_cod";
  if (clean.includes("bnpl") || clean.includes("emi") || clean.includes("lazy") || clean.includes("paylater"))
    return "shiprocket_bnpl";
  if (clean.includes("stripe")) return "stripe";
  return "shiprocket_cod";
}

/**
 * Resolves a local product record from a Shiprocket variant_id string.
 * Tries 5 lookup strategies in order of specificity.
 */
export async function findProductIdByVariantId(supabase: any, variantId: string) {
  if (!variantId) return null;

  if (/^\d+$/.test(variantId)) {
    const { data } = await supabase
      .from("products")
      .select("id, name, inventory_quantity")
      .eq("shiprocket_variant_id", Number(variantId))
      .maybeSingle();
    if (data) return data;
  }

  let { data } = await supabase
    .from("products")
    .select("id, name, inventory_quantity")
    .eq("sku_india", variantId)
    .maybeSingle();
  if (data) return data;

  ({ data } = await supabase
    .from("products")
    .select("id, name, inventory_quantity")
    .eq("sku", variantId)
    .maybeSingle());
  if (data) return data;

  // ── UUID match ──────────────────────────────────────────────────────────────
  if (variantId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    ({ data } = await supabase
      .from("products")
      .select("id, name, inventory_quantity")
      .eq("id", variantId)
      .maybeSingle());
    if (data) return data;
  }

  // ── No match found ───────────────────────────────────────────────────────────
  // IMPORTANT: Do NOT fall back to the first active India product.
  // A fallback would silently assign the wrong product to an order item,
  // causing incorrect inventory deduction. Return null and let the caller
  // decide whether to log a warning or skip the item.
  console.warn(`findProductIdByVariantId: No product found for variant_id="${variantId}". Returning null.`);
  return null;
}

/**
 * Sends order confirmation email to customer and notification to admin via Resend.
 * Silently skips if RESEND_API_KEY is not configured.
 */
export async function sendOrderEmails(supabase: any, order: any, orderItems: any[]) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email notifications.");
    return;
  }

  const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
  const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@scalvea.com";
  let emailToUse = order.shipping_address?.email;

  if (!emailToUse && order.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .maybeSingle();
    if (profile?.email) emailToUse = profile.email;
  }

  if (!emailToUse) {
    console.warn("No customer email found for order:", order.order_number);
    return;
  }

  const currencySymbol = order.currency === "INR" ? "₹" : "A$";
  const formattedItems = orderItems
    .map((item) => `<li>${item.product_name} x ${item.quantity} - ${currencySymbol}${Number(item.price * item.quantity).toFixed(2)}</li>`)
    .join("");

  const emailHtml = `
    <h1>Thank you for your order!</h1>
    <p>Your order <strong>${order.order_number}</strong> has been received and is being processed.</p>
    <h2>Order Summary</h2>
    <ul>${formattedItems}</ul>
    <p><strong>Subtotal:</strong> ${currencySymbol}${Number(order.subtotal).toFixed(2)}</p>
    <p><strong>Tax:</strong> ${currencySymbol}${Number(order.tax_amount).toFixed(2)}</p>
    <p><strong>Shipping:</strong> ${currencySymbol}${Number(order.shipping_amount).toFixed(2)}</p>
    ${order.discount_amount > 0 ? `<p><strong>Discount:</strong> -${currencySymbol}${Number(order.discount_amount).toFixed(2)}</p>` : ""}
    <p><strong>Total:</strong> ${currencySymbol}${Number(order.total_amount).toFixed(2)}</p>
    <p><strong>Delivery Estimate:</strong> ${order.delivery_estimate || "3-5 business days"}</p>
  `;

  const adminHtml = `
    <h1>New Order Received</h1>
    <p>Order Number: <strong>${order.order_number}</strong></p>
    <p>Customer: ${order.shipping_address?.firstName || order.shipping_address?.first_name || ""} ${order.shipping_address?.lastName || order.shipping_address?.last_name || ""}</p>
    <p>Email: ${emailToUse}</p>
    <p>Market: ${order.market || order.country}</p>
    <h2>Order Items</h2>
    <ul>${formattedItems}</ul>
    <p><strong>Total Amount:</strong> ${currencySymbol}${Number(order.total_amount).toFixed(2)}</p>
  `;

  try {
    const customerRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: senderEmail, to: emailToUse, subject: `Order Confirmation - ${order.order_number}`, html: emailHtml }),
    });
    if (!customerRes.ok) console.error("Failed to send customer email:", await customerRes.text());

    const adminRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: senderEmail, to: adminEmail, subject: `[New Order] ${order.order_number} - ${order.market || order.country}`, html: adminHtml }),
    });
    if (!adminRes.ok) console.error("Failed to send admin email:", await adminRes.text());
  } catch (error) {
    console.error("Error sending order emails:", error);
  }
}

// ─── Shared Webhook Delivery (used by shiprocket-catalog-resync) ──────────────
// shiprocket-catalog-sync defines its own local variant with signature:
//   (url, payloadString, apiKey, secretKey) → ...
// This exported version uses the simplified signature expected by catalog-resync:
//   (apiKey, secretKey, type, payload, supabase) → { success, response?, error? }

/**
 * Posts a signed product or collection webhook to Shiprocket with retry logic.
 *
 * @param apiKey    - SHIPROCKET_API_KEY env var
 * @param secretKey - SHIPROCKET_SECRET_KEY env var
 * @param type      - "product" | "collection"
 * @param payload   - The product/collection payload object (serialized internally)
 * @param supabase  - Supabase client for writing to shiprocket_webhook_logs
 */
export async function postWebhookWithRetries(
  apiKey: string,
  secretKey: string,
  type: "product" | "collection",
  payload: Record<string, unknown>,
  supabase: any
): Promise<{ success: boolean; response?: string; error?: string }> {
  const WEBHOOK_URLS: Record<string, string> = {
    product: "https://checkout-api.shiprocket.com/wh/v1/custom/product",
    collection: "https://checkout-api.shiprocket.com/wh/v1/custom/collection",
  };

  const url = WEBHOOK_URLS[type];
  const payloadString = JSON.stringify(payload);
  // Sign the EXACT body that will be sent — HMAC must match the transmitted bytes
  const signature = await generateHmacSha256(secretKey, payloadString);

  const maxAttempts = 3;
  let attempts = 0;
  let lastResponseText = "";

  while (attempts < maxAttempts) {
    attempts++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(url, {
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
      lastResponseText = await res.text();

      if (res.status === 511) {
        const errMsg = `511 Invalid authentication — verify SHIPROCKET_API_KEY and SHIPROCKET_SECRET_KEY. Response: ${lastResponseText}`;
        await supabase.from("shiprocket_webhook_logs").insert({
          webhook_type: type,
          payload,
          response: errMsg,
          status: "auth_failure",
          attempts,
        }).catch(() => {});
        return { success: false, error: errMsg };
      }

      if (res.ok) {
        let isSuccess = false;
        try {
          const resJson = JSON.parse(lastResponseText);
          if (resJson.ok === true && resJson.result === true) isSuccess = true;
        } catch {
          if (lastResponseText.includes("true")) isSuccess = true;
        }
        if (isSuccess) {
          await supabase.from("shiprocket_webhook_logs").insert({
            webhook_type: type,
            payload,
            response: lastResponseText,
            status: "success",
            attempts,
          }).catch(() => {});
          return { success: true, response: lastResponseText };
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastResponseText = err.name === "AbortError"
        ? `Timed out after 10s (attempt ${attempts})`
        : String(err.message);
    }

    if (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, attempts * 2000));
    }
  }

  await supabase.from("shiprocket_webhook_logs").insert({
    webhook_type: type,
    payload,
    response: lastResponseText,
    status: "failed",
    attempts,
  }).catch(() => {});

  return { success: false, error: lastResponseText };
}
