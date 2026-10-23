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
 * Meta Conversions API (CAPI) Integration:
 *   - Access Token configured via META_CONVERSIONS_API_ACCESS_TOKEN.
 *   - Automated deduplication: Browser Pixel and Server CAPI use identical eventID (`purchase-{order.id}`).
 *   - First-party cookie capture: Extracts _fbp and _fbc cookies for maximum match rate.
 *   - SHA-256 normalization: Customer identifiers are securely hashed before dispatch.
 */

import { supabase } from "@/integrations/supabase/client";

export const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1990336078340761";
export const META_CAPI_ACCESS_TOKEN =
  import.meta.env.VITE_META_CONVERSIONS_API_ACCESS_TOKEN ||
  "EAAWL1S9YfiwBS5sVYwBylTevzqxCguuvRtZAGUcFXy4iM5QZBpZAKwZCMZAv14setYjZCvkGL917IowaEWXhEIZANru0PDrgIqEqiIBqHTP3Xsml1Ih0yp1P2zqc4ucE9ANa3YZBFBreUqElsmxhylTosYvM2xtt3iyVP1SQCqv6fV868vAe1Ll4rGtaKYk5YvPTWQZDZD";

// ─── Global fbq type declaration ─────────────────────────────────────────────
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// ─── Cookie extraction helper for Meta 1st-party cookies (_fbp, _fbc) ────────
export function getMetaCookie(name: "_fbp" | "_fbc"): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── SHA-256 Hash helper (Browser Crypto API) ────────────────────────────────
export async function hashSha256(value: string): Promise<string> {
  try {
    const normalized = value.trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
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

// ─── Meta Conversions API (CAPI) Dispatcher ──────────────────────────────────
export async function sendCapiEvent(payload: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: string | null;
    country?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  };
  customData?: Record<string, unknown>;
}): Promise<void> {
  try {
    // 1. Try Supabase Edge Function if available
    try {
      const { data, error } = await supabase.functions.invoke("meta-conversions-api", {
        body: payload,
      });
      if (!error && data?.success) {
        return;
      }
    } catch {
      // Fallback to direct Meta Graph API if edge function is unreachable
    }

    // 2. Direct Meta Graph API fallback from client
    if (typeof window !== "undefined" && META_CAPI_ACCESS_TOKEN) {
      const userDataObj: Record<string, string[]> = {};
      if (payload.userData.email) userDataObj.em = [await hashSha256(payload.userData.email)];
      if (payload.userData.phone) userDataObj.ph = [await hashSha256(payload.userData.phone.replace(/[^\d]/g, ""))];
      if (payload.userData.firstName) userDataObj.fn = [await hashSha256(payload.userData.firstName)];
      if (payload.userData.lastName) userDataObj.ln = [await hashSha256(payload.userData.lastName)];
      if (payload.userData.city) userDataObj.ct = [await hashSha256(payload.userData.city)];
      if (payload.userData.postcode) userDataObj.zp = [await hashSha256(payload.userData.postcode)];
      if (payload.userData.country) userDataObj.country = [await hashSha256(payload.userData.country.slice(0, 2).toLowerCase())];

      const fbp = payload.userData.fbp || getMetaCookie("_fbp");
      const fbc = payload.userData.fbc || getMetaCookie("_fbc");

      const body = {
        data: [
          {
            event_name: payload.eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: payload.eventId,
            event_source_url: payload.eventSourceUrl || window.location.href,
            action_source: "website",
            user_data: {
              ...userDataObj,
              ...(fbp ? { fbp } : {}),
              ...(fbc ? { fbc } : {}),
            },
            custom_data: payload.customData || {},
          },
        ],
      };

      fetch(
        `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        }
      ).catch(() => {
        // Non-blocking CAPI errors
      });
    }
  } catch {
    // Fail silently to never interrupt user browsing
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
  const eventId = `initiate_checkout-${Date.now()}`;

  _fbq(
    "track",
    "InitiateCheckout",
    {
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
    },
    { eventID: eventId }
  );

  sendCapiEvent({
    eventName: "InitiateCheckout",
    eventId,
    userData: {
      fbp: getMetaCookie("_fbp"),
      fbc: getMetaCookie("_fbc"),
    },
    customData: {
      currency,
      value: total,
      content_type: "product",
      content_ids: items.map((i) => i.productId),
      contents: items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price,
      })),
      num_items: numItems,
    },
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
 *      event is sent from both the browser (here) and server-side CAPI.
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
  const eventId = `purchase-${order.id}`;

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
      // Deterministic event ID for automated Meta CAPI deduplication
      eventID: eventId,
    }
  );

  // ── Meta Conversions API (CAPI) Dual-Dispatch ──
  const address = (order as any).shipping_address || (order as any).address || {};
  sendCapiEvent({
    eventName: "Purchase",
    eventId,
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : "https://scalvea.com/order-success",
    userData: {
      email: (order as any).customer_email || (order as any).email || address.email,
      phone: (order as any).customer_phone || (order as any).phone || address.phone,
      firstName: (order as any).customer_first_name || address.first_name || address.name?.split(" ")[0],
      lastName: (order as any).customer_last_name || address.last_name || address.name?.split(" ").slice(1).join(" "),
      city: address.city,
      state: address.state,
      postcode: address.postcode || address.postal_code,
      country: address.country || (order.currency === "INR" ? "IN" : "AU"),
      fbp: getMetaCookie("_fbp"),
      fbc: getMetaCookie("_fbc"),
    },
    customData: {
      currency: order.currency,
      value: order.total_amount,
      order_id: (order as any).order_number || order.id,
      content_type: "product",
      content_ids: items.map((i) => i.product_id),
      contents: items.map((i) => ({
        id: i.product_id,
        quantity: i.quantity ?? 1,
        item_price: i.price ?? 0,
      })),
      num_items: numItems,
    },
  });

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
