/**
 * entry-server.tsx
 * Server-side render entry used only by scripts/vite-prerender.mjs at build time.
 * NOT bundled into the client.
 *
 * IMPORTANT: All page components are imported statically here (not lazily).
 * React's renderToString can't resolve lazy()/Suspense with dynamic imports —
 * it renders the Suspense fallback instead of the actual component. Static
 * imports ensure the full page tree renders in a single synchronous pass.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CountryProvider } from "./contexts/CountryContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";

// Static imports — all pages are eagerly loaded for SSR
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import PaymentPolicy from "./pages/PaymentPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import VideoList from "./pages/VideoList";
import VideoWatch from "./pages/VideoWatch";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./contexts/AuthContext";

// Static route tree — no Suspense, no lazy()
const ServerRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/product/:productId" element={<ProductDetail />} />
    <Route path="/products" element={<Navigate replace to="/shop" />} />
    <Route path="/products/hair-growth-serum" element={<Navigate replace to="/product/follicle-8-hair-growth-serum" />} />
    <Route path="/products/hair-growth-shampoo" element={<Navigate replace to="/shop" />} />
    <Route path="/products/:productId" element={<Navigate replace to="/product/:productId" />} />
    <Route path="/about" element={<About />} />
    <Route path="/blogs" element={<BlogList />} />
    <Route path="/blog" element={<Navigate replace to="/blogs" />} />
    <Route path="/blogs/:slug" element={<BlogDetail />} />
    <Route path="/blog/:slug" element={<BlogDetail />} />
    <Route path="/blogs/best-ingredients-for-hair-regrowth" element={<Navigate replace to="/blogs/best-ingredients-for-hair-regrowth-according-to-research" />} />
    <Route path="/blogs/dht-and-hair-loss" element={<Navigate replace to="/blogs/dht-and-hair-loss-explained-simply" />} />
    <Route path="/blogs/hair-growth-routine" element={<Navigate replace to="/blogs/hair-growth-routine-for-thinning-hair" />} />
    <Route path="/blogs/postpartum-hair-loss" element={<Navigate replace to="/blogs/postpartum-hair-loss-whats-normal-and-whats-not" />} />
    <Route path="/blogs/stress-hair-loss" element={<Navigate replace to="/blogs/how-stress-actually-affects-your-hair" />} />
    <Route path="/blogs/why-is-my-hair-thinning" element={<Navigate replace to="/blogs/why-is-my-hair-thinning-7-real-causes" />} />
    <Route path="/videos" element={<VideoList />} />
    <Route path="/videos/:slug" element={<VideoWatch />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/faqs" element={<Navigate replace to="/faq" />} />
    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    <Route path="/terms-of-service" element={<TermsOfService />} />
    <Route path="/terms-conditions" element={<Navigate replace to="/terms-of-service" />} />
    <Route path="/returns-policy" element={<ReturnsPolicy />} />
    <Route path="/return-refund-policy" element={<Navigate replace to="/returns-policy" />} />
    <Route path="/shipping-policy" element={<ShippingPolicy />} />
    <Route path="/cancellation-policy" element={<CancellationPolicy />} />
    <Route path="/payment-policy" element={<PaymentPolicy />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export function render(url: string): string {
  // Fresh QueryClient per render to avoid state leaking between routes
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        // Don't fetch from Supabase during SSR — render the loading/empty state
        enabled: false,
      },
    },
  });

  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CountryProvider>
          <CartProvider>
            <WishlistProvider>
              <AuthProvider>
                <StaticRouter location={url}>
                  <ServerRoutes />
                </StaticRouter>
              </AuthProvider>
            </WishlistProvider>
          </CartProvider>
        </CountryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );

  return html;
}
