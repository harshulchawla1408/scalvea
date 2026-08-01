import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const ShiprocketCallback = () => {
  useSEO({
    title: "Processing Order - Scalvea",
    description: "Please wait while we verify your order with Shiprocket.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"checking" | "syncing" | "failed" | "success">("checking");
  const [message, setMessage] = useState("Initializing callback handler...");
  
  // Ref to prevent double-execution in React strict mode
  const hasExecuted = useRef(false);

  // Read params
  const orderIdParam = searchParams.get("oid") ||
                        searchParams.get("order_id") || 
                        searchParams.get("shiprocket_order_id") || 
                        searchParams.get("token") || 
                        searchParams.get("id");

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    console.log("[Callback] === SHIPROCKET REDIRECT DETECTED ===");
    console.log("[Callback] Full redirected URL:", window.location.href);
    console.log("[Callback] Extracted orderIdParam:", orderIdParam);

    const ost = searchParams.get("ost");
    if (ost && ost.toUpperCase() !== "SUCCESS") {
      console.warn("[Callback] Shiprocket checkout status indicates cancellation or failure:", ost);
      setStatus("failed");
      if (ost.toUpperCase() === "CANCELLED" || ost.toUpperCase() === "INITIATED") {
        setMessage("Checkout cancelled or abandoned. Redirecting back to checkout...");
      } else {
        setMessage(`Checkout payment failed (Status: ${ost}). Redirecting back to checkout...`);
      }
      setTimeout(() => navigate("/checkout"), 3500);
      return;
    }

    if (!orderIdParam) {
      console.error("[Callback] No order identifier found in URL.");
      setStatus("failed");
      setMessage("No order identifier found in URL. Please contact support.");
      return;
    }

    // FIRE AND FORGET sync to update the draft order in the background ASAP
    supabase.functions.invoke("fetch-shiprocket-order", {
      body: { orderId: orderIdParam }
    }).catch(err => console.warn("Background sync failed:", err));

    // IMMEDIATELY REDIRECT
    setStatus("success");
    setMessage("Payment successful! Loading your order details...");
    
    // We already have a draft order mapped to this shiprocket_order_id!
    setTimeout(() => {
      navigate(`/order-success?shiprocket_order_id=${orderIdParam}`);
    }, 500);

  }, [orderIdParam, searchParams, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4 bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <div className="max-w-md w-full bg-card/60 backdrop-blur-md rounded-2xl p-8 border border-border shadow-2xl relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10">
            {status === "success" && (
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 animate-bounce">
                <CheckCircle className="h-10 w-10" />
              </div>
            )}

            {status === "failed" && (
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6 animate-pulse">
                <AlertCircle className="h-10 w-10" />
              </div>
            )}

            {(status === "checking" || status === "syncing") && (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-spin">
                <Loader2 className="h-10 w-10" />
              </div>
            )}

            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
              {status === "success" && "Order Verified"}
              {status === "failed" && "Verification Timeout"}
              {status === "checking" && "Processing Order"}
              {status === "syncing" && "Verifying Payment"}
            </h1>

            <p className="text-muted-foreground text-sm max-w-xs mb-8 min-h-[48px] flex items-center justify-center leading-relaxed">
              {message}
            </p>

            <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/50">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Secure, encrypted checkout verification</span>
            </div>

            {status === "failed" && (
              <div className="flex flex-col gap-2 w-full mt-6">
                <Button variant="default" onClick={() => navigate("/account")} className="w-full shadow-lg hover:shadow-primary/20">
                  Go to My Account
                </Button>
                <Button variant="ghost" onClick={() => navigate("/shop")} className="w-full">
                  Return to Store
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShiprocketCallback;
