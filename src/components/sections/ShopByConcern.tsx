import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/contexts/CountryContext";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

// Concern Data Configurations
interface ConcernConfig {
  id: string;
  eyebrow: string;
  problemHeading: string;
  description: string;
  videoSrc: string;
  productSlug: string;
  productName: string;
  productCategory: string;
  benefitBullets: string[];
  ctaLabel: string;
  defaultImage: string;
  badge?: string;
}

const CONCERNS: ConcernConfig[] = [
  {
    id: "hair-fall",
    eyebrow: "HAIR FALL & THINNING",
    problemHeading: "Targeting Hair Fall: Stronger Hair Starts at the Root",
    description:
      "Support healthier-looking density and help reduce visible shedding with Follicle 8 Hair Growth Serum.",
    videoSrc:
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/hairfall.mp4",
    productSlug: "follicle-8-hair-growth-serum",
    productName: "Follicle 8 Hair Growth Serum",
    productCategory: "Hair Growth Serum",
    benefitBullets: [
      "4% Anagain & 3% Redensyl formula",
      "Helps reduce shedding & strengthens follicles",
      "Lightweight, non-greasy daily leave-in",
    ],
    ctaLabel: "SHOP FOLLICLE 8",
    defaultImage: prod1,
    badge: "BESTSELLER",
  },
  {
    id: "dandruff",
    eyebrow: "DANDRUFF & FLAKES",
    problemHeading: "Tackling Dandruff: A Cleaner, Flake-Free Scalp Starts Here",
    description:
      "Target stubborn flakes and restore a calm, balanced scalp with Scalp-5 Anti Dandruff Hair Serum.",
    videoSrc:
      "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/dandruff.mp4",
    productSlug: "scalp-5-anti-dandruff-hair-serum",
    productName: "Scalp-5 Anti Dandruff Hair Serum",
    productCategory: "Anti Dandruff Hair Serum",
    benefitBullets: [
      "Piroctone Olamine & Salicylic Acid",
      "Calms itchiness & clears visible flakes",
      "Restores natural scalp barrier balance",
    ],
    ctaLabel: "SHOP SCALP-5",
    defaultImage: prod2,
    badge: "TARGETED CARE",
  },
];

// Reusable Edge-to-Edge Silent Autoplay Video Component
const ConcernVideo = ({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Strict muted settings for 100% browser autoplay compliance
    videoEl.muted = true;
    videoEl.defaultMuted = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoEl) return;
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {
            // Autoplay prevention fallback
          });
        } else {
          videoEl.pause();
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-neutral-100 select-none pointer-events-none rounded-xl"
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        style={{ transform: "scale(1.28)" }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        aria-label={alt}
      />
      {/* Refined subtle gradient protection overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-black/5 pointer-events-none" />
    </div>
  );
};

export default function ShopByConcern() {
  const { products } = useProducts();
  const { formatPrice, selectedCountry } = useCountry();
  const isIndia = selectedCountry === "india";

  return (
    <section
      id="shop-by-concern"
      className="bg-light-grid py-14 sm:py-18 md:py-24 lg:py-28 overflow-hidden relative z-20 border-b border-neutral-150"
      aria-label="Shop by Concern — Real Problems, Real Solutions"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        
        {/* ==================================================
            SECTION INTRO
            ================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 md:mb-14 gap-4 sm:gap-6">
          <div className="max-w-2xl">
            <span className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-neutral-500 font-body font-medium block mb-2 sm:mb-3">
              SHOP BY CONCERN
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-[38px] lg:text-[42px] leading-[1.15] font-heading text-neutral-900 tracking-tight font-normal mb-2.5 sm:mb-3.5">
              Real Problems. Real Solutions.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-body font-light leading-relaxed max-w-xl">
              Targeted hair care for the concerns that matter most. Choose your concern and discover the Scalvea solution designed for it.
            </p>
          </div>
          
          <Link
            to="/shop"
            className="group text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-black hover:opacity-60 transition-all flex items-center gap-2 font-semibold w-fit border-b border-black/30 pb-1 shrink-0 self-start md:self-end"
          >
            <span>View All Products</span>
            <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>

        {/* ==================================================
            CONCERN CARDS GRID (1 Col on Mobile, 2 Col on Laptop/Desktop)
            ================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-8 items-stretch">
          {CONCERNS.map((concern) => {
            const liveProduct = products.find(
              (p) =>
                p.slug === concern.productSlug ||
                p.name.toLowerCase().includes(concern.id === "hair-fall" ? "follicle" : "scalp")
            );

            const productImage =
              liveProduct?.images?.[0] || concern.defaultImage;

            const priceAud = liveProduct?.price_aud ?? 34.5;
            const priceInr = liveProduct?.price_inr ?? (concern.id === "hair-fall" ? 999 : 899);
            const mrpAud = liveProduct?.mrp_aud ?? priceAud;
            const mrpInr = liveProduct?.mrp_inr ?? priceInr;

            const currentSellingPrice = isIndia ? priceInr : priceAud;
            const currentMrpPrice = isIndia ? mrpInr : mrpAud;
            const hasDiscount = currentMrpPrice > currentSellingPrice;

            return (
              <div
                key={concern.id}
                className="group relative bg-[#FAF9F7] border border-neutral-200/90 hover:border-neutral-300 rounded-2xl md:rounded-[24px] p-4 sm:p-6 md:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.05)] transition-all duration-500 flex flex-col justify-between"
              >
                <div className="space-y-4 sm:space-y-5">
                  
                  {/* Eyebrow Header Row */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block" />
                      <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.22em] uppercase text-neutral-600">
                        {concern.eyebrow}
                      </span>
                    </div>

                    {concern.badge && (
                      <span className="text-[9px] font-mono tracking-widest uppercase bg-neutral-900 text-white px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1.5">
                        <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                        {concern.badge}
                      </span>
                    )}
                  </div>

                  {/* Unified Integrated Media & Solution Bay */}
                  <div className="bg-white border border-neutral-200/80 rounded-xl p-2.5 sm:p-3.5 shadow-2xs overflow-hidden">
                    <div className="flex flex-row items-stretch gap-3 sm:gap-4 w-full">
                      
                      {/* Left: Edge-to-Edge Problem Video (38-40% width, shrink-0) */}
                      <div className="w-[38%] sm:w-[40%] shrink-0 relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100 shadow-inner">
                        <ConcernVideo
                          src={concern.videoSrc}
                          alt={`${concern.eyebrow} real concern footage`}
                        />
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <span className="text-[7.5px] sm:text-[8px] font-mono font-medium tracking-wider uppercase bg-black/65 backdrop-blur-xs text-white px-1.5 py-0.5 rounded">
                            PROBLEM
                          </span>
                        </div>
                      </div>

                      {/* Right: Scalvea Solution Product Showcase (flex-1, min-w-0, strictly contained) */}
                      <Link
                        to={`/product/${concern.productSlug}`}
                        className="flex-1 min-w-0 flex flex-col justify-between py-0.5 px-0.5 group/item overflow-hidden"
                      >
                        <div className="min-w-0 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-1 shrink-0">
                            <span className="text-[8px] sm:text-[9px] font-mono font-medium tracking-wider uppercase text-neutral-500 truncate">
                              SOLUTION
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-neutral-500 group-hover/item:text-black group-hover/item:translate-x-0.5 transition-all font-medium shrink-0">
                              Shop →
                            </span>
                          </div>

                          {/* Product Bottle Image Container */}
                          <div className="relative w-full flex-1 min-h-[130px] sm:min-h-[155px] max-h-[190px] sm:max-h-[220px] mx-auto my-0.5 flex items-center justify-center p-1 overflow-hidden">
                            <img
                              src={productImage}
                              alt={concern.productName}
                              className="w-full h-full max-h-[170px] sm:max-h-[200px] object-contain transform scale-110 group-hover/item:scale-115 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Product Title & Price */}
                        <div className="space-y-0.5 pt-1 border-t border-neutral-100 min-w-0 shrink-0">
                          <h4 className="text-[12px] sm:text-[13px] font-medium text-neutral-900 leading-tight truncate font-heading group-hover/item:text-black transition-colors">
                            {concern.productName}
                          </h4>
                          <div className="flex items-baseline gap-1.5 pt-0.5">
                            {hasDiscount && (
                              <span className="text-[10px] sm:text-[11px] text-neutral-500 line-through font-body">
                                {formatPrice(mrpAud, mrpInr)}
                              </span>
                            )}
                            <span className="text-[12px] sm:text-[13px] font-bold text-neutral-900 font-body">
                              {formatPrice(priceAud, priceInr)}
                            </span>
                          </div>
                        </div>
                      </Link>

                    </div>
                  </div>

                  {/* Problem & Solution Heading + Copy */}
                  <div className="space-y-2 pt-1">
                    <h3 className="text-base sm:text-lg lg:text-[19px] font-heading text-neutral-900 font-normal leading-snug tracking-tight">
                      {concern.problemHeading}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-neutral-600 font-body font-light leading-relaxed">
                      {concern.description}
                    </p>

                    {/* Key Actives / Formula Highlights */}
                    <div className="pt-1.5 space-y-1.5">
                      {concern.benefitBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-700 font-body">
                          <span className="w-3.5 h-3.5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                            <Check className="h-2 w-2 stroke-[3]" />
                          </span>
                          <span className="font-light">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Primary CTA Button with interactive tap/hover */}
                <div className="pt-5 mt-auto">
                  <Link
                    to={`/product/${concern.productSlug}`}
                    className="group/btn relative overflow-hidden w-full bg-neutral-900 hover:bg-black text-white active:scale-[0.98] transition-all duration-300 h-11 sm:h-12 flex items-center justify-center gap-2 text-[11px] sm:text-xs tracking-[0.16em] uppercase font-semibold shadow-sm hover:shadow-md rounded-xl"
                  >
                    <span>{concern.ctaLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
