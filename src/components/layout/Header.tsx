import { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingBag, User, Heart, Menu, Copy, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import { logo1Set } from "@/assets/generated";
import ShippingAnnouncementBar from "@/components/layout/ShippingAnnouncementBar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const CartDrawer = lazy(() => import("@/components/cart/CartDrawer"));

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { country, setCountry } = useCountry();

  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header
        className={`z-50 transition-all duration-300 sticky top-0 bg-white w-full ${
          isScrolled ? "shadow-sm border-b border-[#F3F3F3]" : "border-b border-transparent shadow-none"
        }`}
      >
        <nav className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 h-[62px] lg:h-[74px] flex items-center justify-between relative">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logo1Set.src} 
                srcSet={logo1Set.srcSet}
                sizes={logo1Set.sizes}
                alt="Scalvea" 
                width="156"
                height="46"
                fetchpriority="high"
                decoding="sync"
                className="h-[36px] lg:h-[46px] w-auto object-contain transition-all duration-300" 
              />
            </Link>
          </div>

          {/* Center: Navigation Menu */}
          <div className="hidden lg:flex items-center justify-center gap-8 xl:gap-10 absolute left-1/2 -translate-x-1/2">
            {[
              { label: "Shop", path: "/shop" },
              { label: "About Us", path: "/about" },
              { label: "Blog", path: "/blogs" },
              { label: "Contact", path: "/contact" }
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.label}>
                  <Link
                    to={item.path}
                    className={`relative py-2 text-[15px] font-semibold tracking-[0.12em] uppercase text-[#111111] hover:text-black transition-colors duration-250
                      after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-[#111111] after:transition-all after:duration-250
                      ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}
                    `}
                  >
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
            {/* Country Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsCountryOpen(!isCountryOpen)} 
                className="hover:opacity-60 transition-all flex items-center gap-1.5 border border-neutral-250 px-2 sm:px-3 py-1.5 text-xs tracking-[0.06em] uppercase font-medium text-[#111111] bg-white"
                aria-label="Choose country"
              >
                <span className="flex items-center gap-1.5">
                  <img src={country === "India" ? "/flags/in.png" : "/flags/au.png"} alt={country} width="16" height="12" className="w-4 h-auto rounded-[1px] shadow-[0_0_2px_rgba(0,0,0,0.1)]" />
                  <span>{country === "India" ? "INR" : "AUD"}</span>
                </span>
                <span className="text-[9px] opacity-60">▼</span>
              </button>
              {isCountryOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 shadow-lg z-[60] w-[210px] md:w-[230px] animate-fade-in text-neutral-800">
                  <button
                    onClick={() => { setCountry("India"); setIsCountryOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-xs tracking-[0.06em] uppercase hover:bg-neutral-50 transition-colors duration-200 whitespace-nowrap ${country === "India" ? "bg-neutral-50 font-semibold text-black" : "text-neutral-600 font-medium"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <img src="/flags/in.png" alt="India" width="16" height="12" className="w-4 h-auto rounded-sm shadow-sm" />
                      <span className="text-neutral-800 font-medium">India</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">₹ INR</span>
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsCountryOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-xs tracking-[0.06em] uppercase hover:bg-neutral-50 transition-colors duration-200 whitespace-nowrap ${country === "Australia" ? "bg-neutral-50 font-semibold text-black" : "text-neutral-600 font-medium"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <img src="/flags/au.png" alt="Australia" width="16" height="12" className="w-4 h-auto rounded-sm shadow-sm" />
                      <span className="text-neutral-800 font-medium">Australia</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">A$ AUD</span>
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
              className="flex hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-2 min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] items-center justify-center" 
              aria-label="Search"
            >
              <Search className="size-[22px]" />
            </button>

            {/* Account (Desktop/Laptop Only) */}
            <div className="hidden lg:block">
              <Link 
                to="/account" 
                className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-2 min-w-[48px] min-h-[48px] flex items-center justify-center" 
                aria-label="Account"
              >
                <User className="size-[22px]" />
              </Link>
            </div>

            {/* Wishlist (Desktop/Laptop Only) */}
            <div className="hidden lg:block">
              <Link 
                to="/wishlist" 
                className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-2 min-w-[48px] min-h-[48px] flex items-center justify-center relative" 
                aria-label="Wishlist"
              >
                <Heart className="size-[22px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] font-mono w-4 h-4 flex items-center justify-center rounded-full font-semibold scale-90 border border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Cart (Desktop/Laptop Only) */}
            <div className="hidden lg:block">
              <Link 
                to="/cart"
                onMouseEnter={() => import("@/components/cart/CartDrawer")}
                onTouchStart={() => import("@/components/cart/CartDrawer")}
                className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] relative p-2 min-w-[48px] min-h-[48px] flex items-center justify-center" 
                aria-label={`Shopping Bag (${itemCount} items)`}
              >
                <ShoppingBag className="size-[22px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] font-mono w-4 h-4 flex items-center justify-center rounded-full font-semibold scale-90 border border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Hamburger menu (Mobile Only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" 
              aria-label="Open menu"
            >
              <Menu className="size-[22px]" />
            </button>
          </div>
        </nav>

        {/* HIGHLIGHTED SHIPPING BANNER */}
        <ShippingAnnouncementBar />

        {/* Search bar drawer */}
        {isSearchOpen && (
          <div className="border-t border-[#F3F3F3] px-10 md:px-14 lg:px-16 py-4 animate-fade-in text-foreground bg-white shadow-sm">
            <form onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="flex items-center border-b border-foreground">
                <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search products..." 
                  className="w-full py-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground" 
                  autoFocus 
                />
              </div>
            </form>
          </div>
        )}

        {/* Full-Screen Mobile menu sheet drawer */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent 
            side="right" 
            className="w-full h-screen p-0 flex flex-col bg-white border-none z-[100]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Mobile navigation menu for Scalvea store</SheetDescription>
            </SheetHeader>
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between px-6 h-[64px] border-b border-neutral-100 relative">
              <img 
                src={logo1Set.src} 
                srcSet={logo1Set.srcSet}
                sizes={logo1Set.sizes}
                alt="Scalvea" 
                width="130"
                height="38"
                loading="lazy"
                decoding="async"
                className="h-[40px] w-auto object-contain" 
              />
            </div>

            {/* Mobile Drawer Content */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Search Bar in Mobile Menu */}
                <div className="px-6 pt-6">
                  <form onSubmit={handleSearch} className="relative flex items-center border border-neutral-200 px-3 py-2 bg-neutral-50/50">
                    <Search className="size-[16px] text-neutral-500 mr-2" />
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Search products..." 
                      className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500 text-neutral-800" 
                    />
                  </form>
                </div>

                {/* Primary Menu Items */}
                <div className="flex flex-col px-6 py-6 space-y-4">
                  {[
                    { label: "Shop", path: "/shop" },
                    { label: "About Us", path: "/about" },
                    { label: "Blog", path: "/blogs" },
                    { label: "Contact", path: "/contact" }
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-lg font-normal tracking-[0.15em] uppercase py-2.5 border-b border-neutral-100 text-[#111111] transition-all hover:pl-2"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Secondary Drawer Links */}
                <div className="flex flex-col px-6 space-y-5 pt-4 border-t border-neutral-100/50">
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-neutral-700 hover:text-black transition-colors"
                  >
                    <User className="size-[20px]" />
                    <span>My Account</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-neutral-700 hover:text-black transition-colors"
                  >
                    <Heart className="size-[20px]" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-sm font-medium tracking-[0.1em] uppercase text-neutral-700 hover:text-black transition-colors text-left"
                    aria-label={`Shopping Bag (${itemCount} items)`}
                  >
                    <ShoppingBag className="size-[20px]" />
                    <span>Shopping Bag ({itemCount})</span>
                  </Link>
                </div>
              </div>

              {/* Country & Currency Selectors at bottom */}
              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
                <p className="text-xs tracking-[0.15em] uppercase text-neutral-500 mb-3 font-semibold">Select Region & Currency</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setCountry("India"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border text-xs tracking-[0.08em] uppercase transition-all duration-200 ${
                      country === "India" 
                        ? "border-[#111111] bg-black text-white font-medium" 
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    🇮🇳 INR (₹)
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border text-xs tracking-[0.08em] uppercase transition-all duration-200 ${
                      country === "Australia" 
                        ? "border-[#111111] bg-black text-white font-medium" 
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    🇦🇺 AUD (A$)
                  </button>
              </div>
            </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <Suspense fallback={null}>
        {isCartOpen && <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />}
      </Suspense>
    </>
  );
};

export default Header;
