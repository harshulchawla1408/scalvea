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
 * Enhanced to include payment method, EDD, billing address, and GST.
 * Silently skips if RESEND_API_KEY is not configured.
 */
export async function sendOrderEmails(supabase: any, order: any, orderItems: any[]) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not configured. Skipping email notifications.");
    return;
  }

  const senderEmail = Deno.env.get("SENDER_EMAIL") || "onboarding@resend.dev";
  const adminEmail  = Deno.env.get("ADMIN_EMAIL")  || "admin@scalvea.com";
  let emailToUse    = order.shipping_address?.email || order.customer_email;

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

  const isIndia   = order.currency === "INR";
  const formatAmt = (v: number) => isIndia
    ? `&#8377;${Math.round(v || 0).toLocaleString("en-IN")}`
    : `A$${Number(v || 0).toFixed(2)}`;

  const addr    = order.shipping_address || {};
  const billing = order.billing_address  || addr;

  const addrLine = [addr.address || addr.address_line1, addr.city, addr.state, addr.postcode, addr.country].filter(Boolean).join(", ");
  const billLine = [billing.address_line1 || billing.address, billing.city, billing.state, billing.postcode, billing.country].filter(Boolean).join(", ");
  const payMethod = (order.payment_method || "").replace("shiprocket_", "").toUpperCase() || "N/A";

  const formattedItems = orderItems
    .map((item: any) => `<li style="padding:4px 0">${item.product_name || item.name || "Product"} &times; ${item.quantity} &mdash; ${formatAmt(Number(item.price) * Number(item.quantity))}</li>`)
    .join("");

  const couponLine   = order.coupon_code        ? `<p><strong>Coupon:</strong> ${order.coupon_code}</p>` : "";
  const discountLine = Number(order.discount_amount) > 0 ? `<p><strong>Discount:</strong> -${formatAmt(Number(order.discount_amount))}</p>` : "";
  const gstLine      = Number(order.gst_amount || order.tax_amount) > 0 ? `<p><strong>GST:</strong> ${formatAmt(Number(order.gst_amount || order.tax_amount))}</p>` : "";
  const codLine      = Number(order.cod_charges) > 0 ? `<p><strong>COD Charges:</strong> ${formatAmt(Number(order.cod_charges))}</p>` : "";
  const eddLine      = (order.edd_date || order.delivery_estimate) ? `<p><strong>Estimated Delivery:</strong> ${order.edd_date || order.delivery_estimate}</p>` : "";

  const emailHtml = `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
    <h1 style="font-size:22px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px">SCALVEA</h1>
    <p style="font-size:11px;color:#888;letter-spacing:2px;margin-top:0">CARE YOU DESERVE</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p>Order <strong>${order.order_number}</strong> has been confirmed and is being processed.</p>
    <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px">Items Ordered</h2>
    <ul style="padding:0;list-style:none">${formattedItems || "<li>See your order confirmation for details</li>"}</ul>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p><strong>Subtotal:</strong> ${formatAmt(Number(order.subtotal))}</p>
    ${gstLine}<p><strong>Shipping:</strong> ${formatAmt(Number(order.shipping_amount))}</p>
    ${codLine}${discountLine}${couponLine}
    <p><strong>Total Paid:</strong> <span style="font-size:16px;font-weight:600">${formatAmt(Number(order.total_amount_payable || order.total_amount))}</span></p>
    <p><strong>Payment Method:</strong> ${payMethod}</p>
    ${eddLine}
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p><strong>Shipping Address:</strong><br>${(addr.first_name || addr.firstName || "")} ${(addr.last_name || addr.lastName || "")}<br>${addrLine}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:11px;color:#888;text-align:center">SCALVEA GROUPS PTY LTD &middot; scalvea.com</p>
  </div>`;

  const adminHtml = `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto;padding:40px 20px">
    <h1 style="font-size:16px;text-transform:uppercase;letter-spacing:2px">New Order &#8212; ${order.order_number}</h1>
    <p><strong>Market:</strong> ${order.market || order.country} | <strong>Currency:</strong> ${order.currency}</p>
    <p><strong>Customer:</strong> ${order.customer_name || ""} | <strong>Email:</strong> ${emailToUse} | <strong>Phone:</strong> ${order.customer_phone || addr.phone || "N/A"}</p>
    <p><strong>Shiprocket Order ID:</strong> ${order.shiprocket_order_id || order.fastrr_order_id || "N/A"}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:2px">Items</h2>
    <ul style="padding:0;list-style:none">${formattedItems || "<li>&#8212;</li>"}</ul>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <p><strong>Subtotal:</strong> ${formatAmt(Number(order.subtotal))}</p>
    ${gstLine}<p><strong>Shipping:</strong> ${formatAmt(Number(order.shipping_amount))}</p>
    ${codLine}${discountLine}${couponLine}
    <p><strong>Total:</strong> ${formatAmt(Number(order.total_amount_payable || order.total_amount))}</p>
    <p><strong>Payment:</strong> ${payMethod} | <strong>Status:</strong> ${order.payment_status || "N/A"}</p>
    ${eddLine}
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
    <p><strong>Shipping Address:</strong><br>${addrLine}</p>
    <p><strong>Billing Address:</strong><br>${billLine}</p>
  </div>`;

  try {
    const cr = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: senderEmail, to: emailToUse, subject: `Order Confirmed &#8212; ${order.order_number}`, html: emailHtml }),
    });
    if (!cr.ok) console.error("Customer email send failed:", await cr.text());
    else console.log("Customer email sent:", order.order_number);

    const ar = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: senderEmail, to: adminEmail, subject: `[New Order] ${order.order_number} &#8212; ${order.market || order.country}`, html: adminHtml }),
    });
    if (!ar.ok) console.error("Admin email send failed:", await ar.text());
    else console.log("Admin email sent:", order.order_number);
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
          webhook_type: type, payload, response: errMsg, status: "auth_failure", attempts,
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
            webhook_type: type, payload, response: lastResponseText, status: "success", attempts,
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
    webhook_type: type, payload, response: lastResponseText, status: "failed", attempts,
  }).catch(() => {});

  return { success: false, error: lastResponseText };
}

// ─── Order Details API ────────────────────────────────────────────────────────

/**
 * Calls the Shiprocket Order Details API — the canonical source of truth for
 * every Shiprocket order. Returns the complete order object.
 *
 * API: POST https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details
 * Auth: X-Api-Key + X-Api-HMAC-SHA256 (HMAC of JSON body)
 *
 * Returns { ok: true, data } on success, { ok: false, error } on failure.
 * Never throws — all errors are captured and returned as { ok: false }.
 */
export async function callOrderDetailsApi(
  shiprocketOrderId: string,
  apiKey: string,
  secretKey: string
): Promise<{ ok: boolean; data: any | null; error?: string }> {
  const payload = {
    order_id:  String(shiprocketOrderId),
    timestamp: new Date().toISOString(),
  };
  const sig        = await generateHmacSha256(secretKey, JSON.stringify(payload));
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(
      "https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details",
      {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "X-Api-Key":         apiKey,
          "X-Api-HMAC-SHA256": sig,
        },
        body:   JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const text = await res.text();
    if (!res.ok) {
      console.error(`Order Details API HTTP ${res.status} for order ${shiprocketOrderId}:`, text.substring(0, 200));
      return { ok: false, data: null, error: `HTTP ${res.status}: ${text.substring(0, 100)}` };
    }
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    // Normalise envelope — may return { data: {...} } or the object directly
    const data = parsed?.data || parsed;
    console.log(`Order Details API: success for Shiprocket order ${shiprocketOrderId}`);
    return { ok: true, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const msg = err.name === "AbortError"
      ? `Order Details API timed out (15s) for order ${shiprocketOrderId}`
      : `Order Details API fetch error: ${err.message}`;
    console.error(msg);
    return { ok: false, data: null, error: msg };
  }
}

// ─── Canonical Order Sync Function ───────────────────────────────────────────

/**
 * THE single source of truth for syncing a Shiprocket order into the merchant DB.
 *
 * Called by:
 *   - shiprocket-order-webhook (new order creation + duplicate webhook repair)
 *   - fetch-shiprocket-order   (callback polling sync)
 *   - shiprocket-reconcile     (scheduled repair of incomplete orders)
 *
 * Guarantees:
 *   - Idempotent order creation  (UNIQUE constraint on shiprocket_order_id)
 *   - Idempotent payment upserts (check by transaction_id)
 *   - Idempotent item creation   (skip if order_items already exist)
 *   - Idempotent inventory deduction (check inventory_logs by reason)
 *   - Emails sent ONLY on first creation
 *
 * @param supabase           Supabase service-role client
 * @param shiprocketOrderId  Shiprocket order_id string
 * @param orderDetails       Parsed Order Details API response (or fallback object)
 * @param existingOrderId    UUID of existing local order — null means create new
 * @param webhookBody        Raw webhook JSON body for fallback field resolution
 */
export async function syncOrderFromDetails(
  supabase: any,
  shiprocketOrderId: string,
  rawOrderDetails: any,
  existingOrderId: string | null = null,
  webhookBody: any = null
): Promise<{ orderId: string; created: boolean; itemsCreated: any[] }> {
  console.log(`[Sync] syncOrderFromDetails START — srId=${shiprocketOrderId} existing=${existingOrderId ?? "null(new)"}`);
  console.log("=== RAW SHIPROCKET ORDER DETAILS ===");
  console.log(JSON.stringify(rawOrderDetails, null, 2));
  console.log("====================================");

  // Aggressive unwrapping with explicit path logging
  let orderDetails = rawOrderDetails || {};
  let detectedPath = "root";

  if (orderDetails.data) {
    if (Array.isArray(orderDetails.data)) {
      orderDetails = orderDetails.data[0] || {};
      detectedPath = "data[0]";
    } else {
      orderDetails = orderDetails.data;
      detectedPath = "data";
    }
  } else if (orderDetails.order) {
    orderDetails = orderDetails.order;
    detectedPath = "order";
  } else if (orderDetails.order_details) {
    orderDetails = orderDetails.order_details;
    detectedPath = "order_details";
  } else if (Array.isArray(orderDetails) && orderDetails.length > 0) {
    orderDetails = orderDetails[0];
    detectedPath = "[0]";
  }

  console.log(`[Sync] Resolved payload path: ${detectedPath}`);

  // ── A: Extract customer / addresses ───────────────────────────────────────
  const customer    = orderDetails.customer    || orderDetails.buyer || orderDetails.customer_details || {};
  const shippingRaw = orderDetails.shipping    || orderDetails.shipping_address || webhookBody?.shipping_address || {};
  const billingRaw  = orderDetails.billing     || orderDetails.billing_address  || webhookBody?.billing_address  || shippingRaw;

  const firstName = customer.first_name || customer.name?.split(" ")[0] || shippingRaw.first_name || (shippingRaw.name || "").split(" ")[0] || "Customer";
  const lastName  = customer.last_name  || customer.name?.split(" ").slice(1).join(" ") || shippingRaw.last_name  || (shippingRaw.name || "").split(" ").slice(1).join(" ") || "";
  const email     = (customer.email || shippingRaw.email || orderDetails.customer_email || orderDetails.email || webhookBody?.email || "").trim();
  const phone     = (customer.phone || shippingRaw.phone || orderDetails.customer_phone || orderDetails.phone || webhookBody?.phone || "").trim().replace(/[^0-9+]/g, "").replace(/^\+91/, "");

  const shippingAddress = {
    first_name: firstName, last_name: lastName, firstName, lastName,
    address:       shippingRaw.line1 || shippingRaw.address_line1 || shippingRaw.address || shippingRaw.shipping_address || "",
    address_line1: shippingRaw.line1 || shippingRaw.address_line1 || shippingRaw.address || shippingRaw.shipping_address || "",
    address_line2: shippingRaw.line2 || shippingRaw.address_line2 || shippingRaw.shipping_address_2 || "",
    city:    shippingRaw.city || shippingRaw.shipping_city || "", 
    state:   shippingRaw.state || shippingRaw.shipping_state || "",
    postcode: shippingRaw.pincode || shippingRaw.postcode || shippingRaw.postal_code || shippingRaw.shipping_pincode || "",
    country: shippingRaw.country || shippingRaw.shipping_country || "India", 
    country_code: shippingRaw.country_code || "IN",
    landmark: shippingRaw.landmark || "", phone, email,
  };
  const billingAddress = {
    first_name: billingRaw.first_name || billingRaw.billing_name?.split(" ")[0] || firstName, 
    last_name: billingRaw.last_name || billingRaw.billing_name?.split(" ").slice(1).join(" ") || lastName,
    address_line1: billingRaw.line1 || billingRaw.address_line1 || billingRaw.address || billingRaw.billing_address || shippingAddress.address_line1,
    address_line2: billingRaw.line2 || billingRaw.address_line2 || billingRaw.billing_address_2 || "",
    city:     billingRaw.city    || billingRaw.billing_city || shippingAddress.city,
    state:    billingRaw.state   || billingRaw.billing_state || shippingAddress.state,
    postcode: billingRaw.pincode || billingRaw.postcode || billingRaw.billing_pincode || shippingAddress.postcode,
    country: billingRaw.country || billingRaw.billing_country || "India",
    phone: billingRaw.phone || billingRaw.billing_phone || phone,
    email: billingRaw.email || billingRaw.billing_email || email,
  };

  // ── B: Financial fields ───────────────────────────────────────────────────
  const subtotalPrice      = Number(orderDetails.subtotal_price      || orderDetails.subtotal        || orderDetails.net_total || webhookBody?.subtotal_price  || 0);
  const shippingCharges    = Number(orderDetails.shipping_charges    || orderDetails.shipping_amount || orderDetails.shipping || webhookBody?.shipping_charges || 0);
  const couponDiscount     = Number(orderDetails.coupon_discount  || 0);
  const prepaidDiscount    = Number(orderDetails.prepaid_discount || 0);
  const totalDiscount      = Number(orderDetails.total_discount   || orderDetails.discount_amount || orderDetails.discount || webhookBody?.total_discount || (couponDiscount + prepaidDiscount));
  const codCharges         = Number(orderDetails.cod_charges      || webhookBody?.cod_charges     || 0);
  const totalAmountPayable = Number(orderDetails.total_amount_payable || orderDetails.amount || orderDetails.total || webhookBody?.total_amount_payable || webhookBody?.amount || 0);
  const gstAmount          = Number(orderDetails.gst_amount || orderDetails.gst || orderDetails.tax_amount || orderDetails.tax || webhookBody?.tax_amount || 0);

  // ── C: Metadata ───────────────────────────────────────────────────────────
  const fastrrId        = orderDetails.fastrr_order_id || orderDetails.order_id || webhookBody?.fastrr_order_id || String(shiprocketOrderId);
  const platformOrderId = orderDetails.platform_order_id || null;
  const cartId          = orderDetails.cart_id || null;
  const edd             = orderDetails.edd     || orderDetails.edd_date || webhookBody?.edd || null;
  const rtoPrediction   = orderDetails.rto_prediction || null;
  const shippingPlan    = orderDetails.shipping_plan  || null;
  const tags            = orderDetails.tags            || [];
  const paymentsArr     = orderDetails.payments        || [];
  const couponCodesArr  = orderDetails.coupon_codes    || (webhookBody?.coupon_codes || []);
  const discountDetail  = orderDetails.discount_detail || null;

  const couponCodeStr = Array.isArray(couponCodesArr) && couponCodesArr.length > 0
    ? (typeof couponCodesArr[0] === "string" ? couponCodesArr[0] : couponCodesArr[0]?.code || null)
    : (orderDetails.coupon_code || webhookBody?.coupon_code || null);

  // ── D: Status and payment mapping ─────────────────────────────────────────
  const rawStatus      = orderDetails.status       || webhookBody?.status       || "processing";
  const localStatus    = mapOrderStatus(rawStatus);
  const rawPaymentType = orderDetails.payment_type || orderDetails.payment_method || webhookBody?.payment_type || webhookBody?.payment_method || "cod";
  const mappedPayment  = mapPaymentMethod(rawPaymentType);
  const rawPmtStatus   = orderDetails.payment_status
    || (paymentsArr.length > 0 && Number(paymentsArr[0]?.amount_received) > 0 ? "paid" : null);
  const localPayStatus = rawPmtStatus === "paid" ? "paid"
    : (mappedPayment === "shiprocket_cod" && localStatus !== "delivered") ? "unpaid" : "paid";

  // ── E: Resolve user account ───────────────────────────────────────────────
  let userId: string | null = null;
  if (email) {
    const { data: pEmail } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (pEmail) userId = pEmail.id;
  }
  if (!userId && phone) {
    // Attempt multiple formats for phone
    const { data: pPhone } = await supabase.from("profiles").select("id").or(`phone.eq.${phone},phone.eq.+91${phone}`).maybeSingle();
    if (pPhone) userId = pPhone.id;
  }

  // ── F: Build order payload ────────────────────────────────────────────────
  const gatewayResponse = { order_details_api: orderDetails, webhook_payload: webhookBody || null };
  const orderPayload: any = {
    country: "India", currency: "INR",
    subtotal: subtotalPrice, tax_amount: gstAmount,
    shipping_amount: shippingCharges, discount_amount: totalDiscount,
    coupon_code: couponCodeStr, total_amount: totalAmountPayable,
    order_status: localStatus, payment_status: localPayStatus, payment_method: mappedPayment,
    delivery_estimate: edd || "3-5 business days",
    fastrr_order_id: fastrrId, billing_address: billingAddress,
    total_amount_payable: totalAmountPayable, shipping_address: shippingAddress,
    customer_email: email || null, customer_phone: phone || null,
    customer_name: `${firstName} ${lastName}`.trim() || null,
    is_guest: !userId, source: "Shiprocket", platform: "Web",
    gateway_response: gatewayResponse, market: "IN",
    updated_at: new Date().toISOString(),
    // New detail columns (migration 20260727000000)
    shiprocket_order_id: String(shiprocketOrderId),
    cod_charges: codCharges, rto_prediction: rtoPrediction, shipping_plan: shippingPlan,
    cart_id: cartId, platform_order_id: platformOrderId,
    order_tags: tags, discount_detail: discountDetail, coupon_codes: couponCodesArr,
    shiprocket_payments: paymentsArr, edd_date: edd, gst_amount: gstAmount,
  };
  if (userId) orderPayload.user_id = userId;

  // ── G: Create or update the order ─────────────────────────────────────────
  let orderId: string;
  let created = false;
  let savedOrder: any;

  if (existingOrderId) {
    // Clean nulls/undefined/empty string from orderPayload so we don't overwrite good data. 
    // IMPORTANT: We preserve numeric 0 (like shipping_charges = 0)
    const cleanPayload = Object.fromEntries(
      Object.entries(orderPayload).filter(([_, v]) => v !== undefined && v !== null && v !== "")
    );
    
    // PRESERVE LOCAL FINANCIAL FIELDS: If the order was originated by our frontend (e.g. Fastrr checkout),
    // it already has perfectly calculated totals. Shiprocket Fastrr payloads often mangle these 
    // (e.g. returning the already-discounted amount as the subtotal), leading to double-discounts.
    const { data: existingOrder } = await supabase.from("orders").select("subtotal").eq("id", existingOrderId).maybeSingle();
    if (existingOrder && existingOrder.subtotal > 0) {
      delete cleanPayload.subtotal;
      delete cleanPayload.discount_amount;
      delete cleanPayload.total_amount;
      delete cleanPayload.tax_amount;
      delete cleanPayload.shipping_amount;
      delete cleanPayload.total_amount_payable;
      delete cleanPayload.coupon_code;
    }
    
    const { data: updated, error: updateErr } = await supabase
      .from("orders").update(cleanPayload).eq("id", existingOrderId).select().single();
    if (updateErr) { console.error("[Sync] UPDATE failed:", updateErr.message); throw updateErr; }
    orderId    = existingOrderId;
    savedOrder = updated;
    console.log(`[Sync] Updated ${savedOrder.order_number} (${orderId})`);
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("orders").insert(orderPayload).select().single();
    if (insertErr) { console.error("syncOrderFromDetails INSERT failed:", insertErr.message, insertErr.code); throw insertErr; }
    orderId    = inserted.id;
    savedOrder = inserted;
    created    = true;
    console.log(`[Sync] Created ${savedOrder.order_number} (${orderId})`);

    // Create shiprocket_orders mapping (UNIQUE on shiprocket_order_id)
    const { error: mapErr } = await supabase.from("shiprocket_orders").insert({
      order_id: orderId, shiprocket_order_id: String(shiprocketOrderId),
      tracking_id:  webhookBody?.tracking_id  || orderDetails.tracking_id  || null,
      courier_name: webhookBody?.courier_name || orderDetails.courier_name || null,
    } as any);

    if (mapErr) {
      if (mapErr.code === "23505") {
        // Concurrent webhook race condition — remove orphan, return existing order
        console.warn(`syncOrderFromDetails: Concurrent duplicate for ${shiprocketOrderId}. Removing orphan ${orderId}.`);
        await supabase.from("orders").delete().eq("id", orderId);
        const { data: existMap } = await supabase.from("shiprocket_orders")
          .select("order_id").eq("shiprocket_order_id", String(shiprocketOrderId)).maybeSingle();
        return { orderId: existMap?.order_id || orderId, created: false, itemsCreated: [] };
      }
      console.error("syncOrderFromDetails: Mapping insert failed:", mapErr.message); throw mapErr;
    }
  }

  // ── H: Update tracking info if present ───────────────────────────────────
  const hasTracking = webhookBody?.tracking_id || webhookBody?.courier_name || orderDetails.tracking_id || orderDetails.courier_name;
  if (existingOrderId && hasTracking) {
    await supabase.from("shiprocket_orders").update({
      tracking_id:  webhookBody?.tracking_id  || orderDetails.tracking_id  || undefined,
      courier_name: webhookBody?.courier_name || orderDetails.courier_name || undefined,
    }).eq("order_id", existingOrderId)
      .catch((e: any) => console.warn("shiprocket_orders tracking update failed:", e.message));
  }

  // ── I: Upsert payments ────────────────────────────────────────────────────
  if (paymentsArr.length > 0) {
    for (const pmt of paymentsArr) {
      const txnId = pmt.txn_id || pmt.transaction_id || pmt.id || null;
      if (!txnId) continue;
      const { data: existPmt } = await supabase.from("payments").select("id")
        .eq("order_id", orderId).eq("transaction_id", txnId).maybeSingle();
      if (!existPmt) {
        console.log(`[Sync] Inserting payment: method=${pmt.payment_method || rawPaymentType}, txn_id=${txnId}, amount=${pmt.amount}`);
        await supabase.from("payments").insert({
          order_id: orderId, payment_method: mapPaymentMethod(pmt.payment_method || rawPaymentType),
          payment_status: Number(pmt.amount_received) > 0 ? "paid" : "pending",
          amount: Number(pmt.amount || 0), transaction_id: txnId,
          pg_transaction_id: pmt.pg_transaction_id || null,
          amount_received: Number(pmt.amount_received || 0),
          gateway: pmt.gateway || null, raw_response: pmt,
        } as any).catch((e: any) => console.warn("[Sync] payment insert failed:", e.message));
      } else {
        console.log(`[Sync] Payment skipped because transaction_id ${txnId} already exists`);
      }
    }
  } else if (fastrrId) {
    // Fallback: single payment record from order totals
    const { data: existPmt } = await supabase.from("payments").select("id")
      .eq("order_id", orderId).eq("transaction_id", fastrrId).maybeSingle();
    if (!existPmt) {
      console.log(`[Sync] Inserting fallback payment: method=${mappedPayment}, txn_id=${fastrrId}, amount=${totalAmountPayable}`);
      await supabase.from("payments").insert({
        order_id: orderId, payment_method: mappedPayment, payment_status: localPayStatus,
        amount: totalAmountPayable, transaction_id: fastrrId, raw_response: gatewayResponse,
      } as any).catch((e: any) => console.warn("[Sync] fallback payment insert failed:", e.message));
    } else {
      console.log(`[Sync] Fallback payment skipped because transaction_id ${fastrrId} already exists`);
    }
  }

  // ── J: Resolve cart items ─────────────────────────────────────────────────
  let rawItems: any[] = [];
  if (Array.isArray(orderDetails.cart_data?.items)) rawItems = orderDetails.cart_data.items;
  else if (Array.isArray(orderDetails.items)) rawItems = orderDetails.items;
  else if (Array.isArray(orderDetails.products)) rawItems = orderDetails.products;
  else if (Array.isArray(webhookBody?.cart_data?.items)) rawItems = webhookBody.cart_data.items;
  else if (Array.isArray(webhookBody?.items)) rawItems = webhookBody.items;
  else if (Array.isArray(webhookBody?.products)) rawItems = webhookBody.products;

  const cartItems = rawItems.map((it: any) => ({
    variant_id: String(it.variant_id || it.product_id || it.id || ""),
    quantity:   Number(it.quantity || 1),
    price:      Number(it.price || it.selling_price || 0),
    name:       it.name || it.product_name || "Scalvea Product",
  }));

  // ── K: Create order items (idempotent — skip if any already exist) ────────
  const itemsCreated: any[] = [];
  const { data: existingItems } = await supabase.from("order_items")
    .select("id, product_name, quantity, price").eq("order_id", orderId);
  const hasItems = existingItems && existingItems.length > 0;

  if (!hasItems && cartItems.length > 0) {
    console.log(`[Sync] Creating ${cartItems.length} items for order ${orderId}`);
    for (const item of cartItems) {
      const prod = item.variant_id ? await findProductIdByVariantId(supabase, item.variant_id) : null;
      if (!prod) {
        console.warn(`[Sync] WARNING: Variant ID ${item.variant_id} not found in products table. product_id set to NULL.`);
      }
      const itemRow: any = {
        order_id: orderId, product_id: prod?.id || null,
        product_name: item.name || prod?.name || "Scalvea Product",
        quantity: item.quantity, price: item.price, currency: "INR",
      };
      const { error: itemErr } = await supabase.from("order_items").insert(itemRow as any);
      if (itemErr) {
        console.error(`[Sync] order_items insert failed for ${itemRow.product_name}:`, itemErr.message);
      } else {
        itemsCreated.push(itemRow);
      }

      // ── L: Deduct inventory (idempotent via inventory_logs) ───────────────
      if (prod) {
        const { data: existLog } = await supabase.from("inventory_logs").select("id")
          .eq("product_id", prod.id).ilike("reason", `%${shiprocketOrderId}%`).maybeSingle();
        if (!existLog) {
          const prevQty = prod.inventory_quantity ?? 0;
          const newQty  = Math.max(0, prevQty - item.quantity);
          console.log(`[Sync] Inventory deducted for product ${prod.id}: ${prevQty} -> ${newQty}`);
          await supabase.from("products").update({ inventory_quantity: newQty }).eq("id", prod.id)
            .catch((e: any) => console.warn("[Sync] inventory update failed:", e.message));
          await supabase.from("inventory_logs").insert({
            product_id: prod.id, change_amount: -item.quantity,
            previous_quantity: prevQty, new_quantity: newQty,
            reason: `Shiprocket Order ${shiprocketOrderId}`,
          } as any).catch((e: any) => console.warn("[Sync] inventory_log insert failed:", e.message));
        } else {
          console.log(`[Sync] Inventory skipped for product ${prod.id} because already deducted`);
        }
      }
    }
  } else if (hasItems) {
    console.log(`syncOrderFromDetails: Order ${orderId} already has ${existingItems!.length} items — skipping.`);
  } else {
    console.warn(`syncOrderFromDetails: No cart items for Shiprocket order ${shiprocketOrderId}`);
  }

  // ── M: Send emails (only on first creation) ───────────────────────────────
  if (created && savedOrder) {
    sendOrderEmails(supabase, savedOrder, itemsCreated).catch((err: any) =>
      console.error("syncOrderFromDetails: email error:", err.message)
    );
  }

  console.log(`syncOrderFromDetails COMPLETE — orderId=${orderId} created=${created} items=${itemsCreated.length}`);
  return { orderId, created, itemsCreated };
}
