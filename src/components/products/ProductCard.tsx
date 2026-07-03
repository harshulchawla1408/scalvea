import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import type { DBProduct } from "@/hooks/useProducts";

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
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { formatPrice } = useCountry();

  const priceAud = "price_aud" in product ? product.price_aud : ("price" in product ? (product as any).price : 0);
  const priceInr = "price_inr" in product ? product.price_inr : 0;
  const priceUsd = "price_usd" in product ? product.price_usd : 0;

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

  return (
    <Link 
      to={`/product/${product.slug}`} 
      className="group block relative bg-background border border-border/40 hover:border-border transition-all duration-700 hover:shadow-xl hover:shadow-neutral-200/50 hover:-translate-y-1 transform-gpu"
    >
      <div className="relative bg-[#fafafa] aspect-[3/4] overflow-hidden">
        
        {/* Product Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-contain p-6 object-center transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badge */}
        {"badge" in product && product.badge && (
          <span className="absolute top-3 left-3 text-[8px] tracking-[0.2em] uppercase bg-black text-white px-2 py-0.5 font-medium">
            {product.badge}
          </span>
        )}

        {/* Wishlist Button (Glassmorphic) */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full border bg-white/60 backdrop-blur-md transition-all duration-300 ${
            isFavorited 
              ? "border-black text-black scale-105" 
              : "border-neutral-200 text-neutral-500 hover:border-black hover:text-black hover:scale-105"
          } md:opacity-0 md:group-hover:opacity-100`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorited ? "fill-current text-black" : ""}`} />
        </button>

        {/* Sliding Add-to-Cart Overlay (Desktop only) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) bg-gradient-to-t from-black/20 to-transparent hidden lg:block">
          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white hover:bg-neutral-900 transition-colors text-[9px] tracking-[0.2em] uppercase h-10 flex items-center justify-center gap-2 font-medium shadow-md"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to Bag
          </button>
        </div>
      </div>

      {/* Info details */}
      <div className="p-4 space-y-1">
        <span className="text-[8px] tracking-[0.2em] uppercase text-neutral-400 font-light block">
          {"category" in product ? product.category : "Skincare"}
        </span>
        <h3 className="text-xs font-normal text-neutral-800 group-hover:text-black transition-colors truncate">
          {product.name}
        </h3>
        <p className="text-xs font-mono font-medium text-neutral-900 pt-0.5">
          {formatPrice(priceAud, priceInr, priceUsd)}
        </p>
      </div>

      {/* Mobile/Tablet Add-to-Cart Button */}
      <div className="px-4 pb-4 block lg:hidden">
        <button
          onClick={handleAddToCart}
          className="w-full bg-black text-white hover:bg-neutral-900 transition-colors text-[9px] tracking-[0.2em] uppercase h-9 flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          <ShoppingBag className="h-3 w-3" />
          Add to Bag
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
