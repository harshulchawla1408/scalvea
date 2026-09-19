import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCountry } from "@/contexts/CountryContext";
import { ArrowRight, Star, Truck, Shield, Leaf, Check, Microscope, CheckCircle, Globe, Beaker, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { useSEO } from "@/hooks/useSEO";
import ScalveaInMotion from "@/components/sections/ScalveaInMotion";
import ShopByConcern from "@/components/sections/ShopByConcern";
import ProductInDemand from "@/components/sections/ProductInDemand";
import AmazonStoresSection from "@/components/sections/AmazonStoresSection";

import auslap from "@/assets/auslap.webp";
import ausmob from "@/assets/ausmob.webp";
import indlap from "@/assets/indlap.webp";
import indmob from "@/assets/indmob.webp";
import lap1 from "@/assets/lap1.webp";
import lap2 from "@/assets/lap2.webp";
import lap3 from "@/assets/lap3.webp";
import lap4 from "@/assets/lap4.webp";
import mob1 from "@/assets/mob1.webp";
import mob2 from "@/assets/mob2.webp";
import mob3 from "@/assets/mob3.webp";
import mob4 from "@/assets/mob4.webp";
import hero2 from "@/assets/hero2.webp";
import hero3 from "@/assets/hero3.webp";
import scalpPng from "@/assets/scalp.webp";
import puneetPng from "@/assets/puneet.webp";
import puneetMobPng from "@/assets/puneet-mob.webp";
import labSvg from "@/assets/lab.svg";
import rootSvg from "@/assets/root.svg";
import ingredientsSvg from "@/assets/ingredients.svg";
import shieldSvg from "@/assets/shield.svg";

// Asset aliases
const follicle8Serum = hero2;
const follicle8Black = scalpPng;


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

const BASE_SLIDES = [
  { lap: lap1, mob: mob1, alt: "Scalvea Scientific Haircare Banner 1", link: "/shop" },
  { lap: lap4, mob: mob4, alt: "Scalvea Scientific Haircare Banner 2", link: "/shop" },
  { lap: lap2, mob: mob2, alt: "Scalvea Scientific Haircare Banner 3", link: "/shop" },
  { lap: lap3, mob: mob3, alt: "Scalvea Scientific Haircare Banner 4", link: "/shop" },
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
    title: "Science-Backed Hair & Scalp Care",
    description: "Science-backed hair growth serums & scalp treatments formulated with clinically researched ingredients. Shop Follicle 8 & Scalp-5. Fast shipping to Australia & India.",
    image: "https://scalvea.com/og-image.webp",
    canonical: "https://scalvea.com/",
    // max-image-preview:large is now the default — important for hair care product imagery
  });

  const { selectedCountry } = useCountry();
  const [email, setEmail] = useState("");
  
  const slides = useMemo(() => [
    selectedCountry === "india"
      ? { lap: indlap, mob: indmob, alt: "Scalvea India Routine & Bundles", link: "/shop" }
      : { lap: auslap, mob: ausmob, alt: "Scalvea Australia Routine & Bundles", link: "/shop" },
    ...BASE_SLIDES,
  ], [selectedCountry]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const isPointerDown = useRef(false);

  // 6 seconds per slide
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length, currentSlide]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  // Touch Swipe support (with horizontal vs vertical scroll detection)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;
    
    // Ensure horizontal gesture
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mouse Drag support for Desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      isPointerDown.current = true;
      pointerStartX.current = e.clientX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPointerDown.current && pointerStartX.current !== null) {
      const diffX = pointerStartX.current - e.clientX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    isPointerDown.current = false;
    pointerStartX.current = null;
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Header />

      {/* SEO H1 — visually hidden but present in raw HTML for crawlers.
          Screen readers also benefit. The hero imagery conveys the brand
          visually; this H1 carries the primary keyword signal. */}
      <h1 className="sr-only">Science-Backed Hair &amp; Scalp Care — Scalvea</h1>

      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.02]" />

      {/* 1. HERO SLIDER SECTION */}
      <section 
        className="relative w-full overflow-hidden bg-white select-none group max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)] cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          isPointerDown.current = false;
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="w-full relative overflow-hidden max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)]">
          {slides.map((slide, idx) => {
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
                    className="w-full object-cover object-center block max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)] h-auto pointer-events-none"
                  />
                </picture>
                <Link
                  to={slide.link || "/shop"}
                  className="absolute inset-0 cursor-pointer"
                  aria-label="Shop now"
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows (User-friendly on both desktop & mobile) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 sm:left-5 md:left-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/80 hover:scale-105 active:scale-95 transition-all duration-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] -translate-x-0.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 sm:right-5 md:right-8 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/80 hover:scale-105 active:scale-95 transition-all duration-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] translate-x-0.5" />
        </button>

        {/* Navigation Capsule with 6s Visual Timer Progress */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
          {slides.map((_, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(idx);
                }}
                className={`relative h-1.5 sm:h-2 rounded-full transition-all duration-300 focus:outline-none overflow-hidden ${
                  isActive ? "w-7 sm:w-10 bg-white/25" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {isActive && (
                  <motion.div
                    key={`${currentSlide}-${isHovered}`}
                    initial={{ width: "0%" }}
                    animate={{ width: isHovered ? "0%" : "100%" }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="absolute inset-0 bg-white rounded-full"
                  />
                )}
              </button>
            );
          })}
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

      {/* 2. SHOP BY CONCERN SECTION */}
      <ShopByConcern />

      {/* SCALVEA IN MOTION — Editorial Video Carousel */}
      <ScalveaInMotion />

      {/* 3. FOLLICLE 8 PREMIUM SHOWCASE SECTION */}
      <section id="ingredients" className="bg-light-grid py-6 md:py-8 lg:py-10 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 lg:gap-12 items-stretch">
            
            {/* Left Container: Info Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto order-2 md:order-1 space-y-4 md:space-y-0"
            >
              {/* Header & Copy */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#6F6F6F] font-body font-medium block mb-1 sm:mb-2">
                    CLINICALLY DEVELOPED FORMULA
                  </span>
                  <h2 className="text-2xl sm:text-[30px] md:text-[34px] lg:text-[38px] leading-tight font-heading text-[#111111] tracking-tight font-normal">
                    Meet the Science<br className="hidden sm:inline" /> Behind Follicle 8
                  </h2>
                </div>

                {/* 2x2 Compact Ingredient Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3.5 pt-1">
                  {[
                    { pct: "4%", name: "Anagain", desc: "Stimulates dermal papilla cells to support stronger, healthier growth." },
                    { pct: "3%", name: "Redensyl", desc: "Helps reduce excessive shedding and supports the natural growth cycle." },
                    { pct: "3%", name: "Baicapil", desc: "Nourishes weakened follicles and promotes visibly fuller hair." },
                    { pct: "3%", name: "Procapil", desc: "Strengthens anchoring at the root to minimize premature loss." }
                  ].map((ing, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#FAF9F7] hover:bg-white border border-neutral-100/90 p-2.5 sm:p-3.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline gap-1 sm:gap-1.5 mb-1">
                          <span className="text-lg sm:text-xl md:text-2xl font-light text-[#111111] font-heading">{ing.pct}</span>
                          <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#6F6F6F] font-semibold font-mono">{ing.name}</span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] md:text-[11px] text-[#555555] font-body font-light leading-snug line-clamp-2 md:line-clamp-none">
                          {ing.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 sm:pt-4">
                <Link 
                  to="/product/follicle-8-hair-growth-serum"
                  className="group bg-black text-white hover:bg-neutral-900 transition-all duration-300 px-6 sm:px-7 py-2.5 sm:py-3 text-xs md:text-sm tracking-[0.12em] uppercase font-semibold h-11 sm:h-12 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm rounded-none w-full sm:w-fit"
                >
                  Explore Follicle 8
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </motion.div>

            {/* Right Container: Product Image (edge-to-edge fit) (order-1 md:order-2) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] aspect-[4/3] sm:aspect-[16/10] md:aspect-auto relative overflow-hidden order-1 md:order-2 flex items-center justify-center p-0"
            >
              <img
                src={hero2}
                alt="Follicle 8 Premium Showcase"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* PRODUCT IN DEMAND SECTION */}
      <ProductInDemand />

      {/* 4. SCALPA-5 PREMIUM SHOWCASE SECTION */}
      <section className="bg-light-grid py-6 md:py-8 lg:py-10 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 lg:gap-12 items-stretch">
            
            {/* Left Container: Product Image (fills card edge-to-edge) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] aspect-auto md:aspect-square relative overflow-hidden flex items-center justify-center"
            >
              <img
                src={scalpPng}
                alt="Scalp-5 Premium Showcase"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
            
            {/* Right Container: Info Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto md:aspect-square space-y-4 md:space-y-0"
            >
              {/* Header & Copy */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#6F6F6F] font-body font-medium block mb-1 sm:mb-2">
                    OUR SIGNATURE FORMULA
                  </span>
                  <h2 className="text-2xl sm:text-[30px] md:text-[34px] lg:text-[38px] leading-tight font-heading text-[#111111] tracking-tight font-normal">
                    Healthy Scalp.<br className="hidden sm:inline" /> Everyday Confidence.
                  </h2>
                </div>

                <p className="text-xs md:text-sm text-[#3A3A3A] font-body font-light leading-relaxed max-w-[480px]">
                  Scalp-5 is a lightweight anti-dandruff hair serum developed with clinically inspired ingredients to help reduce visible flakes, calm scalp irritation, and restore long-term scalp balance.
                </p>
              </div>

              {/* CTAs */}
              <div className="pt-2 sm:pt-4">
                <Link 
                  to="/product/scalp-5-anti-dandruff-hair-serum"
                  className="group bg-black text-white hover:bg-neutral-900 transition-all duration-300 px-6 sm:px-7 py-2.5 sm:py-3 text-xs md:text-sm tracking-[0.12em] uppercase font-semibold h-11 sm:h-12 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm rounded-none w-full sm:w-fit"
                >
                  Discover Scalp-5
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* 5. RESPONSIVE CAMPAIGN BANNER SECTION */}
      <section className="bg-[#F6F5F2] py-10 md:py-16 overflow-hidden relative select-none border-t border-neutral-200/70">
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
      <section className="bg-light-grid py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] uppercase text-neutral-400 font-body font-medium block mb-2 sm:mb-2.5">
              OUR SCIENCE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-[36px] lg:text-[40px] leading-tight font-heading text-[#111111] tracking-tight font-normal mb-2.5 sm:mb-3">
              Science That Works at the Root
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] font-body font-light leading-relaxed max-w-xl mx-auto">
              Clinically researched ingredients, purposeful formulations, and targeted actives designed to support a healthier scalp and stronger-looking hair.
            </p>
          </div>

          {/* 2 Cards in 1 Row across mobile and desktop */}
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
            className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto"
          >
            {[
              {
                num: "01",
                title: "Clinically Developed",
                desc: "Clinically researched ingredients selected for meaningful performance.",
                icon: labSvg
              },
              {
                num: "02",
                title: "Root Focused",
                desc: "Targeted actives work where healthier hair begins — the scalp.",
                icon: rootSvg
              },
              {
                num: "03",
                title: "High-Performance Actives",
                desc: "Carefully balanced ingredients designed for effective everyday care.",
                icon: ingredientsSvg
              },
              {
                num: "04",
                title: "Purposefully Formulated",
                desc: "Lightweight, focused formulas made for daily scalp and hair care.",
                icon: shieldSvg
              }
            ].map((card, idx) => (
              <motion.div 
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
                  }
                }}
                className="group bg-white border border-neutral-200/80 hover:border-neutral-400/80 p-4 sm:p-7 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex flex-col justify-start h-full">
                  {/* Heading Row: Icon on Left + Title next to it + 01-04 on Right */}
                  <div className="flex items-center justify-between w-full mb-3 sm:mb-4 md:mb-5 gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 min-w-0">
                      <img 
                        src={card.icon} 
                        alt={card.title} 
                        className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <h4 className="text-sm sm:text-lg md:text-xl font-heading font-medium text-neutral-900 leading-snug tracking-tight">
                        {card.title}
                      </h4>
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-mono tracking-widest text-neutral-400 group-hover:text-neutral-800 transition-colors duration-300 font-medium shrink-0">
                      {card.num}
                    </span>
                  </div>

                  {/* Description Text Below */}
                  <p className="text-[11px] sm:text-xs md:text-sm text-[#555555] font-body font-light leading-relaxed">
                    {card.desc}
                  </p>
                </div>
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
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-10 text-xs sm:text-sm tracking-[0.14em] uppercase font-semibold bg-white text-black border border-white hover:bg-transparent hover:text-white transition-all duration-500 hover:-translate-y-0.5 rounded-none shadow-lg"
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
      <section className="bg-light-grid py-16 md:py-24 lg:py-28 overflow-hidden relative border-t border-neutral-150">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-xl mx-auto text-center px-4 sm:px-6"
        >
          {/* Eyebrow */}
          <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-body font-medium block mb-2 sm:mb-3">
            STAY IN THE KNOW
          </span>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-[38px] leading-tight font-heading text-neutral-900 tracking-tight font-normal mb-3 sm:mb-4">
            Stay Connected With Scalvea
          </h2>

          {/* Subheading */}
          <p className="text-xs sm:text-sm text-neutral-500 font-body font-light leading-relaxed max-w-md mx-auto mb-8 sm:mb-9">
            Get the latest from Scalvea — new product launches, hair-care insights, exclusive offers, and helpful updates, delivered straight to your inbox.
          </p>

          {/* Email Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
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
            className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 h-11 sm:h-12 px-5 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-full outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all duration-200 font-body font-light text-neutral-900 placeholder:text-neutral-400"
              required
            />
            <button
              type="submit"
              className="group h-11 sm:h-12 px-7 sm:px-8 bg-black text-white hover:bg-neutral-900 transition-all duration-300 text-[11px] sm:text-xs tracking-[0.12em] uppercase font-semibold flex items-center justify-center gap-2 rounded-full hover:-translate-y-0.5 shadow-sm whitespace-nowrap"
            >
              SUBSCRIBE
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </form>

          {/* Privacy micro-note */}
          <p className="text-[10px] sm:text-xs text-neutral-400 font-body font-light mt-3.5 tracking-normal">
            No spam. Just Scalvea updates.
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

      {/* AMAZON STORES SECTION */}
      <AmazonStoresSection />

      <Footer />
    </div>
  );
};

export default Index;
