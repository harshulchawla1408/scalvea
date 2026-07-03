import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";

const FooterLogo = () => {
  const [isHovered, setIsHovered] = useState(false);
  const word = "SCALVEA";
  
  return (
    <div 
      className="inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.08, delayChildren: 0.1 } 
          }
        }}
        animate={{
          letterSpacing: isHovered ? "0.35em" : "0.25em",
          textShadow: isHovered ? "0 0 12px rgba(255,255,255,0.4)" : "0 0 0px rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center text-sm tracking-[0.25em] font-sans font-light uppercase select-none text-white relative"
      >
        {word.split("").map((letter, idx) => (
          <motion.span
            key={idx}
            variants={{
              hidden: { opacity: 0, filter: "blur(6px)", y: 5 },
              visible: { 
                opacity: 1, 
                filter: "blur(0px)", 
                y: 0,
                transition: { duration: 0.8, ease: "easeOut" } 
              }
            }}
            className="inline-block"
          >
            {letter}
          </motion.span>
        ))}
        {/* Subtle moving light streak pass overlay */}
        <motion.div 
          animate={{ left: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", repeatDelay: 2 }}
          className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
        />
      </motion.div>
    </div>
  );
};

const Footer = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);
  return (
    <footer className="bg-black text-white pt-24 pb-12 overflow-hidden relative border-t border-neutral-900 z-20">
      {/* Global Grain/Noise Overlay */}
      <div className="absolute inset-0 noise-bg pointer-events-none opacity-[0.015]" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-16">
          
          {/* Brand Logo & Info */}
          <div className="lg:col-span-2 space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <FooterLogo />
            <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-xs">
              Premium hair growth solutions backed by clinical research. High concentrations of Redensyl, Baicapil, Procapil, and Anagain.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-[10px] tracking-[0.1em] uppercase text-neutral-400 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-[10px] tracking-[0.1em] uppercase text-neutral-400 hover:text-white transition-colors">Facebook</a>
              <a href="#" className="text-[10px] tracking-[0.1em] uppercase text-neutral-400 hover:text-white transition-colors">Pinterest</a>
            </div>
          </div>

          {/* Shop */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300 mb-5">Shop</h4>
            <ul className="space-y-3 text-xs text-neutral-400 font-light flex flex-col items-center md:items-start">
              <li><Link to="/shop" className="hover:text-white transition-colors relative group block w-fit">
                All Products
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
              <li><Link to="/shop?category=Serums" className="hover:text-white transition-colors relative group block w-fit">
                Follicle 8 Serum
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
              <li><Link to="/shop?category=Sprays" className="hover:text-white transition-colors relative group block w-fit">
                Follicle 8 Spray
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300 mb-5">Help</h4>
            <ul className="space-y-3 text-xs text-neutral-400 font-light flex flex-col items-center md:items-start">
              <li><Link to="/support" className="hover:text-white transition-colors relative group block w-fit">
                Support Center
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
              <li><Link to="/shipping-returns" className="hover:text-white transition-colors relative group block w-fit">
                Shipping & Returns
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors relative group block w-fit">
                FAQs
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all group-hover:w-full" />
              </Link></li>
            </ul>
          </div>

          {/* Contact / Locations */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300 mb-5">Locations</h4>
            <div className="space-y-4 text-xs text-neutral-400 font-light flex flex-col items-center md:items-start">
              <div>
                <p className="text-neutral-300 font-medium tracking-wider text-[10px] uppercase">Australia Office</p>
                <p className="text-[10px] leading-relaxed text-neutral-400">{settings.au_business_name}</p>
                <p className="text-[10px] leading-relaxed text-neutral-500">Craigieburn, VIC 3064</p>
              </div>
              <div>
                <p className="text-neutral-300 font-medium tracking-wider text-[10px] uppercase">India Operations</p>
                <p className="text-[10px] leading-relaxed text-neutral-500">Patiala, Punjab</p>
              </div>
              <div className="pt-1">
                <p className="text-neutral-300 font-medium tracking-wider text-[10px] uppercase">Email</p>
                <a href={`mailto:${settings.in_email}`} className="hover:text-white transition-colors text-[10px] break-all">
                  {settings.in_email}
                </a>
              </div>
            </div>
          </div>

          {/* Mini newsletter */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-300 mb-5">Newsletter</h4>
            <p className="text-[10px] text-neutral-400 font-light mb-4">Sign up for exclusive notifications.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-sm">
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-neutral-900 border border-neutral-800 text-xs px-3 py-1.5 outline-none focus:border-white transition-colors w-full text-white font-light rounded-none" 
              />
              <button type="submit" className="bg-white text-black px-3 text-[9px] tracking-[0.15em] uppercase font-medium">Go</button>
            </form>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-900 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[9px] tracking-[0.2em] text-neutral-500 uppercase">
            © 2026 SCALVEA. NOTHING TO HIDE.
          </span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[9px] tracking-[0.15em] text-neutral-500 uppercase justify-center sm:justify-end">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping Policy</Link>
            <Link to="/returns-policy" className="hover:text-white transition-colors">Returns & Refunds</Link>
            <Link to="/cancellation-policy" className="hover:text-white transition-colors">Cancellation Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
