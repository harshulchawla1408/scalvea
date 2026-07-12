import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";
import logo2 from "@/assets/logo2.png";

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Footer = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  return (
    <footer className="bg-[#000000] text-white border-t border-neutral-900">

      {/* FOOTER COLUMNS SECTION */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 xl:px-20 pt-20 md:pt-24 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 xl:gap-16">

          {/* Column 1 — Brand */}
          <div className="space-y-6 flex flex-col items-start text-left lg:col-span-1 border-b border-neutral-900 lg:border-none pb-6 lg:pb-0">
            {/* Footer Logo */}
            <img src={logo2} alt="Scalvea" className="h-12 w-auto object-contain" />
            <p className="text-sm md:text-[14px] text-neutral-400 font-light leading-relaxed max-w-xs">
              Science-backed hair care formulated with clinically researched ingredients for healthier hair and scalp. Premium Australian innovation, trusted by customers in Australia and India.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4 pt-2">
              <a
                href="https://www.instagram.com/scalvea_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-200 p-1"
                aria-label="Instagram"
              >
                <Instagram className="size-[18px]" />
              </a>
              <a
                href="https://www.tiktok.com/@scalvea/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-200 p-1"
                aria-label="TikTok"
              >
                <TiktokIcon className="size-[18px]" />
              </a>
              <a
                href="mailto:info@scalvea.com"
                className="text-neutral-400 hover:text-white transition-colors duration-200 p-1"
                aria-label="Email"
              >
                <Mail className="size-[18px]" />
              </a>
            </div>
          </div>

          {/* Column 2 — Shop */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("shop")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-bold text-white mb-0 lg:mb-5">
                Shop
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "shop" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "shop" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <li><Link to="/shop" className="hover:text-white transition-colors relative group block w-fit">
                  All Products
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/product/follicle-8-hair-growth-serum" className="hover:text-white transition-colors relative group block w-fit">
                  Hair Growth Serum
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/shop?category=Serums" className="hover:text-white transition-colors relative group block w-fit">
                  Anti Dandruff Serum
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/shop?category=Oils" className="hover:text-white transition-colors relative group block w-fit">
                  Hair Oil
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/shop?category=Shampoos" className="hover:text-white transition-colors relative group block w-fit">
                  Hair Shampoo
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/shop?category=Conditioners" className="hover:text-white transition-colors relative group block w-fit">
                  Hair Conditioner
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><a href="/#products" className="hover:text-white transition-colors relative group block w-fit">
                  Best Sellers
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </a></li>
              </ul>
            </div>
          </div>

          {/* Column 3 — Company */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("company")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-bold text-white mb-0 lg:mb-5">
                Company
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "company" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "company" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <li><Link to="/about" className="hover:text-white transition-colors relative group block w-fit">
                  About Us
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><a href="/#ingredients" className="hover:text-white transition-colors relative group block w-fit">
                  Ingredients
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </a></li>
                <li><Link to="/#" className="hover:text-white transition-colors relative group block w-fit">
                  Blog
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors relative group block w-fit">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/faqs" className="hover:text-white transition-colors relative group block w-fit">
                  FAQs
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors relative group block w-fit">
                  Privacy Policy
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/terms-conditions" className="hover:text-white transition-colors relative group block w-fit">
                  Terms & Conditions
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
              </ul>
            </div>
          </div>

          {/* Column 4 — Support */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("support")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-bold text-white mb-0 lg:mb-5">
                Support
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "support" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "support" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <li><Link to="/payment-policy" className="hover:text-white transition-colors relative group block w-fit">
                  Payment Policy
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/shipping-policy" className="hover:text-white transition-colors relative group block w-fit">
                  Shipping Policy
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/return-refund-policy" className="hover:text-white transition-colors relative group block w-fit">
                  Return & Refund Policy
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/account" className="hover:text-white transition-colors relative group block w-fit">
                  Track Order
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors relative group block w-fit">
                  Support
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors relative group block w-fit">
                  Contact
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
                </Link></li>
              </ul>
            </div>
          </div>

          {/* Column 5 — Locations */}
          <div className="flex flex-col py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("locations")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-bold text-white mb-0 lg:mb-5">
                Locations
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "locations" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "locations" ? "block" : "hidden lg:block"}`}>
              <div className="space-y-4 text-sm text-neutral-400 font-light">
                <div>
                  <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-1">Australia Office</p>
                  <p className="leading-relaxed text-neutral-400 font-normal">SCALVEA GROUPS PTY LTD</p>
                  <p className="leading-relaxed text-neutral-400">17 Travers Street</p>
                  <p className="leading-relaxed text-neutral-400">Craigieburn VIC 3064</p>
                  <p className="leading-relaxed text-neutral-400">Australia</p>
                </div>
                <div>
                  <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-1">India Operations</p>
                  <p className="leading-relaxed text-neutral-400 font-normal">R-6 Tej Bagh Colony</p>
                  <p className="leading-relaxed text-neutral-400">Sanour Road, Patiala</p>
                  <p className="leading-relaxed text-neutral-400">Punjab, India</p>
                </div>
                <div className="pt-1 space-y-2">
                  <div>
                    <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-0.5">Email</p>
                    <a href="mailto:info@scalvea.com" className="hover:text-white transition-colors block break-all text-neutral-400">
                      info@scalvea.com
                    </a>
                  </div>
                  <div>
                    <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-0.5">Phone</p>
                    <a href="tel:+919877191114" className="hover:text-white transition-colors block text-neutral-400">
                      +91 98771 91114
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER BOTTOM SECTION */}
        <div className="border-t border-neutral-900 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-[0.18em] text-neutral-500 uppercase font-light w-full">
          <div className="w-full md:w-auto text-center md:text-left">
            © 2026 Scalvea. All Rights Reserved.
          </div>
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 font-semibold text-neutral-450 text-center w-full md:w-auto py-2 md:py-0">
            Care You Deserve.
          </div>
          <div className="w-full md:w-auto text-center md:text-right">
            Made with Science • Australia & India
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
