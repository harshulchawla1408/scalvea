import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import type { DBProduct } from "@/hooks/useProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ProductCardProps {
  product: DBProduct | {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    images: string[];
    badge?: string;
    price_aud?: number;
    price_inr?: number;
    price_usd?: number;
    compare_at_price_aud?: number;
    compare_at_price_inr?: number;
    compare_at_price_usd?: number;
    rating?: number;
    reviews_count?: number;
    inventory?: number;
    colors?: string[];
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();

  const [mobileImageIndex, setMobileImageIndex] = useState(0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const priceAud = "price_aud" in product ? product.price_aud : ("price" in product ? (product as any).price : 0);
  const priceInr = "price_inr" in product ? product.price_inr : 0;
  const priceUsd = "price_usd" in product ? product.price_usd : 0;

  const mrpAud = "mrp_aud" in product && (product as any).mrp_aud ? (product as any).mrp_aud : priceAud;
  const mrpInr = "mrp_inr" in product && (product as any).mrp_inr ? (product as any).mrp_inr : priceInr;

  const { selectedCountry } = useCountry();
  const currentSellingPrice = selectedCountry === "india" ? priceInr : priceAud;
  const currentMrpPrice = selectedCountry === "india" ? mrpInr : mrpAud;
  const hasDiscount = currentMrpPrice > currentSellingPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price_aud: priceAud,
      price_inr: priceInr,
      price_usd: priceUsd,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  const isFavorited = isInWishlist(product.id);
  const hasSecondImage = product.images && product.images.length > 1;

  // Swipe support for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 50 && hasSecondImage) {
      setMobileImageIndex((prev) => (prev === 0 ? 1 : 0));
    }
    touchStartX.current = null;
  };

  return (
    <>
      <div 
        className="group relative bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.05)] transition-all duration-300 w-full h-full flex flex-col justify-between overflow-hidden"
      >
        <Link
          to={`/product/${product.slug}`}
          className="block flex-1 flex flex-col justify-between"
        >
          {/* Image Bay */}
          <div 
            className="relative bg-[#FAF9F7] aspect-[4/5] overflow-hidden rounded-xl flex items-center justify-center p-3 sm:p-4 md:p-5 cursor-pointer mb-2.5 sm:mb-3.5"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
              if (hasSecondImage && (window.innerWidth < 1024 || window.matchMedia("(pointer: coarse)").matches)) {
                e.preventDefault();
                e.stopPropagation();
                setMobileImageIndex((prev) => (prev === 0 ? 1 : 0));
              }
            }}
          >
            {/* Out of stock label overlay */}
            {product.inventory === 0 && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-20">
                <span className="text-[9px] tracking-[0.22em] uppercase bg-white border border-neutral-200 text-neutral-800 px-3 py-1 font-mono font-medium rounded shadow-2xs">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Product Images (Desktop & Mobile) */}
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Primary Image */}
              <img
                src={product.images[0]}
                alt={product.name}
                width="600"
                height="600"
                className={`w-full h-full object-contain object-center transition-all duration-500 absolute inset-0 transform group-hover:scale-105 ${
                  mobileImageIndex === 0
                    ? (hasSecondImage ? "opacity-100 group-hover:opacity-0" : "opacity-100")
                    : "opacity-0"
                }`}
                loading="lazy"
              />
              
              {/* Secondary Image */}
              {hasSecondImage && (
                <img
                  src={product.images[1]}
                  alt={`${product.name} alternate`}
                  width="600"
                  height="600"
                  className={`w-full h-full object-contain object-center transition-all duration-500 absolute inset-0 transform group-hover:scale-105 ${
                    mobileImageIndex === 1
                      ? "opacity-100 group-hover:opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  loading="lazy"
                />
              )}
            </div>

            {/* Mobile Image Indicator Badge */}
            {hasSecondImage && (
              <div className="absolute bottom-2 right-2 z-10 lg:hidden">
                <span className="text-[7.5px] sm:text-[8px] font-mono tracking-wider bg-black/60 backdrop-blur-xs text-white px-1.5 py-0.5 rounded">
                  {mobileImageIndex === 0 ? "1/2" : "2/2"}
                </span>
              </div>
            )}
            
            {/* Badges (LATEST / BEST SELLER) */}
            {product.badge && (
              <span className={`absolute top-2.5 left-2.5 text-[8px] sm:text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded font-medium z-10 shadow-2xs ${
                product.badge.toLowerCase() === 'sale' 
                  ? "bg-red-600 text-white" 
                  : product.badge.toLowerCase() === 'new' || product.badge.toLowerCase() === 'latest'
                  ? "bg-black text-white"
                  : "bg-black text-white"
              }`}>
                {product.badge}
              </span>
            )}

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs border border-neutral-200/70 flex items-center justify-center transition-all shadow-2xs ${
                isFavorited ? "text-black" : "text-neutral-500 hover:text-black"
              }`}
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Info Details */}
          <div className="space-y-1.5 flex-1 flex flex-col justify-between min-w-0 px-0.5">
            <div className="space-y-1">
              <span className="text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-neutral-500 font-mono font-medium block truncate">
                {"category" in product ? product.category : "SERUMS"}
              </span>
              <h3 className="text-xs sm:text-sm md:text-[15px] font-normal text-neutral-900 group-hover:text-black transition-colors font-heading leading-snug line-clamp-2 min-h-[2.1rem] sm:min-h-[2.5rem]">
                {product.name}
              </h3>
              
              {/* Ratings if available */}
              {product.rating !== undefined && (
                <div className="flex items-center gap-1 pt-0.5">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-2.5 w-2.5 ${i < Math.round(product.rating || 0) ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </div>
                  {product.reviews_count !== undefined && (
                    <span className="text-[9px] text-neutral-500">({product.reviews_count})</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="pt-1.5">
              {/* Price Component with MRP Support */}
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                {hasDiscount && (
                  <span className="font-body font-normal text-[10.5px] sm:text-xs text-neutral-500 line-through">
                    {formatPrice(mrpAud, mrpInr)}
                  </span>
                )}
                <span className="font-body font-bold text-xs sm:text-sm md:text-[15px] text-neutral-900">
                  {formatPrice(priceAud, priceInr)}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Add to Bag Button (Visible on both Mobile & Laptop) */}
        <div className="pt-2.5 sm:pt-3 w-full">
          <button
            onClick={handleAddToCart}
            disabled={product.inventory === 0}
            className={`w-full text-white bg-black hover:bg-neutral-900 active:scale-[0.98] transition-all text-[11px] sm:text-xs tracking-[0.12em] uppercase h-9 sm:h-10 rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 font-medium shadow-2xs ${
              product.inventory === 0 ? "bg-neutral-300 cursor-not-allowed opacity-60" : "bg-black"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{product.inventory === 0 ? "Out of Stock" : "Add to Bag"}</span>
          </button>
        </div>
      </div>

      {/* Quick View Dialog (Minimal Premium design) */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-3xl bg-white border border-neutral-200 shadow-2xl p-0 rounded-none overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>Quick product overview</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image Container */}
            <div className="bg-[#fafafa] flex items-center justify-center p-8 aspect-square relative">
              <img
                src={product.images[0]}
                alt={product.name}
                className="max-h-[300px] object-contain"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 text-[8px] tracking-[0.2em] uppercase bg-black text-white px-2 py-0.5 font-medium">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Right: Info Panels */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-500 font-body font-medium block">
                  {"category" in product ? product.category : "Skincare"}
                </span>
                <h2 className="text-2xl font-normal font-heading leading-tight text-neutral-900">
                  {product.name}
                </h2>
                
                {product.rating !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.round(product.rating || 0) ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                    {product.reviews_count !== undefined && (
                      <span className="text-[10px] text-neutral-500 font-body">({product.reviews_count} Reviews)</span>
                    )}
                  </div>
                )}

                <div className="flex items-baseline gap-2 flex-wrap">
                  {hasDiscount && (
                    <span className="font-body font-normal text-sm text-neutral-500 line-through">
                      {formatPrice(mrpAud, mrpInr)}
                    </span>
                  )}
                  <span className="font-body font-semibold text-lg text-neutral-900">
                    {formatPrice(priceAud, priceInr)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed font-body font-light pt-2">
                  Experience scientific luxury formulation targeting active nourishment and recovery. Clean ingredients designed to support healthier-looking skin and hair.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={(e) => {
                    handleAddToCart(e);
                    setIsQuickViewOpen(false);
                  }}
                  disabled={product.inventory === 0}
                  className="w-full bg-black text-white hover:bg-neutral-950 transition-colors text-sm tracking-[0.12em] uppercase h-12 flex items-center justify-center gap-2.5 font-semibold"
                >
                  <ShoppingBag className="h-4.5 w-4.5" />
                  {product.inventory === 0 ? "Out of Stock" : "Add to Bag"}
                </button>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={() => setIsQuickViewOpen(false)}
                  className="block text-center text-neutral-600 hover:text-black transition-colors text-xs sm:text-[13px] tracking-[0.1em] uppercase font-semibold pt-2 underline underline-offset-4"
                >
                  View Details Page
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
