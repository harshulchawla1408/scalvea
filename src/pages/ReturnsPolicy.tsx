import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, XCircle, Clock, Calendar, Mail, Phone, Info } from "lucide-react";

const ReturnsPolicy = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoreSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  useSEO({
    title: "Returns & Refund Policy",
    description: "Read SCALVEA's Returns & Refunds Policy. Learn about eligibility criteria, safety standards, and refund timelines.",
    keywords: "Scalvea returns, refund policy, hair growth serum refund, return eligibility, order claims",
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />
      
      <div>
        <Header />
        
        <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 relative z-10">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-light block mb-3">
              LEGAL & POLICIES
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.05em] mb-4 text-foreground uppercase">
              Returns & Refund Policy
            </h1>
            <div className="h-[1px] bg-neutral-200 w-16 mx-auto mb-6" />
            <p className="text-xs text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
              Our safety standards and structured claim guidelines ensure the highest hygiene quality for every customer.
            </p>
          </div>

          {loading ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="h-28 bg-muted/30 animate-pulse border border-border" />
              <div className="h-44 bg-muted/30 animate-pulse border border-border" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-8 max-w-4xl mx-auto"
            >
              {/* Pillar 1: Critical Hygiene Warning (Callout card) */}
              <motion.div
                variants={itemVariants}
                className="border border-red-200/50 bg-red-50/20 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
              >
                <div className="flex gap-4 items-start">
                  <ShieldAlert className="h-6 w-6 text-neutral-900 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-xs tracking-[0.15em] uppercase font-semibold text-neutral-950 mb-1">
                      Hygiene & Safety First
                    </h3>
                    <p className="text-xs text-neutral-600 font-light leading-relaxed max-w-xl">
                      SCALVEA does NOT accept returns for used, opened, or partially used products. Due to strict hygiene and health safety protocols, products once opened cannot be returned under any circumstances.
                    </p>
                  </div>
                </div>
                <span className="text-[8px] tracking-[0.2em] uppercase bg-black text-white px-3 py-1 font-medium select-none">
                  Strict Rule
                </span>
              </motion.div>

              {/* Pillar 2: Eligible vs Ineligible (Side-by-side grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Eligible */}
                <motion.div
                  variants={itemVariants}
                  className="border border-neutral-100 bg-[#fafafa]/50 p-6 md:p-8 space-y-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                      <CheckCircle2 className="h-4 w-4 text-neutral-400" />
                      <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-900">
                        Refund or Replacement Applicable
                      </h4>
                    </div>
                    <ul className="space-y-3 text-xs text-neutral-600 font-light">
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">1.</span>
                        <span>Product received damaged during transit</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">2.</span>
                        <span>Incorrect product or size delivered</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">3.</span>
                        <span>Delivery rejected before acceptance</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">4.</span>
                        <span>Items missing in shipment</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 text-[9px] tracking-[0.1em] text-neutral-400 flex items-center gap-1.5 uppercase font-medium">
                    <Info className="h-3.5 w-3.5" /> Subject to verification
                  </div>
                </motion.div>

                {/* Ineligible */}
                <motion.div
                  variants={itemVariants}
                  className="border border-neutral-100 bg-[#fafafa]/50 p-6 md:p-8 space-y-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                      <XCircle className="h-4 w-4 text-neutral-400" />
                      <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-900">
                        Strictly No Refund For
                      </h4>
                    </div>
                    <ul className="space-y-3 text-xs text-neutral-600 font-light">
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">·</span>
                        <span>Change of mind or ordering errors</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">·</span>
                        <span>Used or partially used products</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">·</span>
                        <span>Opened packaging or broken safety seals</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="text-neutral-400 font-medium">·</span>
                        <span>Dissatisfaction or lack of results after usage</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-4 text-[9px] tracking-[0.1em] text-neutral-400 flex items-center gap-1.5 uppercase font-medium">
                    <Info className="h-3.5 w-3.5" /> Hygiene & safety law compliant
                  </div>
                </motion.div>
              </div>

              {/* Pillar 3: Approval Process */}
              <motion.div
                variants={itemVariants}
                className="border border-neutral-100 bg-[#fafafa]/80 p-8 space-y-6"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-900">
                    Refund Approval Process
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-light text-neutral-600 leading-relaxed">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">01 / Contact Support</span>
                    <p>Contact support within <strong>48 hours of delivery</strong>. Delayed claims cannot be verified.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">02 / Provide Proof</span>
                    <p>Provide your Order ID, clear photos/videos of the issue, and a brief description of the condition.</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">03 / Verification</span>
                    <p>After review and validation, refund or replacement will be dispatched within <strong>5–10 business days</strong>.</p>
                  </div>
                </div>
              </motion.div>

              {/* Pillar 4: Timeline & Contact */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <div className="border border-neutral-100 bg-[#fafafa]/50 p-6 flex gap-4 items-center">
                  <Calendar className="h-5 w-5 text-neutral-400 shrink-0" />
                  <div>
                    <h5 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-800">Refund Timeline</h5>
                    <p className="text-xs text-neutral-600 font-light mt-0.5">Approved funds are processed within 5–10 business days.</p>
                  </div>
                </div>
                
                <div className="border border-neutral-100 bg-[#fafafa]/50 p-6 flex gap-4 items-center">
                  <Mail className="h-5 w-5 text-neutral-400 shrink-0" />
                  <div>
                    <h5 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-neutral-800">Support Contacts</h5>
                    <p className="text-xs text-neutral-600 font-light mt-0.5">
                      Email: <a href={`mailto:${settings.in_email}`} className="text-black hover:underline">{settings.in_email}</a><br />
                      Phone: <a href={`tel:${settings.in_phone}`} className="text-black hover:underline">{settings.in_phone}</a>
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Render dynamic DB block below for full transparency */}
              <motion.div
                variants={itemVariants}
                className="pt-8 border-t border-neutral-100 text-center"
              >
                <h5 className="text-[9px] tracking-[0.25em] uppercase font-semibold text-neutral-400 mb-4">Official Document Text</h5>
                <div className="text-[11px] font-light text-neutral-400 max-w-2xl mx-auto whitespace-pre-line leading-relaxed text-left bg-neutral-50/50 p-6 border border-neutral-100/50">
                  {settings.refund_policy}
                </div>
              </motion.div>

            </motion.div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ReturnsPolicy;
