import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Loader2,
  ShoppingBag, MapPin, CreditCard, Printer, User,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useCart } from "@/contexts/CartContext";

// ─── OrderSuccess Page ────────────────────────────────────────────────────────
// Handles three entry points:
//   1. ?session_id=<stripe_session_id>   → AU Stripe payment
//   2. ?id=<local_order_uuid>            → Direct UUID (Shiprocket callback after fast confirm)
//   3. ?shiprocket_order_id=<sr_id>      → Shiprocket fallback (polls DB until webhook fires)
// ─────────────────────────────────────────────────────────────────────────────

const OrderSuccess = () => {
  useSEO({
    title: "Order Confirmed - Scalvea",
    description: "Your payment was processed successfully.",
    noindex: true
  });

  const [searchParams] = useSearchParams();
  const sessionId          = searchParams.get("session_id");
  const orderId            = searchParams.get("id") || searchParams.get("order_id");
  const shiprocketOrderId  = searchParams.get("shiprocket_order_id") || searchParams.get("oid");
  const navigate           = useNavigate();

  const [loading, setLoading]   = useState(true);
  const [order,   setOrder]     = useState<any | null>(null);
  const [error,   setError]     = useState<string | null>(null);
  const { clearCart }           = useCart();
  const hasExecuted             = useRef(false);

  useEffect(() => {
    if (hasExecuted.current) return;
    if (!sessionId && !orderId && !shiprocketOrderId) { navigate("/shop"); return; }
    hasExecuted.current = true;

    // ── 1. Direct load: Stripe session_id or local UUID ───────────────────
    if (sessionId || orderId) {
      const fetchOrder = async () => {
        try {
          let q = supabase.from("orders").select("*, order_items(*)");
          if (sessionId) q = q.eq("stripe_session_id", sessionId);
          else            q = q.eq("id", orderId);

          const { data, error: dbErr } = await q.maybeSingle();
          if (dbErr) throw dbErr;

          if (data) {
            setOrder(data);
            clearCart();
          } else {
            // Order not found — redirect to failed page
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

    // ── 2. Shiprocket fallback: poll orders by shiprocket_order_id column ─
    // The webhook or a delayed API call will write the order; we poll for it.
    let retries = 0;
    const maxRetries = 15; // 15 × 2s = 30 seconds max wait

    const poll = async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("shiprocket_order_id", shiprocketOrderId!)
          .maybeSingle();

        if (data) {
          setOrder(data);
          setLoading(false);
          clearCart();
          return;
        }
      } catch (err: any) {
        console.error("Poll error:", err.message);
      }

      retries++;
      if (retries >= maxRetries) {
        setLoading(false);
        // After 30s of waiting, redirect to failed page with timeout reason
        navigate("/order-failed?reason=timeout");
      } else {
        setTimeout(poll, 2000);
      }
    };

    poll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (val: number) => {
    if (order?.currency === "INR") return `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
    return `A$${Number(val || 0).toFixed(2)}`;
  };

  const handlePrint = () => window.print();

  const addr = order?.shipping_address as any;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between print:bg-white">
      <Header />

      <main className="px-6 lg:px-12 py-16 lg:py-24 max-w-2xl mx-auto w-full">

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-20 space-y-6">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mx-auto" />
            <h1 className="text-xl font-light tracking-[0.1em] uppercase">Confirming Your Order</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We've received your payment and are registering your order. This takes only a moment.
            </p>
          </div>
        )}

        {/* ── Error: redirect happens automatically, this is just a safety net ── */}
        {!loading && error && (
          <div className="text-center py-16 space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {/* ── Success: Order Details ── */}
        {!loading && !error && order && (
          <div className="space-y-10 animate-fade-in">

            {/* Header */}
            <div className="text-center space-y-3 print:space-y-1">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto print:hidden" />
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Thank You for Shopping with Scalvea
              </p>
              <h1 className="text-3xl font-extralight tracking-[0.08em] uppercase">Order Confirmed</h1>
              <p className="text-xs text-muted-foreground">
                Your order is confirmed and is being processed.
              </p>
            </div>

            {/* Main Card */}
            <div className="border border-border p-6 sm:p-8 space-y-6 bg-secondary/5 print:border-gray-300">

              {/* Order Meta Row */}
              <div className="flex flex-wrap justify-between items-start gap-4 border-b border-border/60 pb-5 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase tracking-[0.08em] block mb-0.5">Order Number</span>
                  <span className="font-mono font-semibold text-sm">{order.order_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-[0.08em] block mb-0.5">Status</span>
                  <span className="font-mono text-green-600 uppercase tracking-[0.05em]">
                    {order.payment_status === "paid" ? "Paid" : order.payment_status} ·{" "}
                    {(order.order_status || "processing").replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase tracking-[0.08em] block mb-0.5">Date</span>
                  <span className="font-mono">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
              </div>

              {/* Customer Details */}
              {(order.customer_name || order.customer_email || order.customer_phone) && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Customer
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5 font-light">
                    {order.customer_name  && <p className="font-medium text-foreground">{order.customer_name}</p>}
                    {order.customer_email && <p>{order.customer_email}</p>}
                    {order.customer_phone && <p>+{order.customer_phone}</p>}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-3 w-3" /> Purchased Items
                </p>
                <div className="divide-y divide-border/40">
                  {(order.order_items || []).map((item: any) => (
                    <div key={item.id} className="py-3.5 flex justify-between text-xs font-light">
                      <span>
                        {item.product_name}
                        <span className="text-muted-foreground font-normal ml-1">× {item.quantity}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-medium block">{fmt(item.price * item.quantity)}</span>
                        <span className="text-[9px] text-emerald-600 block mt-0.5">Inclusive of taxes</span>
                      </div>
                    </div>
                  ))}
                  {(!order.order_items || order.order_items.length === 0) && (
                    <p className="text-xs text-muted-foreground py-3 italic">Item details loading...</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              {addr && (
                <div className="border-t border-border/60 pt-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Delivery Address
                  </p>
                  <div className="text-xs font-light leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {addr.firstName || addr.first_name || ""} {addr.lastName || addr.last_name || ""}
                    </p>
                    <p>{addr.address || addr.address_line1 || ""}{addr.address_line2 ? `, ${addr.address_line2}` : ""}</p>
                    <p>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postcode || ""}</p>
                    <p>{addr.country || ""}</p>
                    {addr.phone && <p className="mt-1 font-mono text-[11px]">Ph: {addr.phone}</p>}
                  </div>
                </div>
              )}

              {/* Financials */}
              <div className="border-t border-border/60 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-mono font-light">{fmt(order.subtotal || 0)}</span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                    <span className="font-mono">-{fmt(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Shipping</span>
                  <span className="font-mono font-light">
                    {Number(order.shipping_amount) === 0 ? "Free" : fmt(Number(order.shipping_amount))}
                  </span>
                </div>

                <div className="border-t border-border/60 pt-3.5 flex justify-between text-sm font-semibold">
                  <span className="uppercase tracking-[0.05em] flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Total Paid
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-base block">{fmt(order.total_amount || 0)}</span>
                    <span className="text-[10px] text-emerald-600 font-light tracking-wide block mt-0.5">
                      Inclusive of all taxes
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              {order.payment_method && (
                <div className="text-[10px] text-muted-foreground bg-secondary/30 p-3 flex items-center justify-between">
                  <span>Payment Method</span>
                  <span className="font-medium text-foreground capitalize">
                    {order.payment_method.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {/* Delivery estimate */}
              {order.delivery_estimate && (
                <div className="text-[10px] text-muted-foreground bg-secondary/30 p-3 text-center">
                  Estimated Delivery:{" "}
                  <span className="font-medium text-foreground">{order.delivery_estimate}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap gap-3 justify-center print:hidden">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="h-11 px-6 uppercase tracking-widest text-xs font-light rounded-none flex items-center gap-2"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Invoice
              </Button>

              <Link to="/shop">
                <Button variant="outline" className="h-11 min-w-[160px] uppercase tracking-widest text-xs font-light rounded-none">
                  Continue Shopping
                </Button>
              </Link>

              {order.user_id && (
                <Link to="/account">
                  <Button className="h-11 min-w-[160px] bg-neutral-900 hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-light rounded-none">
                    View My Orders
                  </Button>
                </Link>
              )}
            </div>

            {/* Print-only footer */}
            <div className="hidden print:block text-center text-xs text-gray-500 pt-8 border-t border-gray-200">
              <p className="font-semibold text-gray-800">Scalvea — Care You Deserve</p>
              <p>www.scalvea.com · support@scalvea.com</p>
              <p className="mt-1">Thank you for your order!</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
