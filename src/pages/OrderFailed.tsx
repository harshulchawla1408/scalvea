import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { XCircle, Mail, ShoppingBag, RotateCcw } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

// ─── OrderFailed Page ─────────────────────────────────────────────────────────
// Shown when a checkout is cancelled, payment fails, or an unrecoverable error
// occurs. Always tells the user to email info@scalvea.com if money was deducted.
// ─────────────────────────────────────────────────────────────────────────────

const OrderFailed = () => {
  useSEO({
    title: "Payment Unsuccessful - Scalvea",
    description: "Your payment could not be processed. Please contact support.",
    noindex: true,
  });

  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "cancelled";

  const isCancelled = reason === "cancelled";
  const isTimeout   = reason === "timeout";

  const headingText = isCancelled
    ? "Checkout Cancelled"
    : isTimeout
    ? "Order Not Confirmed"
    : "Payment Unsuccessful";

  const bodyText = isCancelled
    ? "You cancelled the checkout. Your cart is safe — nothing was charged."
    : isTimeout
    ? "Your payment may have been received, but we couldn't confirm your order in time."
    : "Something went wrong during payment processing. Please try again.";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Header />

      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full space-y-10 text-center">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Scalvea</p>
            <h1 className="text-2xl font-extralight tracking-[0.08em] uppercase text-foreground">
              {headingText}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {bodyText}
            </p>
          </div>

          {/* Support card — always shown */}
          <div className="border border-amber-200 bg-amber-50/60 rounded-sm p-6 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-[0.08em]">
                  Was money deducted from your account?
                </p>
                <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                  Don't worry — if any amount was charged, it will be refunded automatically within 5–7 business days.
                  To expedite this or for any queries, please email us:
                </p>
                <a
                  href="mailto:info@scalvea.com?subject=Payment Issue - Order Not Received"
                  className="inline-flex items-center gap-1.5 mt-2.5 text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  info@scalvea.com
                </a>
                <p className="text-[10px] text-amber-600 mt-2">
                  Include your name, email, and the approximate payment amount.
                  We typically respond within 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to="/checkout">
              <Button
                className="w-full sm:w-auto h-12 min-w-[160px] bg-neutral-900 hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-light rounded-none flex items-center gap-2"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </Link>

            <Link to="/shop">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 min-w-[160px] uppercase tracking-widest text-xs font-light rounded-none flex items-center gap-2"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Back to Shop
              </Button>
            </Link>
          </div>

          <Link
            to="/account"
            className="block text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Check My Orders
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderFailed;
