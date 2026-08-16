import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { ArrowRight, Star, Truck, Shield, Leaf, Check, Microscope, CheckCircle, Globe, Beaker } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { useSEO } from "@/hooks/useSEO";
import { LazyVideo } from "@/components/ui/LazyVideo";

// Asset imports
const follicle8Serum = hero2;
const follicle8Black = scalpPng;

import lap1 from "@/assets/lap1.webp";
import lap2 from "@/assets/lap2.webp";
import lap3 from "@/assets/lap3.webp";
import mob1 from "@/assets/mob1.webp";
import mob2 from "@/assets/mob2.webp";
import mob3 from "@/assets/mob3.webp";
import hero2 from "@/assets/hero2.webp";
import hero3 from "@/assets/hero3.webp";
import heroMp4 from "@/assets/hero.mp4";
import heroPoster from "@/assets/hero-poster.jpg";
import scalpPng from "@/assets/scalp.webp";
import puneetPng from "@/assets/puneet.webp";
import puneetMobPng from "@/assets/puneet-mob.webp";
import dropperIcon from "@/assets/dropper.svg";
import hairFollicleIcon from "@/assets/hair.svg";
import microscopeIcon from "@/assets/microscope.svg";
import shieldCheckIcon from "@/assets/shield-check.svg";


// Helper CountUp Component
const CountUp = ({ value, duration = 1.8 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const totalMiliseconds = duration * 1000;
    const incrementTime = 40;
    const totalSteps = totalMiliseconds / incrementTime;
    const stepValue = end / totalSteps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
};

const SLIDES = [
  { lap: lap1, mob: mob1, alt: "Scalvea Scientific Haircare Banner 1" },
  { lap: lap2, mob: mob2, alt: "Scalvea Scientific Haircare Banner 2" },
  { lap: lap3, mob: mob3, alt: "Scalvea Scientific Haircare Banner 3" },
];

const TRUST_ITEMS = [
  "CLINICALLY INSPIRED INGREDIENTS",
  "DERMATOLOGICALLY TESTED",
  "REDENSYL • BAICAPIL • PROCAPIL • ANAGAIN",
  "ROSEMARY OIL • PIROCTONE OLAMINE • SALICYLIC ACID",
  "SCIENCE-BACKED HAIRCARE",
  "DAILY SCALP NOURISHMENT",
  "LIGHTWEIGHT • NON-GREASY FORMULA",
  "SUITABLE FOR MEN & WOMEN",
  "FAST SHIPPING ACROSS INDIA & AUSTRALIA",
  "CLEAN MINIMAL FORMULATIONS",
  "PREMIUM HAIR GROWTH SOLUTIONS",
  "EVERYDAY HAIRCARE ESSENTIALS",
  "DESIGNED FOR HEALTHIER-LOOKING HAIR",
  "TRANSPARENT INGREDIENTS",
  "CARE YOU DESERVE"
];

const Index = () => {
  useSEO({
    noImagePreview: true,
    description: "Science-backed hair care powered by clinically researched ingredients for healthier scalp and stronger hair. Discover transparent formulations designed for everyday results. Care You Deserve.",
    image: "https://scalvea.com/og-image.webp",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://scalvea.com/#organization",
          "name": "Scalvea",
          "alternateName": "Scalvea Hair Care",
          "slogan": "Care You Deserve",
          "description": "Science-backed hair care powered by clinically researched ingredients for healthier scalp and stronger-looking hair.",
          "url": "https://scalvea.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://scalvea.com/scalvea-logo.webp",
            "width": 512,
            "height": 512
          },
          "image": "https://scalvea.com/scalvea-logo.webp",
          "email": "info@scalvea.com",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@scalvea.com",
            "contactType": "customer support",
            "availableLanguage": ["English"]
          },
          "brand": {
            "@type": "Brand",
            "name": "Scalvea",
            "slogan": "Care You Deserve"
          },
          "sameAs": [
            "https://www.instagram.com/scalvea_/",
            "https://www.tiktok.com/@scalvea/",
            "https://www.linkedin.com/company/scalvea/"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://scalvea.com/#website",
          "name": "Scalvea",
          "alternateName": "Scalvea | Care You Deserve",
          "url": "https://scalvea.com",
          "description": "Science-backed hair care powered by clinically researched ingredients for healthier scalp and stronger-looking hair.",
          "publisher": { "@id": "https://scalvea.com/#organization" },
          "inLanguage": "en"
        }
      ]
    }
  });

  const [email, setEmail] = useState("");
  const { products, loading } = useProducts();
  const featured = products.filter((p) => p.featured);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + 3) % 3);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % 3);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 50) {
      handleNext();
    } else if (diffX < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Header />

      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.02]" />

      {/* 1. HERO SLIDER SECTION */}
      <section 
        className="relative w-full overflow-hidden bg-white select-none group max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full relative overflow-hidden max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)]">
          {SLIDES.map((slide, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={idx}
                className={`${
                  isFirst ? "relative" : "absolute inset-0"
                } transition-opacity ease-in-out ${
                  currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
                style={{ transitionDuration: "800ms" }}
              >
                <picture className="block lg:pt-5">
                  <source media="(max-width: 768px)" srcSet={slide.mob} />
                  <img
                    src={slide.lap}
                    alt={slide.alt}
                    loading={isFirst ? "eager" : "lazy"}
                    fetchpriority={isFirst ? "high" : "low"}
                    className="w-full object-cover object-center block max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)] h-auto"
                  />
                </picture>
                <a
                  href="#products"
                  onClick={scrollToProducts}
                  className="absolute inset-0 cursor-pointer"
                  aria-label="Shop now"
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/10 hover:bg-black/30 text-white transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:block rounded-none font-light text-xl"
          aria-label="Previous Slide"
        >
          &#8592;
        </button>
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/10 hover:bg-black/30 text-white transition-opacity duration-300 opacity-0 group-hover:opacity-100 hidden md:block rounded-none font-light text-xl"
          aria-label="Next Slide"
        >
          &#8594;
        </button>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* LUXURY TRUST MARQUEE STRIP */}
      <section className="bg-[#2D2D2D] border-y border-neutral-800 h-[54px] flex items-center overflow-hidden relative z-20 w-full select-none">
        <div className="animate-marquee-luxury flex items-center gap-16 whitespace-nowrap" style={{ animationDuration: "120s" }}>
          {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((text, idx) => (
            <div key={idx} className="flex items-center gap-16 text-white shrink-0 font-body font-medium uppercase tracking-[0.25em] text-[9px] md:text-[11px]">
              <span>{text}</span>
              <span className="opacity-40 text-white/55">|</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. BEST SELLERS / PRODUCTS SECTION */}
      <section id="products" className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-body font-medium block mb-4">
                BEST SELLERS
              </span>
              <h2 className="text-3xl md:text-[42px] leading-tight font-heading text-neutral-900 tracking-tight">
                Our Products
              </h2>
            </div>
            <Link 
              to="/shop" 
              className="group text-[10px] tracking-[0.15em] uppercase text-black hover:opacity-60 transition-opacity flex items-center gap-2 font-medium w-fit border-b border-black/15 pb-1 shrink-0"
            >
              View Collection <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {(featured.length > 0 ? featured : products.slice(0, 3)).map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. FOLLICLE 8 PREMIUM SHOWCASE SECTION */}
      <section id="ingredients" className="bg-white py-6 md:py-8 lg:py-10 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Container: Info Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-[24px] p-8 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto order-2 md:order-1"
            >
              {/* Header & Copy */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#6F6F6F] font-body font-medium block mb-2">
                    CLINICALLY DEVELOPED FORMULA
                  </span>
                  <h2 className="text-3xl md:text-[34px] lg:text-[38px] leading-tight font-heading text-[#111111] tracking-tight font-normal">
                    Meet the Science<br />Behind Follicle 8
                  </h2>
                </div>

                {/* 2x2 Ingredient Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { pct: "4%", name: "Anagain", desc: "Stimulates dermal papilla cells to support stronger, healthier hair growth from the root." },
                    { pct: "3%", name: "Redensyl", desc: "Helps reduce excessive hair shedding while supporting the natural hair growth cycle." },
                    { pct: "3%", name: "Baicapil", desc: "Nourishes weakened follicles and promotes thicker, fuller-looking hair over time." },
                    { pct: "3%", name: "Procapil", desc: "Strengthens hair anchoring, improves scalp condition, and helps reduce premature hair loss." }
                  ].map((ing, idx) => (
                    <div 
                      key={idx}
                      className="bg-white border border-neutral-100 p-4 rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.005)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.012)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline gap-1.5 mb-1.5">
                          <span className="text-xl md:text-2xl font-light text-[#111111] font-heading">{ing.pct}</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#6F6F6F] font-medium font-mono">{ing.name}</span>
                        </div>
                        <p className="text-[10px] md:text-[11px] text-[#555555] font-body font-light leading-relaxed">
                          {ing.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Tags & Actions */}
              <div className="space-y-6 pt-4">
                {/* Outlined pills (Staggered Entry) */}
                <motion.div 
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    "CLINICALLY INSPIRED",
                    "LIGHTWEIGHT FORMULA",
                    "EVERYDAY USE",
                    "SUITABLE FOR MEN & WOMEN"
                  ].map((pill, i) => (
                    <motion.span 
                      key={i}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
                      }}
                      className="text-[9px] tracking-wider uppercase border border-neutral-200 text-[#3A3A3A] px-3 py-1.5 font-body font-medium rounded-full hover:border-[#111111] hover:text-[#111111] transition-colors duration-300 bg-white"
                    >
                      {pill}
                    </motion.span>
                  ))}
                </motion.div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/product/follicle-8-hair-growth-serum"
                    className="group bg-black text-white hover:bg-neutral-900 transition-all duration-300 px-6 py-3 text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold h-11 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm rounded-none w-fit"
                  >
                    Explore Follicle 8
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right Container: Product Image (aspect-auto frame) (order-1 md:order-2) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-[24px] aspect-auto relative overflow-hidden order-1 md:order-2 flex items-center justify-center p-4 md:p-6"
            >
              {/* Static wrapper - zoomed out and fully visible */}
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={hero2}
                  alt="Follicle 8 Premium Showcase"
                  className="w-full h-auto object-contain max-h-[480px] rounded-xl"
                  loading="lazy"
                />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SCIENTIFIC LAB VIDEO BANNER SECTION */}
      <section className="relative w-full overflow-hidden bg-black flex items-center justify-center h-[70vh] min-h-[560px] md:h-[90vh] md:min-h-[720px] select-none">
        <LazyVideo 
          videoSrc={heroMp4} 
          posterSrc={heroPoster}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
        />
        {/* Dark Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ backgroundColor: "rgba(0,0,0,0.38)" }} 
        />
        
        {/* Centered Content Container */}
        <div className="relative z-10 text-center max-w-[760px] px-6 flex items-center justify-center h-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center justify-center text-center space-y-6 md:space-y-8"
          >
            {/* Small Label */}
            <span 
              className="text-[9px] md:text-[10px] tracking-[5px] uppercase font-medium text-white"
              style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 500 }}
            >
              SCIENTIFICALLY FORMULATED
            </span>

            {/* Heading */}
            <h3 
              className="text-4xl md:text-5xl lg:text-[54px] leading-tight font-heading text-white font-medium"
              style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 500 }}
            >
              Science Meets Hair Care.<br />Every Formula. Every Drop.
            </h3>

            {/* Paragraph */}
            <p className="text-xs md:text-sm text-white font-body font-normal leading-relaxed max-w-[620px] w-[90%] md:w-auto mx-auto opacity-95">
              Every Scalvea formula is developed using clinically inspired ingredients selected for performance, stability, and everyday use. Designed to support healthier hair and scalp with modern science, uncompromising quality, and complete ingredient transparency.
            </p>

            {/* CTA Outlined Button */}
            <div className="pt-2 w-full sm:w-auto">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center border border-white text-white bg-transparent hover:bg-white hover:text-black transition-all duration-300 px-8 py-3.5 text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold h-12 w-full sm:w-auto rounded-none"
              >
                EXPLORE OUR FORMULAS &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. SCALPA-5 PREMIUM SHOWCASE SECTION */}
      <section className="bg-white py-6 md:py-8 lg:py-10 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Container: Product Image (aspect-square frame) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-[24px] aspect-square relative overflow-hidden"
            >
              {/* Static wrapper - completely filling container edge-to-edge */}
              <div className="w-full h-full">
                <img
                  src={scalpPng}
                  alt="Scalp-5 Premium Showcase"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
            
            {/* Right Container: Info Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-[24px] p-8 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto md:aspect-square"
            >
              {/* Header & Copy */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#6F6F6F] font-body font-medium block mb-2">
                    OUR SIGNATURE FORMULA
                  </span>
                  <h2 className="text-3xl md:text-[34px] lg:text-[38px] leading-tight font-heading text-[#111111] tracking-tight font-normal">
                    Healthy Scalp.<br />Everyday Confidence.
                  </h2>
                </div>

                <p className="text-xs md:text-sm text-[#3A3A3A] font-body font-light leading-relaxed max-w-[480px]">
                  Scalp-5 is a lightweight anti-dandruff hair serum developed with clinically inspired ingredients to help reduce visible flakes, calm scalp irritation, and restore long-term scalp balance. Designed for everyday use, its fast-absorbing formula supports a cleaner, healthier scalp without leaving behind residue, making it an effortless addition to your daily haircare routine.
                </p>
              </div>

              {/* Premium Tags & Actions */}
              <div className="space-y-6 pt-4">
                {/* Outlined pills (Staggered Entry) */}
                <motion.div 
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    "DERMATOLOGICALLY TESTED",
                    "LIGHTWEIGHT FORMULA",
                    "DAILY SCALP CARE",
                    "SUITABLE FOR MEN & WOMEN",
                    "FAST ABSORBING",
                    "NON-GREASY FINISH"
                  ].map((pill, i) => (
                    <motion.span 
                      key={i}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95 },
                        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
                      }}
                      className="text-[9px] tracking-wider uppercase border border-neutral-200 text-[#3A3A3A] px-3 py-1.5 font-body font-medium rounded-full hover:border-[#111111] hover:text-[#111111] transition-colors duration-300 bg-white"
                    >
                      {pill}
                    </motion.span>
                  ))}
                </motion.div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/product/scalp-5-anti-dandruff-hair-serum"
                    className="group bg-black text-white hover:bg-neutral-900 transition-all duration-300 px-6 py-3 text-[10px] md:text-xs tracking-[0.2em] uppercase font-semibold h-11 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm rounded-none w-fit"
                  >
                    Discover Scalp-5
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* 5. RESPONSIVE CAMPAIGN BANNER SECTION */}
      <section className="bg-white py-10 md:py-16 overflow-hidden relative select-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            <picture className="w-full block">
              <source media="(min-width: 768px)" srcSet={puneetPng} />
              <img
                src={puneetMobPng}
                alt="Scalvea Campaign Poster"
                className="w-full h-auto object-contain mx-auto"
                loading="lazy"
              />
            </picture>
          </motion.div>
        </div>
      </section>

      {/* OUR SCIENCE FEATURES GRID SECTION */}
      <section className="bg-white py-16 md:py-24 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-[#6F6F6F] font-body font-medium block mb-3">
              OUR SCIENCE
            </span>
            <h2 className="text-3xl md:text-[38px] lg:text-[44px] leading-tight font-heading text-[#111111] tracking-tight font-normal mb-4">
              Science That Works at the Root
            </h2>
            <p className="text-xs md:text-sm text-[#555555] font-body font-light leading-relaxed">
              Every Scalvea formula is built with clinically researched ingredients, transparent concentrations, and a science-first approach designed to support healthier scalp and stronger-looking hair.
            </p>
          </div>

          {/* Staggered Grid */}
          <motion.div 
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16"
          >
            {[
              {
                icon: microscopeIcon,
                title: "Clinically Developed",
                desc: "Every formulation is created using clinically researched ingredients selected for measurable performance."
              },
              {
                icon: hairFollicleIcon,
                title: "Targets Hair at the Root",
                desc: "Advanced active ingredients work directly where healthier hair begins—the scalp and hair follicle."
              },
              {
                icon: dropperIcon,
                title: "High-Performance Actives",
                desc: "Precisely balanced concentrations of proven ingredients for everyday scalp and hair care."
              },
              {
                icon: shieldCheckIcon,
                title: "Dermatologically Tested",
                desc: "Carefully formulated for daily use with lightweight, non-greasy performance suitable for all hair types."
              }
            ].map((card, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                  }
                }}
                className="flex flex-col items-start text-left"
              >
                <motion.div 
                  variants={{
                    hidden: { scale: 0.95 },
                    visible: { 
                      scale: 1,
                      transition: { duration: 0.6, ease: "easeOut" }
                    }
                  }}
                  className="mb-6 h-12 w-12 flex items-center justify-start"
                >
                  <img 
                    src={card.icon} 
                    alt={card.title} 
                    className="h-full w-full object-contain opacity-90"
                    loading="lazy"
                  />
                </motion.div>
                <h4 className="text-sm md:text-base font-heading font-medium text-neutral-900 mb-2">
                  {card.title}
                </h4>
                <p className="text-[11px] md:text-xs text-[#555555] font-body font-light leading-relaxed">
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* 7. LIFESTYLE / CTA SECTION – Full Background Image Editorial */}
      <section className="bg-[#F4F4F2] py-12 md:py-16 lg:py-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.22)] min-h-[580px] md:min-h-[680px] lg:min-h-[740px] flex flex-col justify-end"
          >
            {/* Background Image with subtle Ken Burns */}
            <motion.div
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1.0 }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute inset-0 z-0"
            >
              <img
                src={hero3}
                alt="Scalvea premium hair care lifestyle"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>

            {/* Dark gradient overlay – stronger at bottom for text legibility */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10 pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-20 p-8 md:p-12 lg:p-16 max-w-3xl">
              {/* Eyebrow */}
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/60 font-body font-medium block mb-4"
              >
                START YOUR HAIR JOURNEY
              </motion.span>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.32 }}
                className="text-3xl md:text-5xl lg:text-[56px] leading-tight font-heading text-white tracking-tight mb-5"
              >
                Healthy Hair Starts<br className="hidden md:block" /> With Better Science.
              </motion.h2>

              {/* Main paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.44 }}
                className="text-xs md:text-sm text-white/80 font-body font-light leading-relaxed max-w-xl mb-3"
              >
                Hair deserves more than temporary solutions. Every Scalvea formula is developed using clinically researched active ingredients selected to support scalp health, strengthen follicles, and promote healthier-looking hair with everyday use.
              </motion.p>

              {/* Supporting paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.54 }}
                className="text-[11px] md:text-xs text-white/60 font-body font-light leading-relaxed max-w-lg mb-7"
              >
                Every bottle is formulated with transparent ingredient concentrations, lightweight textures, and carefully selected actives that work together to support long-term scalp and hair wellness—without unnecessary fillers or compromises.
              </motion.p>

              {/* Feature pill tags */}
              <motion.div
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {["Clinically Developed", "Everyday Hair Care", "Lightweight Formula"].map((tag, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0.92 },
                      visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: "easeOut" } }
                    }}
                    className="text-[9px] tracking-[0.18em] uppercase text-white/90 border border-white/30 backdrop-blur-sm bg-white/10 px-4 py-1.5 rounded-full font-body font-medium hover:border-white/60 hover:bg-white/15 transition-all duration-300"
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>

              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.75 }}
              >
                <Link
                  to="/shop"
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-10 text-[10px] tracking-[0.22em] uppercase font-semibold bg-white text-black border border-white hover:bg-transparent hover:text-white transition-all duration-500 hover:-translate-y-0.5 rounded-none shadow-lg"
                >
                  <span className="absolute inset-0 w-0 bg-white/20 backdrop-blur-sm transition-all duration-500 ease-out group-hover:w-full" />
                  <span className="relative z-10">Shop Now</span>
                  <ArrowRight className="relative z-10 h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. NEWSLETTER SIGNUP SECTION */}
      <section className="bg-white py-20 md:py-28 lg:py-36 overflow-hidden relative border-t border-neutral-100">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl mx-auto text-center px-6"
        >
          {/* Eyebrow */}
          <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-5">
            STAY IN THE KNOW
          </span>

          {/* Heading */}
          <h2 className="text-3xl md:text-[42px] leading-tight font-heading text-neutral-900 tracking-tight mb-4">
            Stay Connected<br className="hidden sm:block" /> With Scalvea
          </h2>

          {/* Subheading */}
          <p className="text-xs md:text-sm text-neutral-500 font-body font-light leading-relaxed max-w-sm mx-auto mb-10">
            Be the first to discover new product launches, clinically researched hair care insights, exclusive offers, and updates from Scalvea.
          </p>

          {/* Email Form */}
          <motion.form
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.18 }}
            onSubmit={(e) => {
              e.preventDefault();
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                // Show inline error
                const form = e.currentTarget;
                const input = form.querySelector('input[type="email"]') as HTMLInputElement;
                if (input) {
                  input.setCustomValidity("Please enter a valid email address.");
                  input.reportValidity();
                  input.setCustomValidity("");
                }
                return;
              }
              setEmail("");
              // Show success notification in DOM
              const toast = document.getElementById('newsletter-toast');
              if (toast) {
                toast.classList.remove('opacity-0', 'translate-y-2');
                toast.classList.add('opacity-100', 'translate-y-0');
                setTimeout(() => {
                  toast.classList.remove('opacity-100', 'translate-y-0');
                  toast.classList.add('opacity-0', 'translate-y-2');
                }, 4000);
              }
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 h-12 px-5 text-xs bg-white border border-neutral-200 rounded-full outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-200 transition-all duration-300 font-body font-light text-neutral-900 placeholder:text-neutral-400"
              required
            />
            <button
              type="submit"
              className="group h-12 px-8 bg-black text-white hover:bg-neutral-900 transition-all duration-300 text-[9px] md:text-[10px] tracking-[0.22em] uppercase font-semibold flex items-center justify-center gap-2 rounded-full hover:-translate-y-0.5 shadow-sm whitespace-nowrap"
            >
              Subscribe
              <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.form>

          {/* Privacy micro-note */}
          <p className="text-[9px] text-neutral-400 font-body font-light mt-4 tracking-wide">
            We respect your privacy. No spam, ever.
          </p>
        </motion.div>

        {/* Toast notification */}
        <div
          id="newsletter-toast"
          className="fixed top-5 right-5 sm:right-8 z-[9999] opacity-0 translate-y-2 transition-all duration-500 ease-out pointer-events-none"
        >
          <div className="bg-neutral-900 text-white text-[10px] tracking-[0.15em] uppercase font-body font-medium px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[260px]">
            <Check className="h-4 w-4 text-white shrink-0" />
            <span>Thanks for subscribing. Welcome to Scalvea.</span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
