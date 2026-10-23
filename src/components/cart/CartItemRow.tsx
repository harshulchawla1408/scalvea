import React from "react";
import { Link } from "react-router-dom";
import { X, Gift } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import CartQuantitySelector from "./CartQuantitySelector";
import prod1 from "@/assets/prod1.webp";
import prod2 from "@/assets/prod2.webp";

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  isFreeScalp5?: boolean;
  formatPrice: (price: number) => string;
  compact?: boolean;
}

// Always resolve official packaging assets
export const getPackagingImage = (item: { productId?: string; name?: string; image?: string }) => {
  const name = (item.name || "").toLowerCase();
  const id = (item.productId || "").toLowerCase();
  if (id.includes("scalp") || name.includes("scalp") || name.includes("dandruff")) {
    return prod2;
  }
  if (id === "1" || id.includes("follicle") || name.includes("follicle") || name.includes("growth")) {
    return prod1;
  }
  return item.image || prod1;
};

// Map product slug for linking
export const getProductSlug = (item: { productId?: string; name?: string }) => {
  const name = (item.name || "").toLowerCase();
  const id = (item.productId || "").toLowerCase();
  if (id.includes("scalp") || name.includes("scalp")) {
    return "scalp-5-anti-dandruff";
  }
  return "follicle-8-hair-growth";
};

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isFreeScalp5 = false,
  formatPrice,
  compact = false,
}) => {
  const imageSrc = getPackagingImage(item);
  const slug = getProductSlug(item);

  return (
    <div
      className={`group relative bg-white rounded-2xl border border-neutral-200/90 transition-all duration-300 hover:border-neutral-300 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
        compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4.5">
        {/* Product Image Thumbnail */}
        <Link
          to={`/product/${slug}`}
          className={`flex-shrink-0 bg-[#FAF9F7] rounded-xl border border-neutral-200/70 overflow-hidden flex items-center justify-center p-1.5 sm:p-2 relative group-hover:scale-[1.02] transition-transform duration-300 ${
            compact ? "w-16 h-16 sm:w-20 sm:h-20" : "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
          }`}
          aria-label={`View ${item.name}`}
        >
          <img
            src={imageSrc}
            alt={item.name}
            className="w-full h-full object-contain mix-blend-multiply"
            loading="lazy"
          />
          {isFreeScalp5 && (
            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-extrabold tracking-wider px-1.5 py-0.5 rounded uppercase shadow-xs">
              FREE
            </span>
          )}
        </Link>

        {/* Product Details & Actions */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <div className="pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={`/product/${slug}`}
                className="text-xs sm:text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 hover:text-black transition-colors"
              >
                {item.name}
              </Link>
              {isFreeScalp5 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  <Gift className="w-2.5 h-2.5 text-emerald-600" /> Free Gift
                </span>
              )}
            </div>

            {/* Price Presentation */}
            <div className="mt-1">
              {isFreeScalp5 ? (
                item.quantity === 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                      <Gift className="w-3 h-3 text-emerald-600" /> FREE
                    </span>
                    <span className="text-xs text-neutral-600 line-through font-mono">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <Gift className="w-3 h-3 text-emerald-600" /> 1 × FREE
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900">
                        + {item.quantity - 1} × {formatPrice(item.price)}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      1 eligible Scalp-5 free with 3+ serums
                    </span>
                  </div>
                )
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 font-mono">
                    {formatPrice(item.price)}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[11px] text-neutral-600 font-mono">
                      ({formatPrice(item.price * item.quantity)} total)
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px] text-emerald-700 font-light tracking-wide block mt-0.5">
                Inclusive of all taxes
              </span>
            </div>
          </div>

          {/* Stepper & Bottom controls */}
          <div className="flex items-center justify-between mt-3 pt-2">
            <CartQuantitySelector
              quantity={item.quantity}
              onIncrease={() => onUpdateQuantity(item.quantity + 1)}
              onDecrease={() => onUpdateQuantity(item.quantity - 1)}
              itemName={item.name}
              size={compact ? "sm" : "md"}
            />

            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] text-neutral-600 hover:text-rose-600 uppercase tracking-[0.08em] font-medium transition-colors p-1"
              aria-label={`Remove ${item.name} from cart`}
            >
              Remove
            </button>
          </div>
        </div>

        {/* Quick Close (Top-Right) */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="Remove item"
          aria-label={`Remove ${item.name} from cart`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CartItemRow;
