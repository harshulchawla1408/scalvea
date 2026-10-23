import { supabase } from "@/integrations/supabase/client";
import { getMetaCookie } from "@/lib/metaPixel";
import { CartItem } from "@/contexts/CartContext";
import type { User } from "@supabase/supabase-js";
import type { CartRecord, CartItemRecord } from "@/types/cartTracking";

interface SyncCartParams {
  user: User | null;
  items: CartItem[];
  total: number;
  rawTotal: number;
  bundleDiscount: number;
  country: string;
  currency: string;
  eventName: "add_to_cart" | "remove_from_cart" | "update_quantity" | "begin_checkout" | "purchase";
  eventId?: string;
}

// In-memory debounce timer and session store
let debounceTimeout: NodeJS.Timeout | null = null;
let lastSyncedHash = "";

// Generate or retrieve persistent browser session ID
export function getCartSessionId(): string {
  if (typeof window === "undefined") return "ssr-session";
  let sessionId = sessionStorage.getItem("scalvea_cart_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("scalvea_cart_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Debounced sync of logged-in customer's cart to Supabase.
 * Strictly ignores guest users (no unauthenticated DB requests).
 */
export function debouncedSyncCart(params: SyncCartParams, delayMs = 1000): void {
  // REQUIREMENT: No need to save guest users cart only for logged in users
  if (!params.user) return;

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  debounceTimeout = setTimeout(() => {
    syncCartNow(params).catch((err) => {
      console.warn("[CartTracking] Failed to sync cart to Supabase:", err);
    });
  }, delayMs);
}

/**
 * Immediate sync execution
 */
export async function syncCartNow(params: SyncCartParams): Promise<void> {
  const { user, items, total, rawTotal, bundleDiscount, country, currency, eventName } = params;

  // Double-guard: guest users are never saved to database
  if (!user) return;

  const sessionId = getCartSessionId();

  // Create hash to prevent duplicate redundant saves if state hasn't changed
  const payloadHash = `${user.id}_${eventName}_${items.map((i) => `${i.productId}:${i.quantity}`).join(",")}_${total}_${currency}`;
  if (payloadHash === lastSyncedHash && eventName !== "begin_checkout" && eventName !== "purchase") {
    return;
  }
  lastSyncedHash = payloadHash;

  // Consistent Event ID for browser / server deduplication with Meta & GTM
  const eventId = params.eventId || `cart_${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Capture First-Party Meta Cookies for Enhanced CAPI Match Quality
  const fbp = getMetaCookie("_fbp");
  const fbc = getMetaCookie("_fbc");

  // Extract customer details safely
  const userMetadata = user.user_metadata || {};
  const customerName =
    userMetadata.full_name ||
    userMetadata.name ||
    (userMetadata.first_name ? `${userMetadata.first_name} ${userMetadata.last_name || ""}`.trim() : null);
  const customerEmail = user.email || userMetadata.email || null;
  const customerPhone = user.phone || userMetadata.phone || null;

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartStatus = eventName === "begin_checkout" ? "checkout_started" : "active";

  try {
    // 1. Locate existing active or checkout_started cart for this user
    const { data: existingCart, error: fetchErr } = await supabase
      .from("carts")
      .select("id, status, metadata")
      .eq("user_id", user.id)
      .in("status", ["active", "checkout_started"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn("[CartTracking] Error finding active cart:", fetchErr);
      return;
    }

    let cartId: string;

    const metadata = {
      ...(existingCart?.metadata || {}),
      fbp: fbp || existingCart?.metadata?.fbp || null,
      fbc: fbc || existingCart?.metadata?.fbc || null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      lastUpdatedUrl: typeof window !== "undefined" ? window.location.href : null,
    };

    if (existingCart) {
      cartId = existingCart.id;
      // Update existing cart
      const { error: updateErr } = await supabase
        .from("carts")
        .update({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          country,
          currency,
          raw_total: rawTotal,
          bundle_discount: bundleDiscount,
          total,
          item_count: itemCount,
          status: cartStatus,
          last_event: eventName,
          event_id: eventId,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cartId);

      if (updateErr) {
        console.warn("[CartTracking] Error updating cart:", updateErr);
      }
    } else {
      // Create new cart for customer
      const { data: newCart, error: insertErr } = await supabase
        .from("carts")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          country,
          currency,
          raw_total: rawTotal,
          bundle_discount: bundleDiscount,
          total,
          item_count: itemCount,
          status: cartStatus,
          last_event: eventName,
          event_id: eventId,
          metadata,
        })
        .select("id")
        .single();

      if (insertErr || !newCart) {
        console.warn("[CartTracking] Error inserting new cart:", insertErr);
        return;
      }
      cartId = newCart.id;
    }

    // 2. Synchronize Cart Items
    if (cartId) {
      // Remove any items that are no longer in cart
      const currentProductIds = items.map((i) => i.productId);
      if (currentProductIds.length === 0) {
        await supabase.from("cart_items").delete().eq("cart_id", cartId);
      } else {
        await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId)
          .not("product_id", "in", `(${currentProductIds.join(",")})`);

        // Upsert current items
        const itemRows = items.map((item) => ({
          cart_id: cartId,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          updated_at: new Date().toISOString(),
        }));

        const { error: upsertErr } = await supabase
          .from("cart_items")
          .upsert(itemRows, { onConflict: "cart_id,product_id" });

        if (upsertErr) {
          console.warn("[CartTracking] Error upserting cart items:", upsertErr);
        }
      }

      // 3. Log Cart Event (Audit & Attribution)
      const eventItemsSnapshot = items.map((i) => ({
        product_id: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      await supabase.from("cart_events").insert({
        cart_id: cartId,
        user_id: user.id,
        event_name: eventName,
        event_id: eventId,
        value: total,
        currency,
        items: eventItemsSnapshot,
        metadata: {
          item_count: itemCount,
          country,
          fbp,
          fbc,
        },
      });
    }
  } catch (err) {
    console.warn("[CartTracking] Unexpected error during sync:", err);
  }
}

/**
 * Mark user's active cart as purchased upon successful order completion.
 */
export async function markCartPurchased(userId: string, orderNumber?: string): Promise<void> {
  if (!userId) return;

  try {
    const { data: activeCart } = await supabase
      .from("carts")
      .select("id, metadata")
      .eq("user_id", userId)
      .in("status", ["active", "checkout_started"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeCart) {
      const now = new Date().toISOString();
      const updatedMetadata = {
        ...(activeCart.metadata || {}),
        order_number: orderNumber || null,
        completed_at: now,
      };

      await supabase
        .from("carts")
        .update({
          status: "purchased",
          purchased_at: now,
          last_event: "purchase",
          metadata: updatedMetadata,
          updated_at: now,
        })
        .eq("id", activeCart.id);

      await supabase.from("cart_events").insert({
        cart_id: activeCart.id,
        user_id: userId,
        event_name: "purchase",
        event_id: `purchase_${orderNumber || Date.now()}`,
        value: 0,
        currency: "AUD",
        items: [],
        metadata: { order_number: orderNumber },
      });
    }
  } catch (err) {
    console.warn("[CartTracking] Error marking cart purchased:", err);
  }
}
