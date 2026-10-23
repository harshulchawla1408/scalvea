import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { debouncedSyncCart, syncCartNow, markCartPurchased } from "@/services/cartTrackingService";

/**
 * CartSyncManager
 *
 * Runs seamlessly in the background to synchronize logged-in customers' carts
 * to Supabase without any UI intrusion or performance penalty.
 *
 * Strict Rules:
 * - Only runs for authenticated customers (guest users are never stored).
 * - Debounces rapid updates (adding items, incrementing/decrementing).
 * - Tracks 'begin_checkout' when the user accesses /checkout.
 * - Tracks 'purchase' when the user lands on /order-success.
 */
export const CartSyncManager = () => {
  const { items, total, rawTotal, bundleDiscount, itemCount } = useCart();
  const { user } = useAuth();
  const { selectedCountry, currencyCode } = useCountry();
  const location = useLocation();

  const prevItemCountRef = useRef(itemCount);
  const prevItemsHashRef = useRef("");
  const isFirstRender = useRef(true);

  // 1. Sync cart modifications for logged-in user
  useEffect(() => {
    // Only logged in users
    if (!user) return;

    // Build serialized string of item IDs and quantities
    const currentHash = items.map((i) => `${i.productId}:${i.quantity}`).join(",");

    // Skip initial mount if cart is empty
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (items.length > 0) {
        debouncedSyncCart(
          {
            user,
            items,
            total,
            rawTotal,
            bundleDiscount,
            country: selectedCountry === "india" ? "India" : "Australia",
            currency: currencyCode,
            eventName: "add_to_cart",
          },
          1500
        );
      }
      prevItemCountRef.current = itemCount;
      prevItemsHashRef.current = currentHash;
      return;
    }

    // Only sync if cart items or count actually changed
    if (currentHash !== prevItemsHashRef.current) {
      const isAddition = itemCount > prevItemCountRef.current;
      const isRemoval = itemCount < prevItemCountRef.current;
      const eventName = isAddition
        ? "add_to_cart"
        : isRemoval
        ? "remove_from_cart"
        : "update_quantity";

      prevItemCountRef.current = itemCount;
      prevItemsHashRef.current = currentHash;

      debouncedSyncCart(
        {
          user,
          items,
          total,
          rawTotal,
          bundleDiscount,
          country: selectedCountry === "india" ? "India" : "Australia",
          currency: currencyCode,
          eventName,
        },
        1000
      );
    }
  }, [items, total, rawTotal, bundleDiscount, itemCount, user, selectedCountry, currencyCode]);

  // 2. Track 'begin_checkout' when user enters /checkout
  useEffect(() => {
    if (!user || items.length === 0) return;

    if (location.pathname === "/checkout") {
      syncCartNow({
        user,
        items,
        total,
        rawTotal,
        bundleDiscount,
        country: selectedCountry === "india" ? "India" : "Australia",
        currency: currencyCode,
        eventName: "begin_checkout",
      }).catch(() => {});
    }
  }, [location.pathname, user, items, total, rawTotal, bundleDiscount, selectedCountry, currencyCode]);

  // 3. Track 'purchase' when user reaches /order-success
  useEffect(() => {
    if (!user) return;

    if (location.pathname.startsWith("/order-success")) {
      const searchParams = new URLSearchParams(location.search);
      const orderNumber = searchParams.get("order") || undefined;
      markCartPurchased(user.id, orderNumber).catch(() => {});
    }
  }, [location.pathname, location.search, user]);

  return null;
};

export default CartSyncManager;
