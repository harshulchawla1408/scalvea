import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Minus, Plus, Heart, Star, Share2, ShoppingBag, Check,
  ChevronDown, ChevronRight, Truck, Lock, FlaskConical, MessageCircle,
  Leaf, Award, Zap, Droplets, Sparkles, Shield, Clock, ChevronLeft,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("pd-visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        obs.disconnect();
        let start = 0;
        const duration = 1800;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Ingredient data ─── */
const INGREDIENT_DATA: Record<string, { pct: string; benefit: string; icon: React.ReactNode; color: string }> = {
  "Redensyl":    { pct: "4%", benefit: "Activates hair follicle stem cells", icon: <Sparkles className="h-5 w-5" />, color: "#4f6ef7" },
  "Procapil":    { pct: "3%", benefit: "Strengthens hair anchoring", icon: <Shield className="h-5 w-5" />, color: "#6b5cf7" },
  "Baicapil":    { pct: "3%", benefit: "Reduces hair fall", icon: <Leaf className="h-5 w-5" />, color: "#38a169" },
  "Biotin":      { pct: "2%", benefit: "Supports keratin production", icon: <Zap className="h-5 w-5" />, color: "#e09d3a" },
  "Caffeine":    { pct: "1%", benefit: "Stimulates scalp microcirculation", icon: <Droplets className="h-5 w-5" />, color: "#e05252" },
  "Niacinamide": { pct: "5%", benefit: "Balances scalp oil & soothes", icon: <FlaskConical className="h-5 w-5" />, color: "#319795" },
};

/* ─── FAQ data ─── */
const FAQ_DATA = [
  { q: "How long before I see results?", a: "Most customers notice reduced shedding within 4 weeks of consistent daily use. Visible density improvement is typically seen by week 8–12." },
  { q: "Can I use it with other hair products?", a: "Yes. Apply the serum directly to your scalp before other styling products. It absorbs quickly and won't interfere with your routine." },
  { q: "Is it suitable for all hair types?", a: "Absolutely. Follicle 8 is formulated for all hair types — fine, thick, curly, straight — and is safe for color-treated hair." },
  { q: "Do I need to wash it out?", a: "No. It's a leave-in treatment designed to work overnight or throughout the day. Simply apply and go." },
  { q: "Is Scalvea cruelty-free?", a: "Yes. We never test on animals and our formulas are 100% cruelty-free and vegan." },
];

/* ─── Comparison data ─── */
const COMPARISON_FEATURES = [
  { feature: "Clinically Inspired Formula", scalvea: true, ordinary: false },
  { feature: "Non-Greasy, Fast Absorbing", scalvea: true, ordinary: null },
  { feature: "Suitable for Daily Use", scalvea: true, ordinary: true },
  { feature: "Targets Root-Level Hair Growth", scalvea: true, ordinary: false },
  { feature: "Redensyl + Procapil Blend", scalvea: true, ordinary: false },
  { feature: "Safe for Colour-Treated Hair", scalvea: true, ordinary: null },
  { feature: "Cruelty-Free & Vegan", scalvea: true, ordinary: null },
];

/* ─── Rich Description Renderer ─── */
// Preserves newlines, paragraphs, bullet lists, and numbered lists
// exactly as entered in the admin textarea.
function RichDescription({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  // Split into blocks separated by blank lines
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");
        if (lines.length === 0) return null;

        // Check if the block is a bullet list
        const isBullet = lines.every((l) => /^[\u2022\-\*\u25cf\u25e6]\s+/.test(l));
        // Check if the block is a numbered list
        const isNumbered = lines.every((l) => /^\d+[\.\)]\s+/.test(l));

        if (isBullet) {
          return (
            <ul key={bi} className="space-y-1.5 pl-0">
              {lines.map((l, li) => (
                <li key={li} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 flex-shrink-0" />
                  <span>{l.replace(/^[\u2022\-\*\u25cf\u25e6]\s+/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={bi} className="space-y-1.5 pl-0">
              {lines.map((l, li) => {
                const match = l.match(/^(\d+[\.\)])\s+(.*)/);
                return (
                  <li key={li} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
                    <span className="flex-shrink-0 font-medium text-neutral-500 min-w-[1.25rem]">
                      {match ? match[1] : `${li + 1}.`}
                    </span>
                    <span>{match ? match[2] : l}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Mixed block — render line-by-line within one paragraph block
        return (
          <p key={bi} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

/* ─── Before/After Slider ─── */
function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 5), 95);
    setPosition(pct);
  }, []);

  useEffect(() => {
    const onUp = () => { dragging.current = false; };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      move(x);
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [move]);

  return (
    <div>
      <div
        ref={containerRef}
        className="pd-before-after select-none"
        style={{ height: 320 }}
        onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
        onTouchStart={(e) => { dragging.current = true; move(e.touches[0].clientX); }}
      >
        {/* AFTER — full bg */}
        <div className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)" }}>
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
            <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-green-600" />
            </div>
            <span className="text-green-800 font-light tracking-widest text-xs uppercase">After</span>
            <p className="text-green-700 text-xs text-center px-8 opacity-70">Visibly fuller, healthier-looking hair</p>
          </div>
        </div>

        {/* BEFORE — clipped */}
        <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <div style={{ background: "linear-gradient(135deg, #f5f5f5 0%, #eeeeee 50%, #e0e0e0 100%)" }}
            className="absolute inset-0 flex items-center justify-center flex-col gap-2">
            <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-lg">
              <Droplets className="h-8 w-8 text-gray-400" />
            </div>
            <span className="text-gray-500 font-light tracking-widest text-xs uppercase">Before</span>
            <p className="text-gray-400 text-xs text-center px-8 opacity-70">Thinning, weak hair strands</p>
          </div>
        </div>

        {/* Handle */}
        <div className="pd-before-after-handle" style={{ left: `calc(${position}% - 1px)` }}>
          <div className="pd-before-after-handle-btn">
            <div className="flex gap-0.5">
              <ChevronLeft className="h-3 w-3 text-gray-600" />
              <ChevronRight className="h-3 w-3 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-4 text-[10px] tracking-widest uppercase text-gray-500 font-medium pointer-events-none z-20">Before</div>
        <div className="absolute top-3 right-4 text-[10px] tracking-widest uppercase text-green-700 font-medium pointer-events-none z-20">After</div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground mt-3 tracking-wide">Drag slider to compare · Individual results may vary.</p>
    </div>
  );
}

/* ─── FAQ Item ─── */
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pd-glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        id={`faq-item-${index}`}
      >
        <span className="text-sm font-medium tracking-wide pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`pd-faq-content ${open ? "pd-faq-open" : ""}`}>
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── RevealSection wrapper ─── */
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`pd-reveal ${className}`}>{children}</div>;
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(productId || "");
  const { products: allProducts } = useProducts();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { formatPrice, getPrice, settings, selectedCountry } = useCountry();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "helpful">("newest");

  useEffect(() => {
    if (product?.id) addRecentlyViewed(product.id);
  }, [product?.id, addRecentlyViewed]);

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

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: any) => r.rating === star).length,
    pct: reviews.length > 0
      ? Math.round((reviews.filter((r: any) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  const sortedReviews = [...reviews].sort((a: any, b: any) => {
    if (reviewSort === "highest") return b.rating - a.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  useSEO({
    title: product ? product.name : "Product Detail",
    description: product ? (product.description || "").slice(0, 155) : "View product details for Scalvea hair growth treatments.",
    keywords: product ? `${product.name}, ${product.category}, hair growth, Scalvea` : "hair growth, Scalvea",
    image: product && product.images?.[0] ? product.images[0] : "https://scalvea.com/og-image.jpg",
    type: "product",
    canonical: product ? `https://scalvea.com/product/${product.slug}` : undefined,
    schema: product ? {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "name": product.name,
          "image": product.images || [],
          "description": product.description || "",
          "sku": product.sku_australia || product.sku_india || product.id,
          "mpn": product.id,
          "brand": { "@type": "Brand", "name": "Scalvea" },
          "offers": {
            "@type": "Offer",
            "url": `https://scalvea.com/product/${product.slug}`,
            "priceCurrency": selectedCountry === "india" ? "INR" : "AUD",
            "price": selectedCountry === "india" ? product.price_inr : product.price_aud,
            "priceValidUntil": `${new Date().getFullYear() + 1}-12-31`,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "valueAddedTaxIncluded": true,
          },
          ...(reviews.length > 0 ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": avgRating.toFixed(1),
              "reviewCount": reviews.length,
              "bestRating": "5",
              "worstRating": "1",
            },
            "review": reviews.map((r: any) => ({
              "@type": "Review",
              "author": { "@type": "Person", "name": r.reviewer_name || "Anonymous" },
              "datePublished": new Date(r.created_at).toISOString().split("T")[0],
              "reviewBody": r.comment || "",
              "reviewRating": { "@type": "Rating", "bestRating": "5", "ratingValue": r.rating.toString(), "worstRating": "1" },
            })),
          } : {}),
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://scalvea.com" },
            { "@type": "ListItem", "position": 2, "name": "Shop", "item": "https://scalvea.com/shop" },
            { "@type": "ListItem", "position": 3, "name": product.category, "item": `https://scalvea.com/shop?category=${encodeURIComponent(product.category)}` },
            { "@type": "ListItem", "position": 4, "name": product.name, "item": `https://scalvea.com/product/${product.slug}` },
          ],
        },
      ],
    } : undefined,
  });

  const handleSubmitReview = async () => {
    if (!user) { toast({ title: "Please sign in to leave a review" }); return; }
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
      setReviewComment(""); setReviewName(""); setReviewRating(5);
      refetchReviews();
    }
    setSubmittingReview(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="px-6 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Skeleton className="aspect-square max-h-[500px]" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── Not Found ── */
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-light">Product not found</h1>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
              <Link to="/shop">Back to Shop</Link>
            </Button>
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

  /* ── Ingredient cards from product data ── */
  const ingredientCards = product.key_ingredients.map((ing) => ({
    name: ing,
    ...(INGREDIENT_DATA[ing] || {
      pct: "",
      benefit: "Active botanical extract",
      icon: <FlaskConical className="h-5 w-5" />,
      color: "#718096",
    }),
  }));

  /* ── How-to-use steps removed (now uses RichDescription) ── */

  /* ══════════════════════════════════════════
      RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pb-28 lg:pb-12">

        {/* ── Breadcrumb ── */}
        <div className="px-6 lg:px-12 pt-6 pb-2">
          <nav className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        {/* ══════════════════════════════════════════
            SECTION 1 — HERO: Image Gallery + Purchase Panel
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[560px] bg-[#f9f9f9] rounded-2xl overflow-hidden group">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-black text-white text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
                    {product.badge}
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      id={`product-image-thumb-${i}`}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl bg-[#f9f9f9] overflow-hidden border-2 transition-all duration-200 ${selectedImage === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Panel */}
            <div className="lg:sticky lg:top-28 space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">{product.category}</p>
                <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3 leading-tight">{product.name}</h1>

                {/* Rating row */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                )}

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl font-medium">{formatPrice(product.price_aud, product.price_inr, product.price_usd)}</span>
                </div>
                <p className="text-[10px] text-emerald-600 tracking-wide">Inclusive of all taxes</p>
              </div>

              {/* Size & Stock */}
              <div className="flex items-center gap-4">
                {product.size && (
                  <span className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-full">{product.size}</span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                  <span className={`text-xs ${inStock ? "text-emerald-600" : "text-red-500"}`}>
                    {inStock ? (lowStock ? `Only ${product.inventory_quantity} left` : "In Stock") : "Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Key Ingredient Pills */}
              {product.key_ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.key_ingredients.map((ing) => (
                    <span key={ing} className="text-[10px] tracking-[0.08em] border border-neutral-200 px-3 py-1 rounded-full bg-neutral-50 text-neutral-600">
                      {ing}
                    </span>
                  ))}
                </div>
              )}

              {/* Description — preserves full formatting from admin input */}
              {product.description && (
                <div className="border-l-2 border-neutral-200 pl-4 max-h-72 overflow-y-auto scrollbar-none">
                  <RichDescription text={product.description} />
                </div>
              )}

              {settings && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Estimated delivery: {settings.delivery_time}</span>
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4">
                  <span className="text-xs tracking-[0.1em] uppercase text-muted-foreground">Qty</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      id="product-qty-minus"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-11 w-11 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="h-11 w-12 flex items-center justify-center text-sm font-medium border-x border-border">{quantity}</span>
                    <button
                      id="product-qty-plus"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-11 w-11 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <Button
                    id="product-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="flex-1 h-13 bg-black text-white hover:bg-black/90 text-xs tracking-[0.14em] uppercase rounded-xl pd-ripple h-[52px]"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />Add to Bag
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleItem(product.id)}
                    id="product-wishlist"
                    className="h-[52px] w-[52px] border-black rounded-xl p-0 hover:bg-neutral-50"
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-black" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    id="product-share"
                    className="h-[52px] w-[52px] border-black rounded-xl p-0 hover:bg-neutral-50"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  id="product-buy-now"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  variant="outline"
                  className="w-full h-[52px] border-black text-xs tracking-[0.14em] uppercase rounded-xl hover:bg-neutral-50"
                >
                  Buy Now
                </Button>
              </div>

              {/* Mini trust row */}
              <div className="flex flex-wrap gap-3 pt-1">
                {[
                  { icon: <Lock className="h-3 w-3" />, label: "Secure Checkout" },
                  { icon: <Truck className="h-3 w-3" />, label: "Fast Shipping" },
                  { icon: <Leaf className="h-3 w-3" />, label: "Cruelty-Free" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-wide">
                    {icon}<span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 — WHY YOU'LL LOVE IT
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16 bg-[#fafafa]">
          <RevealSection className="max-w-5xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Benefits</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">Why You'll Love It</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {[
                { icon: "✓", text: "Clinically inspired ingredients" },
                { icon: "✓", text: "Lightweight & non-greasy" },
                { icon: "✓", text: "Suitable for men & women" },
                { icon: "✓", text: "Visible hair density support" },
                { icon: "✓", text: "Everyday scalp nourishment" },
              ].map(({ icon, text }, i) => (
                <div key={text} className={`pd-glass-card p-5 text-center pd-reveal pd-reveal-delay-${i + 1}`}>
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3 text-black font-semibold text-lg">
                    {icon}
                  </div>
                  <p className="text-sm font-light leading-snug text-foreground">{text}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 — WHAT MAKES IT DIFFERENT
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16">
          <RevealSection className="max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">The Difference</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-12">What Makes {product.name.split(" ").slice(0, 2).join(" ")} Different?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { title: "Targets Hair at the Root", desc: "Powered by Redensyl and Procapil to help strengthen weak follicles from within.", icon: <Sparkles className="h-6 w-6" /> },
                { title: "Nourishes Your Scalp", desc: "Supports healthier scalp conditions for stronger-looking, more resilient hair.", icon: <Leaf className="h-6 w-6" /> },
                { title: "Lightweight Formula", desc: "Absorbs in seconds — no residue, no grease, no compromises on your style.", icon: <Droplets className="h-6 w-6" /> },
                { title: "Built for Daily Use", desc: "Easy to include in your morning or evening routine without any disruption.", icon: <Clock className="h-6 w-6" /> },
              ].map(({ title, desc, icon }, i) => (
                <div key={title} className={`pd-glass-card p-6 flex gap-5 items-start pd-reveal pd-reveal-delay-${(i % 2) + 1}`}>
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 text-neutral-700">
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1.5 tracking-wide">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — INGREDIENT SHOWCASE
        ══════════════════════════════════════════ */}
        {ingredientCards.length > 0 && (
          <section className="px-6 lg:px-12 py-16 bg-[#fafafa]">
            <RevealSection className="max-w-5xl mx-auto">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">What's Inside</p>
              <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-12">Ingredient Showcase</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {ingredientCards.map(({ name, pct, benefit, icon, color }, i) => (
                  <div
                    key={name}
                    className={`pd-ingredient-card p-5 text-center flex flex-col items-center gap-3 pd-reveal pd-reveal-delay-${Math.min(i + 1, 4)}`}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}15`, color }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm tracking-wide mb-0.5">{name}</p>
                      {pct && (
                        <p className="text-xs font-mono text-muted-foreground mb-1">{pct}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground leading-snug">{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
              {product.ingredients && (
                <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed">{product.ingredients.slice(0, 300)}{product.ingredients.length > 300 ? "…" : ""}</p>
              )}
            </RevealSection>
          </section>
        )}

        {/* ══════════════════════════════════════════
            SECTION 5 — HOW IT WORKS
        ══════════════════════════════════════════ */}
        {product.how_to_use && (
          <section className="px-6 lg:px-12 py-16">
            <RevealSection className="max-w-2xl mx-auto">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Application</p>
              <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">How To Use</h2>
              <div className="pd-glass-card p-6 md:p-8">
                <RichDescription text={product.how_to_use} />
              </div>
            </RevealSection>
          </section>
        )}

        {/* ══════════════════════════════════════════
            SECTION 6 — SCIENCE BEHIND SCALVEA
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-20 pd-science-bg">
          <RevealSection className="max-w-4xl mx-auto text-center">
            {/* Decorative molecule SVG */}
            <div className="flex justify-center mb-8 opacity-40">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="8" fill="white" opacity="0.9"/>
                <circle cx="16" cy="24" r="5" fill="white" opacity="0.6"/>
                <circle cx="64" cy="24" r="5" fill="white" opacity="0.6"/>
                <circle cx="16" cy="56" r="5" fill="white" opacity="0.6"/>
                <circle cx="64" cy="56" r="5" fill="white" opacity="0.6"/>
                <circle cx="40" cy="8" r="4" fill="white" opacity="0.4"/>
                <circle cx="40" cy="72" r="4" fill="white" opacity="0.4"/>
                <line x1="40" y1="32" x2="20" y2="26" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="40" y1="32" x2="60" y2="26" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="40" y1="48" x2="20" y2="54" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="40" y1="48" x2="60" y2="54" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="40" y1="32" x2="40" y2="12" stroke="white" strokeWidth="1" opacity="0.3"/>
                <line x1="40" y1="48" x2="40" y2="68" stroke="white" strokeWidth="1" opacity="0.3"/>
              </svg>
            </div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 mb-4">The Science</p>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6 leading-tight tracking-tight">
              Backed by Science.<br />Designed for Results.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-2xl mx-auto mb-10">
              Every ingredient in our formula is selected based on peer-reviewed research. We combine advanced bioactive actives with a lightweight delivery system that ensures maximum absorption at the follicle level — where it matters most.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { label: "Active Ingredients", value: `${product.key_ingredients.length}+` },
                { label: "Research-Backed", value: "100%" },
                { label: "Formulated By", value: "Experts" },
              ].map(({ label, value }) => (
                <div key={label} className="border border-white/10 rounded-xl p-5 text-center bg-white/5">
                  <p className="text-white text-2xl font-light mb-1">{value}</p>
                  <p className="text-white/40 text-[10px] tracking-widest uppercase">{label}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 7 — RESULTS TIMELINE
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16 bg-[#fafafa]">
          <RevealSection className="max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">What to Expect</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-12">Your Results Timeline</h2>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-0 right-0 h-px bg-neutral-200 hidden md:block" style={{ left: "12.5%", right: "12.5%" }} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { week: "Week 2", milestone: "Scalp feels nourished & balanced", icon: "🌿" },
                  { week: "Week 4", milestone: "Reduced hair shedding*", icon: "✨" },
                  { week: "Week 8", milestone: "Healthier-looking hair strands", icon: "💫" },
                  { week: "Week 12", milestone: "Visible improvement in density*", icon: "🌟" },
                ].map(({ week, milestone, icon }, i) => (
                  <div key={week} className={`text-center pd-reveal pd-reveal-delay-${i + 1}`}>
                    <div className="relative flex justify-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-lg shadow-sm z-10">
                        {icon}
                      </div>
                    </div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-black mb-2">{week}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{milestone}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-8">*Individual results may vary. Consistent daily use recommended.</p>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 8 — BEFORE & AFTER
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16">
          <RevealSection className="max-w-2xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Transformation</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">See the Difference</h2>
            <BeforeAfterSlider />
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 9 — TRUST BADGES
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-14 bg-[#fafafa]">
          <RevealSection className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: <Truck className="h-6 w-6" />, title: "Fast Shipping", desc: "Quick & reliable delivery" },
                { icon: <Lock className="h-6 w-6" />, title: "Secure Checkout", desc: "256-bit SSL encryption" },
                { icon: <FlaskConical className="h-6 w-6" />, title: "Clinically Inspired", desc: "Science-backed formula" },
                { icon: <MessageCircle className="h-6 w-6" />, title: "Expert Support", desc: "Responsive customer care" },
                { icon: <Leaf className="h-6 w-6" />, title: "Cruelty-Free", desc: "100% vegan & ethical" },
              ].map(({ icon, title, desc }, i) => (
                <div key={title} className={`pd-glass-card p-5 text-center pd-reveal pd-reveal-delay-${Math.min(i+1,4)}`}>
                  <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center mx-auto mb-3 text-black">
                    {icon}
                  </div>
                  <p className="text-xs font-semibold mb-1 tracking-wide">{title}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 10 — SOCIAL PROOF COUNTERS
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16 bg-black">
          <RevealSection className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map((s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-white text-xs tracking-[0.2em] uppercase mb-10 opacity-60">Trusted by a growing community</p>
            <div className="grid grid-cols-3 gap-8">
              {[
                { target: 2400, suffix: "+", label: "Orders Placed" },
                { target: reviews.length > 0 ? reviews.length : 150, suffix: "+", label: "Reviews" },
                { target: 2, suffix: " Countries", label: "Available In" },
              ].map(({ target, suffix, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl md:text-4xl font-light text-white mb-1">
                    <AnimatedCounter target={target} suffix={suffix} />
                  </p>
                  <p className="text-[10px] tracking-widest uppercase text-white/40">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-8 italic">"Helping customers build healthier hair routines."</p>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 11 — PREMIUM REVIEWS
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16 bg-[#fafafa]">
          <RevealSection className="max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Customer Reviews</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-12">What Our Customers Say</h2>

            {/* Rating overview */}
            {reviews.length > 0 && (
              <div className="pd-glass-card p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Big score */}
                <div className="text-center">
                  <p className="text-6xl font-light mb-2">{avgRating.toFixed(1)}</p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{reviews.length} verified reviews</p>
                </div>
                {/* Distribution bars */}
                <div className="space-y-2">
                  {ratingDist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs w-4 text-right text-muted-foreground">{star}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                      <span className="text-[10px] text-muted-foreground w-4">({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sort controls */}
            {reviews.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {(["newest", "highest", "helpful"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setReviewSort(s)}
                    id={`review-sort-${s}`}
                    className={`text-[10px] tracking-[0.1em] uppercase px-4 py-2 rounded-full border transition-colors ${reviewSort === s ? "bg-black text-white border-black" : "border-neutral-200 text-muted-foreground hover:border-black"}`}
                  >
                    {s === "newest" ? "Newest" : s === "highest" ? "Highest Rated" : "Most Helpful"}
                  </button>
                ))}
              </div>
            )}

            {/* Review cards */}
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {sortedReviews.map((review: any) => (
                  <div key={review.id} className="pd-glass-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-600">
                          {(review.reviewer_name || "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{review.reviewer_name || "Anonymous"}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 tracking-wide">Verified Purchase</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Write a review */}
            <div className="pd-glass-card p-6 max-w-xl mx-auto">
              <h3 className="text-sm font-medium tracking-wide mb-5">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1.5">Your Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setReviewRating(s)} id={`review-star-${s}`}>
                        <Star className={`h-6 w-6 transition-colors ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-neutral-200 hover:text-amber-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1.5">Name</label>
                  <Input id="review-name-input" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name" className="h-10 text-sm rounded-xl" />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground block mb-1.5">Review</label>
                  <Textarea id="review-comment-input" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Share your experience with this product..." className="text-sm min-h-[90px] rounded-xl" />
                </div>
                <Button
                  id="review-submit-btn"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="h-11 bg-black text-white hover:bg-black/90 text-xs tracking-[0.1em] uppercase rounded-xl w-full"
                >
                  {submittingReview ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 12 — FAQ
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16">
          <RevealSection className="max-w-2xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Have Questions?</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">Frequently Asked</h2>
            <div className="space-y-3">
              {FAQ_DATA.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} index={i} />)}
            </div>
            <div className="text-center mt-6">
              <Link to="/faq" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                View All FAQs <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 13 — PRODUCT COMPARISON
        ══════════════════════════════════════════ */}
        <section className="px-6 lg:px-12 py-16 bg-[#fafafa]">
          <RevealSection className="max-w-3xl mx-auto">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Compare</p>
            <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">Why Choose Scalvea?</h2>
            <div className="pd-glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[10px] tracking-[0.15em] uppercase text-muted-foreground p-4 font-normal w-1/2">Feature</th>
                    <th className="text-center text-[10px] tracking-[0.15em] uppercase p-4 font-semibold w-1/4">Scalvea</th>
                    <th className="text-center text-[10px] tracking-[0.15em] uppercase text-muted-foreground p-4 font-normal w-1/4">Ordinary Serums</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map(({ feature, scalvea, ordinary }, i) => (
                    <tr key={feature} className={`border-b border-neutral-50 ${i % 2 === 0 ? "bg-white/50" : ""}`}>
                      <td className="p-4 text-sm font-light">{feature}</td>
                      <td className="p-4 text-center">
                        {scalvea ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <span className="text-red-400 text-xs font-bold">✕</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {ordinary === true ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          </div>
                        ) : ordinary === false ? (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                            <span className="text-red-400 text-xs font-bold">✕</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-sm">△</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-4">△ = Varies by product</p>
          </RevealSection>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 14 — RELATED PRODUCTS
        ══════════════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <section className="px-6 lg:px-12 py-16">
            <RevealSection>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">Explore More</p>
              <h2 className="text-2xl md:text-3xl font-light text-center tracking-tight mb-10">You May Also Like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </RevealSection>
          </section>
        )}

      </main>

      {/* ══════════════════════════════════════════
          SECTION 15 — STICKY MOBILE CTA
      ══════════════════════════════════════════ */}
      {inStock && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-neutral-100 shadow-2xl animate-fade-in">
          <div className="px-4 pt-3 pb-safe pb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-wider text-muted-foreground uppercase truncate">{product.name}</p>
                <p className="text-sm font-semibold mt-0.5">{formatPrice(product.price_aud, product.price_inr, product.price_usd)}</p>
              </div>
              {/* Inline qty stepper */}
              <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  id="mobile-qty-minus"
                  className="h-9 w-9 flex items-center justify-center text-neutral-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="h-9 w-8 flex items-center justify-center text-sm border-x border-neutral-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  id="mobile-qty-plus"
                  className="h-9 w-9 flex items-center justify-center text-neutral-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                id="mobile-add-to-cart"
                onClick={handleAddToCart}
                className="flex-1 h-11 bg-black text-white hover:bg-black/90 text-[10px] tracking-[0.18em] uppercase rounded-xl font-medium pd-ripple"
              >
                <ShoppingBag className="h-3.5 w-3.5 mr-2" />Add to Bag
              </Button>
              <Button
                id="mobile-buy-now"
                onClick={handleBuyNow}
                variant="outline"
                className="flex-1 h-11 border-black text-[10px] tracking-[0.18em] uppercase rounded-xl font-medium"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
