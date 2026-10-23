import React from "react";
import { Minus, Plus } from "lucide-react";

export interface CartQuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  itemName?: string;
}

export const CartQuantitySelector: React.FC<CartQuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  disabled = false,
  min = 1,
  max = 99,
  size = "md",
  itemName = "item",
}) => {
  const isSm = size === "sm";

  return (
    <div
      role="group"
      aria-label={`Quantity selector for ${itemName}`}
      className="inline-flex items-center rounded-lg border border-neutral-300 bg-white shadow-2xs overflow-hidden select-none"
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        aria-label={`Decrease quantity of ${itemName}`}
        className={`flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isSm ? "w-7 h-7" : "w-8 h-8"
        }`}
      >
        <Minus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>

      <span
        aria-live="polite"
        className={`text-center font-mono font-medium text-neutral-900 tabular-nums ${
          isSm ? "w-7 text-xs" : "w-9 text-xs sm:text-sm"
        }`}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label={`Increase quantity of ${itemName}`}
        className={`flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isSm ? "w-7 h-7" : "w-8 h-8"
        }`}
      >
        <Plus className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      </button>
    </div>
  );
};

export default CartQuantitySelector;
