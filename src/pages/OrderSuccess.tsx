import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  ShoppingBag,
  MapPin,
  CreditCard,
  Printer,
  User,
  Package,
  Truck,
  ShieldCheck,
  Sparkles,
  Mail,
  Gift,
  Copy,
  Check,
  Clock,
  Phone,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useCart } from "@/contexts/CartContext";
import { trackPurchase } from "@/lib/metaPixel";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

// ─── Product Thumbnail Resolver ──────────────────────────────────────────────
const getItemImage = (item: any) => {
  if (item.image_url) return item.image_url;
  const name = (item.product_name || item.name || "").toLowerCase();
  const id = (item.product_id || item.productId || "").toLowerCase();
  if (name.includes("scalp") || id.includes("scalp") || name.includes("dandruff")) return prod2;
  return prod1;
};

// ─── OrderSuccess Page ────────────────────────────────────────────────────────
// Handles three entry points:
//   1. ?session_id=<stripe_session_id>   → AU Stripe payment
//   2. ?id=<local_order_uuid>            → Direct UUID (Shiprocket callback after fast confirm)
//   3. ?shiprocket_order_id=<sr_id>      → Shiprocket fallback (polls DB until webhook fires)
// ─────────────────────────────────────────────────────────────────────────────

const OrderSuccess = () => {
  useSEO({
    title: "Order Confirmed — Scalvea",
    description: "Thank you for your order. Your purchase has been confirmed.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("id") || searchParams.get("order_id");
  const shiprocketOrderId = searchParams.get("shiprocket_order_id") || searchParams.get("oid");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { clearCart } = useCart();
  const hasExecuted = useRef(false);
  const purchaseTracked = useRef(false);

  useEffect(() => {
    if (hasExecuted.current) return;
    if (!sessionId && !orderId && !shiprocketOrderId) {
      navigate("/shop");
      return;
    }
    hasExecuted.current = true;

    // ── 1. Direct load: Stripe session_id or local UUID ───────────────────
    if (sessionId || orderId) {
      const fetchOrder = async () => {
        try {
          let q = supabase.from("orders").select("*, order_items(*)");
          if (sessionId) q = q.eq("stripe_session_id", sessionId);
          else q = q.eq("id", orderId);

          const { data, error: dbErr } = await q.maybeSingle();
          if (dbErr) throw dbErr;

          if (data) {
            setOrder(data);
            clearCart();
            // ── Meta Pixel: Purchase ──
            if (!purchaseTracked.current) {
              purchaseTracked.current = true;
              trackPurchase(data);
            }
          } else {
            navigate("/order-failed?reason=failed");
          }
        } catch (err: any) {
          navigate("/order-failed?reason=failed");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
      return;
    }

    // ── 2. Shiprocket fallback: poll and actively verify via fetch-shiprocket-order ─
    let retries = 0;
    const maxRetries = 8; // 8 × 1.2s = ~10s max

    let fallbackData: any = null;
    try {
      const raw =
        sessionStorage.getItem("scalvea_pending_india_checkout") ||
        localStorage.getItem("scalvea_pending_india_checkout");
      if (raw) fallbackData = JSON.parse(raw);
    } catch (_) {}

    const poll = async () => {
      try {
        // First check if order is already in the database
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("shiprocket_order_id", shiprocketOrderId!)
          .maybeSingle();

        if (data) {
          setOrder(data);
          setLoading(false);
          clearCart();
          if (!purchaseTracked.current) {
            purchaseTracked.current = true;
            trackPurchase(data);
          }
          return;
        }

        // If not in database yet, trigger fetch-shiprocket-order immediately!
        const { data: fnData } = await supabase.functions.invoke("fetch-shiprocket-order", {
          body: { orderId: shiprocketOrderId, fallbackData },
        });

        if (fnData?.success && fnData?.order) {
          setOrder(fnData.order);
          setLoading(false);
          clearCart();
          if (!purchaseTracked.current) {
            purchaseTracked.current = true;
            trackPurchase(fnData.order);
          }
          return;
        }
      } catch (err: any) {
        console.warn("[OrderSuccess] Verification poll warning:", err.message);
      }

      retries++;
      if (retries >= maxRetries) {
        setLoading(false);
        navigate("/order-failed?reason=timeout");
      } else {
        setTimeout(poll, 1200);
      }
    };

    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isIndia = order?.currency === "INR";

  const fmt = (val: number) => {
    if (isIndia) return `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
    return `A$${Number(val || 0).toFixed(2)}`;
  };

  const handleCopyOrderNumber = () => {
    if (!order?.order_number) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  const addr = order?.shipping_address as any;
  const items = (order?.order_items as any[]) || [];
  const totalItemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Check if any free gift was part of the order
  const hasFreeScalp5 =
    isIndia &&
    items.some(
      (item) =>
        (Number(item.price) === 0 || (item.product_name || "").toLowerCase().includes("free")) &&
        (item.product_name || "").toLowerCase().includes("scalp")
    );

  const formattedDate = order?.created_at
    ? new Date(order.created_at).toLocaleDateString(isIndia ? "en-IN" : "en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between print:bg-white">
      <Header />

      <main className="px-4 sm:px-6 lg:px-12 py-8 sm:py-14 max-w-4xl mx-auto w-full">
        {/* ── Loading State ── */}
        {loading && (
          <div className="text-center py-24 space-y-6">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-neutral-900 animate-spin border-l-transparent border-r-transparent border-b-transparent" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-medium tracking-[0.08em] uppercase text-foreground">
                Confirming Your Order
              </h1>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                We've received your payment and are securely registering your order details. This takes just a moment...
              </p>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && error && (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline">
              <Link to="/shop">Return to Shop</Link>
            </Button>
          </div>
        )}

        {/* ── Success: Full Luxury Order Presentation ── */}
        {!loading && !error && order && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Top Success Banner / Hero */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#e8e8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-10 text-center relative overflow-hidden print:border-none print:shadow-none print:p-0">
              {/* Subtle top ambient accent bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 print:hidden" />

              {/* Animated Success Badge */}
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 mb-5 shadow-xs print:hidden">
                <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
              </div>

              {/* Region Pill */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                  {isIndia ? "🇮🇳 India Order" : "🇦🇺 Australia Order"}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified & Paid
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-light tracking-[0.04em] text-foreground">
                Thank You For Your Order
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                Your order has been placed and is now being carefully prepared. We've sent a confirmation receipt to{" "}
                <span className="font-medium text-foreground">
                  {order.customer_email || (addr && addr.email) || "your email"}
                </span>
                .
              </p>

              {/* Order Number Quick Copy Pill */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 p-1.5 sm:p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium pl-2">
                  Order ID:
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                  {order.order_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-700 hover:text-black hover:border-neutral-400 transition-all shadow-2xs active:scale-95 print:hidden"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-neutral-500" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Order Status Tracker Stepper ── */}
            <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-7 print:hidden">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground">
                    Order Status & Timeline
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">{formattedDate}</span>
              </div>

              <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                {/* Step 1: Confirmed */}
                <div className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-foreground">1. Confirmed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-9 font-light">Payment received</p>
                </div>

                {/* Step 2: Processing */}
                <div className="space-y-2 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shadow-xs">
                      2
                    </div>
                    <span className="text-xs font-bold text-foreground">2. Processing</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-9 font-light">Quality inspection</p>
                </div>

                {/* Step 3: Dispatched */}
                <div className="space-y-2 relative opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <span className="text-xs font-semibold text-neutral-700">3. Dispatch</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-9 font-light">
                    {isIndia ? "Shiprocket Express" : "Australia Post"}
                  </p>
                </div>

                {/* Step 4: Delivery */}
                <div className="space-y-2 relative opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <span className="text-xs font-semibold text-neutral-700">4. Delivery</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-9 font-light">
                    {isIndia ? "3–5 Business Days" : "2–4 Business Days"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Main Details Grid (Items & Summary + Shipping) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
              {/* LEFT COLUMN: Items Breakdown */}
              <div className="space-y-6">
                {/* Purchased Products Card */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-foreground" />
                      <h2 className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground">
                        Purchased Items ({totalItemCount})
                      </h2>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {isIndia ? "GST Included" : "GST Included"}
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-100 p-5 space-y-4">
                    {items.map((item: any) => {
                      const isFree =
                        Number(item.price) === 0 ||
                        (item.product_name || "").toLowerCase().includes("free");

                      return (
                        <div key={item.id} className="pt-4 first:pt-0 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 relative">
                            <img
                              src={getItemImage(item)}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] w-5 h-5 flex items-center justify-center font-bold rounded-full">
                              {item.quantity}
                            </span>
                            {isFree && (
                              <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[7px] font-bold tracking-wider px-1 py-0.5 rounded shadow-xs uppercase">
                                FREE
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                {item.product_name}
                              </p>
                              {isFree && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  <Gift className="w-2.5 h-2.5 text-emerald-600" /> Free Gift
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {isFree ? (
                                <span className="text-emerald-700 font-bold">🎁 ₹0 (Free Promotional Gift)</span>
                              ) : (
                                <>
                                  {item.quantity > 1 ? `${item.quantity} × ${fmt(item.price)} = ` : ""}
                                  <span className="font-semibold text-foreground">
                                    {fmt(item.price * item.quantity)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {items.length === 0 && (
                      <p className="text-xs text-muted-foreground py-4 italic text-center">
                        Order item records are loading...
                      </p>
                    )}
                  </div>

                  {/* Free Gift / Bundle Highlight Banner */}
                  {hasFreeScalp5 && (
                    <div className="mx-5 mb-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-[#f2faf5] border border-emerald-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <p className="font-bold text-neutral-900">BUY 2 GET 1 FREE Offer Applied</p>
                        <p className="text-emerald-800 font-light text-[11px] mt-0.5">
                          1 complimentary Scalp-5 Anti Dandruff Hair Serum has been added to your package.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scalvea Care & Support Box */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-4 print:hidden">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> The Scalvea Promise
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Dermatologist Formulated</p>
                        <p className="text-[11px] font-light mt-0.5">Clinically tested actives crafted for scalp wellness.</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                      <Truck className="w-4 h-4 text-neutral-800 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Tracked Express Delivery</p>
                        <p className="text-[11px] font-light mt-0.5">Live tracking updates sent via SMS and email.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Address & Financial Summary */}
              <div className="space-y-6">
                {/* Shipping Address Card */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-foreground" />
                      <h2 className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground">
                        Shipping Address
                      </h2>
                    </div>
                    <span className="text-base">{isIndia ? "🇮🇳" : "🇦🇺"}</span>
                  </div>

                  {addr ? (
                    <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                      <p className="font-bold text-foreground text-sm">
                        {addr.firstName || addr.first_name || order.customer_name || ""}{" "}
                        {addr.lastName || addr.last_name || ""}
                      </p>
                      <p>{addr.address || addr.address_line1 || ""}</p>
                      {addr.address_line2 && <p>{addr.address_line2}</p>}
                      <p>
                        {addr.city ? `${addr.city}, ` : ""}
                        {addr.state ? `${addr.state} ` : ""}
                        <span className="font-mono font-medium text-foreground">{addr.postcode || ""}</span>
                      </p>
                      <p className="font-medium text-foreground uppercase tracking-wider text-[11px] pt-1">
                        {addr.country || (isIndia ? "India" : "Australia")}
                      </p>

                      {(addr.phone || order.customer_phone) && (
                        <p className="pt-2 flex items-center gap-1.5 text-foreground font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{addr.phone || order.customer_phone}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Address details unavailable.</p>
                  )}

                  {/* Delivery Estimate Box */}
                  <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Estimated Delivery: </span>
                      <span className="font-bold text-foreground">
                        {order.delivery_estimate || (isIndia ? "3–5 Business Days" : "2–4 Business Days")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                    <CreditCard className="w-4 h-4 text-foreground" />
                    <h2 className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground">
                      Payment Summary
                    </h2>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">Items Subtotal</span>
                      <span className="font-mono font-medium text-foreground">{fmt(order.subtotal || 0)}</span>
                    </div>

                    {Number(order.discount_amount) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Discount {order.coupon_code ? `(${order.coupon_code})` : "Savings"}
                        </span>
                        <span className="font-mono">-{fmt(order.discount_amount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-light">
                        Shipping ({isIndia ? "India" : "Australia-Wide"})
                      </span>
                      <span className="font-mono font-semibold text-emerald-600">
                        {Number(order.shipping_amount) === 0 ? "Free" : fmt(Number(order.shipping_amount))}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex justify-between items-end">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                          Total Paid
                        </span>
                        <span className="text-[10px] text-emerald-600 font-light">
                          {isIndia ? "All taxes & GST included" : "GST included"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-mono font-extrabold text-foreground">
                          {fmt(order.total_amount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Badge */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Payment Channel:</span>
                    <span className="font-semibold text-foreground capitalize bg-neutral-100 px-2.5 py-1 rounded-md">
                      {order.payment_method ? order.payment_method.replace(/_/g, " ") : isIndia ? "Shiprocket Secured" : "Stripe Direct"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="pt-4 flex flex-col sm:flex-row flex-wrap gap-3.5 justify-center print:hidden">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="h-12 px-6 rounded-xl border-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-50 shadow-2xs"
              >
                <Printer className="w-4 h-4" /> Print / Save Invoice
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-12 px-6 rounded-xl border-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-50 shadow-2xs"
              >
                <Link to="/shop">
                  <ShoppingBag className="w-4 h-4" /> Continue Shopping
                </Link>
              </Button>

              {order.user_id && (
                <Button
                  asChild
                  className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5"
                >
                  <Link to="/account">
                    <span>View In My Account</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Need Help? Box */}
            <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-5 text-center space-y-2 text-xs text-muted-foreground print:hidden">
              <p className="font-semibold text-foreground">Have questions regarding your delivery?</p>
              <p className="font-light">
                Our customer care team is available 7 days a week. Quote Order ID{" "}
                <span className="font-mono font-bold text-foreground">{order.order_number}</span> when contacting us.
              </p>
              <div className="pt-1 flex items-center justify-center gap-4">
                <a
                  href={`mailto:support@scalvea.com?subject=Order Query - ${order.order_number}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:underline underline-offset-4"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> support@scalvea.com
                </a>
              </div>
            </div>

            {/* Print-only Invoice Header and Footer */}
            <div className="hidden print:block text-center text-xs text-gray-500 pt-8 border-t border-gray-200">
              <p className="font-bold text-gray-800 text-sm">Scalvea Pty Ltd · Official Purchase Receipt</p>
              <p>www.scalvea.com · support@scalvea.com</p>
              <p className="mt-1">Thank you for choosing Scalvea for your hair and scalp care.</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
