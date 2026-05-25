import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import CartDrawer from "@/components/cart/CartDrawer";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount, isCartOpen, setIsCartOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { country, setCountry, settings } = useCountry();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
      <header className={`z-50 transition-all duration-500 ${
        isHome ? "fixed top-0 left-0 right-0" : "sticky top-0"
      } ${
        isHome && !isScrolled
          ? "bg-transparent border-b border-white/10 text-white"
          : "bg-background/80 backdrop-blur-md border-b border-border text-foreground shadow-sm"
      }`}>
        {/* Announcement bar */}
        <div className={`text-center py-2 px-4 transition-all duration-500 ${
          isHome && !isScrolled 
            ? "bg-black/10 text-white/80 border-b border-white/5" 
            : "bg-foreground text-primary-foreground"
        }`}>
          <p className="text-[10px] tracking-[0.15em] uppercase font-light">
            Free shipping on orders over {settings?.currency_symbol}{settings?.free_shipping_above} {settings?.currency}
          </p>
        </div>

        <nav className="flex items-center justify-between px-6 lg:px-12 py-4">
          {/* Left */}
          <div className="flex items-center gap-6">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden" aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/shop" className="text-xs tracking-[0.12em] uppercase hover:opacity-60 transition-opacity">Shop</Link>
              <Link to="/about" className="text-xs tracking-[0.12em] uppercase hover:opacity-60 transition-opacity">About</Link>
              <Link to="/contact" className="text-xs tracking-[0.12em] uppercase hover:opacity-60 transition-opacity">Contact</Link>
            </div>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl md:text-2xl tracking-[0.2em] uppercase font-normal">Scalvea</h1>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-4">
            {/* Country selector */}
            <div className="relative">
              <button 
                onClick={() => setIsCountryOpen(!isCountryOpen)} 
                className={`hover:opacity-60 transition-all flex items-center gap-1.5 border px-2.5 py-1 text-[10px] tracking-[0.08em] uppercase font-light ${
                  isHome && !isScrolled ? "border-white/20" : "border-border"
                }`} 
                aria-label="Choose country"
              >
                <span>{country === "India" ? "🇮🇳 INR" : "🇦🇺 AUD"}</span>
                <span className="text-[8px] opacity-60">▼</span>
              </button>
              {isCountryOpen && (
                <div className="absolute right-0 top-full mt-2 bg-background border border-border shadow-lg z-50 min-w-[160px] animate-fade-in text-foreground">
                  <button
                    onClick={() => { setCountry("India"); setIsCountryOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-xs tracking-[0.08em] uppercase hover:bg-secondary transition-colors flex items-center justify-between ${country === "India" ? "bg-secondary font-medium" : ""}`}
                  >
                    <span>🇮🇳 India</span>
                    <span className="text-muted-foreground font-mono text-[10px]">₹ INR</span>
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsCountryOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-xs tracking-[0.08em] uppercase hover:bg-secondary transition-colors flex items-center justify-between ${country === "Australia" ? "bg-secondary font-medium" : ""}`}
                  >
                    <span>🇦🇺 Australia</span>
                    <span className="text-muted-foreground font-mono text-[10px]">A$ AUD</span>
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="hover:opacity-60 transition-opacity" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>
            <Link to="/account" className="hover:opacity-60 transition-opacity hidden sm:block" aria-label="Account">
              <User className="h-4 w-4" />
            </Link>
            <Link to="/wishlist" className="hover:opacity-60 transition-opacity relative hidden sm:block" aria-label="Wishlist">
              <Heart className="h-4 w-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] w-3.5 h-3.5 flex items-center justify-center font-mono rounded-none">{wishlistCount}</span>
              )}
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="hover:opacity-60 transition-opacity relative" aria-label="Cart">
              <ShoppingBag className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[9px] w-3.5 h-3.5 flex items-center justify-center font-mono rounded-none">{itemCount}</span>
              )}
            </button>
          </div>
        </nav>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="border-t border-border px-6 lg:px-12 py-4 animate-fade-in text-foreground bg-background">
            <form onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="flex items-center border-b border-foreground">
                <Search className="h-4 w-4 mr-3 text-muted-foreground" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="w-full py-2 bg-transparent text-sm outline-none placeholder:text-muted-foreground" autoFocus />
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background animate-fade-in text-foreground">
            <div className="flex flex-col px-6 py-6 space-y-4">
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="text-sm tracking-[0.12em] uppercase py-2">Shop</Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-sm tracking-[0.12em] uppercase py-2">About</Link>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-sm tracking-[0.12em] uppercase py-2">Contact</Link>
              <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-sm tracking-[0.12em] uppercase py-2">Account</Link>
              <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-sm tracking-[0.12em] uppercase py-2">Wishlist</Link>
              <div className="border-t border-border pt-4">
                <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-3">Country / Currency</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCountry("India"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border text-xs tracking-[0.08em] uppercase ${country === "India" ? "border-foreground bg-secondary" : "border-border text-muted-foreground"}`}
                  >
                    🇮🇳 INR
                  </button>
                  <button
                    onClick={() => { setCountry("Australia"); setIsMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 border text-xs tracking-[0.08em] uppercase ${country === "Australia" ? "border-foreground bg-secondary" : "border-border text-muted-foreground"}`}
                  >
                    🇦🇺 AUD
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
