import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CartCheckoutCTAProps {
  isIndia?: boolean;
  user?: any;
  onBeforeNavigate?: () => void;
  fullWidth?: boolean;
}

export const CartCheckoutCTA: React.FC<CartCheckoutCTAProps> = ({
  isIndia = false,
  user = null,
  onBeforeNavigate,
  fullWidth = true,
}) => {
  const checkoutHref = "/checkout";

  const handleCheckoutClick = () => {
    if (onBeforeNavigate) {
      onBeforeNavigate();
    }
    try {
      sessionStorage.setItem("scalvea_buying_flow", "true");
      localStorage.setItem("scalvea_buying_flow", "true");
      sessionStorage.setItem("scalvea_auth_return_to", "/checkout");
      localStorage.setItem("scalvea_auth_return_to", "/checkout");
    } catch (_) {}
  };

  return (
    <div className={`space-y-3 ${fullWidth ? "w-full" : ""}`}>
      <Button
        asChild
        className="w-full bg-black text-white hover:bg-neutral-800 text-xs sm:text-sm font-bold tracking-[0.14em] uppercase h-12 rounded-xl transition-all active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Link to={checkoutHref} onClick={handleCheckoutClick}>
          <Lock className="w-3.5 h-3.5 opacity-80" />
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>

      <Link
        to="/shop"
        onClick={onBeforeNavigate}
        className="block text-center text-xs font-semibold tracking-[0.12em] uppercase text-neutral-600 hover:text-black transition-colors py-1.5"
      >
        Continue Shopping
      </Link>
    </div>
  );
};

export default CartCheckoutCTA;
