import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, RefreshCw, Clock, ShieldCheck } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";

const ShippingReturns = () => {
  const [activeTab, setActiveTab] = useState<"shipping" | "returns">("shipping");
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  useSEO({
    title: "Shipping & Returns",
    description: "Learn about Scalvea's global shipping rates to Australia and India, delivery timelines, and our 30-day returns and refund policy.",
    keywords: "Scalvea shipping, Scalvea returns, hair serum delivery, refund policy, international shipping",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />

      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="text-center mb-12">
          <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
            CUSTOMER CARE
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.04em] mb-4 text-foreground uppercase">
            Shipping & Returns
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
            Everything you need to know about our logistics, delivery timelines, and return policies.
          </p>
        </div>

        {/* Premium Tab Bar */}
        <div className="flex border-b border-border mb-12 justify-center">
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-8 py-4 text-xs tracking-[0.15em] uppercase transition-all duration-300 relative ${
              activeTab === "shipping" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shipping Policy
            {activeTab === "shipping" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-8 py-4 text-xs tracking-[0.15em] uppercase transition-all duration-300 relative ${
              activeTab === "returns" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Returns & Refunds
            {activeTab === "returns" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Contents with animations */}
        <div className="min-h-[350px]">
          <AnimatePresence mode="wait">
            {activeTab === "shipping" ? (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                {/* Highlights grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-border p-6 flex gap-4 items-start">
                    <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-xs tracking-[0.12em] uppercase font-medium mb-1">Free Shipping Available</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Free standard shipping on orders over $75 AUD in Australia, and corresponding thresholds globally.</p>
                    </div>
                  </div>
                  <div className="border border-border p-6 flex gap-4 items-start">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-xs tracking-[0.12em] uppercase font-medium mb-1">1-2 Day Processing</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Orders are processed within 1-2 business days. A tracking number will be sent immediately upon dispatch.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">Domestic Shipping (Australia)</h2>
                    <ul className="space-y-2 border-l border-border pl-4">
                      <li><strong className="text-foreground">Standard Delivery:</strong> 3-7 business days — <span className="line-through text-muted-foreground/60 mr-1">$10.00 AUD</span> <strong className="font-semibold text-foreground">$7.50 AUD</strong></li>
                      <li><strong className="text-foreground">Express Delivery:</strong> 1-3 business days — $14.95 AUD</li>
                      <li>Free standard shipping applies automatically to all orders over $75 AUD.</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">International Shipping & India</h2>
                    <ul className="space-y-2 border-l border-border pl-4">
                      <li><strong className="text-foreground">Standard Delivery (India):</strong> 3-5 business days — <span className="line-through text-muted-foreground/60 mr-1">₹100</span> <strong className="font-semibold text-foreground">₹50</strong></li>
                      <li><strong className="text-foreground">Standard International:</strong> 7-14 business days — $19.95 AUD / Regional equivalent</li>
                      <li><strong className="text-foreground">Express International:</strong> 3-7 business days — $29.95 AUD</li>
                      <li>We ship directly to Australia, India, and the USA with local courier integrations.</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">Order Tracking</h2>
                    <p className="border-l border-border pl-4">
                      All parcels are dispatched from our regional hub nodes. You will receive a tracking link via email. You can also view real-time delivery logs inside your Scalvea account profile page.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="returns"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                {/* Highlights grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-border p-6 flex gap-4 items-start">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-xs tracking-[0.12em] uppercase font-medium mb-1">30-Day Money-Back</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">If you're not satisfied, return unopened products within 30 days of delivery for a full refund.</p>
                    </div>
                  </div>
                  <div className="border border-border p-6 flex gap-4 items-start">
                    <RefreshCw className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-xs tracking-[0.12em] uppercase font-medium mb-1">Hassle-Free Process</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Contact customer care, receive your pre-paid shipping label, and drop it off at your local post.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">Returns Guarantee</h2>
                    <p className="border-l border-border pl-4">
                      We offer a 30-day money-back guarantee for all unopened products in their original packaging. If you experience an adverse reaction to our active ingredients, opened products can be returned within 14 days of delivery.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">How to Initiate a Return</h2>
                    <ul className="space-y-2 border-l border-border pl-4">
                      <li>1. Contact our customer care team at <strong className="text-foreground">{settings.in_email}</strong> or call us at <strong className="text-foreground">{settings.in_phone}</strong> (India Operations) or <strong className="text-foreground">{settings.au_phone}</strong> (Australia Office).</li>
                      <li>2. Provide your order number, purchase receipt, and reason for return.</li>
                      <li>3. If eligible, we will send you a pre-paid return shipping label and package drop-off instructions.</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-3 font-semibold">Refund Timelines</h2>
                    <p className="border-l border-border pl-4">
                      Once your return is received and inspected at our hub, your refund will be processed back to your original payment method (Stripe/Card/COD adjustments) within 5-7 business days.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturns;
