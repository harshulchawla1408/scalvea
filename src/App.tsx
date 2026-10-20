import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import BuyingFlowRedirector from "./components/BuyingFlowRedirector";
import MetaPixelRouteTracker from "./components/MetaPixelRouteTracker";
import GtmRouteTracker from "./components/GtmRouteTracker";
import ChatbaseController from "./components/ChatbaseController";
import PageTransition from "./components/layout/PageTransition";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { CountryProvider } from "./contexts/CountryContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./AppRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CountryProvider>
        <CartProvider>
          <WishlistProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <BuyingFlowRedirector />
                <MetaPixelRouteTracker />
                <GtmRouteTracker />
                <ChatbaseController />
                <PageTransition />
                <AppRoutes />
              </BrowserRouter>
            </AuthProvider>
          </WishlistProvider>
        </CartProvider>
      </CountryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
