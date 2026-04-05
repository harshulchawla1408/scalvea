import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Heart, Star, Share2, ShoppingBag, Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(productId || "");
  const { products: allProducts } = useProducts();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { formatPrice, getPrice, settings } = useCountry();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (product?.id) addRecentlyViewed(product.id);
  }, [product?.id, addRecentlyViewed]);

  // Fetch reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!product?.id,
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleSubmitReview = async () => {
    if (!user) {
      toast({ title: "Please sign in to leave a review" });
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: product!.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment,
      reviewer_name: reviewName || "Anonymous",
    });
    if (error) {
      toast({ title: "Failed to submit review", variant: "destructive" });
    } else {
      toast({ title: "Review submitted!" });
      setReviewComment("");
      setReviewName("");
      setReviewRating(5);
      refetchReviews();
    }
    setSubmittingReview(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-light">Product not found</h1>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase"><Link to="/shop">Back to Shop</Link></Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({ productId: product.id, name: product.name, image: product.images[0], price_aud: product.price_aud, price_inr: product.price_inr, price_usd: product.price_usd }, quantity);
  };

  const handleBuyNow = () => {
    addItem({ productId: product.id, name: product.name, image: product.images[0], price_aud: product.price_aud, price_inr: product.price_inr, price_usd: product.price_usd }, quantity);
    navigate("/checkout");
  };

  const inStock = product.inventory_quantity > 0;
  const lowStock = product.inventory_quantity > 0 && product.inventory_quantity <= 10;
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-8">
        <nav className="mb-8 text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square max-h-[500px] bg-secondary overflow-hidden">
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-contain object-center" />
            </div>
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-16 h-16 bg-secondary overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-foreground" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-32 lg:h-fit space-y-6">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-2">{product.category}</p>
              <h1 className="text-2xl md:text-3xl font-light tracking-[0.02em] mb-3">{product.name}</h1>
              <div className="flex items-center gap-4 mb-1">
                <p className="text-lg">{formatPrice(product.price_aud, product.price_inr, product.price_usd)}</p>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                    <span>{avgRating.toFixed(1)}</span>
                    <span>({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs text-green-600">
                    {lowStock ? `Only ${product.inventory_quantity} left in stock` : "In Stock"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-destructive">Out of Stock</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {product.key_ingredients.map((ing) => (
                <span key={ing} className="text-[10px] tracking-[0.1em] uppercase border border-border px-3 py-1">{ing}</span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            <p className="text-xs text-muted-foreground">{product.size}</p>

            {settings && (
              <p className="text-xs text-muted-foreground">
                Estimated delivery: {settings.delivery_time}
              </p>
            )}

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-[0.1em] uppercase">Quantity</span>
                <div className="flex items-center border border-border">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors"><Minus className="h-3 w-3" /></button>
                  <span className="h-10 w-12 flex items-center justify-center text-sm border-x border-border">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors"><Plus className="h-3 w-3" /></button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleAddToCart} disabled={!inStock} className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Add to Bag
                </Button>
                <Button variant="outline" onClick={() => toggleItem(product.id)} className="h-12 w-12 border-foreground p-0">
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-foreground" : ""}`} />
                </Button>
                <Button variant="outline" onClick={handleShare} className="h-12 w-12 border-foreground p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={handleBuyNow} disabled={!inStock} variant="outline" className="w-full h-12 border-foreground text-xs tracking-[0.12em] uppercase">
                Buy Now
              </Button>
            </div>

            <Accordion type="multiple" className="border-t border-border">
              <AccordionItem value="ingredients">
                <AccordionTrigger className="text-xs tracking-[0.12em] uppercase font-normal py-4">Ingredients</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">{product.ingredients}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="how-to-use">
                <AccordionTrigger className="text-xs tracking-[0.12em] uppercase font-normal py-4">How to Use</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">{product.how_to_use}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger className="text-xs tracking-[0.12em] uppercase font-normal py-4">Shipping & Returns</AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                  Free shipping on orders over {settings?.currency_symbol}{settings?.free_shipping_above} {settings?.currency}. {settings?.delivery_time} delivery. 30-day money-back guarantee.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20 lg:mt-28 border-t border-border pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs tracking-[0.15em] uppercase">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground">out of 5</span>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="border border-border p-6 mb-8 max-w-xl">
            <h3 className="text-xs tracking-[0.12em] uppercase mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setReviewRating(s)}>
                      <Star className={`h-5 w-5 ${s <= reviewRating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1">Name</label>
                <Input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1">Comment</label>
                <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience..." className="text-sm min-h-[80px]" />
              </div>
              <Button onClick={handleSubmitReview} disabled={submittingReview} className="h-10 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.1em] uppercase">
                Submit Review
              </Button>
            </div>
          </div>

          {/* Review List */}
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-border pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.reviewer_name || "Anonymous"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 lg:mt-28 border-t border-border pt-12">
            <h2 className="text-xs tracking-[0.15em] uppercase mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((p) => (<ProductCard key={p.id} product={p} />))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
