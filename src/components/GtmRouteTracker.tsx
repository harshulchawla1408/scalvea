/**
 * GtmRouteTracker.tsx
 *
 * Fires a virtual page_view event to window.dataLayer on each client-side SPA route change.
 *
 * The very first page view is already captured by the GTM container initialization
 * script in index.html (gtm.js), so we skip it on initial mount to avoid duplicate hits.
 *
 * Placement: inside <BrowserRouter> in App.tsx, alongside MetaPixelRouteTracker.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackGtmPageView } from "@/lib/gtm";

const GtmRouteTracker = () => {
  const location = useLocation();
  // Skip the first mount — index.html GTM snippet handles the initial page view
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Fire page_view on every subsequent route change
    trackGtmPageView({
      page_path: location.pathname + location.search,
      page_title: typeof document !== "undefined" ? document.title : "",
      page_location: typeof window !== "undefined" ? window.location.href : "",
    });
  }, [location.pathname, location.search]);

  return null;
};

export default GtmRouteTracker;
