import { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, ChevronDown, ChevronUp, Linkedin } from "lucide-react";

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
                className="text-white text-2xl font-normal tracking-tight leading-none block"
                style={{ fontFamily: "'Chillax', 'Clash Display', sans-serif" }}
              >
                Scalvea
              </span>
              <span className="text-[9px] tracking-[0.35em] uppercase text-neutral-500 font-light block">
                CARE YOU DESERVE
              </span>
            </div>

            <p className="text-sm md:text-[13px] text-neutral-400 font-light leading-relaxed max-w-xs">
              Science-backed hair care formulated with clinically researched ingredients for healthier hair and scalp. Premium Australian innovation trusted across Australia and India.
            </p>

            {/* Social Icons — Instagram, TikTok, Email */}
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
              <a
                href="https://www.linkedin.com/company/scalvea/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors duration-200 p-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-[18px]" />
              </a>
            </div>
          </div>

          {/* Column 2 — Shop */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("shop")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Shop
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "shop" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "shop" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <FooterLink to="/shop">All Products</FooterLink>
                <FooterLink to="/product/follicle-8-hair-growth-serum">Hair Growth Serum</FooterLink>
                <FooterLink to="/shop?category=Serums">Anti Dandruff Serum</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 3 — Company */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("company")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Company
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "company" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "company" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <FooterLink to="/about">About Us</FooterLink>
                <FooterLink to="/blogs">Blog</FooterLink>
                <FooterLink to="/faqs">FAQs</FooterLink>
                <FooterLink to="/terms-conditions">Terms & Conditions</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 4 — Support */}
          <div className="flex flex-col border-b border-neutral-900 lg:border-none py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("support")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Support
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "support" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "support" ? "block" : "hidden lg:block"}`}>
              <ul className="space-y-3.5 text-sm text-neutral-400 font-light">
                <FooterLink to="/contact">Contact Us</FooterLink>
                <FooterLink to="/shipping-policy">Shipping Policy</FooterLink>
                <FooterLink to="/return-refund-policy">Return & Refund Policy</FooterLink>
                <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
              </ul>
            </div>
          </div>

          {/* Column 5 — Locations */}
          <div className="flex flex-col py-4 lg:py-0">
            <button
              onClick={() => toggleAccordion("locations")}
              className="w-full flex items-center justify-between lg:pointer-events-none text-left focus:outline-none"
            >
              <h4 className="text-xs md:text-[13px] tracking-[0.2em] uppercase font-semibold text-white mb-0 lg:mb-5">
                Locations
              </h4>
              <span className="lg:hidden text-neutral-500">
                {activeAccordion === "locations" ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </span>
            </button>
            <div className={`mt-4 lg:mt-0 ${activeAccordion === "locations" ? "block" : "hidden lg:block"}`}>
              <div className="space-y-5 text-sm text-neutral-400 font-light">
                <div>
                  <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-1.5">
                    🇦🇺 Australia
                  </p>
                  <p className="leading-relaxed text-neutral-400">Craigieburn, Victoria</p>
                  <p className="leading-relaxed text-neutral-500 text-xs">Australia</p>
                </div>
                <div>
                  <p className="text-neutral-300 font-semibold tracking-wider text-[11px] uppercase mb-1.5">
                    🇮🇳 India
                  </p>
                  <p className="leading-relaxed text-neutral-400">Patiala, Punjab</p>
                  <p className="leading-relaxed text-neutral-500 text-xs">India</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER BOTTOM SECTION */}
        <div className="border-t border-neutral-900 mt-20 pt-8 relative flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-[0.18em] text-neutral-500 uppercase font-light w-full">
          <div className="w-full md:w-auto text-center md:text-left">
            © 2026 SCALVEA. ALL RIGHTS RESERVED.
          </div>
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 font-semibold text-neutral-400 text-center w-full md:w-auto py-2 md:py-0">
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
