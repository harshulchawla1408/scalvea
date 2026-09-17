import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCountry } from "@/contexts/CountryContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/hooks/useAuth";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Minus, Plus, Heart, Star, Share2, ShoppingBag, Check,
  ChevronDown, ChevronRight, Truck, Lock, FlaskConical, MessageCircle,
  Leaf, Award, Zap, Droplets, Sparkles, Shield, Clock, ChevronLeft,
  Volume2, VolumeX, Play,
} from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import IngredientShowcase from "@/components/products/IngredientShowcase";

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

/* ─── SEO Metadata Mapping ─── */
const PRODUCT_SEO_CONFIG: Record<string, { title: string; description: string; h1: string; imageAlt: string }> = {
  "scalp-5-anti-dandruff-hair-serum": {
    title: "Scalp-5 Anti-Dandruff Serum – Dandruff Control | Scalvea",
    description: "Soothe itchy, flaky scalps with our anti-dandruff hair serum. Formulated with Salicylic Acid, Rosemary Oil & Piroctone Olamine. Fast shipping available.",
    h1: "Scalp-5 Anti-Dandruff Hair Serum & Scalp Treatment",
    imageAlt: "Scalvea Scalp-5 anti-dandruff hair serum bottle on white background",
  },
  "follicle-8-hair-growth-serum": {
    title: "Follicle 8 Hair Growth Serum – Hair Density Serum | Scalvea",
    description: "Support thicker, healthier-looking hair with Follicle 8 hair growth serum. Powered by Redensyl, Procapil, Baicapil & Anagain to help reduce hair fall.",
    h1: "Follicle 8 Hair Growth Serum & Density Support",
    imageAlt: "Scalvea Follicle 8 hair growth serum bottle on white background",
  }
};

/* ─── Rich Description Renderer ─── */
// Preserves newlines, paragraphs, bullet lists, and numbered lists
// exactly as entered in the admin textarea.
function RichDescription({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  // Split into blocks separated by blank lines
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l !== "");
        if (lines.length === 0) return null;

        // Check if the block is a bullet list
        const isBullet = lines.every((l) => /^[\u2022\-\*\u25cf\u25e6]\s+/.test(l));
        // Check if the block is a numbered list
        const isNumbered = lines.every((l) => /^\d+[\.\)]\s+/.test(l));

        if (isBullet) {
          return (
            <ul key={bi} className="space-y-2.5 pl-0 my-3">
              {lines.map((l, li) => {
                const content = l.replace(/^[\u2022\-\*\u25cf\u25e6]\s+/, "");
                return (
                  <li key={li} className="flex items-start gap-3 text-[15px] md:text-[16px] text-neutral-700 leading-[1.8]">
                    <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-neutral-900 flex-shrink-0" />
                    <span>{content}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={bi} className="space-y-2.5 pl-0 my-3">
              {lines.map((l, li) => {
                const match = l.match(/^(\d+[\.\)])\s+(.*)/);
                return (
                  <li key={li} className="flex items-start gap-3 text-[15px] md:text-[16px] text-neutral-700 leading-[1.8]">
                    <span className="flex-shrink-0 font-semibold text-neutral-900 min-w-[1.25rem]">
                      {match ? match[1] : `${li + 1}.`}
                    </span>
                    <span>{match ? match[2] : l}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Check if block is a heading (e.g., "Key Benefits:", "How to Use:")
        const firstLine = lines[0];
        const isHeading = lines.length === 1 && (/^(key benefits|benefits|features|how it works|why it works|ingredients|direction|how to use):?/i.test(firstLine) || (firstLine.endsWith(":") && firstLine.length < 40));

        if (isHeading) {
          return (
            <h4 key={bi} className="text-base md:text-[17px] font-semibold text-neutral-900 tracking-tight mt-6 mb-2">
              {firstLine}
            </h4>
          );
        }

        // Paragraph block — render line-by-line within one paragraph block
        return (
          <p key={bi} className="text-[15px] md:text-[16px] text-neutral-700 leading-[1.8] whitespace-pre-line">
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
  const location = useLocation();
  const { product, loading } = useProduct(productId || "");
  const { products: allProducts } = useProducts();
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { formatPrice, getPrice, settings, selectedCountry } = useCountry();
  const { addItem: addRecentlyViewed } = useRecentlyViewed();
  const { user } = useAuth();

  const PRODUCT_GALLERY_VIDEO = "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/Reel4.mp4";

  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const galleryVideoRef = useRef<HTMLVideoElement>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "helpful">("newest");
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);

  const mediaItems = useMemo(() => {
    if (!product?.images || product.images.length === 0) return [];
    const items: Array<{ type: "image" | "video"; url: string; alt?: string }> = [
      {
        type: "image",
        url: product.images[0],
        alt: product.slug && PRODUCT_SEO_CONFIG[product.slug] ? PRODUCT_SEO_CONFIG[product.slug].imageAlt : product.name,
      },
      {
        type: "video",
        url: PRODUCT_GALLERY_VIDEO,
      },
    ];
    for (let i = 1; i < product.images.length; i++) {
      items.push({
        type: "image",
        url: product.images[i],
        alt: product.slug && PRODUCT_SEO_CONFIG[product.slug]
          ? `${PRODUCT_SEO_CONFIG[product.slug].imageAlt} thumbnail ${i + 1}`
          : `${product.name} thumbnail ${i + 1}`,
      });
    }
    return items;
  }, [product]);

  // Reset selected media index on product change
  useEffect(() => {
    setSelectedMediaIndex(0);
    setUserHasInteracted(false);
  }, [product?.id]);

  // Auto-slideshow timer: 3 sec on images, then video play completion
  useEffect(() => {
    if (userHasInteracted || mediaItems.length <= 1) return;

    const currentMedia = mediaItems[selectedMediaIndex];
    if (!currentMedia) return;

    if (currentMedia.type === "image") {
      const timer = setTimeout(() => {
        setSelectedMediaIndex((prev) => (prev + 1) % mediaItems.length);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedMediaIndex, userHasInteracted, mediaItems]);

  // Ensure video starts playing when selected
  useEffect(() => {
    if (mediaItems[selectedMediaIndex]?.type === "video" && galleryVideoRef.current) {
      galleryVideoRef.current.play().catch(() => {});
    }
  }, [selectedMediaIndex, mediaItems]);

  const handleVideoEnded = useCallback(() => {
    if (!userHasInteracted) {
      setSelectedMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }
  }, [userHasInteracted, mediaItems.length]);

  const mainPurchaseRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = mainPurchaseRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (product?.id) addRecentlyViewed(product.id);
  }, [product?.id, addRecentlyViewed]);

  // ── Meta Pixel: ViewContent ───────────────────────────────────────────────
  // Fire once per product load. Guard with ref so re-renders don't duplicate.
  const viewContentFiredForId = useRef<string | null>(null);
  useEffect(() => {
    if (!product?.id) return;
    if (viewContentFiredForId.current === product.id) return;
    viewContentFiredForId.current = product.id;
    trackViewContent({
      id: product.id,
      name: product.name,
      price: selectedCountry === "india" ? product.price_inr : product.price_aud,
      currency: selectedCountry === "india" ? "INR" : "AUD",
    });
  }, [product?.id, product?.name, product?.price_inr, product?.price_aud, selectedCountry]);

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

  const schema = useMemo(() => {
    if (!product) return undefined;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "name": product.name,
          "image": product.images || [],
          "description": product.slug && PRODUCT_SEO_CONFIG[product.slug] ? PRODUCT_SEO_CONFIG[product.slug].description : (product.description || ""),
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
    };
  }, [product, selectedCountry, reviews, avgRating]);

  // Sanitize description: strip bullet chars, extra whitespace, and truncate for meta
  const sanitizedDescription = product
    ? (product.description || "")
        .replace(/^[\u2022\-\*\u25cf\u25e6\d+\.]\s*/gm, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 152)
    : "";

  useSEO({
    title: product && PRODUCT_SEO_CONFIG[product.slug] 
      ? PRODUCT_SEO_CONFIG[product.slug].title 
      : product ? `${product.name} – Hair Serum` : "Product Detail",
    description: product && PRODUCT_SEO_CONFIG[product.slug]
      ? PRODUCT_SEO_CONFIG[product.slug].description
      : product ? sanitizedDescription || `Shop ${product.name} by Scalvea. Science-backed hair care with clinically researched ingredients.` : "View product details for Scalvea hair growth treatments.",
    image: product && product.images?.[0] ? product.images[0] : "https://scalvea.com/og-image.webp",
    canonical: product ? `https://scalvea.com/product/${product.slug}` : undefined,
    schema,
  });

  const handleRequireAuth = () => {
    if (!user) {
      toast({
        title: "Please sign in to leave a review",
        description: "Redirecting you to the login page...",
        variant: "destructive",
      });
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname + location.search)}`);
      return true;
    }
    return false;
  };

  const handleSubmitReview = async () => {
    if (handleRequireAuth()) return;
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast({ title: "Please select a rating", description: "Star rating is required.", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);

    try {
      // Check if user already reviewed this product
      const existingReview = reviews.find((r: any) => r.user_id === user.id);

      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: reviewRating,
            comment: reviewComment.trim() || null,
            reviewer_name: reviewName.trim() || user.user_metadata?.full_name || "Verified Customer",
          })
          .eq("id", existingReview.id);

        if (error) throw error;
        toast({ title: "Your review has been updated!" });
      } else {
        // Create new review
        const { error } = await supabase.from("reviews").insert({
          product_id: product!.id,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment.trim() || null,
          reviewer_name: reviewName.trim() || user.user_metadata?.full_name || "Verified Customer",
        });

        if (error) throw error;
        toast({ title: "Thank you for your review!" });
      }
      setReviewComment("");
      setReviewName("");
      setReviewRating(5);
      refetchReviews();
    } catch (err: any) {
      toast({ title: "Failed to submit review", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingReview(false);
    }
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
        {productId && PRODUCT_SEO_CONFIG[productId] && (
          <h1 className="sr-only">{PRODUCT_SEO_CONFIG[productId].h1}</h1>
        )}
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
    // Fire AddToCart after addItem() completes (synchronous local-state update)
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: selectedCountry === "india" ? product.price_inr : product.price_aud,
      currency: selectedCountry === "india" ? "INR" : "AUD",
    }, quantity);
  };
  const handleBuyNow = () => {
    addItem({ productId: product.id, name: product.name, image: product.images[0], price_aud: product.price_aud, price_inr: product.price_inr, price_usd: product.price_usd }, quantity);
    // Fire AddToCart for Buy Now as well — the item is being added to cart
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: selectedCountry === "india" ? product.price_inr : product.price_aud,
      currency: selectedCountry === "india" ? "INR" : "AUD",
    }, quantity);
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
          <nav className="text-xs sm:text-[13px] font-medium tracking-[0.06em] uppercase text-muted-foreground flex items-center gap-2">
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

            {/* Image & Video Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-square max-h-[560px] bg-[#f9f9f9] rounded-2xl overflow-hidden group">
                {mediaItems[selectedMediaIndex]?.type === "video" ? (
                  <div className="relative w-full h-full bg-black">
                    <video
                      ref={galleryVideoRef}
                      src={mediaItems[selectedMediaIndex].url}
                      autoPlay
                      playsInline
                      muted={isVideoMuted}
                      onEnded={handleVideoEnded}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVideoMuted(!isVideoMuted);
                      }}
                      className="absolute bottom-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                      aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <img
                    src={mediaItems[selectedMediaIndex]?.url || product.images[0]}
                    alt={mediaItems[selectedMediaIndex]?.alt || product.name}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10 bg-black text-white text-[9px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full pointer-events-none">
                    {product.badge}
                  </div>
                )}
              </div>
              {mediaItems.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pt-1">
                  {mediaItems.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setUserHasInteracted(true);
                        setSelectedMediaIndex(i);
                      }}
                      id={`product-media-thumb-${i}`}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 relative ${
                        item.type === "video" ? "bg-black" : "bg-[#f9f9f9]"
                      } ${
                        selectedMediaIndex === i ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      aria-label={item.type === "video" ? "Play product video" : `View image ${i + 1}`}
                    >
                      {item.type === "video" ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-neutral-900">
                          <video src={item.url} className="w-full h-full object-cover opacity-60" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} alt={item.alt || `${product.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Purchase Panel */}
            <div className="lg:sticky lg:top-28 space-y-5">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-2">{product.category}</p>
                <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3 leading-tight">
                  {product.slug && PRODUCT_SEO_CONFIG[product.slug] ? PRODUCT_SEO_CONFIG[product.slug].h1 : product.name}
                </h1>

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

                {(() => {
                  const isIndia = selectedCountry === "india";
                  const sellingPrice = isIndia ? product.price_inr : product.price_aud;
                  const mrpPrice = isIndia ? (product.mrp_inr || product.price_inr) : (product.mrp_aud || product.price_aud);
                  const hasDiscount = mrpPrice > sellingPrice;

                  return (
                    <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                      {hasDiscount && (
                        <span className="text-xl md:text-2xl font-normal text-neutral-400 line-through">
                          {formatPrice(product.mrp_aud || product.price_aud, product.mrp_inr || product.price_inr)}
                        </span>
                      )}
                      <span className="text-2xl md:text-3xl font-semibold text-neutral-900">
                        {formatPrice(product.price_aud, product.price_inr)}
                      </span>
                    </div>
                  );
                })()}
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

              {/* Quantity + CTA + Trust Badges (Main Purchase Block) */}
              <div ref={mainPurchaseRef} className="space-y-4 pt-1">
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
                      className="flex-1 bg-black text-white hover:bg-black/90 text-sm font-semibold tracking-[0.08em] uppercase rounded-xl pd-ripple h-[52px]"
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
                    className="w-full h-[52px] border-black text-sm font-semibold tracking-[0.08em] uppercase rounded-xl hover:bg-neutral-50"
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Mini trust row */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {[
                    { icon: <Lock className="h-3.5 w-3.5" />, label: "Secure Checkout" },
                    { icon: <Truck className="h-3.5 w-3.5" />, label: "Fast Shipping" },
                    { icon: <Leaf className="h-3.5 w-3.5" />, label: "Cruelty-Free" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground tracking-wide">
                      {icon}<span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Ingredient Pills */}
              {product.key_ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.key_ingredients.map((ing) => (
                    <span key={ing} className="text-[10px] tracking-[0.08em] border border-neutral-200 px-3 py-1 rounded-full bg-neutral-50 text-neutral-600">
                      {ing}
                    </span>
                  ))}
                </div>
              )}

              {/* Description — Full natural height with high-contrast typography */}
              {product.description && (
                <div className="border-l-2 border-neutral-300 pl-4 md:pl-5 py-1 my-3">
                  <RichDescription text={product.description} />
                </div>
              )}

              {settings && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Estimated delivery: {settings.delivery_time}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION — INGREDIENT SHOWCASE
        ══════════════════════════════════════════ */}
        <IngredientShowcase product={product} />

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
                    onClick={() => {
                      setReviewSort(s);
                      setVisibleReviewsCount(5);
                    }}
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {sortedReviews.slice(0, visibleReviewsCount).map((review: any) => (
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

                {/* See More Button */}
                {sortedReviews.length > visibleReviewsCount && (
                  <div className="flex justify-center mb-8">
                    <Button
                      id="see-more-reviews-btn"
                      variant="outline"
                      onClick={() => setVisibleReviewsCount((prev) => prev + 5)}
                      className="h-11 px-8 rounded-full border-neutral-300 hover:border-black text-xs font-semibold tracking-[0.1em] uppercase transition-all shadow-xs hover:bg-neutral-50"
                    >
                      See More
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Write / Edit a review */}
            {(() => {
              const existingUserReview = user ? reviews.find((r: any) => r.user_id === user.id) : null;
              
              if (!user) {
                return (
                  <div className="pd-glass-card p-8 max-w-xl mx-auto text-center">
                    <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4 text-black">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-medium tracking-wide mb-2">Have you tried this product?</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                      Please sign in to write a review. Your honest feedback helps others make informed decisions.
                    </p>
                    <Button
                      id="review-login-redirect-btn"
                      onClick={() => handleRequireAuth()}
                      className="h-11 bg-black text-white hover:bg-black/90 text-sm font-semibold tracking-[0.08em] uppercase rounded-xl px-8"
                    >
                      Sign In to Leave a Review
                    </Button>
                  </div>
                );
              }

              return (
                <div className="pd-glass-card p-6 max-w-xl mx-auto">
                  {existingUserReview ? (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-medium text-xs text-emerald-800 tracking-wide">
                          <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 rounded-full p-0.5" />
                          Already Reviewed
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          {new Date(existingUserReview.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${s <= existingUserReview.rating ? "fill-amber-400 text-amber-400" : "text-emerald-200"}`}
                          />
                        ))}
                      </div>
                      {existingUserReview.comment ? (
                        <p className="text-xs text-emerald-900/90 leading-relaxed font-light italic bg-white/60 p-3 rounded-xl border border-emerald-100">
                          "{existingUserReview.comment}"
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-700 italic">No written comment provided with rating.</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-200/60">
                        <span className="text-[10px] text-emerald-700">Reviewer: {existingUserReview.reviewer_name || "Verified Customer"}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewRating(existingUserReview.rating);
                            setReviewName(existingUserReview.reviewer_name || "");
                            setReviewComment(existingUserReview.comment || "");
                            toast({ title: "Review loaded into editing box" });
                          }}
                          className="text-[10px] uppercase font-semibold text-emerald-800 hover:text-black underline tracking-wider transition-colors cursor-pointer"
                        >
                          Load into box to edit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-medium tracking-wide">
                      {existingUserReview ? "Update Your Review" : "Write a Review"}
                    </h3>
                    {existingUserReview && (
                      <span className="text-[9px] tracking-wider uppercase text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Already Reviewed
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground block mb-1.5">
                        {existingUserReview ? "Update Rating" : "Your Rating"} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button type="button" key={s} onClick={() => setReviewRating(s)} id={`review-star-${s}`}>
                            <Star className={`h-6 w-6 transition-colors ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-neutral-200 hover:text-amber-300"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground block mb-1.5">Name (optional)</label>
                      <Input id="review-name-input" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Your name (optional)" className="h-10 text-sm rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-medium tracking-[0.08em] uppercase text-muted-foreground block mb-1.5">
                        {existingUserReview ? "Update your experience (optional)" : "Share your experience (optional)"}
                      </label>
                      <Textarea
                        id="review-comment-input"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={existingUserReview ? "Type new review comment to update..." : "Write your review here... (optional)"}
                        className="text-sm min-h-[90px] rounded-xl"
                      />
                    </div>
                    <Button
                      id="review-submit-btn"
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="h-11 bg-black text-white hover:bg-black/90 text-sm font-semibold tracking-[0.08em] uppercase rounded-xl w-full"
                    >
                      {submittingReview ? "Saving…" : existingUserReview ? "Update Review" : "Submit Rating"}
                    </Button>
                  </div>
                </div>
              );
            })()}
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
                            <span className="text-red-400 text-xs font-semibold">✕</span>
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
                            <span className="text-red-400 text-xs font-semibold">✕</span>
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
          COMPACT STICKY MOBILE CTA ON SCROLL
      ══════════════════════════════════════════ */}
      {product && (
        <div
          className={`fixed bottom-[60px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out lg:hidden ${
            showStickyBar ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-w-md mx-auto flex gap-2.5 items-center">
            <Button
              id="product-sticky-add-to-cart"
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 bg-black text-white hover:bg-black/90 text-xs font-semibold tracking-[0.08em] uppercase rounded-xl h-11 pd-ripple"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Add to Bag
            </Button>
            <Button
              id="product-sticky-buy-now"
              onClick={handleBuyNow}
              disabled={!inStock}
              variant="outline"
              className="flex-1 bg-white text-black border-black hover:bg-neutral-50 text-xs font-semibold tracking-[0.08em] uppercase rounded-xl h-11"
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
