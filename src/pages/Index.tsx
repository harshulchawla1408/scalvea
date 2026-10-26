import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCountry } from "@/contexts/CountryContext";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import ShopByConcern from "@/components/sections/ShopByConcern";
import ScalveaInMotion from "@/components/sections/ScalveaInMotion";
import ProductInDemand from "@/components/sections/ProductInDemand";
import AmazonStoresSection from "@/components/sections/AmazonStoresSection";

import {
  auslapSet,
  ausmobSet,
  indlapSet,
  indmobSet,
  lap1Set,
  lap2Set,
  lap4Set,
  mob1Set,
  mob2Set,
  mob4Set,
  hero2Set,
  hero3Set,
  puneetSet,
  puneetMobSet,
  scalpSet,
} from "@/assets/generated";
import labSvg from "@/assets/lab.svg";
import rootSvg from "@/assets/root.svg";
import ingredientsSvg from "@/assets/ingredients.svg";
import shieldSvg from "@/assets/shield.svg";


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
  { lapSet: lap4Set, mobSet: mob4Set, alt: "Scalvea Scientific Haircare Banner 1", link: "/shop" },
  { lapSet: lap1Set, mobSet: mob1Set, alt: "Scalvea Scientific Haircare Banner 2", link: "/shop" },
  { lapSet: lap2Set, mobSet: mob2Set, alt: "Scalvea Scientific Haircare Banner 3", link: "/shop" },
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
    title: "Science-Backed Hair Care | Hair Growth Solutions | Scalvea",
    description: "Premium hair growth solutions & scalp treatments with clinically inspired ingredients. Shop Follicle 8 & Scalp-5 — designed for healthier-looking hair.",
    image: "https://scalvea.com/og-image.webp",
    canonical: "https://scalvea.com/",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "name": "Scalvea",
          "url": "https://scalvea.com",
          "logo": "https://scalvea.com/logo.webp",
          "sameAs": [
            "https://www.instagram.com/scalvea_/",
            "https://www.tiktok.com/@scalvea/",
            "https://www.linkedin.com/company/scalvea/"
          ]
        },
        {
          "@type": "VideoObject",
          "name": "Scalvea Follicle 8 Hair Growth Serum In-Demand Showcase",
          "description": "Discover the clinically developed active ingredients in Scalvea Follicle 8 Serum designed for hair thinning, shedding, and scalp health.",
          "thumbnailUrl": "https://scalvea.com/og-image.webp",
          "uploadDate": "2026-09-05T08:00:00+00:00",
          "duration": "PT30S",
          "contentUrl": "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/demanded.mp4",
          "embedUrl": "https://scalvea.com/",
          "publisher": {
            "@type": "Organization",
            "name": "Scalvea",
            "logo": {
              "@type": "ImageObject",
              "url": "https://scalvea.com/logo.webp"
            }
          }
        }
      ]
    },
  });

  const { selectedCountry } = useCountry();
  const [email, setEmail] = useState("");
  
  const slides = useMemo(() => [
    selectedCountry === "india"
      ? { lapSet: indlapSet, mobSet: indmobSet, alt: "Scalvea India Routine & Bundles", link: "/shop" }
      : { lapSet: auslapSet, mobSet: ausmobSet, alt: "Scalvea Australia Routine & Bundles", link: "/shop" },
    ...BASE_SLIDES,
  ], [selectedCountry]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedCount, setLoadedCount] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const isPointerDown = useRef(false);

  // Progressive slide loading:
  // Initial render: ONLY slide 0 is mounted (zero competing image downloads during LCP).
  // At 2.5s: mount slide 1 so it is preloaded well before 8s transition.
  // At 6s: mount all remaining slides.
  useEffect(() => {
    const t1 = setTimeout(() => {
      setLoadedCount((prev) => Math.max(prev, 2));
    }, 2500);

    const t2 = setTimeout(() => {
      setLoadedCount(slides.length);
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [slides.length]);

  const ensureAllLoaded = () => {
    setLoadedCount(slides.length);
  };

  // 8 seconds per slide — allows comfortable reading and lets LCP settle on slide 0
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  const handlePrev = () => {
    ensureAllLoaded();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    ensureAllLoaded();
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
    ensureAllLoaded();
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
    ensureAllLoaded();
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
    <div className="min-h-screen bg-background overflow-hidden relative flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
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
              const isMounted = idx < loadedCount;
              return (
                <div
                  key={idx}
                  className={`${
                    isFirst ? "relative" : "absolute inset-0"
                  } ${
                    isFirst
                      ? (currentSlide === 0 ? "opacity-100 z-10" : "opacity-0 z-0 transition-opacity ease-in-out")
                      : `transition-opacity ease-in-out ${currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"}`
                  }`}
                  style={isFirst ? undefined : { transitionDuration: "800ms" }}
                >
                  {isMounted ? (
                    <picture className="block lg:pt-5 w-full">
                      <source
                        media="(max-width: 768px)"
                        srcSet={slide.mobSet.srcSet}
                        sizes={slide.mobSet.sizes}
                        width={slide.mobSet.width}
                        height={slide.mobSet.height}
                      />
                      <img
                        src={slide.lapSet.src}
                        srcSet={slide.lapSet.srcSet}
                        sizes={slide.lapSet.sizes}
                        alt={slide.alt}
                        width={slide.lapSet.width}
                        height={slide.lapSet.height}
                        loading={isFirst ? "eager" : "lazy"}
                        fetchpriority={isFirst ? "high" : "low"}
                        decoding={isFirst ? "sync" : "async"}
                        className="w-full object-cover object-center block max-h-[calc(100vh-116px)] md:max-h-[calc(100vh-128px)] lg:max-h-[calc(100vh-74px)] h-auto pointer-events-none"
                      />
                    </picture>
                  ) : (
                    <div className="w-full h-full bg-neutral-100/50" />
                  )}
                  <Link
                    to={slide.link || "/shop"}
                    className="absolute inset-0 cursor-pointer"
                    aria-label="Shop now"
                  />
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows (User-friendly on both desktop & mobile with 48x48px touch target) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-5 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/80 hover:scale-105 active:scale-95 transition-all duration-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2] -translate-x-0.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-5 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.18)] backdrop-blur-md border border-white/80 hover:scale-105 active:scale-95 transition-all duration-300 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.2] translate-x-0.5" />
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
                  <div
                    key={currentSlide}
                    className="absolute inset-0 bg-white rounded-full animate-slide-progress"
                    style={{ animationPlayState: isHovered ? "paused" : "running" }}
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
            <div
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto order-2 md:order-1 space-y-4 md:space-y-0"
            >
              {/* Header & Copy */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-neutral-600 font-body font-medium block mb-1 sm:mb-2">
                    CLINICALLY DEVELOPED FORMULA
                  </span>
                  <h2 className="text-2xl sm:text-[30px] md:text-[34px] lg:text-[38px] leading-tight font-heading text-[#111111] tracking-tight font-normal">
                    Meet the Science Behind Follicle 8
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
                          <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-600 font-semibold font-mono">{ing.name}</span>
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
            </div>

            {/* Right Container: Product Image (fit to container) (order-1 md:order-2) */}
            <div 
              className="border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] bg-[#2E2E2E] aspect-[4/3] sm:aspect-[16/10] md:aspect-auto relative overflow-hidden order-1 md:order-2 flex items-center justify-center p-0"
            >
              <img
                src={hero2Set.src}
                srcSet={hero2Set.srcSet}
                sizes={hero2Set.sizes}
                alt="Follicle 8 Premium Showcase"
                width={hero2Set.width}
                height={hero2Set.height}
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>

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
            <div 
              className="border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] aspect-auto md:aspect-square relative overflow-hidden flex items-center justify-center"
            >
              <img
                src={scalpSet.src}
                srcSet={scalpSet.srcSet}
                sizes={scalpSet.sizes}
                alt="Scalp-5 Premium Showcase"
                width={scalpSet.width}
                height={scalpSet.height}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            
            {/* Right Container: Info Panel */}
            <div
              className="bg-white border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.01)] rounded-2xl md:rounded-[24px] p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between aspect-auto md:aspect-square space-y-4 md:space-y-0"
            >
              {/* Header & Copy */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-neutral-600 font-body font-medium block mb-1 sm:mb-2">
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
            </div>
          </div>
        </div>
      </section>

      {/* 5. RESPONSIVE CAMPAIGN BANNER SECTION */}
      <section className="bg-[#F6F5F2] py-10 md:py-16 overflow-hidden relative select-none border-t border-neutral-200/70">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex items-center justify-center">
          <div className="w-full">
            <picture className="w-full block">
              <source
                media="(min-width: 768px)"
                srcSet={puneetSet.srcSet}
                sizes={puneetSet.sizes}
                width={puneetSet.width}
                height={puneetSet.height}
              />
              <img
                src={puneetMobSet.src}
                srcSet={puneetMobSet.srcSet}
                sizes={puneetMobSet.sizes}
                alt="Scalvea Campaign Poster"
                width={puneetMobSet.width}
                height={puneetMobSet.height}
                className="w-full h-auto object-contain mx-auto"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>
        </div>
      </section>

      {/* OUR SCIENCE FEATURES GRID SECTION */}
      <section className="bg-light-grid py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden border-t border-border/30 relative select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.25em] uppercase text-neutral-600 font-body font-medium block mb-2 sm:mb-2.5">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
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
              <div 
                key={idx}
                className="group bg-white border border-neutral-200/80 hover:border-neutral-400/80 p-4 sm:p-7 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex flex-col justify-start h-full">
                  {/* Heading Row: Icon on Left + Title next to it + 01-04 on Right */}
                  <div className="flex items-center justify-between w-full mb-3 sm:mb-4 md:mb-5 gap-2">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 min-w-0">
                      <img 
                        src={card.icon} 
                        alt={card.title} 
                        width="64"
                        height="64"
                        className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      <h3 className="text-sm sm:text-lg md:text-xl font-heading font-medium text-neutral-900 leading-snug tracking-tight">
                        {card.title}
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-mono tracking-widest text-neutral-600 group-hover:text-neutral-800 transition-colors duration-300 font-medium shrink-0">
                      {card.num}
                    </span>
                  </div>

                  {/* Description Text Below */}
                  <p className="text-[11px] sm:text-xs md:text-sm text-[#555555] font-body font-light leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. LIFESTYLE / CTA SECTION – Full Background Image Editorial */}
      <section className="bg-[#F4F4F2] py-12 md:py-16 lg:py-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div
            className="relative rounded-[28px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.22)] min-h-[580px] md:min-h-[680px] lg:min-h-[740px] flex flex-col justify-end"
          >
            {/* Background Image with subtle Ken Burns */}
            <div className="absolute inset-0 z-0">
              <img
                src={hero3Set.src}
                srcSet={hero3Set.srcSet}
                sizes={hero3Set.sizes}
                alt="Scalvea premium hair care lifestyle"
                width={hero3Set.width}
                height={hero3Set.height}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Dark gradient overlay – stronger at bottom for text legibility */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/10 pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-20 p-8 md:p-12 lg:p-16 max-w-3xl">
              {/* Eyebrow */}
              <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/60 font-body font-medium block mb-4">
                START YOUR HAIR JOURNEY
              </span>

              {/* Heading */}
              <h2 className="text-3xl md:text-5xl lg:text-[56px] leading-tight font-heading text-white tracking-tight mb-5">
                Healthy Hair Starts<br className="hidden md:block" /> With Better Science.
              </h2>

              {/* Main paragraph */}
              <p className="text-xs md:text-sm text-white/80 font-body font-light leading-relaxed max-w-xl mb-3">
                Hair deserves more than temporary solutions. Every Scalvea formula is developed using clinically researched active ingredients selected to support scalp health, strengthen follicles, and promote healthier-looking hair with everyday use.
              </p>

              {/* Supporting paragraph */}
              <p className="text-[11px] md:text-xs text-white/60 font-body font-light leading-relaxed max-w-lg mb-7">
                Every bottle is formulated with transparent ingredient concentrations, lightweight textures, and carefully selected actives that work together to support long-term scalp and hair wellness—without unnecessary fillers or compromises.
              </p>

              {/* Feature pill tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {["Clinically Developed", "Everyday Hair Care", "Lightweight Formula"].map((tag, i) => (
                  <span
                    key={i}
                    className="text-[9px] tracking-[0.18em] uppercase text-white/90 border border-white/30 backdrop-blur-sm bg-white/10 px-4 py-1.5 rounded-full font-body font-medium hover:border-white/60 hover:bg-white/15 transition-all duration-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA button */}
              <div>
                <Link
                  to="/shop"
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-10 text-xs sm:text-sm tracking-[0.14em] uppercase font-semibold bg-white text-black border border-white hover:bg-transparent hover:text-white transition-all duration-500 hover:-translate-y-0.5 rounded-none shadow-lg"
                >
                  <span className="absolute inset-0 w-0 bg-white/20 backdrop-blur-sm transition-all duration-500 ease-out group-hover:w-full" />
                  <span className="relative z-10">Shop Now</span>
                  <ArrowRight className="relative z-10 h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER SIGNUP SECTION */}
      <section className="bg-light-grid py-16 md:py-24 lg:py-28 overflow-hidden relative border-t border-neutral-150">
        <div
          className="relative z-10 max-w-xl mx-auto text-center px-4 sm:px-6"
        >
          {/* Eyebrow */}
          <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-neutral-600 font-body font-medium block mb-2 sm:mb-3">
            STAY IN THE KNOW
          </span>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-[38px] leading-tight font-heading text-neutral-900 tracking-tight font-normal mb-3 sm:mb-4">
            Stay Connected With Scalvea
          </h2>

          {/* Subheading */}
          <p className="text-xs sm:text-sm text-neutral-600 font-body font-light leading-relaxed max-w-md mx-auto mb-8 sm:mb-9">
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
              className="flex-1 h-11 sm:h-12 px-5 text-xs sm:text-sm bg-white border border-neutral-200/90 rounded-full outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all duration-200 font-body font-light text-neutral-900 placeholder:text-neutral-600"
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
          <p className="text-[10px] sm:text-xs text-neutral-600 font-body font-light mt-3.5 tracking-normal">
            No spam. Just Scalvea updates.
          </p>
        </div>

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

      </main>

      <Footer />
    </div>
  );
};

export default Index;
