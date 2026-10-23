import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCountry } from "@/contexts/CountryContext";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { trackGtmViewCart } from "@/lib/gtm";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";
import CartMilestoneProgress from "@/components/cart/CartMilestoneProgress";
import CartItemRow from "@/components/cart/CartItemRow";
import CartRecommendation from "@/components/cart/CartRecommendation";
import CartPriceSummary from "@/components/cart/CartPriceSummary";
import CartCheckoutCTA from "@/components/cart/CartCheckoutCTA";

const Cart = () => {
  useSEO({
    title: "Your Bag — Scalvea Clinical Hair Care",
    description: "Review and manage products in your Scalvea shopping bag.",
    noindex: true,
  });

  const {
    items,
    removeItem,
    updateQuantity,
    addItem,
    total,
    rawTotal,
    bundleDiscount,
    itemCount,
  } = useCart();
  const { user } = useAuth();
  const { currencyCode, selectedCountry } = useCountry();
  const { products } = useProducts();

  const isIndia = selectedCountry === "india";

  // GTM GA4: track view_cart exactly once per visit to /cart
  const viewCartTracked = useRef(false);
  useEffect(() => {
    if (!viewCartTracked.current && items.length > 0) {
      viewCartTracked.current = true;
      trackGtmViewCart({
        items,
        total,
        currency: isIndia ? "INR" : "AUD",
      });
    }
  }, [items, total, isIndia]);

  // Format currency
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

  // India Buy 2 Get 1 Free unlock state
  const isIndiaOfferUnlocked = isIndia && serumCount >= 3 && hasScalp5;

  const isScalp5Item = (item: { productId?: string; name?: string }) => {
    const name = (item.name || "").toLowerCase();
    const id = (item.productId || "").toLowerCase();
    return id.includes("scalp") || name.includes("scalp") || name.includes("dandruff");
  };

  // Shipping Calculation
  // Australia: Free Shipping threshold A$60+, below A$60 is A$9.50
  // India: Free shipping across all India (threshold = 0)
  const freeShippingThreshold = isIndia ? 0 : 60;
  const shipping = total >= freeShippingThreshold ? 0 : isIndia ? 0 : 9.5;

  // Quick addition handler for milestones & recommendations
  // Pass openDrawer = false so customer stays seamlessly on /cart
  const [isAddingItem, setIsAddingItem] = useState(false);

  const handleAddProduct = (type?: "scalp" | "follicle") => {
    setIsAddingItem(true);
    try {
      if (type === "scalp" || (!type && !hasScalp5)) {
        addItem(
          {
            productId: dbScalp5?.id || "scalp-5-anti-dandruff",
            name: dbScalp5?.name || "Scalp-5 Anti-Dandruff Hair Serum",
            image: prod2,
            price_aud: scalp5PriceAud,
            price_inr: scalp5PriceInr,
            price_usd: 0,
          },
          1,
          false // Don't pop drawer over /cart page
        );
      } else {
        addItem(
          {
            productId: dbFollicle8?.id || "1",
            name: dbFollicle8?.name || "Follicle 8 Hair Growth Serum",
            image: prod1,
            price_aud: follicle8PriceAud,
            price_inr: follicle8PriceInr,
            price_usd: 0,
          },
          1,
          false // Don't pop drawer over /cart page
        );
      }
    } finally {
      setTimeout(() => setIsAddingItem(false), 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-14 pb-24 lg:pb-16">
        {/* Page Title & Count */}
        <div className="flex items-baseline justify-between mb-6 sm:mb-8 pb-4 border-b border-neutral-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal font-heading tracking-tight text-neutral-900">
              Your Bag
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-body mt-1">
              Review your items, unlock clinical routine milestones, and proceed to checkout.
            </p>
          </div>
          <span className="text-xs sm:text-sm font-mono font-medium text-neutral-600 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-2xs">
            {itemCount} {itemCount === 1 ? "Item" : "Items"}
          </span>
        </div>

        {/* ─── EMPTY CART STATE ──────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="max-w-md mx-auto my-12 sm:my-20 p-8 sm:p-12 text-center bg-white rounded-3xl border border-neutral-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF9F7] border border-neutral-200/80 flex items-center justify-center text-neutral-400">
              <ShoppingBag className="w-9 h-9 stroke-[1.4]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-heading font-normal text-neutral-900">
                Your bag is empty
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 font-light max-w-xs mx-auto leading-relaxed">
                Explore our scientifically formulated scalp serums designed to support long-term follicle density.
              </p>
            </div>

            <Button
              asChild
              className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs tracking-[0.14em] uppercase h-11 px-8 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
            >
              <Link to="/shop">Explore Products</Link>
            </Button>
          </div>
        ) : (
          /* ─── ACTIVE CART 2-COLUMN LAYOUT ──────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ─── LEFT COLUMN (approx 65% / 7-8 cols on lg) ─────────────────── */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
              {/* 1. Scalvea 3-Stage Milestone Progress Component */}
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
                isAdding={isAddingItem}
              />

              {/* 2. Product Items List */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-semibold tracking-[0.12em] uppercase text-neutral-500 px-1">
                  <span>Selected Products ({items.length})</span>
                  <span>Quantity & Pricing</span>
                </div>

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
                        compact={false}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 3. "Complete Your Routine" Cross-Sell Recommendation */}
              <CartRecommendation
                hasFollicle8={hasFollicle8}
                hasScalp5={hasScalp5}
                serumCount={serumCount}
                scalp5Price={isIndia ? scalp5PriceInr : scalp5PriceAud}
                follicle8Price={isIndia ? follicle8PriceInr : follicle8PriceAud}
                formatPrice={formatPrice}
                onAddProduct={handleAddProduct}
              />

              {/* Back to Shop Shortcut on desktop */}
              <div className="hidden lg:block pt-2">
                <Link
                  to="/shop"
                  className="text-xs uppercase tracking-[0.14em] font-semibold text-neutral-600 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <span>← Continue Browsing Collection</span>
                </Link>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (approx 35% / 4-5 cols on lg) — STICKY ─────────── */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 space-y-4">
              <CartPriceSummary
                rawTotal={rawTotal}
                total={total}
                bundleDiscount={bundleDiscount}
                shipping={shipping}
                isIndia={isIndia}
                currencyCode={currencyCode}
                formatPrice={formatPrice}
              />

              {/* Checkout CTA — Rendered directly below Order Summary on both Mobile and Desktop */}
              <div className="w-full pt-1">
                <CartCheckoutCTA isIndia={isIndia} user={user} />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
