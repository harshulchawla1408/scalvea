import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";

/**
 * BuyingFlowRedirector ensures that Australian users in a buying flow
 * (e.g. clicked Buy Now, went from cart to checkout, or logged in via OAuth / email)
 * are always redirected to /checkout instead of being dropped on the home page (/).
 */
export const BuyingFlowRedirector = () => {
  const { user, loading: authLoading } = useAuth();
  const { items } = useCart();
  const { selectedCountry, market, currency } = useCountry();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authLoading || !user) return;

    // Only intercept if user landed on "/" or "/auth"
    const isAtLandingOrAuth = location.pathname === "/" || location.pathname === "/auth";
    if (!isAtLandingOrAuth) return;

    // Do not interfere if user is in password recovery flow
    if (location.pathname === "/auth" && location.search.includes("type=recovery")) return;

    const pendingReturnTo =
      sessionStorage.getItem("scalvea_auth_return_to") ||
      localStorage.getItem("scalvea_auth_return_to");
    const isBuyingFlow =
      sessionStorage.getItem("scalvea_buying_flow") === "true" ||
      localStorage.getItem("scalvea_buying_flow") === "true";
    const isAustralia =
      selectedCountry === "australia" || market === "AU" || currency === "AUD";

    // If explicit returnTo is checkout OR (Australia user in buying flow / cart has items)
    const shouldGoToCheckout =
      pendingReturnTo === "/checkout" ||
      (isAustralia && (isBuyingFlow || items.length > 0) && (pendingReturnTo || isBuyingFlow));

    if (shouldGoToCheckout) {
      try {
        sessionStorage.removeItem("scalvea_auth_return_to");
        localStorage.removeItem("scalvea_auth_return_to");
        sessionStorage.removeItem("scalvea_buying_flow");
        localStorage.removeItem("scalvea_buying_flow");
      } catch (_) {}

      navigate("/checkout", { replace: true });
    }
  }, [
    user,
    authLoading,
    location.pathname,
    location.search,
    items.length,
    selectedCountry,
    market,
    currency,
    navigate,
  ]);

  return null;
};

export default BuyingFlowRedirector;
