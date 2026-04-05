import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import { Button } from "@/components/ui/button";
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
  const { formatPrice, getPrice } = useCountry();

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

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative bg-secondary aspect-[4/5] mb-3 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {"badge" in product && product.badge && (
          <span className="absolute top-2 left-2 text-[9px] tracking-[0.15em] uppercase bg-background px-2 py-0.5">
            {product.badge}
          </span>
        )}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? "fill-foreground text-foreground" : "text-foreground"}`} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-foreground text-background hover:bg-foreground/90 text-[9px] tracking-[0.12em] uppercase h-9"
          >
            Add to Bag
          </Button>
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] tracking-[0.12em] uppercase text-muted-foreground">
          {"category" in product ? product.category : ""}
        </p>
        <h3 className="text-xs font-normal">{product.name}</h3>
        <p className="text-xs">{formatPrice(priceAud, priceInr, priceUsd)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
