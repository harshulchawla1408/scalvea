import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, ShieldCheck, Lock } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

// ─── ShiprocketCallback ──────────────────────────────────────────────────────
// Landing page after Shiprocket Checkout redirect.
//
// FLOW:
//   1. Check explicit payment cancellation. If cancelled -> /order-failed
//   2. Retrieve cached checkout snapshot from sessionStorage/localStorage.
//   3. Call fetch-shiprocket-order with orderId & fallback snapshot.
//   4. Order is created/confirmed immediately in Supabase.
//   5. Redirect customer directly to /order-success?id=<LOCAL_ORDER_UUID>.
//   6. Clean, professional UI with zero exposed retry or attempt counters.
// ─────────────────────────────────────────────────────────────────────────────

const REASSURING_MESSAGES = [
  "Confirming your payment and order details...",
  "Securing transaction with bank & logistics...",
  "Preparing your order confirmation receipt...",
  "Finalizing your purchase summary...",
];

const ShiprocketCallback = () => {
  useSEO({
    title: "Confirming Your Order — Scalvea",
    description: "Please wait while we confirm your order.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState(REASSURING_MESSAGES[0]);
  const hasExecuted = useRef(false);
  const msgIdx = useRef(0);

  // Shiprocket / Fastrr passes various param names
  const shiprocketOrderId =
    searchParams.get("oid") ||
    searchParams.get("order_id") ||
    searchParams.get("shiprocket_order_id") ||
    searchParams.get("id") ||
    searchParams.get("token") ||
    searchParams.get("orderid") ||
    searchParams.get("orderId");

  const ost = searchParams.get("ost");

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    // Rotate reassuring messages smoothly while verifying
    const msgInterval = setInterval(() => {
      msgIdx.current = (msgIdx.current + 1) % REASSURING_MESSAGES.length;
      setMessage(REASSURING_MESSAGES[msgIdx.current]);
    }, 2000);

    // Only redirect to failed if explicitly cancelled or rejected
    const isExplicitCancel =
      ost &&
      ["CANCELLED", "CANCELED", "FAILED", "FAILURE", "ABORTED", "ERROR", "REJECTED"].includes(
        ost.toUpperCase()
      );

    if (isExplicitCancel) {
      clearInterval(msgInterval);
      navigate("/order-failed?reason=cancelled");
      return;
    }

    if (!shiprocketOrderId) {
      clearInterval(msgInterval);
      navigate("/order-failed?reason=missing_order");
      return;
    }

    // Retrieve cached checkout snapshot for instant zero-loss order creation
    let fallbackData: any = null;
    try {
      const raw =
        sessionStorage.getItem("scalvea_pending_india_checkout") ||
        localStorage.getItem("scalvea_pending_india_checkout");
      if (raw) {
        fallbackData = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[Callback] Failed to parse cached checkout snapshot:", e);
    }

    // ── Fast order confirmation ──────────────────────────────────────────
    const confirm = async (attempt = 0): Promise<void> => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-shiprocket-order", {
          body: {
            orderId: shiprocketOrderId,
            fallbackData,
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success || !data?.order) throw new Error("Order not ready yet");

        // Order confirmed! Clean up cached checkout snapshot and clear cart
        try {
          sessionStorage.removeItem("scalvea_pending_india_checkout");
          localStorage.removeItem("scalvea_pending_india_checkout");
        } catch (_) {}
        clearCart();

        clearInterval(msgInterval);
        setStatus("success");
        setMessage("Order confirmed! Loading your receipt...");

        // Instant seamless redirect to order confirmation
        setTimeout(() => {
          navigate(`/order-success?id=${data.order.id}`);
        }, 350);
      } catch (err: any) {
        console.warn(`[Callback] Processing attempt ${attempt + 1}:`, err.message);

        if (attempt < 2) {
          // Fast discreet retry in 600ms — virtually imperceptible to the user
          setTimeout(() => confirm(attempt + 1), 600);
        } else {
          // Fallback directly to OrderSuccess which will also attempt fetch-shiprocket-order
          try {
            sessionStorage.removeItem("scalvea_pending_india_checkout");
            localStorage.removeItem("scalvea_pending_india_checkout");
          } catch (_) {}
          clearCart();
          clearInterval(msgInterval);
          navigate(`/order-success?shiprocket_order_id=${shiprocketOrderId}`);
        }
      }
    };

    confirm();

    return () => clearInterval(msgInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {status === "success" && (
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mx-auto transition-all scale-100">
              <CheckCircle className="h-9 w-9" />
            </div>
          )}

          {status === "failed" && (
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
              <AlertCircle className="h-9 w-9" />
            </div>
          )}

          {status === "processing" && (
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-border/40" />
              <div className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {status === "success" && "Order Confirmed"}
              {status === "failed" && "Something went wrong"}
              {status === "processing" && "Confirming Your Order"}
            </h1>
            <p className="text-sm text-muted-foreground transition-all duration-300 min-h-[24px]">
              {message}
            </p>
          </div>

          {status === "processing" && (
            <div className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-muted/40 text-xs text-muted-foreground border border-border/40">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>Verified &amp; Encrypted Transaction</span>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => navigate("/checkout")} className="w-full">
                Return to Checkout
              </Button>
              <Button variant="ghost" onClick={() => navigate("/account")} className="w-full">
                View My Account
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShiprocketCallback;
