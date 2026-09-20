import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Asset imports
import insideImg from "@/assets/inside.webp";
import follicle1 from "@/assets/follicle1.webp";
import follicle2 from "@/assets/follicle2.webp";
import follicle3 from "@/assets/follicle3.webp";
import follicle4 from "@/assets/follicle4.webp";
import scalp1 from "@/assets/scalp1.webp";
import scalp2 from "@/assets/scalp2.webp";
import scalp3 from "@/assets/scalp3.webp";
import scalp4 from "@/assets/scalp4.webp";

interface IngredientShowcaseProps {
  product: {
    slug?: string;
    name?: string;
    category?: string;
    ingredients?: string | null;
  };
}

export const IngredientShowcase = ({ product }: IngredientShowcaseProps) => {
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Determine which formula to display based on product slug/name
  const isAntiDandruff = (() => {
    const s = (product.slug || "").toLowerCase();
    const n = (product.name || "").toLowerCase();
    const c = (product.category || "").toLowerCase();
    return (
      s.includes("scalp") ||
      s.includes("dandruff") ||
      n.includes("scalp") ||
      n.includes("dandruff") ||
      c.includes("dandruff")
    );
  })();

  const activeIngredients = isAntiDandruff
    ? [
        { id: "scalp1", img: scalp1, title: "Piroctone Olamine", num: "01" },
        { id: "scalp2", img: scalp2, title: "Salicylic Acid", num: "02" },
        { id: "scalp3", img: scalp3, title: "Rosemary Oil", num: "03" },
        { id: "scalp4", img: scalp4, title: "Vitamin E (Tocopherol)", num: "04" },
      ]
    : [
        { id: "follicle1", img: follicle1, title: "Anagain — 4%", num: "01" },
        { id: "follicle2", img: follicle2, title: "Redensyl — 3%", num: "02" },
        { id: "follicle3", img: follicle3, title: "Baicapil — 3%", num: "03" },
        { id: "follicle4", img: follicle4, title: "Procapil — 3%", num: "04" },
      ];

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, offsetWidth } = carouselRef.current;
    const cardWidth = offsetWidth * 0.84;
    const newIdx = Math.round(scrollLeft / cardWidth);
    setActiveMobileIndex(Math.min(Math.max(0, newIdx), activeIngredients.length - 1));
  };

  const scrollToSlide = (idx: number) => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.offsetWidth * 0.84;
    carouselRef.current.scrollTo({
      left: idx * cardWidth,
      behavior: "smooth",
    });
    setActiveMobileIndex(idx);
  };

  return (
    <section className="px-4 sm:px-6 lg:px-12 py-12 md:py-20 bg-[#FAF9F6] border-t border-neutral-200/70 relative overflow-hidden">
      {/* Hidden heading for screen readers & SEO */}
      <h2 className="sr-only">Ingredients and Formulation</h2>

      {/* Subtle Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] bg-amber-50/30 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* ══════════════════════════════════════════════════════════════
            DESKTOP: CIRCULAR / ORBITAL POSTER CONSTELLATION
            Center: inside.webp poster
            Around: 4 ingredient posters in circular layout
        ══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block relative py-6">
          {/* Orbital Circle / Rings SVG behind posters */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-0">
            <svg
              className="w-[900px] h-[900px] text-neutral-300/80 animate-[spin_180s_linear_infinite]"
              viewBox="0 0 900 900"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="450"
                cy="450"
                r="410"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="6 8"
                opacity="0.55"
              />
              <circle
                cx="450"
                cy="450"
                r="300"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.35"
              />
              {/* Orbital Nodes */}
              <circle cx="450" cy="40" r="4.5" fill="#737373" />
              <circle cx="860" cy="450" r="4.5" fill="#737373" />
              <circle cx="450" cy="860" r="4.5" fill="#737373" />
              <circle cx="40" cy="450" r="4.5" fill="#737373" />
            </svg>
          </div>

          {/* 3-Column Radial Composition */}
          <div className="relative z-10 grid grid-cols-[1fr_1.12fr_1fr] gap-8 xl:gap-12 items-center max-w-6xl mx-auto">
            
            {/* Left Flank: Cards 1 (Top-Left) & 3 (Bottom-Left) */}
            <div className="flex flex-col gap-8 justify-between">
              {/* Card 1: Top Left */}
              <div className="group relative bg-[#f2eded] rounded-3xl overflow-hidden border border-black/8 shadow-[0_6px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 transform xl:translate-x-3">
                <img
                  src={activeIngredients[0].img}
                  alt={activeIngredients[0].title}
                  className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>

              {/* Card 3: Bottom Left */}
              <div className="group relative bg-[#f2eded] rounded-3xl overflow-hidden border border-black/8 shadow-[0_6px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 transform xl:translate-x-3">
                <img
                  src={activeIngredients[2].img}
                  alt={activeIngredients[2].title}
                  className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Center: inside.webp Poster */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className="relative group w-full max-w-[360px] rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.12)] border-2 border-black/10 bg-[#f2eded] transition-all duration-700 hover:shadow-[0_24px_64px_rgba(0,0,0,0.18)] hover:border-black/20 hover:scale-[1.01]">
                <img
                  src={insideImg}
                  alt="What's Inside"
                  className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.01]"
                  loading="eager"
                />
              </div>
            </div>

            {/* Right Flank: Cards 2 (Top-Right) & 4 (Bottom-Right) */}
            <div className="flex flex-col gap-8 justify-between">
              {/* Card 2: Top Right */}
              <div className="group relative bg-[#f2eded] rounded-3xl overflow-hidden border border-black/8 shadow-[0_6px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 transform xl:-translate-x-3">
                <img
                  src={activeIngredients[1].img}
                  alt={activeIngredients[1].title}
                  className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>

              {/* Card 4: Bottom Right */}
              <div className="group relative bg-[#f2eded] rounded-3xl overflow-hidden border border-black/8 shadow-[0_6px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 transform xl:-translate-x-3">
                <img
                  src={activeIngredients[3].img}
                  alt={activeIngredients[3].title}
                  className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE / TABLET: BOOK-TYPE FLOW
            1. "What's Inside" poster on top
            2. Followed directly by the first image
            3. Smooth, book-like page flipping / scrolling flow
        ══════════════════════════════════════════════════════════════ */}
        <div className="block lg:hidden">
          {/* Top: Central "What's Inside" Poster */}
          <div className="max-w-[280px] sm:max-w-[320px] mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-black/10 bg-[#f2eded] mb-8">
            <img
              src={insideImg}
              alt="What's Inside"
              className="w-full h-auto block"
              loading="eager"
            />
          </div>

          {/* Book-Style Page Viewer */}
          <div className="relative">
            {/* Book Page Top Status Bar */}
            <div className="flex items-center justify-between max-w-[330px] mx-auto mb-3 px-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black/60" />
                <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-600">
                  Page {activeMobileIndex + 1} of {activeIngredients.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activeIngredients.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToSlide(i)}
                    aria-label={`Go to page ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeMobileIndex ? "w-6 bg-black" : "w-1.5 bg-neutral-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Book Pages Horizontal Snap Scroll */}
            <div className="-mx-4 sm:mx-0">
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex items-start gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none px-6 pb-2 pt-1"
              >
                {activeIngredients.map((item) => (
                  <div
                    key={item.id}
                    className="w-[84vw] sm:w-[320px] shrink-0 snap-center self-start bg-[#f2eded] rounded-3xl overflow-hidden border border-black/8 shadow-lg transition-transform duration-300"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Book Navigation Footer Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => scrollToSlide(Math.max(0, activeMobileIndex - 1))}
                disabled={activeMobileIndex === 0}
                aria-label="Previous page"
                className="px-4 py-2 rounded-full bg-white border border-neutral-300 text-xs font-medium text-neutral-800 disabled:opacity-30 shadow-xs hover:bg-neutral-50 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 rounded-full text-xs font-mono font-medium text-neutral-700">
                <span>{activeMobileIndex + 1}</span>
                <span className="text-neutral-500">/</span>
                <span>{activeIngredients.length}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  scrollToSlide(Math.min(activeIngredients.length - 1, activeMobileIndex + 1))
                }
                disabled={activeMobileIndex === activeIngredients.length - 1}
                aria-label="Next page"
                className="px-4 py-2 rounded-full bg-white border border-neutral-300 text-xs font-medium text-neutral-800 disabled:opacity-30 shadow-xs hover:bg-neutral-50 flex items-center gap-1.5 transition-all active:scale-95"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default IngredientShowcase;
