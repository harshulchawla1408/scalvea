import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingBag, User, Heart, Menu } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import logo1 from "@/assets/logo1.png";

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      delay: 0.15,
      ease: "easeOut",
    },
  },
};

const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.25,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const iconsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.45,
    },
  },
};

const iconItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
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
      <motion.header
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        className={`z-50 transition-all duration-300 ${
          isHome ? "fixed top-0 left-0 right-0" : "sticky top-0"
        } bg-white w-full ${
          isScrolled ? "shadow-sm border-b border-[#F3F3F3]" : "border-b border-transparent shadow-none"
        }`}
      >
        <nav className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 h-[68px] lg:h-[80px] flex items-center justify-between relative">
          {/* Left: Logo */}
          <motion.div variants={logoVariants} className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logo1} 
                alt="Scalvea" 
                className="h-[52px] lg:h-[64px] w-auto object-contain transition-all duration-300" 
              />
            </Link>
          </motion.div>

          {/* Center: Navigation Menu */}
          <motion.div
            variants={navContainerVariants}
            className="hidden lg:flex items-center justify-center gap-8 xl:gap-10 absolute left-1/2 -translate-x-1/2"
          >
            {[
              { label: "Shop", path: "/shop" },
              { label: "About Us", path: "/about" },
              { label: "Blog", path: "/#" },
              { label: "Contact", path: "/contact" }
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div key={item.label} variants={navItemVariants}>
                  <Link
                    to={item.path}
                    className={`relative py-2 text-xs font-semibold tracking-[0.15em] uppercase text-[#111111] hover:text-black transition-colors duration-250
                      after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#111111] after:transition-all after:duration-250
                      ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"}
                    `}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right: Icons */}
          <motion.div 
            variants={iconsContainerVariants} 
            className="flex items-center gap-3 sm:gap-4 lg:gap-5"
          >
            {/* Country Selector */}
            <motion.div variants={iconItemVariants} className="relative">
              <button 
                onClick={() => setIsCountryOpen(!isCountryOpen)} 
                className="hover:opacity-60 transition-all flex items-center gap-1 sm:gap-1.5 border border-neutral-250 px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-[10px] tracking-[0.08em] uppercase font-light text-[#111111] bg-white"
                aria-label="Choose country"
              >
                <span>{country === "India" ? "🇮🇳 INR" : "🇦🇺 AUD"}</span>
                <span className="text-[7px] sm:text-[8px] opacity-60">▼</span>
              </button>
              {isCountryOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 shadow-lg z-[60] w-[200px] md:w-[220px] animate-fade-in text-neutral-800">
                  <button
                    onClick={() => { setCountry("India"); setIsCountryOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-[10px] tracking-[0.08em] uppercase hover:bg-neutral-50 transition-colors duration-200 whitespace-nowrap ${country === "India" ? "bg-neutral-50 font-semibold text-black" : "text-neutral-600 font-light"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🇮🇳</span>
                      <span className="text-neutral-800 font-medium">India</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-[9px]">₹ INR</span>
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsCountryOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 text-[10px] tracking-[0.08em] uppercase hover:bg-neutral-50 transition-colors duration-200 whitespace-nowrap ${country === "Australia" ? "bg-neutral-50 font-semibold text-black" : "text-neutral-600 font-light"}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span>🇦🇺</span>
                      <span className="text-neutral-800 font-medium">Australia</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-[9px]">A$ AUD</span>
                  </button>
                </div>
              )}
            </motion.div>

            {/* Search */}
            <motion.button 
              variants={iconItemVariants}
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
              className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-1 flex items-center justify-center" 
              aria-label="Search"
            >
              <Search className="size-[22px]" />
            </motion.button>

            {/* Account (Desktop Only) */}
            <motion.div variants={iconItemVariants} className="hidden md:block">
              <Link 
                to="/account" 
                className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-1 flex items-center justify-center" 
                aria-label="Account"
              >
                <User className="size-[22px]" />
              </Link>
            </motion.div>

            {/* Wishlist (Desktop Only) */}
            <motion.div variants={iconItemVariants} className="hidden md:block">
              <Link 
                to="/wishlist" 
                className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-1 flex items-center justify-center relative" 
                aria-label="Wishlist"
              >
                <Heart className="size-[22px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] font-mono w-4 h-4 flex items-center justify-center rounded-full font-bold scale-90 border border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            </motion.div>

            {/* Cart */}
            <motion.button 
              variants={iconItemVariants}
              onClick={() => setIsCartOpen(true)} 
              className="hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] relative p-1 flex items-center justify-center" 
              aria-label="Cart"
            >
              <ShoppingBag className="size-[22px]" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[8px] font-mono w-4 h-4 flex items-center justify-center rounded-full font-bold scale-90 border border-white">
                  {itemCount}
                </span>
              )}
            </motion.button>

            {/* Hamburger menu (Mobile Only) */}
            <motion.button 
              variants={iconItemVariants}
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden hover:scale-105 hover:opacity-70 transition-all duration-200 text-[#111111] p-1 flex items-center justify-center" 
              aria-label="Open menu"
            >
              <Menu className="size-[22px]" />
            </motion.button>
          </motion.div>
        </nav>

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
            {/* Mobile Drawer Header */}
            <div className="flex items-center justify-between px-6 h-[64px] border-b border-neutral-100 relative">
              <img 
                src={logo1} 
                alt="Scalvea" 
                className="h-[40px] w-auto object-contain" 
              />
            </div>

            {/* Mobile Drawer Content */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                {/* Search Bar in Mobile Menu */}
                <div className="px-6 pt-6">
                  <form onSubmit={handleSearch} className="relative flex items-center border border-neutral-200 px-3 py-2 bg-neutral-50/50">
                    <Search className="size-[16px] text-neutral-400 mr-2" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..." 
                      className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400 text-neutral-800" 
                    />
                  </form>
                </div>

                {/* Primary Menu Items */}
                <div className="flex flex-col px-6 py-6 space-y-4">
                  {[
                    { label: "Shop", path: "/shop" },
                    { label: "About Us", path: "/about" },
                    { label: "Blog", path: "/#" },
                    { label: "Contact", path: "/contact" }
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base font-light tracking-[0.2em] uppercase py-2 border-b border-neutral-100 text-[#111111] transition-all hover:pl-2"
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
                    className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-neutral-600 hover:text-black transition-colors"
                  >
                    <User className="size-[18px]" />
                    <span>My Account</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-neutral-600 hover:text-black transition-colors"
                  >
                    <Heart className="size-[18px]" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </Link>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setIsCartOpen(true); }}
                    className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-neutral-600 hover:text-black transition-colors text-left"
                  >
                    <ShoppingBag className="size-[18px]" />
                    <span>Shopping Cart ({itemCount})</span>
                  </button>
                </div>
              </div>

              {/* Country & Currency Selectors at bottom */}
              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-3 font-semibold">Select Region & Currency</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setCountry("India"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${
                      country === "India" 
                        ? "border-[#111111] bg-black text-white font-medium" 
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    🇮🇳 INR (₹)
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${
                      country === "Australia" 
                        ? "border-[#111111] bg-black text-white font-medium" 
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400 bg-white"
                    }`}
                  >
                    🇦🇺 AUD (A$)
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.header>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
