import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
    title: categoryFilter ? `${categoryFilter} Collection` : "Shop Premium Hair Care",
    description: categoryFilter 
      ? `Explore our range of premium ${categoryFilter.toLowerCase()} formulated with active ingredients to restore hair density.` 
      : "Shop Scalvea's premium clinical hair growth serums, sprays, and treatments. Free shipping globally.",
    keywords: `hair growth shop, hair serum shop, Scalvea products, Redensyl, Baicapil, AnaGain, hair regrowth${categoryFilter ? `, ${categoryFilter}` : ""}`,
    canonical: categoryFilter ? `https://scalvea.com/shop?category=${encodeURIComponent(categoryFilter)}` : "https://scalvea.com/shop"
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.04em] mb-2">
            {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} products</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border">
          <div className="flex gap-6">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-xs tracking-[0.12em] uppercase transition-opacity ${activeCategory === cat ? "opacity-100" : "opacity-40 hover:opacity-70"}`}>
                {cat}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs tracking-[0.08em] uppercase bg-transparent border border-border px-3 py-2 outline-none">
            <option value="default">Sort By</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20"><p className="text-sm text-muted-foreground">No products found</p></div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
