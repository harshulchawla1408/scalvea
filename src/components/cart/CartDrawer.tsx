import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { trackGtmViewCart } from "@/lib/gtm";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";
import CartMilestoneProgress from "./CartMilestoneProgress";
import CartItemRow from "./CartItemRow";
import CartRecommendation from "./CartRecommendation";
import CartPriceSummary from "./CartPriceSummary";
import CartCheckoutCTA from "./CartCheckoutCTA";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    total,
    rawTotal,
    bundleDiscount,
    itemCount,
  } = useCart();
  const { currencyCode, selectedCountry } = useCountry();
  const { user } = useAuth();
  const { products } = useProducts();

  const isIndia = selectedCountry === "india";

  // GTM GA4: Track view_cart once per intentional drawer opening
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current && items.length > 0) {
      trackGtmViewCart({
        items,
        total,
        currency: isIndia ? "INR" : "AUD",
      });
    }
    wasOpenRef.current = open;
  }, [open, items, total, isIndia]);

  // Format currency helper
  const formatPrice = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  // Products from DB or official fallback configs
  const dbScalp5 = products.find(
    (p) => p.slug?.includes("scalp") || p.name.toLowerCase().includes("scalp")
  );
  const dbFollicle8 = products.find(
    (p) => p.slug?.includes("follicle") || p.name.toLowerCase().includes("follicle")
  );

  const scalp5PriceInr = dbScalp5?.price_inr ?? 899;
  const scalp5PriceAud = dbScalp5?.price_aud ?? 34.50;
  const follicle8PriceInr = dbFollicle8?.price_inr ?? 999;
  const follicle8PriceAud = dbFollicle8?.price_aud ?? 34.50;

  // Identify serum counts and types
  const hasFollicle8 = items.some(
    (item) =>
      item.productId === "1" ||
      item.productId === dbFollicle8?.id ||
      item.productId.toLowerCase().includes("follicle") ||
      item.name.toLowerCase().includes("follicle")
  );

  const hasScalp5 = items.some(
    (item) =>
      item.productId === "scalp-5-anti-dandruff" ||
      item.productId === dbScalp5?.id ||
      item.productId.toLowerCase().includes("scalp") ||
      item.name.toLowerCase().includes("scalp")
  );

  const serumCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isIndiaOfferUnlocked = isIndia && serumCount >= 3 && hasScalp5;

  const isScalp5Item = (item: { productId?: string; name?: string }) => {
    const name = (item.name || "").toLowerCase();
    const id = (item.productId || "").toLowerCase();
    return id.includes("scalp") || name.includes("scalp") || name.includes("dandruff");
  };

  // Shipping
  const freeShippingThreshold = isIndia ? 0 : 60;
  const shipping = total >= freeShippingThreshold ? 0 : isIndia ? 0 : 9.5;

  const handleAddProduct = (type?: "scalp" | "follicle") => {
    if (type === "scalp" || (!type && !hasScalp5)) {
      addItem({
        productId: dbScalp5?.id || "scalp-5-anti-dandruff",
        name: dbScalp5?.name || "Scalp-5 Anti-Dandruff Hair Serum",
        image: prod2,
        price_aud: scalp5PriceAud,
        price_inr: scalp5PriceInr,
        price_usd: 0,
      });
    } else {
      addItem({
        productId: dbFollicle8?.id || "1",
        name: dbFollicle8?.name || "Follicle 8 Hair Growth Serum",
        image: prod1,
        price_aud: follicle8PriceAud,
        price_inr: follicle8PriceInr,
        price_usd: 0,
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-[#FAF9F7] border-l border-neutral-200">
        {/* 1. CART DRAWER HEADER */}
        <SheetHeader className="px-5 sm:px-6 py-4 border-b border-neutral-200 bg-white flex flex-row items-center justify-between text-left space-y-0 flex-shrink-0 pr-12">
          <div>
            <SheetTitle className="text-xs sm:text-[13px] tracking-[0.2em] uppercase font-semibold text-neutral-900">
              Your Bag ({itemCount})
            </SheetTitle>
            <SheetDescription className="sr-only">
              Shopping bag sidebar drawer
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* 2. EMPTY STATE */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
              <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium tracking-wide text-neutral-900">
                Your bag is empty
              </p>
              <p className="text-xs text-neutral-500 font-light">
                Discover our science-backed scalp & hair routines.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-2 text-xs font-semibold tracking-[0.14em] uppercase h-11 px-8 rounded-xl border-neutral-900 hover:bg-black hover:text-white transition-all"
              onClick={onClose}
            >
              <Link to="/shop">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* 3. SCROLLABLE CART CONTENT */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 space-y-5">
              {/* Scalvea 3-Stage Milestone Progress */}
              <CartMilestoneProgress
                serumCount={serumCount}
                total={total}
                rawTotal={rawTotal}
                bundleDiscount={bundleDiscount}
                isIndia={isIndia}
                currencyCode={currencyCode}
                hasScalp5={hasScalp5}
                hasFollicle8={hasFollicle8}
                onAddSerum={handleAddProduct}
                compact={true}
              />

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const isFreeScalp5 = isIndiaOfferUnlocked && isScalp5Item(item);
                  return (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      onUpdateQuantity={(qty) => updateQuantity(item.productId, qty)}
                      onRemove={() => removeItem(item.productId)}
                      isFreeScalp5={isFreeScalp5}
                      formatPrice={formatPrice}
                      compact={true}
                    />
                  );
                })}
              </div>

              {/* "Complete Your Routine" Cross-Sell */}
              <CartRecommendation
                hasFollicle8={hasFollicle8}
                hasScalp5={hasScalp5}
                serumCount={serumCount}
                scalp5Price={isIndia ? scalp5PriceInr : scalp5PriceAud}
                follicle8Price={isIndia ? follicle8PriceInr : follicle8PriceAud}
                formatPrice={formatPrice}
                onAddProduct={handleAddProduct}
                compact={true}
              />
            </div>

            {/* 4. STICKY DRAWER FOOTER */}
            <div className="border-t border-neutral-200 p-4 sm:p-5 bg-white space-y-3.5 flex-shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
              <CartPriceSummary
                rawTotal={rawTotal}
                total={total}
                bundleDiscount={bundleDiscount}
                shipping={shipping}
                isIndia={isIndia}
                currencyCode={currencyCode}
                formatPrice={formatPrice}
                compact={true}
              />

              <CartCheckoutCTA
                isIndia={isIndia}
                user={user}
                onBeforeNavigate={onClose}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
