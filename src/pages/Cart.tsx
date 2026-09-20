import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShippingAnnouncementBar from "@/components/layout/ShippingAnnouncementBar";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Gift, Check } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

const Cart = () => {
  useSEO({
    title: "Your Bag",
    description: "View and manage items in your Scalvea shopping cart.",
    noindex: true
  });

  const { items, removeItem, updateQuantity, addItem, total, rawTotal, bundleDiscount } = useCart();
  const { currencySymbol, currencyCode, settings, selectedCountry } = useCountry();
  const { products } = useProducts();

  const isIndia = selectedCountry === "india";
  const formatVal = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  const dbScalp5 = products.find(
    (p) => p.slug?.includes("scalp") || p.name.toLowerCase().includes("scalp")
  );
  const dbFollicle8 = products.find(
    (p) => p.slug?.includes("follicle") || p.name.toLowerCase().includes("follicle")
  );

  const isScalp5Item = (item: { productId?: string; name?: string }) => {
    const name = (item.name || "").toLowerCase();
    const id = (item.productId || "").toLowerCase();
    return id.includes("scalp") || name.includes("scalp") || name.includes("dandruff");
  };

  const totalSerumCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const hasScalp5 = items.some(isScalp5Item);
  const isIndiaOfferUnlocked = isIndia && totalSerumCount >= 3 && hasScalp5;

  const handleAddScalp5 = () => {
    addItem({
      productId: dbScalp5?.id || "scalp-5-anti-dandruff",
      name: dbScalp5?.name || "Scalp-5 Anti-Dandruff Hair Serum",
      image: prod2,
      price_aud: dbScalp5?.price_aud ?? 34.50,
      price_inr: dbScalp5?.price_inr ?? 899,
      price_usd: 0,
    });
  };

  const handleAddFollicle8 = () => {
    addItem({
      productId: dbFollicle8?.id || "1",
      name: dbFollicle8?.name || "Follicle 8 Hair Growth Serum",
      image: prod1,
      price_aud: dbFollicle8?.price_aud ?? 34.50,
      price_inr: dbFollicle8?.price_inr ?? 999,
      price_usd: 0,
    });
  };

  const freeShippingThreshold = isIndia ? 0 : 60;
  const shipping = total >= freeShippingThreshold ? 0 : (isIndia ? 0 : 9.50);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="text-3xl font-light tracking-[0.04em] mb-8">Your Bag</h1>
        
        {/* HIGHLIGHTED SHIPPING BANNER */}
        <ShippingAnnouncementBar variant="inline" className="mb-8" />

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your bag is empty</p>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              
              {/* INDIA BUY 2 GET 1 FREE PROMOTIONAL OFFER BANNER */}
              {isIndia && (
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                    isIndiaOfferUnlocked
                      ? "border-emerald-500/80 bg-gradient-to-r from-[#f0faf2] via-white to-[#f5fbf7] shadow-xs"
                      : "border-neutral-200 bg-[#fafafa]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isIndiaOfferUnlocked ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 uppercase tracking-wide">
                          BUY 2, GET 1 FREE
                        </span>
                        {isIndiaOfferUnlocked ? (
                          <span className="text-[10px] font-extrabold tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Check className="w-3 h-3" /> UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-medium tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                            PROMOTIONAL OFFER
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 font-light mt-1 leading-relaxed">
                        Add any 3 Scalvea serums to your cart and get 1 Scalp-5 Anti Dandruff Hair Serum FREE.
                      </p>

                      {/* Dynamic State Feedback */}
                      {isIndiaOfferUnlocked ? (
                        <div className="mt-3 pt-2.5 border-t border-emerald-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Offer unlocked — 1 Scalp-5 is FREE</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium">
                            ✓ ₹899 discount applied to your total
                          </p>
                        </div>
                      ) : totalSerumCount >= 3 && !hasScalp5 ? (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="text-xs font-medium text-amber-800">
                            Add Scalp-5 Anti Dandruff Serum to unlock your FREE gift
                          </p>
                          <Button
                            size="sm"
                            onClick={handleAddScalp5}
                            className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider h-8 px-4"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Scalp-5
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2.5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="text-xs font-medium text-neutral-700">
                            {totalSerumCount === 2
                              ? "Add 1 more serum to unlock your FREE Scalp-5"
                              : `Add ${Math.max(1, 3 - totalSerumCount)} more serums to unlock your FREE Scalp-5`}
                          </p>
                          <Button
                            size="sm"
                            onClick={!hasScalp5 ? handleAddScalp5 : handleAddFollicle8}
                            className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider h-8 px-4"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add {!hasScalp5 ? "Scalp-5" : "Serum"}
                          </Button>
                        </div>
                      )}

                      <p className="text-[10px] text-neutral-500 font-light mt-2">
                        Offer cannot be combined with other promotions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items table */}
              <div className="space-y-0">
                <div className="border-b border-border pb-4 mb-6 hidden sm:grid grid-cols-12 gap-4">
                  <p className="col-span-6 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">Product</p>
                  <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">Quantity</p>
                  <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground text-right">Price</p>
                  <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground text-right">Total</p>
                </div>
                {items.map((item) => {
                  const isFreeScalp5 = isIndiaOfferUnlocked && isScalp5Item(item);
                  return (
                    <div key={item.productId} className="border-b border-border py-6 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-12 sm:col-span-6 flex gap-4">
                        <div className="w-20 h-24 bg-secondary flex-shrink-0 relative overflow-hidden rounded-md border border-border/40">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          {isFreeScalp5 && (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded shadow-xs uppercase">
                              FREE
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium">{item.name}</p>
                            {isFreeScalp5 && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                <Gift className="w-2.5 h-2.5 text-emerald-600" /> Free Gift
                              </span>
                            )}
                          </div>
                          <button onClick={() => removeItem(item.productId)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.08em] text-left mt-1">Remove</button>
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <div className="flex items-center border border-border w-fit rounded-md overflow-hidden">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center hover:bg-neutral-100 transition-colors"><Minus className="h-3 w-3" /></button>
                          <span className="h-8 w-8 flex items-center justify-center text-xs border-x border-border font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-neutral-100 transition-colors"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="col-span-4 sm:col-span-2 text-right">
                        {isFreeScalp5 ? (
                          <div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                              <Gift className="w-3 h-3 text-emerald-600" /> FREE
                            </span>
                            <p className="text-[9px] text-muted-foreground line-through font-mono mt-0.5">{formatVal(item.price)}</p>
                          </div>
                        ) : (
                          <p className="text-sm">{formatVal(item.price)}</p>
                        )}
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">Inclusive of all taxes</p>
                      </div>
                      <div className="col-span-4 sm:col-span-2 text-right">
                        {isFreeScalp5 ? (
                          <div>
                            {item.quantity === 1 ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                                <Gift className="w-3 h-3 text-emerald-600" /> FREE
                              </span>
                            ) : (
                              <div className="text-right">
                                <span className="text-xs font-semibold text-foreground block">
                                  {formatVal(item.price * (item.quantity - 1))}
                                </span>
                                <span className="text-[9px] text-emerald-700 font-medium block">
                                  + 1 FREE Scalp-5
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">{formatVal(item.price * item.quantity)}</p>
                        )}
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">Inclusive of all taxes</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:sticky lg:top-32 lg:h-fit bg-secondary p-8 space-y-6 rounded-2xl border border-border/60">
              <h2 className="text-sm font-semibold tracking-[0.1em] uppercase">Order Summary</h2>

              {/* Offer reminder in summary */}
              {isIndiaOfferUnlocked && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    <span>BUY 2, GET 1 FREE UNLOCKED</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">1 Scalp-5 Anti Dandruff Serum FREE</p>
                  <p className="text-[10px] text-emerald-600 font-medium">✓ ₹899 discount applied to your total</p>
                  <p className="text-[9px] text-muted-foreground/80 pt-0.5">Offer cannot be combined with other promotions.</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-mono">{formatVal(bundleDiscount > 0 ? rawTotal : total)}</span>
                </div>
                {bundleDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-emerald-600" />
                      {isIndia ? "BUY 2, GET 1 FREE (1 Scalp-5 Free)" : "Bundle & Save"}
                    </span>
                    <span className="font-mono">-{formatVal(bundleDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Shipping</span>
                  <span className="font-mono">
                      {shipping === 0 ? (
                        "Free Shipping"
                      ) : (
                        <span className="font-medium text-foreground">{formatVal(shipping)}</span>
                      )}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-normal">
                  <span className="font-medium">Total</span>
                  <div className="text-right font-mono">
                    <span className="block font-semibold text-base">{formatVal(total + shipping)} {currencyCode}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5 font-body">Inclusive of all taxes</span>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold tracking-[0.1em] uppercase">
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Link to="/shop" className="block text-center text-sm font-medium tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
