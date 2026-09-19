import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useProducts } from "@/hooks/useProducts";
import {
  Lock,
  ShieldCheck,
  Truck,
  Package,
  Zap,
  Gift,
  Plus,
  Star,
  BadgePercent,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";
import paytmSvg from "@/assets/paytm.svg";
import bhimSvg from "@/assets/bhim.svg";
import phonepeSvg from "@/assets/phonepe.svg";
import rupaySvg from "@/assets/rupay.svg";
import visaSvg from "@/assets/visa.svg";
import cardSvg from "@/assets/card.svg";
import codSvg from "@/assets/cod.svg";
import applepaySlug from "@/assets/applepay.svg";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUSTRALIA_STATES = [
  "New South Wales (NSW)",
  "Victoria (VIC)",
  "Queensland (QLD)",
  "Western Australia (WA)",
  "South Australia (SA)",
  "Tasmania (TAS)",
  "Australian Capital Territory (ACT)",
  "Northern Territory (NT)",
];

// Scalp-5 static config — update productId once confirmed in DB
const SCALP5_CONFIG = {
  productId: "scalp-5-anti-dandruff",
  name: "Scalp-5 Anti-Dandruff Hair Serum",
  price_inr: 899,
  price_aud: 34.50,
  price_usd: 0,
  image: prod2,
};

// Follicle 8 Hair Growth Serum static config for recommendations
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

// Product ID sets for bidirectional recommendations
const FOLLICLE8_PRODUCT_IDS = ["1"];
const SCALP5_PRODUCT_IDS = ["scalp-5-anti-dandruff"];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** India — offer cards: GET20 + Free Shipping + BUY 2 GET 1 FREE */
const IndiaOfferCards = ({ onAddSerum, totalItems }: { onAddSerum: () => void; totalItems: number }) => {
  const isQualified = totalItems >= 2;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
          Available Offers
        </p>
        <span className="text-[10px] font-medium text-emerald-700">
          Applied at checkout
        </span>
      </div>

      {/* 1. GET20 Card */}
      <div className="relative overflow-hidden rounded-xl border-2 border-[#c9a97a]/50 bg-gradient-to-r from-[#fdf6eb] to-[#fefaf3] p-4">
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-[#c9a97a]" />
        <div className="pl-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#c9a97a]/20 flex items-center justify-center">
            <BadgePercent className="w-5 h-5 text-[#9a6f30]" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-base font-extrabold text-[#7a5a2a] tracking-widest">GET20</span>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">— GET20 FOR ALL ORDERS</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-light mt-0.5">
              Get 20% discount on your order
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
              ✓ Automatically applied at final stage
            </p>
          </div>
        </div>
      </div>

      {/* 2. BUY 2 GET 1 SCALP-5 SERUM FREE Card */}
      <div
        className={`relative overflow-hidden rounded-xl border-2 transition-all p-4 ${
          isQualified
            ? "border-emerald-500/80 bg-gradient-to-r from-[#eef9f1] to-[#f5fbf7]"
            : "border-emerald-300/60 bg-gradient-to-r from-[#f0faf2] to-[#f5fcf6]"
        }`}
      >
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-emerald-500" />
        <div className="pl-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                isQualified ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Gift className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                  Buy 2 Get 1 Scalp-5 Serum Free
                </span>
                {isQualified && (
                  <span className="text-[9px] font-extrabold tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">
                    QUALIFIED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-light">
                Buy any 2 Scalvea serums — get 1 Scalp-5 FREE.
              </p>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                ✓ Automatically applied at final stage
              </p>
            </div>
          </div>
          {!isQualified && (
            <button
              type="button"
              onClick={onAddSerum}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors active:scale-[0.98]"
            >
              <Plus className="w-3 h-3" /> Add Another Serum to Qualify for Free Scalp-5
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/70 font-light text-center tracking-widest uppercase">
        Offers cannot be combined
      </p>
    </div>
  );
};

/** India — Partial COD visual badge */
const PartialCodBadge = () => (
  <div className="rounded-xl border border-[#e0e0e0] bg-white p-4">
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#f5f5f5] flex items-center justify-center">
        <Package className="w-4.5 h-4.5 text-foreground" strokeWidth={1.8} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-foreground">
            Partial COD Available
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider bg-foreground text-background rounded uppercase">
            TRUSTED
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground font-light mt-0.5">
          Pay <span className="font-semibold text-foreground">₹249 now</span> · Pay the remaining amount on delivery
        </p>
      </div>
    </div>
  </div>
);

/** India — Payment method visual trust strip using real SVG assets */
const INDIA_PAYMENT_METHODS = [
  { src: paytmSvg,  alt: "Paytm",    label: "Paytm" },
  { src: bhimSvg,   alt: "BHIM UPI", label: "BHIM UPI" },
  { src: phonepeSvg,alt: "PhonePe",  label: "PhonePe" },
  { src: visaSvg,   alt: "Visa",     label: "Visa" },
  { src: rupaySvg,  alt: "RuPay",    label: "RuPay" },
  { src: cardSvg,   alt: "Cards",    label: "Cards / EMI" },
  { src: codSvg,    alt: "COD",      label: "COD" },
] as const;

const IndiaPaymentTrustStrip = () => (
  <div className="rounded-xl border border-[#e8e8e8] bg-white p-4">
    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground mb-3">
      We Accept
    </p>
    {/* GPay inline since we don't have a separate asset */}
    <div className="flex flex-wrap items-center gap-2">
      {/* GPay — inline SVG wordmark (no asset available) */}
      <div className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-[#fafafa] text-[12px] font-black text-[#1a73e8] tracking-tight select-none">
        G<span className="text-[#ea4335]">P</span><span className="text-[#fbbc05]">a</span><span className="text-[#34a853]">y</span>
      </div>
      {INDIA_PAYMENT_METHODS.map(({ src, alt, label }) => (
        <div
          key={alt}
          title={label}
          className="h-8 w-12 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-[#fafafa] overflow-hidden p-1"
        >
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground/70 font-light mt-3 tracking-wide">
      Payments processed securely via Shiprocket
    </p>
  </div>
);

/** Shared — Trust indicators (country-aware) */
const TrustIndicators = ({ isIndia }: { isIndia: boolean }) => {
  const items = isIndia
    ? [
        { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Secure Payments" },
        { icon: <Truck className="w-3.5 h-3.5" />, label: "Fast Delivery" },
        { icon: <Zap className="w-3.5 h-3.5" />, label: "Easy Checkout" },
        { icon: <Package className="w-3.5 h-3.5" />, label: "Order Protection" },
      ]
    : [
        { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Secure Payment" },
        { icon: <Truck className="w-3.5 h-3.5" />, label: "Australia-Wide Delivery" },
        { icon: <Package className="w-3.5 h-3.5" />, label: "Carefully Packed" },
        { icon: <Zap className="w-3.5 h-3.5" />, label: "Easy Checkout" },
      ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#ebebeb] bg-white text-[11px] font-medium text-foreground"
        >
          <span className="text-emerald-600 flex-shrink-0">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
};

/** Shared — product recommendation card */
const ProductRecommendationCard = ({
  image,
  name,
  subtitle,
  price,
  label,
  onAdd,
}: {
  image: string;
  name: string;
  subtitle: string;
  price: string;
  label: string;
  onAdd: () => void;
}) => (
  <div className="mt-4 rounded-xl border border-[#e4d5c4] bg-gradient-to-r from-[#fdf9f5] to-[#fefbf7] p-4">
    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#a07840] mb-3 flex items-center gap-1.5">
      <Star className="w-3 h-3" />
      {label}
    </p>
    <div className="flex gap-3 items-center">
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#e8ddd0] flex-shrink-0 bg-[#f5f0eb]">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-foreground leading-snug">{name}</p>
        <p className="text-[10px] text-muted-foreground font-light mt-0.5">{subtitle}</p>
        <p className="text-sm font-bold text-foreground mt-1">{price}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-foreground text-background text-[11px] font-semibold tracking-[0.06em] uppercase transition-all hover:bg-foreground/85 active:scale-95"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
    </div>
  </div>
);

/** Australia — actionable bundle deal cards */
const AustraliaOfferCards = ({
  totalItems,
  onAddOne,
}: {
  totalItems: number;
  onAddOne: () => void;
}) => {
  const needForBundle2 = Math.max(0, 2 - totalItems);
  const needForBundle3 = Math.max(0, 3 - totalItems);
  const hasBuy2 = totalItems >= 2;
  const hasBuy3 = totalItems >= 3;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-muted-foreground">
        Bundle Deals
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* BUY 2 */}
        <div
          className={`relative rounded-xl border-2 p-4 text-center transition-all ${
            hasBuy2
              ? "border-emerald-500 bg-gradient-to-br from-[#f0faf5] to-[#f6fcf8]"
              : "border-[#c2d4e8] bg-white"
          }`}
        >
          {hasBuy2 && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[9px] font-extrabold tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                ✓ UNLOCKED
              </span>
            </div>
          )}
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#2d6ea4] mb-1">BUY 2</p>
          <p className="text-[26px] font-extrabold text-foreground leading-none tracking-tight">A$69</p>
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Truck className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">Free Delivery</span>
          </div>
          {!hasBuy2 && needForBundle2 > 0 && (
            <button
              type="button"
              onClick={onAddOne}
              className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2d6ea4] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#235480] transition-colors active:scale-[0.98]"
            >
              <Plus className="w-2.5 h-2.5" /> Add {needForBundle2} more
            </button>
          )}
        </div>

        {/* BUY 3 — BEST VALUE */}
        <div
          className={`relative rounded-xl border-2 p-4 text-center transition-all ${
            hasBuy3
              ? "border-emerald-500 bg-gradient-to-br from-[#f0faf5] to-[#f6fcf8]"
              : "border-[#2d6ea4] bg-gradient-to-br from-[#ebf3fb] to-[#f3f8fd]"
          }`}
        >
          {hasBuy3 ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[9px] font-extrabold tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                ✓ UNLOCKED
              </span>
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[9px] font-extrabold tracking-widest bg-[#2d6ea4] text-white px-2.5 py-0.5 rounded-full uppercase">
                BEST VALUE
              </span>
            </div>
          )}
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#2d6ea4] mb-1">BUY 3</p>
          <p className="text-[26px] font-extrabold text-foreground leading-none tracking-tight">A$100</p>
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Truck className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">Free Delivery</span>
          </div>
          {!hasBuy3 && needForBundle3 > 0 && (
            <button
              type="button"
              onClick={onAddOne}
              className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#2d6ea4] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#235480] transition-colors active:scale-[0.98]"
            >
              <Plus className="w-2.5 h-2.5" /> Add {needForBundle3} more
            </button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/70 font-light text-center tracking-widest uppercase">
        {hasBuy3
          ? "✓ Bundle discount applied at checkout"
          : hasBuy2
          ? "✓ Buy 2 deal active — add 1 more for Buy 3!"
          : "Add 2+ serums to unlock bundle pricing & free delivery"}
      </p>
    </div>
  );
};

// ─── Main Checkout Component ──────────────────────────────────────────────────

const Checkout = () => {
  useSEO({
    title: "Checkout",
    description: "Securely complete your purchase on Scalvea.",
    noindex: true,
  });

  const { items, total, rawTotal, bundleDiscount, addItem, setIsCartOpen } = useCart();
  const { settings, currencyCode, market } = useCountry();
  const { user, loading: authLoading } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?returnTo=/cart");
    }
  }, [authLoading, user, navigate]);

  // ── Coupon state kept for zero-breakage (not rendered) ──
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percentage: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const isIndia = settings?.country?.toLowerCase() === "india";

  const discountAmount = appliedCoupon ? total * (appliedCoupon.discount_percentage / 100) : 0;
  const subtotalAfterDiscount = total - discountAmount;
  const taxRate = isIndia ? (settings?.tax_percentage || 0) / 100 : 0;
  const taxAmount = subtotalAfterDiscount * taxRate;

  const freeShippingThreshold = isIndia ? 0 : 60;
  const shippingAmount = subtotalAfterDiscount >= freeShippingThreshold ? 0 : (isIndia ? 0 : 9.50);
  const grandTotal = subtotalAfterDiscount + taxAmount + shippingAmount;

  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    address_line2: "",
    city: "",
    state: AUSTRALIA_STATES[0],
    postcode: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      state: isIndia ? "" : AUSTRALIA_STATES[0],
    }));
    setPaymentMethod(isIndia ? "shiprocket" : "stripe");
  }, [isIndia]);

  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, email: prev.email || user.email || "" }));
    }
  }, [user?.email]);

  const formatVal = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  // ── Coupon helpers (kept but not rendered) ──
  const applyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride || couponCode).trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (data) {
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          toast({ title: "Coupon expired", variant: "destructive" });
          setApplyingCoupon(false);
          return;
        }
        if (data.max_usage && (data.usage_count || 0) >= data.max_usage) {
          toast({ title: "Coupon usage limit reached", variant: "destructive" });
          setApplyingCoupon(false);
          return;
        }
        setAppliedCoupon({ code: data.code, discount_percentage: Number(data.discount_percentage) });
        toast({ title: `Coupon ${data.code} applied! ${Number(data.discount_percentage)}% off` });
      } else {
        toast({ title: "Invalid coupon", description: `This coupon code is not valid.`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error applying coupon", variant: "destructive" });
    }
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  // ── Add Scalp-5 to cart ──
  const handleAddScalp5 = () => {
    addItem({
      productId: dbScalp5?.id || SCALP5_CONFIG.productId,
      name: dbScalp5?.name || SCALP5_CONFIG.name,
      image: prod2,
      price_inr: scalp5PriceInr,
      price_aud: scalp5PriceAud,
      price_usd: SCALP5_CONFIG.price_usd,
    });
    toast({ title: "Scalp-5 added to your order!" });
  };

  // ── Add Follicle 8 to cart ──
  const handleAddFollicle8 = () => {
    addItem({
      productId: dbFollicle8?.id || FOLLICLE8_CONFIG.productId,
      name: dbFollicle8?.name || FOLLICLE8_CONFIG.name,
      image: prod1,
      price_inr: follicle8PriceInr,
      price_aud: follicle8PriceAud,
      price_usd: FOLLICLE8_CONFIG.price_usd,
    });
    toast({ title: "Follicle 8 added to your order!" });
  };

  // ── Add a generic serum (for AU bundle upsell) ──
  const handleAddAuSerum = () => {
    // Add whichever serum is NOT already in cart, or add Scalp-5 if both present
    const hasF8 = items.some((i) => FOLLICLE8_PRODUCT_IDS.includes(i.productId));
    if (!hasF8) {
      handleAddFollicle8();
    } else {
      handleAddScalp5();
    }
  };

  // Total serum count for AU bundle & offer qualification logic
  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // ── Recommendation logic (bidirectional) ──
  const hasFollicle8 = items.some(
    (i) =>
      FOLLICLE8_PRODUCT_IDS.includes(i.productId) ||
      i.productId.toLowerCase().includes("follicle") ||
      i.name.toLowerCase().includes("follicle")
  );
  const hasScalp5Already = items.some(
    (i) =>
      SCALP5_PRODUCT_IDS.includes(i.productId) ||
      i.productId.toLowerCase().includes("scalp-5") ||
      i.name.toLowerCase().includes("scalp")
  );
  // Show Scalp-5 rec if user has Follicle 8 only (1 bottle) and not already qualified for 2+ serums
  const showScalp5Rec = hasFollicle8 && !hasScalp5Already && totalItemCount < 2;
  // Show Follicle 8 rec if user has Scalp-5 only (1 bottle) and not already qualified for 2+ serums
  const showFollicle8Rec = hasScalp5Already && !hasFollicle8 && totalItemCount < 2;

  // ─── Shiprocket Checkout ──────────────────────────────────────────────────
  const handleShiprocketCheckout = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    const capturedNativeEvent: Event | null = (e?.nativeEvent as Event) || null;
    e?.preventDefault();

    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to complete checkout.", variant: "destructive" });
      navigate("/auth?returnTo=/cart");
      return;
    }

    setPlacing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-shiprocket-checkout-token", {
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          couponCode: appliedCoupon?.code || null,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          email: form.email || user?.email || "",
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          city: form.city,
          state: form.state,
          postcode: form.postcode,
          subtotal: subtotalAfterDiscount,
          shippingAmount: shippingAmount,
          taxAmount: taxAmount,
        },
      });

      if (error || !data || !data.token) {
        throw new Error(error?.message || data?.error || "Failed to create checkout token");
      }

      const token = data.token;
      trackInitiateCheckout(items, grandTotal, currencyCode);

      const { launchShiprocketCheckout } = await import("@/lib/shiprocketCheckout");
      const fallbackUrl = window.location.origin + "/checkout";
      launchShiprocketCheckout(capturedNativeEvent, token, fallbackUrl);
    } catch (err: any) {
      console.error("Shiprocket checkout error:", err);
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  // ─── Stripe Checkout ─────────────────────────────────────────────────────
  const startStripeCheckout = async () => {
    try {
      for (const item of items) {
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select("id, name, inventory_quantity_australia")
          .eq("id", item.productId)
          .single();

        if (prodError || !prod) {
          toast({ title: "Product unavailable", description: `${item.name} could not be verified.`, variant: "destructive" });
          setPlacing(false);
          return;
        }

        const currentStock = prod.inventory_quantity_australia ?? 0;
        if (item.quantity > currentStock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${currentStock} units of ${item.name} are available for shipping in ${settings?.country}. Please adjust your cart.`,
            variant: "destructive",
          });
          setPlacing(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("create-stripe-session", {
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          email: form.email || user?.email || "",
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          address: form.address,
          address_line2: form.address_line2 || "",
          city: form.city,
          state: form.state,
          postcode: form.postcode,
          coupon_code: appliedCoupon?.code || null,
          shipping_type: "standard",
        },
      });

      if (error || !data || !data.sessionId) {
        throw new Error(error?.message || "Failed to create Stripe Checkout Session");
      }

      const sessionId = data.sessionId;
      const checkoutUrl = data.checkoutUrl;
      trackInitiateCheckout(items, grandTotal, currencyCode);

      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not configured. Redirecting directly using session URL.");
        window.location.href = checkoutUrl;
        return;
      }

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(stripePublishableKey);
      if (stripe) {
        const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
        if (redirectError) throw redirectError;
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error("Stripe Checkout error:", err);
      toast({ title: "Payment redirection failed", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  // ─── Form Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to place an order.", variant: "destructive" });
      navigate("/auth?returnTo=/cart");
      return;
    }

    if (isIndia) {
      if (!form.firstName || !form.lastName || !form.address || !form.city || !form.state || !form.postcode || !form.phone) {
        toast({ title: "Missing details", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
      handleShiprocketCheckout(e as unknown as React.MouseEvent<HTMLButtonElement>);
      return;
    }

    if (!form.firstName || !form.lastName || !form.address || !form.city || !form.state || !form.postcode || !form.phone) {
      toast({ title: "Missing details", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (!/^\d{4}$/.test(form.postcode.trim())) {
      toast({ title: "Invalid postcode", description: "Please enter a valid 4-digit Australian postcode.", variant: "destructive" });
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      toast({ title: "Invalid phone number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }

    setPlacing(true);
    await startStripeCheckout();
  };

  // ─── Empty cart state ─────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-32 space-y-4">
          <p className="text-sm text-muted-foreground">Your bag is empty</p>
          <Button asChild variant="outline" className="text-sm font-medium tracking-[0.08em] uppercase h-11 px-6">
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-8 h-8 border-2 border-foreground border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  // ─── ORDER SUMMARY (shared, sticky right column on desktop) ───────────────
  const OrderSummaryPanel = () => (
    <div className="space-y-5">
      {/* Order items card */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-[#f0f0f0]">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-foreground">
            Order Summary
          </h2>
        </div>

        {/* Items list */}
        <div className="px-5 py-4 space-y-4 max-h-[260px] overflow-y-auto scrollbar-none">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3.5 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#ebebeb] flex-shrink-0 relative">
                <img src={getItemImage(item)} alt={item.name} className="w-full h-full object-cover" />
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] w-5 h-5 flex items-center justify-center font-bold rounded-full">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-snug truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{formatVal(item.price * item.quantity)}</p>
                <p className="text-[9px] text-emerald-600 font-light mt-0.5 tracking-wide">
                  {isIndia ? "Inclusive of all taxes" : "GST included"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Recommendations — bidirectional, both markets */}
        {showScalp5Rec && (
          <div className="px-4 pb-4">
            <ProductRecommendationCard
              image={SCALP5_CONFIG.image}
              name={SCALP5_CONFIG.name}
              subtitle="Complete your routine with anti-dandruff care."
              price={isIndia ? `₹${scalp5PriceInr.toLocaleString("en-IN")}` : `A$${scalp5PriceAud.toFixed(2)}`}
              label="Complete Your Scalp Care"
              onAdd={handleAddScalp5}
            />
          </div>
        )}
        {showFollicle8Rec && (
          <div className="px-4 pb-4">
            <ProductRecommendationCard
              image={FOLLICLE8_CONFIG.image}
              name={FOLLICLE8_CONFIG.name}
              subtitle="Add hair growth serum to complete your routine."
              price={isIndia ? `₹${follicle8PriceInr.toLocaleString("en-IN")}` : `A$${follicle8PriceAud.toFixed(2)}`}
              label="Pair It With Hair Growth"
              onAdd={handleAddFollicle8}
            />
          </div>
        )}

        {/* Price breakdown */}
        <div className="px-5 py-4 border-t border-[#f0f0f0] space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-light">Subtotal</span>
            <span className="font-mono font-medium">{formatVal(bundleDiscount > 0 && !isIndia ? rawTotal : total)}</span>
          </div>
          {bundleDiscount > 0 && !isIndia && (
            <div className="flex justify-between text-xs text-emerald-600 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Bundle & Save ({totalItemCount === 3 ? "3 Serums for A$100" : "Bundle Deal"})
              </span>
              <span className="font-mono">-{formatVal(bundleDiscount)}</span>
            </div>
          )}
          {appliedCoupon && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount ({appliedCoupon.discount_percentage}%)</span>
              <span className="font-mono">-{formatVal(discountAmount)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-light">Tax ({settings?.tax_percentage}%)</span>
              <span className="font-mono">{formatVal(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-light">Shipping</span>
            <span className="font-mono">
              {shippingAmount === 0 ? (
                <span className="text-emerald-600 font-semibold">Free</span>
              ) : (
                <span className="font-medium text-foreground">{formatVal(shippingAmount)}</span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-end pt-3 border-t border-[#f0f0f0]">
            <span className="text-sm font-semibold tracking-[0.04em] text-foreground">Total Due</span>
            <div className="text-right">
              <span className="block text-lg font-bold font-mono text-foreground">{formatVal(grandTotal)}</span>
              <span className="text-[10px] text-emerald-600 font-light tracking-wide">Inclusive of all taxes</span>
            </div>
          </div>
        </div>

        {settings && (
          <div className="px-5 py-3 bg-[#fafafa] border-t border-[#f0f0f0] flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground font-light">
              Estimated delivery: <span className="font-medium text-foreground">{settings.delivery_time}</span>
            </p>
          </div>
        )}
      </div>

      {isIndia && totalItemCount >= 2 && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-[#f5fbf7] p-4 shadow-[0_12px_25px_rgba(16,185,129,0.08)]">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" />
          <div className="pl-3 flex items-center gap-3">
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
              <p className="mt-1 text-sm font-semibold text-foreground leading-tight">
                Scalp-5 Anti-Dandruff Hair Serum
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                Qualifies for a free serum with your 2-serum purchase.
              </p>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <span className="inline-flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M7.6 14.85 3.75 11l1.05-1.05L7.6 12.75l7.6-7.6 1.05 1.05-8.65 8.65Z"/>
                  </svg>
                </span>
                Totally free at checkout
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div>
        {isIndia ? (
          <Button
            type="button"
            onClick={(e) => handleShiprocketCheckout(e)}
            disabled={placing}
            className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-bold tracking-[0.1em] uppercase shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-0"
          >
            {placing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Continue to Secure Checkout
              </span>
            )}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={placing}
            className="w-full h-14 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-sm font-bold tracking-[0.1em] uppercase shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-0"
          >
            {placing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Continue to Payment — {formatVal(grandTotal)}
              </span>
            )}
          </Button>
        )}

        {/* Minimal lock line below CTA */}
        <p className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground/70 tracking-widest uppercase">
          <Lock className="w-3 h-3" /> SSL Secured Checkout
        </p>
      </div>

      {/* Offer cards — below CTA, country-specific */}
      {isIndia
        ? <IndiaOfferCards onAddSerum={handleAddAuSerum} totalItems={totalItemCount} />
        : <AustraliaOfferCards totalItems={totalItemCount} onAddOne={handleAddAuSerum} />
      }

      {/* Trust indicators grid */}
      <TrustIndicators isIndia={isIndia} />
    </div>
  );

  // ─── INDIA LEFT PANEL — Partial COD + Payment strip (no text-duplicate list) ─────
  const IndiaLeftPanel = () => (
    <div className="space-y-5">
      {/* Secure checkout header — compact */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-foreground" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[0.06em] text-foreground">Secure Checkout</h2>
            <p className="text-[11px] text-muted-foreground font-light mt-0.5">
              Complete your order with your preferred payment method.
            </p>
          </div>
        </div>
      </div>

      {/* Partial COD */}
      <PartialCodBadge />

      {/* Payment icons strip — replaces the text method list */}
      <IndiaPaymentTrustStrip />
    </div>
  );

  // ─── AUSTRALIA LEFT PANEL — Shipping Form + Payment Section ──────────────
  const AustraliaLeftPanel = () => (
    <div className="space-y-6">
      {/* Contact */}
      {!user?.email && (
        <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase mb-4 text-foreground">Contact</h2>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address"
            className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
          />
        </div>
      )}

      {/* Shipping Details */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
        <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase mb-5 text-foreground flex items-center gap-2">
          <span>🇦🇺</span> Shipping Details
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                First Name *
              </label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="First name"
                required
                className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Last Name *
              </label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Last name"
                required
                className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
              Mobile Number *
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="04XX XXX XXX"
              type="tel"
              required
              className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div className="pt-1 border-t border-[#f0f0f0] space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Street Address *
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Example Street"
                required
                className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Apartment, Suite, Unit (optional)
              </label>
              <input
                value={form.address_line2}
                onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                placeholder="Apt 4B"
                className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                  City / Suburb *
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Sydney"
                  required
                  className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                  Postcode *
                </label>
                <input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                  placeholder="2000"
                  required
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d{4}"
                  className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                State / Territory *
              </label>
              <select
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="w-full h-11 px-4 text-sm bg-transparent border border-[#e0e0e0] rounded-lg outline-none focus:border-foreground transition-colors appearance-none cursor-pointer"
              >
                {AUSTRALIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Shipping Destination
              </p>
              <div className="w-full h-11 px-4 text-sm bg-[#fafafa] border border-[#e0e0e0] rounded-lg flex items-center text-muted-foreground cursor-not-allowed">
                🇦🇺 Australia
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment section — using real AU-relevant SVG assets */}
      <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
        <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3 text-foreground">
          Secure Payment
        </h2>
        <div className="rounded-xl border border-[#e8e8e8] bg-[#fafafa] p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
            <Lock className="w-3 h-3 flex-shrink-0" />
            <span className="tracking-[0.05em] uppercase">Secure encrypted payment via Stripe</span>
          </div>
          {/* AU payment icons — only AU-relevant methods */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Apple Pay */}
            <div title="Apple Pay" className="h-8 w-14 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-white overflow-hidden p-1">
              <img src={applepaySlug} alt="Apple Pay" className="max-h-full max-w-full object-contain" />
            </div>
            {/* Visa */}
            <div title="Visa" className="h-8 w-12 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-white overflow-hidden p-1">
              <img src={visaSvg} alt="Visa" className="max-h-full max-w-full object-contain" />
            </div>
            {/* Cards / Mastercard */}
            <div title="Cards" className="h-8 w-12 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-white overflow-hidden p-1">
              <img src={cardSvg} alt="Cards" className="max-h-full max-w-full object-contain" />
            </div>
            {/* Google Pay inline wordmark */}
            <div title="Google Pay" className="h-8 px-2.5 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-white text-[12px] font-black tracking-tight select-none">
              <span className="text-[#1a73e8]">G</span><span className="text-[#ea4335]">P</span><span className="text-[#fbbc05]">a</span><span className="text-[#34a853]">y</span>
            </div>
            {/* Amex text badge */}
            <div title="American Express" className="h-8 px-2 flex items-center justify-center rounded-lg border border-[#eaeaea] bg-white text-[10px] font-extrabold text-[#016FD0] tracking-widest select-none">
              AMEX
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Header />
      <main className="px-4 sm:px-6 lg:px-12 py-8 lg:py-14 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-xl font-light tracking-[0.06em] text-foreground">Checkout</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span className="tracking-[0.05em] uppercase">Secure & Encrypted</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 tracking-[0.03em]"
            >
              <ShoppingBag className="w-3 h-3" />
              View cart
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Desktop: two-column, Mobile: single column (summary first on mobile via order) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-start">

            {/* LEFT — Info / Form (order-2 on mobile so summary shows first) */}
            <div className="order-2 lg:order-1">
              {isIndia ? <IndiaLeftPanel /> : <AustraliaLeftPanel />}
            </div>

            {/* RIGHT — Order summary (sticky, order-1 on mobile) */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:h-fit">
              <OrderSummaryPanel />
            </div>

          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;