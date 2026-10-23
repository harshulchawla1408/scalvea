import React from "react";
import { Sparkles, ShieldCheck, Truck, Lock } from "lucide-react";

export interface CartPriceSummaryProps {
  rawTotal: number;
  total: number;
  bundleDiscount: number;
  shipping: number;
  isIndia: boolean;
  currencyCode: string;
  formatPrice: (price: number) => string;
  compact?: boolean;
}

export const CartPriceSummary: React.FC<CartPriceSummaryProps> = ({
  rawTotal,
  total,
  bundleDiscount,
  shipping,
  isIndia,
  currencyCode,
  formatPrice,
  compact = false,
}) => {
  const finalTotal = total + shipping;
  const isFreeShipping = shipping === 0;
  const auFreeShippingThreshold = 60;
  const amountToFreeShipping = Math.max(0, auFreeShippingThreshold - total);

  return (
    <div className={`space-y-4 ${compact ? "" : "bg-white rounded-2xl border border-neutral-200/90 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"}`}>
      <h3 className="text-xs sm:text-sm font-bold tracking-[0.14em] uppercase text-neutral-900 pb-2 border-b border-neutral-100">
        Order Summary
      </h3>

      {/* Applied Bundle Discount Pill */}
      {bundleDiscount > 0 && (
        <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
          <span className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>
              {isIndia ? "BUY 2, GET 1 FREE Applied" : "Bundle Savings Applied"}
            </span>
          </span>
          <span className="font-mono font-bold">-{formatPrice(bundleDiscount)}</span>
        </div>
      )}

      {/* Breakdown Rows */}
      <div className="space-y-2.5 text-xs sm:text-sm">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-neutral-600 font-light">Subtotal</span>
          <div className="flex items-baseline gap-2 font-mono">
            {bundleDiscount > 0 && (
              <span className="text-neutral-600 line-through text-xs">
                {formatPrice(rawTotal)}
              </span>
            )}
            <span className="font-semibold text-neutral-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Shipping Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-neutral-600 font-light">
            <Truck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Shipping</span>
          </div>
          <div className="text-right font-mono">
            {isFreeShipping ? (
              <span className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                FREE
              </span>
            ) : (
              <span className="font-semibold text-neutral-900">
                {formatPrice(shipping)}
              </span>
            )}
          </div>
        </div>

        {/* Australia Free Shipping Threshold Reminder if under threshold */}
        {!isIndia && !isFreeShipping && amountToFreeShipping > 0 && (
          <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span>Add {formatPrice(amountToFreeShipping)} more for Free AU Delivery</span>
            <span className="font-mono font-bold text-[10px]">A$60 goal</span>
          </div>
        )}

        {/* Final Total */}
        <div className="border-t border-neutral-200 pt-3.5 mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 block">
              Estimated Total
            </span>
            <span className="text-[10px] text-emerald-700 font-light tracking-wide block mt-0.5">
              Inclusive of all taxes & duties
            </span>
          </div>
          <div className="text-right font-mono">
            <span className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
              {formatPrice(finalTotal)} <span className="text-xs font-semibold text-neutral-600">{currencyCode}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Trust & Verified Checkout Information */}
      <div className="pt-2 border-t border-neutral-100/80 grid grid-cols-2 gap-2 text-[10px] text-neutral-600">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
          <span>Australian Formulated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />
          <span>256-Bit Encrypted SSL</span>
        </div>
      </div>
    </div>
  );
};

export default CartPriceSummary;
