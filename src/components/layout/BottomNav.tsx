import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, BookOpen, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const BottomNav = () => {
  const location = useLocation();
  const { itemCount, setIsCartOpen } = useCart();

  // Hide bottom nav on admin pages
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent page content from being obscured behind sticky bottom nav */}
      <div className="h-16 lg:hidden" aria-hidden="true" />

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-300">
        <div className="max-w-md mx-auto h-[60px] flex items-center justify-between px-1">
          {/* 1. Home */}
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center justify-center py-1 text-center transition-all duration-200 active:scale-95 ${
              location.pathname === "/" ? "text-black font-semibold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Home className={`h-[20px] w-[20px] transition-transform duration-200 ${location.pathname === "/" ? "scale-110 text-black stroke-[2.2]" : "stroke-[1.6]"}`} />
              {location.pathname === "/" && <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 font-body ${location.pathname === "/" ? "text-black font-medium" : "text-neutral-500 font-normal"}`}>
              Home
            </span>
          </Link>

          {/* 2. Products */}
          <Link
            to="/shop"
            className={`flex-1 flex flex-col items-center justify-center py-1 text-center transition-all duration-200 active:scale-95 ${
              location.pathname.startsWith("/shop") ? "text-black font-semibold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <LayoutGrid className={`h-[20px] w-[20px] transition-transform duration-200 ${location.pathname.startsWith("/shop") ? "scale-110 text-black stroke-[2.2]" : "stroke-[1.6]"}`} />
              {location.pathname.startsWith("/shop") && <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 font-body ${location.pathname.startsWith("/shop") ? "text-black font-medium" : "text-neutral-500 font-normal"}`}>
              Products
            </span>
          </Link>

          {/* 3. CART (Center Highlighted Icon) */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-1 text-center transition-all duration-200 active:scale-95 group"
            aria-label="Open Shopping Cart"
          >
            <div className="relative flex items-center justify-center -mt-2 bg-black text-white w-10 h-10 rounded-full shadow-md group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="h-5 w-5 stroke-[2]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[9px] font-mono w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-black">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-body font-medium text-black">
              Cart
            </span>
          </button>

          {/* 4. Blogs */}
          <Link
            to="/blogs"
            className={`flex-1 flex flex-col items-center justify-center py-1 text-center transition-all duration-200 active:scale-95 ${
              location.pathname.startsWith("/blog") ? "text-black font-semibold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <BookOpen className={`h-[20px] w-[20px] transition-transform duration-200 ${location.pathname.startsWith("/blog") ? "scale-110 text-black stroke-[2.2]" : "stroke-[1.6]"}`} />
              {location.pathname.startsWith("/blog") && <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 font-body ${location.pathname.startsWith("/blog") ? "text-black font-medium" : "text-neutral-500 font-normal"}`}>
              Blogs
            </span>
          </Link>

          {/* 5. Account */}
          <Link
            to="/account"
            className={`flex-1 flex flex-col items-center justify-center py-1 text-center transition-all duration-200 active:scale-95 ${
              location.pathname.startsWith("/account") || location.pathname.startsWith("/auth") ? "text-black font-semibold" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <User className={`h-[20px] w-[20px] transition-transform duration-200 ${location.pathname.startsWith("/account") || location.pathname.startsWith("/auth") ? "scale-110 text-black stroke-[2.2]" : "stroke-[1.6]"}`} />
              {(location.pathname.startsWith("/account") || location.pathname.startsWith("/auth")) && <span className="absolute -bottom-1.5 w-1.5 h-1.5 bg-black rounded-full" />}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 font-body ${location.pathname.startsWith("/account") || location.pathname.startsWith("/auth") ? "text-black font-medium" : "text-neutral-500 font-normal"}`}>
              Account
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
