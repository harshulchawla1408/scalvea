/**
 * metaPixel.ts
 *
 * Centralized Meta Pixel tracking utility for Scalvea.
 *
 * The Pixel is initialized once in index.html (fbq('init', ...) + first PageView).
 * This file provides typed helper functions for all standard events.
 * All functions are wrapped in try/catch — pixel failures never interrupt checkout.
 *
 * Pixel ID: 1990336078340761 (also available as import.meta.env.VITE_META_PIXEL_ID)
 *
 * Future CAPI compatibility: Purchase events include eventID = 'purchase-{order.id}'.
 * The same ID must be used on the server-side CAPI call to deduplicate with Meta.
 *
 * AddPaymentInfo is intentionally NOT implemented:
 *   - Australia: Stripe Checkout is hosted externally — no in-app payment-info callback.
 *   - India: Shiprocket Checkout is an externally hosted iframe — no payment-info event.
 *   False events are worse than missing optional events.
 */

// ─── Global fbq type declaration ─────────────────────────────────────────────
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// ─── Internal safe caller ─────────────────────────────────────────────────────
function _fbq(...args: unknown[]): void {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(...args);
    }
  } catch {
    // Pixel errors must never interrupt the user flow
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PixelProduct {
  id: string;
  name: string;
  price: number;    // current market price (INR or AUD)
  currency: string; // "INR" | "AUD"
}

export interface PixelCartItem {
  productId: string;
  name: string;
  price: number;    // current market price
  quantity: number;
}

export interface PixelOrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

export interface PixelOrder {
  id: string;           // Local DB UUID — used for event_id deduplication
  order_number?: string;
  total_amount: number;
  currency: string;     // "INR" | "AUD"
  order_items?: PixelOrderItem[];
}

// ─── PageView ─────────────────────────────────────────────────────────────────
/**
 * Track a page view. Called by MetaPixelRouteTracker on each SPA route change.
 * The very first PageView on hard load is already fired by index.html.
 */
export function trackPageView(): void {
  _fbq("track", "PageView");
}

// ─── ViewContent ──────────────────────────────────────────────────────────────
/**
 * Fire when a customer views an individual product detail page.
 * NOT fired for product cards in listing pages.
 */
export function trackViewContent(product: PixelProduct): void {
  _fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.name,
    value: product.price,
    currency: product.currency,
  });
}

// ─── AddToCart ────────────────────────────────────────────────────────────────
/**
 * Fire after a product is successfully added to the cart.
 * Called only after addItem() completes (synchronous local-state update).
 */
export function trackAddToCart(product: PixelProduct, quantity: number): void {
  _fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.name,
    value: product.price * quantity,
    currency: product.currency,
    contents: [
      {
        id: product.id,
        quantity,
        item_price: product.price,
      },
    ],
  });
}

// ─── InitiateCheckout ─────────────────────────────────────────────────────────
/**
 * Fire when checkout is actually initiated — after the session/token is
 * created and the user is about to be redirected to the payment provider.
 *
 * NOT fired when the user navigates to /checkout or views the cart.
 * NOT fired simply because a checkout button was clicked.
 */
export function trackInitiateCheckout(
  items: PixelCartItem[],
  total: number,
  currency: string
): void {
  const numItems = items.reduce((sum, i) => sum + i.quantity, 0);

  _fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.productId),
    content_type: "product",
    value: total,
    currency,
    num_items: numItems,
    contents: items.map((i) => ({
      id: i.productId,
      quantity: i.quantity,
      item_price: i.price,
    })),
  });
}

// ─── Purchase ─────────────────────────────────────────────────────────────────
/**
 * Fire ONLY after a real, confirmed, paid order is loaded from Supabase.
 *
 * DEDUPLICATION — two layers:
 *   1. sessionStorage key `px_purchase_{order.id}` prevents duplicate fires
 *      if the customer refreshes the /order-success page.
 *   2. eventID `purchase-{order.id}` allows Meta to deduplicate if the same
 *      event is sent from both the browser (here) and a future server-side CAPI call.
 *
 * Returns true if the event was fired, false if skipped (already tracked).
 */
export function trackPurchase(order: PixelOrder): boolean {
  if (!order?.id) return false;

  const dedupeKey = `px_purchase_${order.id}`;

  // Skip if already tracked in this browser session (e.g. page refresh)
  if (typeof window !== "undefined" && sessionStorage.getItem(dedupeKey)) {
    return false;
  }

  const items: PixelOrderItem[] = order.order_items ?? [];
  const numItems = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  _fbq(
    "track",
    "Purchase",
    {
      content_ids: items.map((i) => i.product_id),
      content_type: "product",
      value: order.total_amount,
      currency: order.currency,
      num_items: numItems,
      contents: items.map((i) => ({
        id: i.product_id,
        quantity: i.quantity ?? 1,
        item_price: i.price ?? 0,
      })),
    },
    {
      // Deterministic event ID for future CAPI deduplication
      eventID: `purchase-${order.id}`,
    }
  );

  // Mark as tracked — prevents re-fire on page refresh
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // sessionStorage may be unavailable in certain browser privacy modes
    }
  }

  return true;
}
