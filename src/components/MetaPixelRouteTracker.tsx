/**
 * MetaPixelRouteTracker.tsx
 *
 * Fires a Meta Pixel PageView event on each SPA route change.
 *
 * The very first PageView is already fired by the inline script in index.html,
 * so we skip it on the initial mount to avoid a duplicate.
 *
 * Placement: inside <BrowserRouter> in App.tsx, alongside <ScrollToTop />.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/metaPixel";

const MetaPixelRouteTracker = () => {
  const location = useLocation();
  // Skip the first mount — index.html already fired PageView for the initial load
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Fire PageView on every subsequent route change
    trackPageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelRouteTracker;
