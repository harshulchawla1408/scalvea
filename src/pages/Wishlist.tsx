import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { products } from "@/data/products";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const Wishlist = () => {
  useSEO({
    title: "My Wishlist",
    description: "Manage your favorite items on your Scalvea wishlist.",
    noindex: true
  });

  const { items } = useWishlist();
  const wishlistProducts = products.filter(p => items.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="text-3xl font-light tracking-[0.04em] mb-12">Wishlist</h1>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your wishlist is empty</p>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {wishlistProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
