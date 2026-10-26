import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, ChevronDown, ChevronUp, Linkedin } from "lucide-react";

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

import { WhatsappIcon } from "@/components/ui/whatsapp-icon";

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li>
    <Link to={to} className="hover:text-white transition-colors relative group block w-fit">
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white transition-all duration-200 group-hover:w-full" />
    </Link>
  </li>
);

const Footer = () => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

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
            {/* Text Logo */}
            <div className="space-y-1">
              <span
                className="text-white text-2xl font-light font-display tracking-tight leading-none block"
              >
                Scalvea
              </span>
              <span className="text-[9px] tracking-[0.35em] uppercase text-neutral-500 font-light block">
                CARE YOU DESERVE
              </span>
            </div>

            <p className="text-sm md:text-[13px] text-neutral-300 font-light leading-relaxed max-w-xs">
              Science-backed hair care formulated with clinically researched ingredients for healthier hair and scalp. Premium Australian innovation trusted across Australia and India.
            </p>

            {/* Social Icons — Facebook, Instagram, LinkedIn, TikTok (Left side) */}
            <div className="flex gap-2 pt-2">
              <a
                href="https://www.facebook.com/p/Scalvea-61593812710461/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-200 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="size-[18px]" />
              </a>
              <a
                href="https://www.instagram.com/scalvea_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-200 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="size-[18px]" />
              </a>
              <a
                href="https://www.linkedin.com/company/scalvea/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-200 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-[18px]" />
              </a>
              <a
                href="https://www.tiktok.com/@scalvea/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-200 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="TikTok"
              >
                <TiktokIcon className="size-[18px]" />
              </a>
            </div>
          </div>

          {/* Column 2 — Shop */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("shop")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <div className="text-sm md:text-[14px] tracking-[0.16em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Shop
              </div>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "shop" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "shop" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-[15px] text-neutral-300 font-normal">
                <FooterLink to="/shop">All Products</FooterLink>
                <FooterLink to="/product/follicle-8-hair-growth-serum">Hair Growth Serum</FooterLink>
                <FooterLink to="/product/scalp-5-anti-dandruff-hair-serum">Anti Dandruff Serum</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 3 — Company */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("company")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <div className="text-sm md:text-[14px] tracking-[0.16em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Company
              </div>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "company" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "company" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-[15px] text-neutral-300 font-normal">
                <FooterLink to="/about">About Us</FooterLink>
                <FooterLink to="/blogs">Blog</FooterLink>
                <FooterLink to="/videos">Video Guides</FooterLink>
                <FooterLink to="/faq">FAQs</FooterLink>
                <FooterLink to="/terms-of-service">Terms &amp; Conditions</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 4 — Support */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("support")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <div className="text-sm md:text-[14px] tracking-[0.16em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Support
              </div>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "support" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "support" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-[15px] text-neutral-300 font-normal">
                <FooterLink to="/contact">Contact Us</FooterLink>
                <FooterLink to="/shipping-policy">Shipping Policy</FooterLink>
                <FooterLink to="/returns-policy">Return &amp; Refund Policy</FooterLink>
                <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
                <FooterLink to="/payment-policy">Payment Policy</FooterLink>
                <FooterLink to="/cancellation-policy">Cancellation Policy</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 5 — Locations */}
          <div className="flex flex-col py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("locations")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <div className="text-sm md:text-[14px] tracking-[0.16em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Contact & Locations
              </div>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "locations" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "locations" ? "block" : "hidden lg:block"}`}>
              <div className="space-y-5 text-sm text-neutral-300 font-light">
                <div>
                  <p className="text-neutral-200 font-semibold tracking-wider text-[11px] uppercase mb-1.5 flex items-center gap-1.5">
                    <img src="/flags/au.png" alt="Australia" className="w-3.5 h-auto rounded-[1.5px] shadow-sm" width="14" height="10" />
                    <span>Australia (HQ)</span>
                  </p>
                  <address className="not-italic leading-relaxed text-neutral-300 text-[13px]">
                    Little Collins St<br />Melbourne VIC 3000
                  </address>
                </div>
                <div>
                  <p className="text-neutral-200 font-semibold tracking-wider text-[11px] uppercase mb-1.5 flex items-center gap-1.5">
                    <img src="/flags/in.png" alt="India" className="w-3.5 h-auto rounded-[1.5px] shadow-sm" width="14" height="10" />
                    <span>India</span>
                  </p>
                  <address className="not-italic leading-relaxed text-neutral-300 text-[13px]">
                    Patiala, Punjab
                  </address>
                </div>
                
                <div className="pt-3 mt-3 border-t border-neutral-900">
                  <p className="text-neutral-200 font-semibold tracking-wider text-[11px] uppercase mb-2.5">
                    Get in Touch
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://wa.me/917527862966?text=Hi%20Scalvea%2C%20I%20would%20like%20to%20know%20more%20about%20your%20premium%20hair%20care%20products."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors text-[13px] group"
                      aria-label="WhatsApp"
                    >
                      <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-emerald-400 group-hover:border-neutral-700 transition-colors flex items-center justify-center shrink-0">
                        <WhatsappIcon className="size-3.5" />
                      </span>
                      <span>WhatsApp: +91 7527 862 966</span>
                    </a>
                    <a
                      href="mailto:info@scalvea.com"
                      className="flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors text-[13px] group"
                      aria-label="Email"
                    >
                      <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-white group-hover:border-neutral-700 transition-colors flex items-center justify-center shrink-0">
                        <Mail className="size-3.5" />
                      </span>
                      <span>info@scalvea.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER BOTTOM SECTION */}
        <div className="border-t border-neutral-900 mt-20 pt-8 relative flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-[0.14em] text-neutral-300 uppercase font-light w-full">
          <div className="w-full md:w-auto text-center md:text-left">
            © 2026 SCALVEA. ALL RIGHTS RESERVED.
          </div>
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 font-semibold text-neutral-200 text-center w-full md:w-auto py-2 md:py-0">
            CARE YOU DESERVE.
          </div>
          <div className="w-full md:w-auto text-center md:text-right">
            MADE WITH SCIENCE • AUSTRALIA & INDIA
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
