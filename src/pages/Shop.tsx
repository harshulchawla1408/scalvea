import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/contexts/CountryContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");

  useSEO({
    title: "Hair Care Products | Hair Growth Serums | Scalvea",
    description: "Shop Scalvea's science-backed hair growth serums & anti-dandruff treatments. Clinically researched ingredients. Free shipping to AU & IN.",
    canonical: "https://scalvea.com/shop"
  });

  const [sortBy, setSortBy] = useState("default");
  const { products, loading } = useProducts();
  const { getPrice } = useCountry();

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ["All", ...cats];
  }, [products]);

  const [activeCategory, setActiveCategory] = useState(categoryFilter || "All");

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory !== "All") result = result.filter((p) => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (sortBy === "price-low") result = [...result].sort((a, b) => getPrice(a.price_aud, a.price_inr, a.price_usd) - getPrice(b.price_aud, b.price_inr, b.price_usd));
    if (sortBy === "price-high") result = [...result].sort((a, b) => getPrice(b.price_aud, b.price_inr, b.price_usd) - getPrice(a.price_aud, a.price_inr, a.price_usd));
    if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [activeCategory, sortBy, searchQuery, products, getPrice]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-body text-neutral-900">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="text-[11px] sm:text-xs text-neutral-500 mb-2.5 sm:mb-3.5 flex items-center gap-1.5 font-mono tracking-wider uppercase">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-medium">Shop</span>
        </nav>

        {/* Page Title & Count */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-[34px] font-normal font-heading tracking-tight text-neutral-900 leading-[1.2] mb-1">
            {searchQuery ? `Results for "${searchQuery}"` : "Hair Growth Serums & Scalp Care Products"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-body font-light">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Category Tabs + Sort Row */}
        <div className="flex flex-row justify-between items-center gap-3 mb-6 sm:mb-8 pb-3 border-b border-neutral-200/80">
          {/* Category Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs sm:text-[13px] font-medium tracking-[0.08em] uppercase transition-all shrink-0 pb-1.5 relative ${
                  activeCategory === cat
                    ? "text-black font-semibold"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div
                    layoutId="activeCategoryIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[10.5px] sm:text-xs font-mono font-medium tracking-wider uppercase bg-white border border-neutral-200/90 hover:border-black text-neutral-800 pl-2.5 pr-6 py-1.5 rounded-md outline-none cursor-pointer transition-colors appearance-none shadow-2xs"
              aria-label="Sort products"
            >
              <option value="default">SORT BY</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-500">
              ▾
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className={filtered.length <= 2 ? "grid grid-cols-2 max-w-3xl lg:max-w-4xl mx-auto gap-3.5 sm:gap-6 lg:gap-8" : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8"}>
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3 bg-white p-3 rounded-2xl border border-neutral-100 shadow-2xs">
                <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className={filtered.length <= 2 ? "grid grid-cols-2 max-w-3xl lg:max-w-4xl mx-auto gap-3.5 sm:gap-6 lg:gap-8 items-stretch" : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8 items-stretch"}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-20">
            <p className="text-sm text-neutral-500 font-light">No products found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
