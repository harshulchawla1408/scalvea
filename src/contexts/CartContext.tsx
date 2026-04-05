import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useCountry } from "./CountryContext";

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
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { getPrice } = useCountry();

  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(() => {
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
    localStorage.setItem("scalvea-cart", JSON.stringify(storedItems));
  }, [storedItems]);

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
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, total, isCartOpen, setIsCartOpen }}
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
