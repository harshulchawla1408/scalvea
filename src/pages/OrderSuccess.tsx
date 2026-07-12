import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle, ShoppingBag, MapPin, CreditCard } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useCart } from "@/contexts/CartContext";

const OrderSuccess = () => {
  useSEO({
    title: "Order Success",
    description: "Your payment was processed successfully.",
    noindex: true
  });

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const shiprocketOrderId = searchParams.get("shiprocket_order_id") || searchParams.get("oid");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!sessionId && !orderId && !shiprocketOrderId) {
      navigate("/shop");
      return;
    }

    let intervalId: any;

    const checkOrder = async () => {
      try {
        let orderQuery = supabase
          .from("orders")
          .select("*, order_items(*)");

        if (sessionId) {
          orderQuery = orderQuery.eq("stripe_session_id", sessionId);
        } else if (orderId) {
          orderQuery = orderQuery.eq("id", orderId);
        } else if (shiprocketOrderId) {
          const { data: mapping } = await supabase
            .from("shiprocket_orders")
            .select("order_id")
            .eq("shiprocket_order_id", shiprocketOrderId)
            .maybeSingle();

          if (mapping?.order_id) {
            orderQuery = orderQuery.eq("id", mapping.order_id);
          } else {
            // Mapping record not found yet (webhook has not processed the order yet)
            setRetryCount(prev => {
              if (prev >= 12) {
                setLoading(false);
                setError("We received your payment, but the order registration is taking longer than expected. Please check your account page shortly.");
                clearInterval(intervalId);
              }
              return prev + 1;
            });
            return;
          }
        }

        const { data, error: dbError } = await orderQuery.maybeSingle();

        if (dbError) throw dbError;

        if (data) {
          setOrder(data);
          setLoading(false);
          clearInterval(intervalId);
          clearCart();
        } else {
          // If not found, increment retry count
          setRetryCount(prev => {
            if (prev >= 12) { // 12 retries * 1.5s = 18 seconds timeout
              setLoading(false);
              setError("We received your payment, but the order registration is taking longer than expected. Please check your account page shortly.");
              clearInterval(intervalId);
            }
            return prev + 1;
          });
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError("An error occurred while retrieving order details.");
        setLoading(false);
        clearInterval(intervalId);
      }
    };

    // Run immediately
    checkOrder();

    // Poll every 1.5 seconds
    intervalId = setInterval(checkOrder, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, orderId, shiprocketOrderId, navigate]);

  const formatVal = (val: number) => {
    if (order?.currency === "INR") {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${Number(val || 0).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Header />
      
      <main className="px-6 lg:px-12 py-16 lg:py-24 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 space-y-6">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mx-auto" />
            <h1 className="text-xl font-light tracking-[0.1em] uppercase">Confirming Your Order</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We've received your payment and are currently registering your order details. This will only take a moment.
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-6 border border-border/60 p-8 bg-secondary/10 relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-red-500" />
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h1 className="text-lg font-light tracking-[0.1em] uppercase">Verification Status</h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
                <Link to="/account">Go to Account</Link>
              </Button>
              <Button onClick={() => window.location.reload()} className="text-xs tracking-[0.1em] uppercase">
                Refresh Page
              </Button>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-10 animate-fade-in">
            {/* Header section */}
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Thank You for Your Order</p>
              <h1 className="text-3xl font-extralight tracking-[0.08em] uppercase">Payment Successful</h1>
              <p className="text-xs text-muted-foreground">
                Your order is confirmed and is currently being processed.
              </p>
            </div>

            {/* Order summary card */}
            <div className="border border-border p-6 sm:p-8 space-y-6 bg-secondary/5">
              <div className="flex justify-between items-center border-b border-border/60 pb-4 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase tracking-[0.08em] block">Order Number</span>
                  <span className="font-mono font-medium text-sm mt-0.5 block">{order.order_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground uppercase tracking-[0.08em] block">Status</span>
                  <span className="font-mono text-green-600 uppercase tracking-[0.05em] mt-0.5 block">Paid & processing</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ShoppingBag className="h-3 w-3" /> Purchased Items
                </p>
                <div className="divide-y divide-border/40">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="py-3.5 flex justify-between text-xs font-light">
                      <span>
                        {item.product_name} <span className="text-muted-foreground font-normal ml-1">× {item.quantity}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-medium block">{formatVal(item.price * item.quantity)}</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5">Inclusive of all taxes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-t border-border/60 pt-4 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Delivery Address
                </p>
                {order.shipping_address && (
                  <div className="text-xs font-light leading-relaxed text-muted-foreground">
                    <p className="font-medium text-foreground">{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postcode}</p>
                    <p>{order.shipping_address.country}</p>
                    <p className="mt-1 text-[11px] font-mono">Ph: {order.shipping_address.phone}</p>
                  </div>
                )}
              </div>

              {/* Financial calculations */}
              <div className="border-t border-border/60 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-mono font-light">{formatVal(order.subtotal)}</span>
                </div>
                
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                    <span className="font-mono">-{formatVal(order.discount_amount)}</span>
                  </div>
                )}

                {Number(order.gst || order.tax_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-light">GST (10% Included)</span>
                    <span className="font-mono font-light">{formatVal(order.gst || order.tax_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Shipping Cost</span>
                  <span className="font-mono font-light">
                    {Number(order.shipping_cost || order.shipping_amount) === 0 ? (
                      "Free Shipping"
                    ) : (
                      <span>
                        <span className="line-through text-muted-foreground/60 mr-1.5">
                          {order.currency === "INR" ? "₹100" : "A$10.00"}
                        </span>
                        <span>{formatVal(Number(order.shipping_cost || order.shipping_amount))}</span>
                      </span>
                    )}
                  </span>
                </div>

                <div className="border-t border-border/60 pt-3.5 flex justify-between text-sm font-semibold">
                  <span className="uppercase tracking-[0.05em] flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" /> Total Paid
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-base block">{formatVal(order.total || order.total_amount)}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5 font-sans">Inclusive of all taxes</span>
                  </div>
                </div>
              </div>

              {order.delivery_estimate && (
                <div className="text-[10px] text-muted-foreground bg-secondary/30 p-3 text-center">
                  Estimated Delivery Time: <span className="font-medium text-foreground">{order.delivery_estimate}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/shop">
                <Button variant="outline" className="min-w-[200px] h-12 uppercase tracking-widest text-xs font-light rounded-none">
                  Continue Shopping
                </Button>
              </Link>
              {order.user_id ? (
                <Link to="/account">
                  <Button className="min-w-[200px] h-12 bg-neutral-900 hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-light rounded-none">
                    View Orders
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button disabled variant="outline" className="min-w-[200px] h-12 uppercase tracking-widest text-xs font-light rounded-none text-muted-foreground">
                Track Order (Coming Soon)
              </Button>
              <Button disabled variant="outline" className="min-w-[200px] h-12 uppercase tracking-widest text-xs font-light rounded-none text-muted-foreground">
                Download Invoice
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
