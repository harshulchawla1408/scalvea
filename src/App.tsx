import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/layout/PageTransition";
import BottomNav from "./components/layout/BottomNav";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { CountryProvider } from "./contexts/CountryContext";
import { PageLoader } from "./components/ui/page-loader";
import FloatingWhatsApp from "./components/FloatingWhatsApp";

const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderFailed = lazy(() => import("./pages/OrderFailed"));
const ShiprocketCallback = lazy(() => import("./pages/ShiprocketCallback"));
const About = lazy(() => import("./pages/About"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Admin = lazy(() => import("./pages/Admin"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const ReturnsPolicy = lazy(() => import("./pages/ReturnsPolicy"));
const PaymentPolicy = lazy(() => import("./pages/PaymentPolicy"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <PageTransition />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:productId" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/order-failed" element={<OrderFailed />} />
                  <Route path="/shiprocket-callback" element={<ShiprocketCallback />} />
                  <Route path="/about" element={<About />} />
                  {/* Blog: /blogs is canonical, /blog redirects */}
                  <Route path="/blogs" element={<BlogList />} />
                  <Route path="/blog" element={<Navigate replace to="/blogs" />} />
                  <Route path="/blogs/:slug" element={<BlogDetail />} />
                  <Route path="/blog/:slug" element={<BlogDetail />} />
                  <Route path="/contact" element={<Contact />} />
                  {/* /support redirects to /contact */}
                  <Route path="/support" element={<Navigate replace to="/contact" />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/payment-policy" element={<PaymentPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  {/* Terms: /terms-of-service is canonical */}
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/terms-conditions" element={<Navigate replace to="/terms-of-service" />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  {/* Returns: /returns-policy is canonical */}
                  <Route path="/returns-policy" element={<ReturnsPolicy />} />
                  <Route path="/return-refund-policy" element={<Navigate replace to="/returns-policy" />} />
                  <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                  {/* /shipping-returns redirects to /shipping-policy */}
                  <Route path="/shipping-returns" element={<Navigate replace to="/shipping-policy" />} />
                  {/* /faq is canonical, /faqs redirects */}
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/faqs" element={<Navigate replace to="/faq" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <FloatingWhatsApp />
              <BottomNav />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </CountryProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
