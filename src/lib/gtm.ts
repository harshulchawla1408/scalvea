/**
 * gtm.ts
 *
 * Centralized Google Tag Manager & GA4 E-commerce dataLayer utility for Scalvea.
 * Container ID: GTM-WD9MTGPT
 *
 * Features:
 *  - Official GA4 e-commerce dataLayer structure (view_item_list, view_item,
 *    add_to_cart, remove_from_cart, view_cart, begin_checkout, purchase).
 *  - Clears previous ecommerce object before each ecommerce push ({ ecommerce: null })
 *    to prevent parameter bleeding between events.
 *  - Respects country-specific currencies: INR for India, AUD for Australia.
 *  - SSR-safe (guards against window being undefined).
 *  - Never throws: pixel/tag failures will never interrupt user browsing or checkout.
 *  - Zero PII: no passwords, payment secrets, tokens, addresses, phone numbers, or emails
 *    are ever pushed to dataLayer.
 *  - Purchase deduplication: prevents duplicate purchase tracking on page refresh
 *    or repeated callbacks via sessionStorage.
 */

export const GTM_CONTAINER_ID = "GTM-WD9MTGPT";

// ─── Global dataLayer declaration ───────────────────────────────────────────
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

// ─── Base Safe Push Helper ───────────────────────────────────────────────────
export function pushDataLayer(data: Record<string, unknown>): void {
  try {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(data);
    }
  } catch (err) {
    // Tracking failures must never interrupt the customer experience
    console.warn("[GTM] dataLayer push error:", err);
  }
}

/**
 * Standard GA4 Ecommerce pusher.
 * Per Google's official documentation, always clear the previous ecommerce
 * object first to avoid data leaking across different events.
 */
export function pushEcommerce(event: string, ecommerceData: Record<string, unknown>): void {
  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event,
    ecommerce: ecommerceData,
  });
}

// ─── E-Commerce Types ────────────────────────────────────────────────────────
export interface GtmItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  index?: number;
}

export interface GtmCartItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface GtmOrderInput {
  id: string;
  order_number?: string;
  total_amount: number;
  currency: string;
  tax_amount?: number;
  shipping_amount?: number;
  coupon_code?: string;
  shipping_country?: string;
  order_items?: Array<{
    product_id?: string;
    productId?: string;
    product_name?: string;
    name?: string;
    price?: number;
    quantity?: number;
    category?: string;
  }>;
}

// ─── 1. Page View (SPA Route Change) ─────────────────────────────────────────
/**
 * Track virtual page views on client-side route changes.
 * Skipped on initial mount because the GTM container initialization
 * already handles the initial landing page view.
 */
export function trackGtmPageView(params: {
  page_path: string;
  page_title?: string;
  page_location?: string;
}): void {
  pushDataLayer({
    event: "page_view",
    page_path: params.page_path,
    page_title: params.page_title || (typeof document !== "undefined" ? document.title : ""),
    page_location: params.page_location || (typeof window !== "undefined" ? window.location.href : ""),
  });
}

// ─── 2. View Item List (Product Listing / Shop) ──────────────────────────────
export function trackGtmViewItemList(params: {
  item_list_id?: string;
  item_list_name?: string;
  items: Array<{
    item_id: string;
    item_name: string;
    price?: number;
    currency?: string;
    item_brand?: string;
    item_category?: string;
    index?: number;
  }>;
}): void {
  const gtmItems: GtmItem[] = params.items.map((item, idx) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    price: item.price ?? 0,
    item_brand: item.item_brand || "Scalvea",
    item_category: item.item_category || "Hair Care",
    index: item.index ?? idx + 1,
  }));

  pushEcommerce("view_item_list", {
    item_list_id: params.item_list_id || "shop_products",
    item_list_name: params.item_list_name || "Shop Products",
    items: gtmItems,
  });
}

// ─── 3. View Item (Product Detail Page) ──────────────────────────────────────
export function trackGtmViewItem(params: {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
  item_brand?: string;
  item_category?: string;
}): void {
  pushEcommerce("view_item", {
    currency: params.currency,
    value: params.price,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: 1,
        item_brand: params.item_brand || "Scalvea",
        item_category: params.item_category || "Hair Care",
      },
    ],
  });
}

// ─── 4. Add To Cart ──────────────────────────────────────────────────────────
export function trackGtmAddToCart(params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency: string;
  item_brand?: string;
  item_category?: string;
}): void {
  pushEcommerce("add_to_cart", {
    currency: params.currency,
    value: Number((params.price * params.quantity).toFixed(2)),
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity,
        item_brand: params.item_brand || "Scalvea",
        item_category: params.item_category || "Hair Care",
      },
    ],
  });
}

// ─── 5. Remove From Cart ─────────────────────────────────────────────────────
export function trackGtmRemoveFromCart(params: {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  currency: string;
  item_brand?: string;
  item_category?: string;
}): void {
  pushEcommerce("remove_from_cart", {
    currency: params.currency,
    value: Number((params.price * params.quantity).toFixed(2)),
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        price: params.price,
        quantity: params.quantity,
        item_brand: params.item_brand || "Scalvea",
        item_category: params.item_category || "Hair Care",
      },
    ],
  });
}

// ─── 6. View Cart (Cart Drawer / Cart Page Opened) ───────────────────────────
export function trackGtmViewCart(params: {
  items: GtmCartItemInput[];
  total: number;
  currency: string;
}): void {
  const gtmItems: GtmItem[] = params.items.map((item, idx) => ({
    item_id: item.productId,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_brand: "Scalvea",
    item_category: item.category || "Hair Care",
    index: idx + 1,
  }));

  pushEcommerce("view_cart", {
    currency: params.currency,
    value: Number(params.total.toFixed(2)),
    items: gtmItems,
  });
}

// ─── 7. Begin Checkout ───────────────────────────────────────────────────────
export function trackGtmBeginCheckout(params: {
  items: GtmCartItemInput[];
  total: number;
  currency: string;
  coupon?: string;
}): void {
  const gtmItems: GtmItem[] = params.items.map((item, idx) => ({
    item_id: item.productId,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_brand: "Scalvea",
    item_category: item.category || "Hair Care",
    index: idx + 1,
  }));

  pushEcommerce("begin_checkout", {
    currency: params.currency,
    value: Number(params.total.toFixed(2)),
    ...(params.coupon ? { coupon: params.coupon } : {}),
    items: gtmItems,
  });
}

// ─── 8. Purchase ─────────────────────────────────────────────────────────────
/**
 * Fire ONLY after a real, confirmed order is loaded from Supabase.
 *
 * DEDUPLICATION:
 *  Uses sessionStorage key `gtm_purchase_{order.id}` to prevent duplicate fires
 *  if customer refreshes or revisits /order-success.
 *
 * Returns true if the event was pushed, false if skipped (already tracked).
 */
export function trackGtmPurchase(order: GtmOrderInput): boolean {
  if (!order?.id) return false;

  const dedupeKey = `gtm_purchase_${order.id}`;

  // Skip if already tracked in this browser session
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(dedupeKey)) {
        return false;
      }
    } catch {
      // sessionStorage unavailable (private browsing) - proceed safely
    }
  }

  const rawItems = order.order_items || [];
  const gtmItems: GtmItem[] = rawItems.map((item, idx) => ({
    item_id: item.product_id || item.productId || "",
    item_name: item.product_name || item.name || "Scalvea Product",
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    item_brand: "Scalvea",
    item_category: item.category || "Hair Care",
    index: idx + 1,
  }));

  const currency =
    order.currency ||
    (order.shipping_country?.toLowerCase().includes("india") ? "INR" : "AUD");

  pushEcommerce("purchase", {
    transaction_id: order.order_number || order.id,
    value: Number(Number(order.total_amount).toFixed(2)),
    currency,
    tax: Number((Number(order.tax_amount) || 0).toFixed(2)),
    shipping: Number((Number(order.shipping_amount) || 0).toFixed(2)),
    ...(order.coupon_code ? { coupon: order.coupon_code } : {}),
    items: gtmItems,
  });

  // Mark as tracked in sessionStorage
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // ignore storage errors
    }
  }

  return true;
}
