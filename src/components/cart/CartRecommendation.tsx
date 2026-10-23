import React, { useState } from "react";
import { Sparkles, Plus, Check } from "lucide-react";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

export interface CartRecommendationProps {
  hasFollicle8: boolean;
  hasScalp5: boolean;
  serumCount: number;
  scalp5Price: number;
  follicle8Price: number;
  formatPrice: (val: number) => string;
  onAddProduct: (productType: "scalp" | "follicle") => void;
  compact?: boolean;
}

export const CartRecommendation: React.FC<CartRecommendationProps> = ({
  hasFollicle8,
  hasScalp5,
  serumCount,
  scalp5Price,
  follicle8Price,
  formatPrice,
  onAddProduct,
  compact = false,
}) => {
  const [justAdded, setJustAdded] = useState<"scalp" | "follicle" | null>(null);

  // Cross-sell logic:
  // If Follicle 8 in cart and Scalp-5 missing -> Recommend Scalp-5
  // If Scalp-5 in cart and Follicle 8 missing -> Recommend Follicle 8
  // If both or neither -> If serumCount < 2, recommend Scalp-5 as complementary
  const showScalp5 = hasFollicle8 && !hasScalp5;
  const showFollicle8 = hasScalp5 && !hasFollicle8;

  // If customer already has both products, hide cross-sell
  if (hasFollicle8 && hasScalp5) {
    return null;
  }

  // If neither is present (e.g. empty or unknown), default suggest Follicle 8
  const recommendType: "scalp" | "follicle" = showScalp5 ? "scalp" : "follicle";

  const productData =
    recommendType === "scalp"
      ? {
          name: "Scalp-5 Anti-Dandruff Hair Serum",
          shortName: "Scalp-5 Serum",
          benefit: "Eliminates flakes & purifies scalp microflora for accelerated root growth.",
          price: scalp5Price,
          image: prod2,
        }
      : {
          name: "Follicle 8 Hair Growth Serum",
          shortName: "Follicle 8 Serum",
          benefit: "Reactivates dormant hair follicles with Redensyl & Anagain for density.",
          price: follicle8Price,
          image: prod1,
        };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    onAddProduct(recommendType);
    setJustAdded(recommendType);
    setTimeout(() => {
      setJustAdded(null);
    }, 1800);
  };

  return (
    <div className={`rounded-2xl border border-[#e8ded2] bg-gradient-to-r from-[#fdfaf5] to-[#fcf8f2] shadow-2xs ${compact ? "p-3.5" : "p-4 sm:p-5"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-neutral-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#a07840]" />
          Complete Your Routine
        </span>
        <span className="text-[10px] font-bold text-[#8b6528] tracking-wider uppercase bg-[#dfcca8]/30 px-2 py-0.5 rounded-full">
          Recommended Synergy
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Product Thumbnail */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-[#e6dcce] flex-shrink-0 overflow-hidden p-1.5 flex items-center justify-center shadow-2xs">
          <img
            src={productData.image}
            alt={productData.name}
            className="w-full h-full object-contain mix-blend-multiply"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h4 className="text-xs sm:text-[13px] font-bold text-neutral-900 truncate">
              {productData.name}
            </h4>
            <span className="text-xs sm:text-[13px] font-bold text-neutral-900 font-mono">
              {formatPrice(productData.price)}
            </span>
          </div>

          <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug font-light line-clamp-2">
            {productData.benefit}
          </p>
        </div>

        {/* Inline Add Button */}
        <div className="flex-shrink-0">
          {justAdded === recommendType ? (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs animate-fade-in">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Added
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="px-3.5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs cursor-pointer"
              aria-label={`Add ${productData.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartRecommendation;
