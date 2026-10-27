import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/contexts/CountryContext";
import { prod1Set, prod2Set, type ResponsiveImageSet } from "@/assets/generated";
import { getOptimizedImageUrl, getOptimizedImageSrcSet, getFallbackProductImageUrl } from "@/utils/imageOptimizer";

interface ProductShowcaseConfig {
  id: string;
  categoryLabel: string;
  productSlug: string;
  productName: string;
  shortDescription: string;
  ctaLabel: string;
  defaultSet: ResponsiveImageSet;
  badge: string;
  originLabel?: string;
}

const PRODUCTS: ProductShowcaseConfig[] = [
  {
    id: "follicle-8",
    categoryLabel: "HAIR GROWTH SERUM",
    productName: "Follicle 8 Hair Growth Serum",
    shortDescription:
      "Formulated with 4% Anagain & 3% Redensyl to help reduce visible shedding and support fuller, healthier-looking density.",
    productSlug: "follicle-8-hair-growth-serum",
    ctaLabel: "SHOP FOLLICLE 8",
    defaultSet: prod1Set,
    badge: "BESTSELLER",
    originLabel: "AN AUSTRALIAN BRAND",
  },
  {
    id: "scalp-5",
    categoryLabel: "ANTI-DANDRUFF SERUM",
    productName: "Scalp-5 Anti-Dandruff Serum",
    shortDescription:
      "Target stubborn flakes and restore a calm, balanced scalp with Piroctone Olamine, Salicylic Acid, and Rosemary Oil.",
    productSlug: "scalp-5-anti-dandruff-hair-serum",
    ctaLabel: "SHOP SCALP-5",
    defaultSet: prod2Set,
    badge: "TARGETED CARE",
    originLabel: "AN AUSTRALIAN BRAND",
  },
];

export default function ShopByConcern() {
  const { products } = useProducts();
  const { formatPrice, selectedCountry } = useCountry();
  const isIndia = selectedCountry === "india";

  return (
    <section
      id="shop-by-concern"
      className="bg-light-grid py-12 sm:py-16 md:py-20 lg:py-24 relative z-20 border-b border-neutral-150 overflow-visible"
      aria-label="Shop by Concern — Product Showcase"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ==================================================
            SECTION INTRO — Editorial & Light
            ================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-neutral-500 font-mono font-medium block mb-2">
              TARGETED SOLUTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-[38px] leading-[1.15] font-heading text-neutral-900 tracking-tight font-normal mb-2">
              Science-Backed Solutions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-body font-light leading-relaxed">
              Targeted hair care formulated with clinically researched actives. Select your targeted treatment.
            </p>
          </div>
          
          <Link
            to="/shop"
            className="group text-[11px] sm:text-xs md:text-sm tracking-[0.14em] uppercase text-black hover:opacity-60 transition-all flex items-center gap-1.5 font-medium border-b border-black/30 pb-1 shrink-0 self-start md:self-end"
          >
            <span>View All Products</span>
            <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>

        {/* ==================================================
            PRODUCT SHOWCASE CARDS
            Controlled overflow beyond boundary, dominant image, refined badges
            ================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-8 lg:gap-10 items-stretch pt-2">
          {PRODUCTS.map((item) => {
            const liveProduct = products.find(
              (p) =>
                p.slug === item.productSlug ||
                p.name.toLowerCase().includes(item.id === "follicle-8" ? "follicle" : "scalp")
            );

            const defaultSet = item.defaultSet;
            const supaImg = liveProduct?.images?.[0];
            const isOriginal = !supaImg || supaImg.includes('1786916700729') || supaImg.includes('1786916747760');

            const imageSrc = isOriginal ? defaultSet.src : getOptimizedImageUrl(supaImg, 480);
            const imageSrcSet = isOriginal ? defaultSet.srcSet : (getOptimizedImageSrcSet(supaImg, [320, 480, 640]) || undefined);
            const imageSizes = isOriginal ? defaultSet.sizes : "(max-width: 640px) 280px, (max-width: 1024px) 380px, 480px";

            const priceAud = liveProduct?.price_aud ?? 34.5;
            const priceInr = liveProduct?.price_inr ?? (item.id === "follicle-8" ? 999 : 899);
            const mrpAud = liveProduct?.mrp_aud ?? priceAud;
            const mrpInr = liveProduct?.mrp_inr ?? priceInr;

            const currentSellingPrice = isIndia ? priceInr : priceAud;
            const currentMrpPrice = isIndia ? mrpInr : mrpAud;
            const hasDiscount = currentMrpPrice > currentSellingPrice;

            return (
              <div key={item.id} className="showcase-card-wrapper relative">
                <Link
                  to={`/product/${item.productSlug}`}
                  className="showcase-card group relative bg-white border border-neutral-200/80 rounded-2xl md:rounded-[22px] flex flex-col h-full shadow-[0_2px_16px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] overflow-visible"
                >
                  {/* UPPER STAGE: Badge & Product Image Canvas (Unified, No Double-Box) */}
                  <div className="relative bg-[#FAF9F7] rounded-t-2xl md:rounded-t-[22px] p-4 sm:p-5 pb-2 sm:pb-3 border-b border-neutral-100/70 overflow-visible">
                    
                    {/* 1. BADGE & ORIGIN STRIP */}
                    <div className="flex items-center justify-between mb-2 z-20 relative">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-[0.18em] uppercase font-medium bg-neutral-900 text-white shadow-2xs">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        {item.badge}
                      </span>
                      {item.originLabel && (
                        <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-neutral-400 font-medium">
                          {item.originLabel}
                        </span>
                      )}
                    </div>

                    {/* 2. PRODUCT IMAGE — Dominant visual focus with controlled hover overflow */}
                    <div className="relative overflow-visible flex items-center justify-center py-1 sm:py-2">
                      <img
                        src={imageSrc}
                        srcSet={imageSrcSet}
                        sizes={imageSizes}
                        alt={item.productName}
                        width="480"
                        height="480"
                        className="showcase-img w-full max-w-[280px] sm:max-w-[310px] md:max-w-[330px] h-auto object-contain rounded-lg"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = getFallbackProductImageUrl(item.productName);
                          if (target.src !== fallback) {
                            target.src = fallback;
                            target.removeAttribute("srcset");
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* 3–6. CONTENT: Category, Title, Description, CTA */}
                  <div className="p-5 sm:p-6 pt-4 flex flex-col flex-1 justify-between">
                    <div className="space-y-2">
                      {/* 3. Small Category Label */}
                      <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.22em] uppercase text-neutral-500 block">
                        {item.categoryLabel}
                      </span>

                      {/* 4. Product Title */}
                      <h3 className="text-lg sm:text-xl md:text-[22px] font-heading text-neutral-900 font-normal leading-snug tracking-tight">
                        {item.productName}
                      </h3>

                      {/* 5. Short Description */}
                      <p className="text-xs sm:text-[13px] text-neutral-600 font-body font-light leading-relaxed">
                        {item.shortDescription}
                      </p>
                    </div>

                    {/* Price + 6. CTA Button */}
                    <div className="pt-5 mt-auto">
                      <div className="flex items-baseline gap-2 pb-3">
                        {hasDiscount && (
                          <span className="text-xs text-neutral-400 line-through font-body">
                            {formatPrice(mrpAud, mrpInr)}
                          </span>
                        )}
                        <span className="text-base sm:text-lg font-semibold text-neutral-900 font-body tracking-tight">
                          {formatPrice(priceAud, priceInr)}
                        </span>
                      </div>

                      <span
                        className="w-full bg-neutral-900 group-hover:bg-black text-white h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] sm:text-xs tracking-[0.14em] uppercase font-medium transition-all duration-200 shadow-2xs group-hover:shadow-md"
                      >
                        <span>{item.ctaLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

      </div>

      {/* Scoped Hover & Motion styling — Desktop overflow lift, disabled on touch/mobile */}
      <style>{`
        .showcase-img {
          transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms ease;
          will-change: transform;
        }

        @media (hover: hover) and (min-width: 768px) and (prefers-reduced-motion: no-preference) {
          .showcase-card:hover .showcase-img {
            transform: translateY(-8px) scale(1.04);
            box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.12);
          }
        }

        @media (max-width: 767px) {
          .showcase-card:hover .showcase-img,
          .showcase-img {
            transform: none !important;
            transition: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .showcase-card,
          .showcase-img {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
