import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BlogHero from "@/components/blog/BlogHero";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { getAllBlogs, getCategories } from "@/lib/blog";
import { useSEO } from "@/hooks/useSEO";
import { BlogPost } from "@/types/blog";

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  
  const blogs = useMemo(() => getAllBlogs(), []);
  const categories = useMemo(() => ["All", ...getCategories()], []);
  
  const featuredBlog = useMemo(() => blogs.find(b => b.meta.featured) || blogs[0], [blogs]);

  useSEO({
    title: "Hair Care Journal | Hair Growth, Scalp Care & Ingredient Guides",
    description: "Science-backed hair care articles, scalp health guides, ingredient breakdowns, and hair growth research from the Scalvea team. Practical advice for Australia & India.",
    canonical: "https://scalvea.com/blogs",
  });

  // Filter blogs based on search and category
  const filteredBlogs = useMemo(() => {
    let filtered = blogs;
    
    if (activeCategory !== "All") {
      filtered = filtered.filter(b => b.meta.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.meta.title.toLowerCase().includes(q) ||
        b.meta.description.toLowerCase().includes(q) ||
        b.meta.category.toLowerCase().includes(q) ||
        b.meta.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [blogs, activeCategory, searchQuery]);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategory !== "All") params.set("category", activeCategory);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeCategory, setSearchParams]);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col font-body">
      <Header />
      
      <main className="flex-1">
        <BlogHero />
        
        {/* Featured Blog */}
        {featuredBlog && !searchQuery && activeCategory === "All" && (
          <section className="max-w-6xl mx-auto px-6 lg:px-16 py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-3xl overflow-hidden border border-neutral-100 flex flex-col md:flex-row hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-neutral-200 transition-all duration-500 group"
            >
              <Link to={`/blogs/${featuredBlog.meta.slug}`} className="md:w-1/2 relative overflow-hidden aspect-square md:aspect-auto h-full min-h-[300px]">
                <img 
                  src={featuredBlog.meta.featuredImage} 
                  alt={featuredBlog.meta.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-luxury"
                />
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur-sm text-neutral-800 text-[10px] uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full shadow-sm">
                    Featured
                  </span>
                </div>
              </Link>
              
              <div className="p-8 md:p-12 flex flex-col justify-center md:w-1/2">
                <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium mb-4">
                  <span>{featuredBlog.meta.category}</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span>{format(new Date(featuredBlog.meta.date), "MMM d, yyyy")}</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span>{featuredBlog.meta.readingTime}</span>
                </div>
                
                <Link to={`/blogs/${featuredBlog.meta.slug}`}>
                  <h2 className="text-2xl md:text-4xl font-heading text-neutral-900 leading-tight mb-4 group-hover:text-black transition-colors">
                    {featuredBlog.meta.title}
                  </h2>
                </Link>
                
                <p className="text-sm md:text-base text-neutral-500 font-light leading-relaxed mb-8 line-clamp-3">
                  {featuredBlog.meta.description}
                </p>
                
                <Link 
                  to={`/blogs/${featuredBlog.meta.slug}`}
                  className="inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-[0.1em] font-semibold hover:bg-neutral-800 transition-all duration-300 w-fit"
                >
                  Read Article
                </Link>
              </div>
            </motion.div>
          </section>
        )}

        {/* Filters and Grid */}
        <section className="max-w-6xl mx-auto px-6 lg:px-16 py-12 border-t border-neutral-100/50">
          
          <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center mb-12">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-neutral-200 rounded-full text-sm font-light text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-[0.08em] font-medium transition-all duration-300 ${
                    activeCategory === cat 
                      ? "bg-black text-white" 
                      : "bg-white text-neutral-600 border border-neutral-200 hover:border-black hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Grid */}
          {filteredBlogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((post, index) => (
                <BlogCard key={post.meta.slug} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-neutral-500 font-light">No articles found matching your criteria.</p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
                className="mt-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-black border-b border-black pb-1 hover:text-neutral-500 hover:border-neutral-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

        </section>
        
        <NewsletterCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogList;
