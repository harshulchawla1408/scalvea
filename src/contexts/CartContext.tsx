import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useCountry } from "./CountryContext";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  productId: string;
  name: string;
  price: number; // current country price (computed dynamically)
  image: string;
  quantity: number;
  // Multi-currency prices stored for recalculation on country switch
  price_aud: number;
  price_inr: number;
  price_usd: number;
}

// What's stored in localStorage (includes multi-currency)
interface StoredCartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price_aud: number;
  price_inr: number;
  price_usd: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "price">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  rawTotal: number;
  bundleDiscount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { getPrice, selectedCountry } = useCountry();

  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem("scalvea-cart");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      // Migration: old items without multi-currency prices
      return parsed.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price_aud: item.price_aud ?? item.price ?? 0,
        price_inr: item.price_inr ?? 0,
        price_usd: item.price_usd ?? 0,
      }));
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("scalvea-cart", JSON.stringify(storedItems));
    }
  }, [storedItems]);

  // Sync stored cart items with official DB prices on load
  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, slug, product_prices(*)")
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setStoredItems((prev) => {
          let hasChanges = false;
          const updated = prev.map((item) => {
            const lowerName = (item.name || "").toLowerCase();
            const lowerId = (item.productId || "").toLowerCase();
            const match = data.find(
              (p: any) =>
                p.id === item.productId ||
                p.slug === item.productId ||
                (lowerName.includes("scalp") && p.slug?.includes("scalp")) ||
                (lowerName.includes("follicle") && p.slug?.includes("follicle")) ||
                (lowerId.includes("scalp") && p.slug?.includes("scalp")) ||
                (lowerId.includes("follicle") && p.slug?.includes("follicle"))
            );
            if (match) {
              const prices = Array.isArray(match.product_prices)
                ? match.product_prices[0]
                : match.product_prices || {};
              const price_aud = Number(prices.price_aud) || item.price_aud;
              const price_inr = Number(prices.price_inr) || item.price_inr;
              if (item.price_inr !== price_inr || item.price_aud !== price_aud) {
                hasChanges = true;
                return {
                  ...item,
                  price_aud,
                  price_inr,
                };
              }
            }
            return item;
          });
          return hasChanges ? updated : prev;
        });
      })
      .catch(() => {});
  }, []);

  // Derive items with current country price
  const items: CartItem[] = storedItems.map((item) => ({
    ...item,
    price: getPrice(item.price_aud, item.price_inr, item.price_usd),
  }));

  const addItem = (item: Omit<CartItem, "quantity" | "price">, quantity = 1) => {
    setStoredItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        productId: item.productId,
        name: item.name,
        image: item.image,
        quantity,
        price_aud: item.price_aud,
        price_inr: item.price_inr,
        price_usd: item.price_usd,
      }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string) => {
    setStoredItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setStoredItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setStoredItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const rawTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Australia Bundle Pricing:
  // Strictly A$69 for 2 products, A$100 for 3 products.
  // When quantity > 3: Math.floor(qty / 3) * 100 + (rem === 2 ? 69 : rem * 34.50)
  //
  // India BUY 2 GET 1 FREE Offer:
  // When 3+ serums in cart and at least 1 is Scalp-5, 1 Scalp-5 (₹899) is FREE.
  const calculateTotal = () => {
    if (selectedCountry === "australia") {
      if (itemCount === 0) return 0;
      if (itemCount === 1) return rawTotal;
      if (itemCount === 2) return 69.0;
      if (itemCount === 3) return 100.0;
      const packsOf3 = Math.floor(itemCount / 3);
      const rem = itemCount % 3;
      return packsOf3 * 100.0 + (rem === 2 ? 69.0 : rem * 34.5);
    }
    if (selectedCountry === "india") {
      const hasScalp5 = items.some(
        (i) =>
          (i.name || "").toLowerCase().includes("scalp") ||
          (i.productId || "").toLowerCase().includes("scalp")
      );
      if (itemCount >= 3 && hasScalp5) {
        const scalp5Item = items.find(
          (i) =>
            (i.name || "").toLowerCase().includes("scalp") ||
            (i.productId || "").toLowerCase().includes("scalp")
        );
        const scalp5Price = scalp5Item?.price ?? 899;
        return Math.max(0, rawTotal - scalp5Price);
      }
      return rawTotal;
    }
    return rawTotal;
  };

  const total = calculateTotal();
  const bundleDiscount = Math.max(0, rawTotal - total);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        rawTotal,
        bundleDiscount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
