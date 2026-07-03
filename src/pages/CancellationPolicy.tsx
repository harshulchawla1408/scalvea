import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";
import { motion } from "framer-motion";
import { Clock, Ban, FileCheck, Mail, HelpCircle } from "lucide-react";

const CancellationPolicy = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoreSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  useSEO({
    title: "Cancellation Policy",
    description: "Read SCALVEA's order cancellation terms and policies. Learn about timelines, dispatch rules, and approval rights.",
    keywords: "Scalvea cancellation, cancel order, refund, dispatch rule, shipping",
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Extract paragraphs or use standard breakdown
  const paragraphs = settings.cancellation_policy
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  // Assign icons to each rule for luxury card layout
  const ruleIcons = [
    <Clock className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />,
    <Ban className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />,
    <Mail className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />,
    <FileCheck className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />,
  ];

  const ruleTitles = [
    "Cancellation Timeframe",
    "Post-Dispatch Rule",
    "How to Request",
    "Approval Rights",
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />
      
      <div>
        <Header />
        
        <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
          {/* Editorial Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-light block mb-3">
              LEGAL & POLICIES
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.05em] mb-4 text-foreground uppercase">
              Cancellation Policy
            </h1>
            <div className="h-[1px] bg-neutral-200 w-16 mx-auto mb-6" />
            <p className="text-xs text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
              Transparent terms governing your order modifications and dispatch cancellation processes.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="h-24 bg-muted/30 animate-pulse border border-border" />
              <div className="h-24 bg-muted/30 animate-pulse border border-border" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
            >
              {paragraphs.map((para, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-[#fafafa]/80 backdrop-blur-sm border border-neutral-100/80 p-8 shadow-sm hover:shadow-md hover:border-neutral-200 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                      {ruleIcons[index] || <HelpCircle className="h-5 w-5 text-neutral-400 mt-1 shrink-0" />}
                      <h3 className="text-[10px] tracking-[0.25em] uppercase font-semibold text-neutral-800">
                        {ruleTitles[index] || `Section ${index + 1}`}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      {para}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Customer Support Footer Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-16 max-w-3xl mx-auto border border-neutral-100 bg-[#fafafa] p-8 text-center"
          >
            <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase mb-2">Need Immediate Help?</p>
            <p className="text-xs text-neutral-600 font-light max-w-md mx-auto mb-4">
              If you have just placed an order and need to make modifications or request a cancel, please call or email operations support without delay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-[10px] tracking-[0.1em] text-neutral-500 uppercase font-medium">
              <span>Phone: <a href={`tel:${settings.in_phone}`} className="text-black hover:underline">{settings.in_phone}</a></span>
              <span className="hidden sm:inline">|</span>
              <span>Email: <a href={`mailto:${settings.in_email}`} className="text-black hover:underline">{settings.in_email}</a></span>
            </div>
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CancellationPolicy;
