import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

// ─── ShiprocketCallback ──────────────────────────────────────────────────────
// Landing page after Shiprocket Checkout redirect.
//
// NEW FLOW (no heavy polling — no verification screen):
//   1. Read ost param. If not SUCCESS → redirect back to checkout.
//   2. Call fetch-shiprocket-order with the shiprocket order_id from URL.
//      The function handles: DB lookup → API call → order creation atomically.
//   3. On success: redirect straight to /order-success?id=<LOCAL_ORDER_UUID>
//   4. On retry failure (max 3): redirect to /order-success?shiprocket_order_id=<SR_ID>
//      The OrderSuccess page will poll DB until the webhook creates it.
// ─────────────────────────────────────────────────────────────────────────────

const FACTS = [
  "Processing your order...",
  "Scalvea products are dermatologist tested.",
  "Your hair deserves the best — almost there!",
  "Confirming payment with Shiprocket...",
  "Preparing your order summary...",
];

const ShiprocketCallback = () => {
  useSEO({
    title: "Processing Order - Scalvea",
    description: "Please wait while we confirm your order.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState(FACTS[0]);
  const [retryCount, setRetryCount] = useState(0);
  const hasExecuted = useRef(false);
  const factIdx = useRef(0);

  // Shiprocket passes various param names — handle all of them
  const shiprocketOrderId =
    searchParams.get("oid") ||
    searchParams.get("order_id") ||
    searchParams.get("shiprocket_order_id") ||
    searchParams.get("id") ||
    searchParams.get("token");

  const ost = searchParams.get("ost");

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    console.log("[Callback] URL:", window.location.href);
    console.log("[Callback] ost:", ost, "| shiprocketOrderId:", shiprocketOrderId);

    // ── Rotate fun facts while processing ─────────────────────────────────
    const factInterval = setInterval(() => {
      factIdx.current = (factIdx.current + 1) % FACTS.length;
      setMessage(FACTS[factIdx.current]);
    }, 2000);

    // ── If payment was cancelled / failed → /order-failed ───────────────────────
    if (ost && !["SUCCESS", "PAID", "COMPLETED"].includes(ost.toUpperCase())) {
      clearInterval(factInterval);
      navigate(`/order-failed?reason=cancelled`);
      return;
    }

    if (!shiprocketOrderId) {
      clearInterval(factInterval);
      navigate(`/order-failed?reason=cancelled`);
      return;
    }

    // ── Attempt to confirm the order via fetch-shiprocket-order ──────────
    const confirm = async (attempt = 0): Promise<void> => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-shiprocket-order", {
          body: { orderId: shiprocketOrderId },
        });

        if (error) throw new Error(error.message);
        if (!data?.success || !data?.order) throw new Error("Order not yet available");

        // Success! We have the local order UUID — go straight to success page
        clearInterval(factInterval);
        setStatus("success");
        setMessage("Order confirmed! Loading your receipt...");
        setTimeout(() => {
          navigate(`/order-success?id=${data.order.id}`);
        }, 500);
      } catch (err: any) {
        console.warn(`[Callback] Attempt ${attempt + 1} failed:`, err.message);
        setRetryCount(attempt + 1);

        if (attempt < 4) {
          // Shiprocket API takes 3-8 seconds to populate — retry
          setTimeout(() => confirm(attempt + 1), 3000);
        } else {
          // Exhausted all retries — payment may have been received but order not yet in DB.
          // Redirect to order-failed with reason=timeout so user knows to email if money taken.
          clearInterval(factInterval);
          navigate(`/order-failed?reason=timeout`);
        }
      }
    };

    confirm();

    return () => clearInterval(factInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full text-center space-y-8">

          {status === "success" && (
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
          )}

          {status === "failed" && (
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mx-auto">
              <AlertCircle className="h-10 w-10" />
            </div>
          )}

          {status === "processing" && (
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin border-l-transparent border-r-transparent border-b-transparent" />
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {status === "success" && "Order Confirmed"}
              {status === "failed"  && "Something went wrong"}
              {status === "processing" && "Confirming Your Order"}
            </h1>
            <p className="text-sm text-muted-foreground transition-all duration-500 min-h-[40px]">
              {message}
            </p>
          </div>

          {status === "processing" && (
            <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/50">
              <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Secure checkout by Shiprocket</span>
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

          {/* Debug info for development */}
          {retryCount > 0 && status === "processing" && (
            <p className="text-[10px] text-muted-foreground/50">
              Attempt {retryCount + 1}/5
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShiprocketCallback;
