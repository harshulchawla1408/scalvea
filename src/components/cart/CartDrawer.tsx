import { Link } from "react-router-dom";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Gift,
  BadgePercent,
  Truck,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ─── Product Configurations for Cart Upsell / Recommendation ────────────────
const SCALP5_CONFIG = {
  productId: "scalp-5-anti-dandruff",
  name: "Scalp-5 Anti-Dandruff Hair Serum",
  price_inr: 899,
  price_aud: 34.50,
  price_usd: 0,
  image: prod2,
};

const FOLLICLE8_CONFIG = {
  productId: "1",
  name: "Follicle 8 Hair Growth Serum",
  price_inr: 999,
  price_aud: 34.50,
  price_usd: 0,
  image: prod1,
};

// Always resolve official packaging assets for Follicle 8 and Scalp-5
const getItemImage = (item: { productId?: string; name?: string; image?: string }) => {
  const name = (item.name || "").toLowerCase();
  const id = (item.productId || "").toLowerCase();
  if (id.includes("scalp") || name.includes("scalp") || name.includes("dandruff")) {
    return prod2;
  }
  if (id === "1" || id.includes("follicle") || name.includes("follicle") || name.includes("growth")) {
    return prod1;
  }
  return item.image || prod1;
};

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, addItem, removeItem, updateQuantity, total, rawTotal, bundleDiscount, itemCount } = useCart();
  const { currencyCode, selectedCountry } = useCountry();
  const { products } = useProducts();

  const isIndia = selectedCountry === "india";

  // Dynamic products and prices fetched from DB
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

  const formatVal = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  // ── Identify products in cart ──────────────────────────────────────────────
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
      item.productId.toLowerCase().includes("scalp-5") ||
      item.name.toLowerCase().includes("scalp")
  );

  // Total serums count in cart
  const serumCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Recommendation logic:
  // - Follicle 8 only (1 bottle) -> Recommend Scalp-5
  // - Scalp-5 only (1 bottle) -> Recommend Follicle 8
  // - Both products in cart OR 2+ serums (already qualified for BUY 2 GET 1 FREE or Australia bundle) -> Hide recommendation
  const showScalp5Rec = hasFollicle8 && !hasScalp5 && serumCount < 2;
  const showFollicle8Rec = hasScalp5 && !hasFollicle8 && serumCount < 2;
  const showRecommendation = showScalp5Rec || showFollicle8Rec;

  const handleAddScalp5 = () => {
    addItem({
      productId: dbScalp5?.id || SCALP5_CONFIG.productId,
      name: dbScalp5?.name || SCALP5_CONFIG.name,
      image: prod2,
      price_aud: scalp5PriceAud,
      price_inr: scalp5PriceInr,
      price_usd: SCALP5_CONFIG.price_usd,
    });
  };

  const handleAddFollicle8 = () => {
    addItem({
      productId: dbFollicle8?.id || FOLLICLE8_CONFIG.productId,
      name: dbFollicle8?.name || FOLLICLE8_CONFIG.name,
      image: prod1,
      price_aud: follicle8PriceAud,
      price_inr: follicle8PriceInr,
      price_usd: FOLLICLE8_CONFIG.price_usd,
    });
  };

  // Target counterpart serum to add when clicking offer buttons
  const handleAddCounterpart = () => {
    if (!hasScalp5) {
      handleAddScalp5();
    } else if (!hasFollicle8) {
      handleAddFollicle8();
    } else {
      // If both or neither, default add Scalp-5
      handleAddScalp5();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l border-border/80">
        {/* 1. CART HEADER */}
        <SheetHeader className="px-6 py-4 border-b border-border/60 flex flex-row items-center justify-between text-left space-y-0 flex-shrink-0 pr-12">
          <SheetTitle className="text-xs sm:text-[13px] tracking-[0.2em] uppercase font-medium text-foreground">
            Your Bag ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {/* 2. COUNTRY-SPECIFIC FREE SHIPPING BAR */}
        <div className="bg-neutral-900 text-white py-2 px-4 text-center select-none shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0">
          {isIndia ? (
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide">
              <span>Free Shipping Across All India</span>
              <img
                src="https://flagcdn.com/w20/in.png"
                alt="India"
                className="w-4 h-auto rounded-[2px] shadow-sm inline-block"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-wide">
              <span>Free Shipping A$60+</span>
              <img
                src="https://flagcdn.com/w20/au.png"
                alt="Australia"
                className="w-4 h-auto rounded-[2px] shadow-sm inline-block"
              />
            </div>
          )}
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium tracking-wide text-foreground">Your bag is empty</p>
              <p className="text-xs text-muted-foreground font-light">
                Discover our science-backed scalp & hair routines.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="mt-2 text-xs font-medium tracking-[0.14em] uppercase h-11 px-8 rounded-none border-foreground hover:bg-foreground hover:text-background transition-all"
              onClick={onClose}
            >
              <Link to="/shop">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* SCROLLABLE CART CONTENT */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-6 py-4 space-y-6 divide-y divide-border/40">
              {/* ITEM LIST */}
              <div className="space-y-4 pt-1">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start gap-3 sm:gap-4 group min-w-0"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 min-w-[64px] min-h-[64px] max-w-[64px] sm:min-w-[80px] sm:max-w-[80px] bg-secondary/30 rounded-lg border border-border/50 flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-[13px] font-medium text-foreground leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs font-semibold text-foreground mt-1">
                        {formatVal(item.price)}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">
                        Inclusive of all taxes
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border border-border/80 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-medium w-7 text-center tabular-nums text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded border border-border/80 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 -mr-1 self-start text-muted-foreground/60 hover:text-foreground transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 3. CONTEXTUAL PRODUCT RECOMMENDATION ("COMPLETE YOUR ROUTINE") */}
              {showRecommendation && (
                <div className="pt-5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#a07840]" />
                      Complete Your Routine
                    </span>
                    <span className="text-[10px] font-medium text-[#8b6528] tracking-wide">
                      Recommended
                    </span>
                  </div>

                  {showScalp5Rec && (
                    <div className="rounded-xl border border-[#e8ded2] bg-gradient-to-r from-[#fdfaf5] to-[#fcf8f2] p-3.5 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-white border border-[#e6dcce] flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                        <img
                          src={SCALP5_CONFIG.image}
                          alt={SCALP5_CONFIG.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                          {SCALP5_CONFIG.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-light">
                          Complete your scalp routine
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1">
                          {formatVal(isIndia ? scalp5PriceInr : scalp5PriceAud)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddScalp5}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold tracking-wider uppercase hover:bg-foreground/85 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> ADD
                      </button>
                    </div>
                  )}

                  {showFollicle8Rec && (
                    <div className="rounded-xl border border-[#e8ded2] bg-gradient-to-r from-[#fdfaf5] to-[#fcf8f2] p-3.5 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-white border border-[#e6dcce] flex-shrink-0 overflow-hidden p-1 flex items-center justify-center">
                        <img
                          src={FOLLICLE8_CONFIG.image}
                          alt={FOLLICLE8_CONFIG.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                          {FOLLICLE8_CONFIG.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-light">
                          Complete your hair care routine
                        </p>
                        <p className="text-xs font-bold text-foreground mt-1">
                          {formatVal(isIndia ? follicle8PriceInr : follicle8PriceAud)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddFollicle8}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-semibold tracking-wider uppercase hover:bg-foreground/85 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> ADD
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4. INDIA OFFERS (Only when isIndia) */}
              {isIndia && (
                <div className="pt-5 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
                      Available Offers
                    </p>
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                      Applied at checkout
                    </span>
                  </div>

                  {serumCount >= 2 && (
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-[#f5fbf7] p-3.5 shadow-[0_10px_25px_rgba(16,185,129,0.08)]">
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" />
                      <div className="pl-2 flex items-center gap-3">
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-white p-1 shadow-sm">
                          <img src={prod2} alt="Scalp-5 Anti-Dandruff Hair Serum" className="h-full w-full object-contain" />
                          <span className="absolute bottom-1 right-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                            Free
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-emerald-700">
                              Gift with order
                            </span>
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                              Included
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] font-semibold text-foreground leading-tight">
                            Scalp-5 Anti-Dandruff Hair Serum
                          </p>
                          <p className="mt-1 text-[10px] text-emerald-700 font-medium">
                            You qualify for 1 free serum with your 2-serum purchase.
                          </p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <Check className="h-3 w-3" />
                            Totally free at checkout
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. GET20 Card */}
                  <div className="rounded-xl border border-[#dfcca8]/70 bg-gradient-to-r from-[#fdf8f0] to-[#fffcf8] p-3 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f4e8cf] text-[#8c672b] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgePercent className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-[#7e5c26] tracking-wider bg-[#f6ecda] px-1.5 py-0.5 rounded">
                          GET20
                        </span>
                        <span className="text-[11px] font-bold text-foreground tracking-wide uppercase">
                          GET20 for all orders
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-500 font-medium mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 flex-shrink-0" /> Automatically applied at final stage
                      </p>
                    </div>
                  </div>

                  {/* 2. BUY 2 GET 1 SCALP-5 SERUM FREE Card */}
                  <div
                    className={`rounded-xl border p-3 transition-all ${
                      serumCount >= 2
                        ? "border-emerald-500/80 bg-[#f2faf4]"
                        : "border-emerald-300/60 bg-[#f6fcf8]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          serumCount >= 2 ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[11px] font-extrabold text-emerald-900 tracking-wide uppercase">
                            Buy 2 Get 1 Scalp-5 Serum Free
                          </span>
                          {serumCount >= 2 && (
                            <span className="text-[9px] font-extrabold tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">
                              QUALIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500 font-medium mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3 flex-shrink-0" /> Automatically applied at final stage
                        </p>
                      </div>
                    </div>

                    {/* Action button if only 1 serum in cart */}
                    {serumCount === 1 && (
                      <button
                        type="button"
                        onClick={handleAddCounterpart}
                        className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                      >
                        <Plus className="w-3 h-3" /> Add 2nd Serum to Qualify for Free Scalp-5
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground/70 font-light text-center tracking-widest uppercase pt-0.5">
                    Offers cannot be combined
                  </p>
                </div>
              )}

              {/* 5. AUSTRALIA OFFERS (Only when not India) */}
              {!isIndia && (
                <div className="pt-5 space-y-2.5">
                  <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
                    Bundle & Save
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* BUY 2 — A$69 */}
                    <div
                      className={`relative rounded-xl border p-3 text-center flex flex-col justify-between transition-all ${
                        serumCount >= 2
                          ? "border-emerald-500 bg-[#f2faf5]"
                          : "border-border/80 bg-background"
                      }`}
                    >
                      <div>
                        {serumCount >= 2 ? (
                          <span className="inline-block text-[9px] font-extrabold tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase mb-1">
                            UNLOCKED ✓
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold tracking-wider text-muted-foreground uppercase mb-1">
                            BUNDLE
                          </span>
                        )}
                        <p className="text-xs font-extrabold text-foreground tracking-tight">BUY 2</p>
                        <p className="text-lg font-black text-foreground mt-0.5 tracking-tight">A$69</p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                          <Truck className="w-3 h-3" /> Free Delivery
                        </div>
                      </div>

                      {serumCount === 1 && (
                        <button
                          type="button"
                          onClick={handleAddCounterpart}
                          className="mt-2.5 w-full py-1.5 rounded-md bg-foreground text-background text-[10px] font-bold uppercase tracking-wider hover:bg-foreground/85 active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" /> Add 1 more
                        </button>
                      )}
                    </div>

                    {/* BUY 3 — A$100 */}
                    <div
                      className={`relative rounded-xl border p-3 text-center flex flex-col justify-between transition-all ${
                        serumCount >= 3
                          ? "border-emerald-500 bg-[#f2faf5]"
                          : "border-[#2d6ea4]/60 bg-[#f7faff]"
                      }`}
                    >
                      <div>
                        {serumCount >= 3 ? (
                          <span className="inline-block text-[9px] font-extrabold tracking-wider bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase mb-1">
                            UNLOCKED ✓
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-extrabold tracking-wider bg-[#2d6ea4] text-white px-1.5 py-0.5 rounded uppercase mb-1">
                            BEST VALUE
                          </span>
                        )}
                        <p className="text-xs font-extrabold text-foreground tracking-tight">BUY 3</p>
                        <p className="text-lg font-black text-foreground mt-0.5 tracking-tight">A$100</p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                          <Truck className="w-3 h-3" /> Free Delivery
                        </div>
                      </div>

                      {serumCount < 3 && (
                        <button
                          type="button"
                          onClick={handleAddCounterpart}
                          className="mt-2.5 w-full py-1.5 rounded-md bg-[#2d6ea4] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#235682] active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-2.5 h-2.5" /> Add {Math.max(1, 3 - serumCount)} more
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. CART FOOTER */}
            <div className="border-t border-border/70 p-5 sm:p-6 bg-background/95 backdrop-blur-sm space-y-3.5 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
              {bundleDiscount > 0 && !isIndia && (
                <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Bundle Deal Applied
                  </span>
                  <span className="font-bold">-{formatVal(bundleDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline">
                <span className="text-xs tracking-[0.14em] uppercase font-semibold text-foreground">
                  Subtotal
                </span>
                <div className="text-right">
                  <div className="flex items-baseline gap-2 justify-end">
                    {bundleDiscount > 0 && !isIndia && (
                      <span className="text-xs text-muted-foreground line-through font-mono">
                        {formatVal(rawTotal)}
                      </span>
                    )}
                    <span className="block font-bold text-base sm:text-lg text-foreground tracking-tight font-mono">
                      {formatVal(total)} {currencyCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5">
                    Inclusive of all taxes
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground font-light text-center">
                Shipping & taxes calculated at checkout
              </p>

              {/* Dominant Checkout CTA */}
              <Button
                asChild
                className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs sm:text-sm font-bold tracking-[0.14em] uppercase h-12 rounded-lg transition-all active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"
              >
                <Link to="/checkout" onClick={onClose}>
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
