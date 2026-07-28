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

  const comparePriceAud = "compare_at_price_aud" in product ? product.compare_at_price_aud : 0;
  const comparePriceInr = "compare_at_price_inr" in product ? product.compare_at_price_inr : 0;
  const comparePriceUsd = "compare_at_price_usd" in product ? product.compare_at_price_usd : 0;

  const hasDiscount = comparePriceAud > 0 && comparePriceAud > priceAud;
  const savePercentage = hasDiscount ? Math.round(((comparePriceAud - priceAud) / comparePriceAud) * 100) : 0;

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

  // Tap-to-toggle logic for touch devices
  const handleCardClick = (e: React.MouseEvent) => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && hasSecondImage) {
      if (mobileImageIndex === 0) {
        e.preventDefault();
        e.stopPropagation();
        setMobileImageIndex(1);
      }
    }
  };

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
      <Link 
        to={`/product/${product.slug}`} 
        onClick={handleCardClick}
        className="group block relative bg-background border border-border/40 hover:border-border transition-all duration-700 hover:shadow-2xl hover:shadow-neutral-200/40 hover:-translate-y-1.5 transform-gpu w-full h-full flex flex-col justify-between"
      >
        <div className="relative bg-[#fafafa] aspect-[3/4] overflow-hidden flex-shrink-0"
             onTouchStart={handleTouchStart}
             onTouchEnd={handleTouchEnd}
        >
          {/* Out of stock label overlay */}
          {product.inventory === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="text-[9px] tracking-[0.25em] uppercase bg-white border border-neutral-200 text-neutral-800 px-3 py-1 font-medium">
                Out of Stock
              </span>
            </div>
          )}

          {/* Product Images (Desktop & Mobile) */}
          <div className="w-full h-full relative">
            {/* Primary Image */}
            <img
              src={product.images[0]}
              alt={product.name}
              className={`w-full h-full object-contain p-6 object-center transition-all duration-300 absolute inset-0 ${
                hasSecondImage 
                  ? "opacity-100 group-hover:lg:opacity-0 lg:block hidden" 
                  : "opacity-100"
              }`}
              style={{
                opacity: window.matchMedia("(pointer: coarse)").matches 
                  ? (mobileImageIndex === 0 ? 1 : 0) 
                  : undefined
              }}
              loading="lazy"
            />
            
            {/* Secondary Image */}
            {hasSecondImage && (
              <img
                src={product.images[1]}
                alt={`${product.name} alternate`}
                className={`w-full h-full object-contain p-6 object-center transition-all duration-300 absolute inset-0 ${
                  window.matchMedia("(pointer: coarse)").matches 
                    ? (mobileImageIndex === 1 ? "opacity-100" : "opacity-0")
                    : "opacity-0 group-hover:lg:opacity-100"
                }`}
                loading="lazy"
              />
            )}
          </div>
          
          {/* Future Ready Badges */}
          {product.badge && (
            <span className={`absolute top-3 left-3 text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 font-medium z-10 ${
              product.badge.toLowerCase() === 'sale' 
                ? "bg-red-600 text-white" 
                : product.badge.toLowerCase() === 'new'
                ? "bg-emerald-600 text-white"
                : "bg-black text-white"
            }`}>
              {product.badge}
            </span>
          )}

          {/* Quick Actions (Desktop only - slides up) */}
          {product.inventory !== 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) bg-white/90 backdrop-blur-md border-t border-neutral-100 flex items-center justify-between gap-2 z-20 hidden lg:flex">
              <button
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setIsQuickViewOpen(true); 
                }}
                className="flex-1 bg-neutral-900 text-white hover:bg-black transition-colors text-[9px] tracking-[0.15em] uppercase h-9 flex items-center justify-center font-medium"
              >
                Quick View
              </button>
              <button
                onClick={handleAddToCart}
                className="w-9 h-9 border border-neutral-200 text-neutral-800 hover:border-black hover:text-black flex items-center justify-center bg-white transition-colors"
                aria-label="Add to cart"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`w-9 h-9 border flex items-center justify-center transition-colors bg-white ${
                  isFavorited ? "border-black text-black" : "border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* Info Details */}
        <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 font-body font-medium block">
              {"category" in product ? product.category : "Skincare"}
            </span>
            <h3 className="text-sm font-normal text-neutral-800 group-hover:text-black transition-colors font-heading leading-snug line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            
            {/* Future Ready Ratings */}
            {product.rating !== undefined && (
              <div className="flex items-center gap-1">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-2.5 w-2.5 ${i < Math.round(product.rating || 0) ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
                {product.reviews_count !== undefined && (
                  <span className="text-[9px] text-neutral-400">({product.reviews_count})</span>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-1.5 pt-1">
            {/* Price Component with Discount Support */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-body font-semibold text-xs md:text-sm text-neutral-900">
                {formatPrice(priceAud, priceInr, priceUsd)}
              </span>
              {hasDiscount && (
                <>
                  <span className="font-body font-normal text-[10px] md:text-xs text-neutral-400 line-through">
                    {formatPrice(comparePriceAud, comparePriceInr, comparePriceUsd)}
                  </span>
                  <span className="text-[8px] tracking-wider uppercase bg-red-50 text-red-650 px-1.5 py-0.5 font-medium rounded-sm">
                    -{savePercentage}%
                  </span>
                </>
              )}
            </div>

            {/* Future Ready Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {product.colors.map((color: string, i: number) => (
                  <span 
                    key={i} 
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-sm" 
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Add-to-Cart Button */}
        <div className="px-4 pb-4 block lg:hidden">
          <button
            onClick={handleAddToCart}
            disabled={product.inventory === 0}
            className={`w-full text-white hover:bg-neutral-900 transition-colors text-[9px] tracking-[0.2em] uppercase h-9 flex items-center justify-center gap-2 font-medium shadow-sm ${
              product.inventory === 0 ? "bg-neutral-300 cursor-not-allowed" : "bg-black"
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Bag
          </button>
        </div>
      </Link>

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
                <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400 font-body font-medium block">
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
                      <span className="text-[10px] text-neutral-400 font-body">({product.reviews_count} Reviews)</span>
                    )}
                  </div>
                )}

                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-body font-semibold text-lg text-neutral-900">
                    {formatPrice(priceAud, priceInr, priceUsd)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="font-body font-normal text-sm text-neutral-400 line-through">
                        {formatPrice(comparePriceAud, comparePriceInr, comparePriceUsd)}
                      </span>
                      <span className="text-[9px] tracking-wider uppercase bg-red-50 text-red-650 px-2 py-0.5 font-medium rounded-sm">
                        Save {savePercentage}%
                      </span>
                    </>
                  )}
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
                  className="w-full bg-black text-white hover:bg-neutral-950 transition-colors text-[10px] tracking-[0.2em] uppercase h-12 flex items-center justify-center gap-2.5 font-medium"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {product.inventory === 0 ? "Out of Stock" : "Add to Bag"}
                </button>
                <Link
                  to={`/product/${product.slug}`}
                  onClick={() => setIsQuickViewOpen(false)}
                  className="block text-center text-neutral-500 hover:text-black transition-colors text-[9px] tracking-[0.15em] uppercase font-medium pt-2 underline underline-offset-4"
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
