import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import MetaPixelRouteTracker from "./components/MetaPixelRouteTracker";
import ChatbaseController from "./components/ChatbaseController";
import PageTransition from "./components/layout/PageTransition";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { CountryProvider } from "./contexts/CountryContext";
import AppRoutes from "./AppRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CountryProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <MetaPixelRouteTracker />
              <ChatbaseController />
              <PageTransition />
              <AppRoutes />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </CountryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
