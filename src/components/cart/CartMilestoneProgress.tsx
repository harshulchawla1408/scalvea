import React from "react";
import { Sparkles, Crown, Gem, Check, Plus, ArrowRight, Truck, Gift } from "lucide-react";

export interface CartMilestoneProgressProps {
  serumCount: number;
  total: number;
  rawTotal: number;
  bundleDiscount: number;
  isIndia: boolean;
  currencyCode?: string;
  hasScalp5?: boolean;
  hasFollicle8?: boolean;
  onAddSerum?: (targetType?: "scalp" | "follicle") => void;
  isAdding?: boolean;
  compact?: boolean;
}

export const CartMilestoneProgress: React.FC<CartMilestoneProgressProps> = ({
  serumCount,
  total,
  rawTotal,
  bundleDiscount,
  isIndia,
  currencyCode = isIndia ? "INR" : "AUD",
  hasScalp5 = false,
  hasFollicle8 = false,
  onAddSerum,
  isAdding = false,
  compact = false,
}) => {
  const formatMoney = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  // Determine active tier: 0 (none), 1 (Silver), 2 (Gold), 3 (Diamond)
  const tier = serumCount <= 0 ? 0 : serumCount === 1 ? 1 : serumCount === 2 ? 2 : 3;

  // Progress percentage (0%, 33.3%, 66.6%, 100%)
  const progressPercent =
    serumCount <= 0 ? 0 : serumCount === 1 ? 33.3 : serumCount === 2 ? 66.6 : 100;

  // Decide counterpart serum when quick-adding
  const targetCounterpart: "scalp" | "follicle" = !hasScalp5
    ? "scalp"
    : !hasFollicle8
    ? "follicle"
    : "scalp";

  // Active Milestone Card Styling & Content
  const getMilestoneDetails = () => {
    if (tier === 3) {
      // DIAMOND — 3 or more serums
      if (isIndia) {
        const freeScalpUnlocked = hasScalp5;
        return {
          title: "Diamond Milestone Unlocked",
          badge: "DIAMOND",
          badgeColor: "bg-[#0284c7] text-white border-[#0284c7]",
          cardTheme:
            "border-[#7dd3fc] bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]/40 text-[#0c4a6e]",
          iconTheme: "bg-[#0284c7] text-white",
          subheadline: freeScalpUnlocked
            ? "BUY 2, GET 1 FREE Applied — 1 Scalp-5 Anti Dandruff Hair Serum is 100% FREE!"
            : "Diamond tier reached! Add Scalp-5 Anti Dandruff Serum to claim your FREE gift worth ₹899.",
          savingsNote: freeScalpUnlocked ? "✓ ₹899 discount applied + Free express delivery" : undefined,
          actionPrompt: !freeScalpUnlocked ? "Add Scalp-5 for FREE" : undefined,
          actionTarget: "scalp" as const,
        };
      } else {
        // Australia
        const normal3Subtotal = formatMoney(rawTotal);
        const promoSubtotal = formatMoney(total);
        const savingsText =
          bundleDiscount > 0
            ? `You save ${formatMoney(bundleDiscount)} + Free Delivery`
            : "Free Delivery Included";
        return {
          title: "Diamond Milestone Unlocked",
          badge: "DIAMOND",
          badgeColor: "bg-[#1e587d] text-white border-[#1e587d]",
          cardTheme:
            "border-[#9ec3dc] bg-gradient-to-br from-[#f0f6fa] via-[#e5f0f8] to-[#d4e6f3] text-[#144260]",
          iconTheme: "bg-[#1e587d] text-white",
          subheadline:
            serumCount === 3
              ? `Best-value 3-serum bundle applied: ${promoSubtotal} (Standard: ${normal3Subtotal})`
              : `Best-value bundle applied: ${promoSubtotal} (${serumCount} serums)`,
          savingsNote: `✓ ${savingsText}`,
          actionPrompt: undefined,
          actionTarget: targetCounterpart,
        };
      }
    }

    if (tier === 2) {
      // GOLD — 2 serums
      if (isIndia) {
        return {
          title: "Gold Milestone Unlocked",
          badge: "GOLD",
          badgeColor: "bg-[#9a7032] text-white border-[#9a7032]",
          cardTheme:
            "border-[#dfcca8] bg-gradient-to-br from-[#fffdf7] via-[#faf4e6] to-[#f4e9cb] text-[#6d4a17]",
          iconTheme: "bg-[#9a7032] text-white",
          subheadline: "Free express delivery across India! Subtotal: " + formatMoney(total),
          savingsNote: "Add 1 more serum to unlock Diamond (BUY 2 GET 1 FREE — Save ₹899)",
          actionPrompt: "Add 1 more for Diamond",
          actionTarget: targetCounterpart,
        };
      } else {
        // Australia: 2 x A$34.50 = A$69.00 -> Free delivery qualified (A$60+ threshold)
        return {
          title: "Gold Milestone Unlocked",
          badge: "GOLD",
          badgeColor: "bg-[#8b6528] text-white border-[#8b6528]",
          cardTheme:
            "border-[#dfcca8] bg-gradient-to-br from-[#fffdf8] via-[#fbf5e7] to-[#f5ead0] text-[#6c4815]",
          iconTheme: "bg-[#8b6528] text-white",
          subheadline: `Free Australian delivery qualified! Two-serum subtotal: ${formatMoney(total)}`,
          savingsNote: "Add 1 more serum to unlock Diamond (3 for A$100 — Save A$3.50)!",
          actionPrompt: "Add 1 more for Diamond",
          actionTarget: targetCounterpart,
        };
      }
    }

    if (tier === 1) {
      // SILVER — 1 serum
      return {
        title: "Silver Milestone Achieved",
        badge: "SILVER",
        badgeColor: "bg-[#475569] text-white border-[#475569]",
        cardTheme:
          "border-slate-300 bg-gradient-to-br from-slate-50 via-zinc-100/80 to-slate-200/50 text-slate-800",
        iconTheme: "bg-[#475569] text-white",
        subheadline: `Your routine has started. Product subtotal: ${formatMoney(total)}`,
        savingsNote: isIndia
          ? "Add 1 more serum to reach Gold & 2 more for BUY 2 GET 1 FREE!"
          : "Add 1 more serum to reach Gold & unlock Free Australian Delivery!",
        actionPrompt: isIndia ? "Add 1 more for Gold" : "Add 1 more for Free Delivery",
        actionTarget: targetCounterpart,
      };
    }

    // 0 Serums
    return {
      title: "Start Your Routine",
      badge: "BEGIN",
      badgeColor: "bg-neutral-700 text-white border-neutral-700",
      cardTheme: "border-neutral-200 bg-neutral-50 text-neutral-800",
      iconTheme: "bg-neutral-700 text-white",
      subheadline: "Add 1 serum to reach Silver milestone and begin your clinical hair routine.",
      savingsNote: isIndia
        ? "Reach 2 for Gold or 3 for BUY 2 GET 1 FREE (Scalp-5 Free)!"
        : "Reach 2 for Gold (Free Delivery) or 3 for Diamond (A$100 Bundle)!",
      actionPrompt: "Add 1 Serum to Begin",
      actionTarget: "follicle" as const,
    };
  };

  const details = getMilestoneDetails();

  // Screen reader live status announcement
  const liveStatusText = `Cart milestone updated: ${details.title}. ${details.subheadline} ${
    details.savingsNote || ""
  }`;

  return (
    <section
      aria-label="Scalvea Cart Rewards Milestone Progress"
      className={`w-full transition-all duration-300 ${compact ? "space-y-3" : "space-y-4"}`}
    >
      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveStatusText}
      </div>

      {/* ─── 1. PROGRESS BAR TRACK & NODES ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* Progress header */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold tracking-[0.14em] uppercase text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
            Milestone Rewards
          </span>
          <span className="text-[11px] font-mono font-medium text-neutral-600">
            {serumCount} {serumCount === 1 ? "Serum" : "Serums"} in Bag
          </span>
        </div>

        {/* The Track Container */}
        <div className="relative pt-1 pb-4">
          {/* Background Bar */}
          <div
            className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/60"
            role="progressbar"
            aria-valuenow={serumCount}
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuetext={`${details.title} — ${serumCount} serums`}
          >
            {/* Smooth Left-to-Right Animated Fill (GPU-accelerated scaleX to avoid forced reflow) */}
            <div
              className="h-full w-full bg-gradient-to-r from-slate-400 via-amber-400 to-sky-600 rounded-full transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none"
              style={{ transform: `scaleX(${Math.max(0, Math.min(100, progressPercent)) / 100})`, transformOrigin: "left" }}
            />
          </div>

          {/* Milestone Node Points */}
          <div className="flex items-center justify-between mt-3 text-[11px]">
            {/* Stage 1: Silver */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  serumCount >= 1
                    ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                    : "bg-white text-slate-400 border-slate-300"
                } ${tier === 1 ? "ring-2 ring-slate-400 ring-offset-2 scale-105" : ""}`}
                title="Silver: 1 Serum"
              >
                {serumCount >= 1 ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Sparkles className="w-3 h-3" />}
              </div>
              <span
                className={`mt-1.5 font-bold tracking-wider text-[10px] uppercase ${
                  serumCount >= 1 ? "text-slate-800" : "text-neutral-600"
                }`}
              >
                Silver
              </span>
              <span className="text-[9px] text-neutral-600 font-mono">1 Serum</span>
            </div>

            {/* Stage 2: Gold */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  serumCount >= 2
                    ? "bg-[#9a7032] text-white border-[#9a7032] shadow-xs"
                    : "bg-white text-amber-500/60 border-amber-300/80"
                } ${tier === 2 ? "ring-2 ring-amber-400 ring-offset-2 scale-105" : ""}`}
                title="Gold: 2 Serums"
              >
                {serumCount >= 2 ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Crown className="w-3 h-3" />}
              </div>
              <span
                className={`mt-1.5 font-bold tracking-wider text-[10px] uppercase ${
                  serumCount >= 2 ? "text-[#7a531a]" : "text-neutral-600"
                }`}
              >
                Gold
              </span>
              <span className="text-[9px] text-neutral-600 font-mono">
                {isIndia ? "2 Serums" : "Free Delivery"}
              </span>
            </div>

            {/* Stage 3: Diamond */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  serumCount >= 3
                    ? "bg-[#0284c7] text-white border-[#0284c7] shadow-xs"
                    : "bg-white text-sky-500/60 border-sky-300/80"
                } ${tier >= 3 ? "ring-2 ring-sky-400 ring-offset-2 scale-105" : ""}`}
                title="Diamond: 3+ Serums"
              >
                {serumCount >= 3 ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Gem className="w-3 h-3" />}
              </div>
              <span
                className={`mt-1.5 font-bold tracking-wider text-[10px] uppercase ${
                  serumCount >= 3 ? "text-[#0284c7]" : "text-neutral-600"
                }`}
              >
                Diamond
              </span>
              <span className="text-[9px] text-neutral-600 font-mono">
                {isIndia ? "Buy 2 Get 1" : "Best Value"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. ACTIVE MILESTONE BANNER / REWARD CARD ─────────────────────────── */}
      <div
        className={`rounded-2xl border p-4 sm:p-4.5 transition-all duration-300 shadow-xs ${details.cardTheme}`}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full border shadow-2xs ${details.badgeColor}`}
            >
              {details.badge}
            </span>
            <h3 className="text-xs sm:text-[13px] font-bold tracking-tight">
              {details.title}
            </h3>
          </div>

          {tier >= 3 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/90 text-neutral-900 border border-current/20 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-emerald-600" /> Best Offer Applied
            </span>
          ) : tier === 2 && !isIndia ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-white/90 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full">
              <Truck className="w-3 h-3" /> Free AU Shipping
            </span>
          ) : null}
        </div>

        {/* Subheadline and dynamic messaging */}
        <p className="text-xs sm:text-[12.5px] mt-1.5 leading-relaxed font-normal opacity-95">
          {details.subheadline}
        </p>

        {details.savingsNote && (
          <p className="text-[11px] font-semibold mt-1 tracking-tight flex items-center gap-1">
            {details.savingsNote}
          </p>
        )}

        {/* Action Button for Unlocking Next Milestone */}
        {details.actionPrompt && onAddSerum && (
          <div className="mt-3 pt-2.5 border-t border-current/15 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium opacity-90 hidden sm:block">
              {tier === 1
                ? isIndia
                  ? "Unlock Gold & advance to Buy 2 Get 1 Free"
                  : "Unlock Gold & qualify for Free Delivery"
                : isIndia
                ? "Unlock Diamond & claim your FREE Scalp-5"
                : "Unlock Diamond & save A$3.50 instantly"}
            </p>
            <button
              type="button"
              disabled={isAdding}
              onClick={() => onAddSerum(details.actionTarget)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
              aria-label={details.actionPrompt}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? "Adding..." : details.actionPrompt}</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartMilestoneProgress;
