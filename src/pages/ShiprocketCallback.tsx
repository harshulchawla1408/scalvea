import { useEffect, useState } from "react";
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

  const [status, setStatus] = useState<"checking" | "syncing" | "fallback" | "failed" | "success">("checking");
  const [message, setMessage] = useState("Initializing callback handler...");
  const [, setRetriesLeft] = useState(10);
  const [, setTargetOrderId] = useState<string | null>(null);

  // Read params
  const orderIdParam = searchParams.get("oid") ||
                        searchParams.get("order_id") || 
                        searchParams.get("shiprocket_order_id") || 
                        searchParams.get("token") || 
                        searchParams.get("id");

  useEffect(() => {
    // 5. Log full redirected URL received from Shiprocket
    console.log("=== SHIPROCKET REDIRECT DETECTED ===");
    console.log("Full redirected URL received from Shiprocket:", window.location.href);
    console.log("URL search parameters:", Array.from(searchParams.entries()));
    console.log("Extracted orderIdParam:", orderIdParam);
    console.log("=====================================");

    const ost = searchParams.get("ost");
    if (ost && ost !== "SUCCESS" && ost !== "success") {
      console.warn("Shiprocket checkout status indicates cancellation or failure:", ost);
      setStatus("failed");
      if (ost === "CANCELLED" || ost === "cancelled" || ost === "INITIATED") {
        setMessage("Checkout cancelled or abandoned. Redirecting back to checkout...");
      } else {
        setMessage(`Checkout payment failed (Status: ${ost}). Redirecting back to checkout...`);
      }
      setTimeout(() => {
        navigate("/checkout");
      }, 3500);
      return;
    }

    const syncOrder = async (id: string, attempt: number) => {
      try {
        setStatus("syncing");
        setMessage(`Verifying payment details with Shiprocket (Attempt ${11 - attempt}/10)...`);

        const { data, error } = await supabase.functions.invoke("fetch-shiprocket-order", {
          body: { orderId: id }
        });

        if (error) {
          console.warn("fetch-shiprocket-order returned an error:", error);
          throw error;
        }

        console.log("fetch-shiprocket-order response:", data);
        setStatus("success");
        setMessage("Payment verified! Redirecting to success page...");
        
        // Wait a brief moment for the visual transition
        setTimeout(() => {
          navigate(`/order-success?shiprocket_order_id=${id}`);
        }, 1500);

      } catch (err: any) {
        console.error("Sync error:", err);
        
        if (attempt > 1) {
          setTimeout(() => {
            setRetriesLeft(attempt - 1);
            syncOrder(id, attempt - 1);
          }, 2000); // Wait 2 seconds before retrying
        } else {
          console.error("Exhausted all retries syncing order.");
          setStatus("failed");
          setMessage("We couldn't sync your order details immediately. Redirecting to your success page where syncing will continue...");
          setTimeout(() => {
            navigate(`/order-success?shiprocket_order_id=${id}`);
          }, 4000);
        }
      }
    };

    const handleFallback = async (attempt: number) => {
      try {
        setStatus("fallback");
        setMessage(`No order identifier found in URL. Checking database for recent orders (Attempt ${11 - attempt}/10)...`);

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn("No authenticated user found for fallback");
          setStatus("failed");
          setMessage("Session expired. Please log in to check your order history.");
          return;
        }

        // Fetch recent orders for this user created in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentOrders, error: ordersErr } = await supabase
          .from("orders")
          .select("id, created_at, shiprocket_orders(shiprocket_order_id)")
          .eq("user_id", user.id)
          .gte("created_at", fiveMinutesAgo)
          .order("created_at", { ascending: false });

        if (ordersErr) throw ordersErr;

        if (recentOrders && recentOrders.length > 0) {
          const mappingOrder = recentOrders.find(
            (o: any) => o.shiprocket_orders && o.shiprocket_orders.length > 0
          );

          if (mappingOrder) {
            const shiprocketId = mappingOrder.shiprocket_orders[0].shiprocket_order_id;
            console.log("Fallback found mapped order in database:", shiprocketId);
            syncOrder(shiprocketId, 10);
            return;
          }
        }

        // If not found, retry or fail
        if (attempt > 1) {
          setTimeout(() => {
            handleFallback(attempt - 1);
          }, 2000);
        } else {
          setStatus("failed");
          setMessage("We couldn't locate your recent order. Please check your account page to see if it processes shortly.");
        }

      } catch (err: any) {
        console.error("Fallback check error:", err);
        setStatus("failed");
        setMessage(`Verification error: ${err.message}`);
      }
    };

    if (orderIdParam) {
      setTargetOrderId(orderIdParam);
      syncOrder(orderIdParam, 10);
    } else {
      // 4. Fallback behavior if no order_id is present
      handleFallback(10);
    }
  }, [orderIdParam, searchParams, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4 bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <div className="max-w-md w-full bg-card/60 backdrop-blur-md rounded-2xl p-8 border border-border shadow-2xl relative overflow-hidden transition-all duration-300">
          {/* Neon gradient glows */}
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

            {(status === "checking" || status === "syncing" || status === "fallback") && (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-spin">
                <Loader2 className="h-10 w-10" />
              </div>
            )}

            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
              {status === "success" && "Order Verified"}
              {status === "failed" && "Sync Timeout"}
              {status === "checking" && "Processing Order"}
              {status === "syncing" && "Verifying Payment"}
              {status === "fallback" && "Locating Order"}
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
