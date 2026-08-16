import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BlogHero from "@/components/blog/BlogHero";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { getAllBlogs, getCategories } from "@/lib/blog";
import { useSEO } from "@/hooks/useSEO";
import { BlogPost } from "@/types/blog";

const POSTS_PER_PAGE = 9;

const BlogList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  const [currentPage, setCurrentPage] = useState(1);
  
  const blogs = useMemo(() => getAllBlogs(), []);
  const categories = useMemo(() => ["All", ...getCategories()], []);
  
  const featuredBlog = useMemo(() => blogs.find(b => b.meta.featured) || blogs[0], [blogs]);

  useSEO({
    title: "Hair Care Journal",
    description: "Science-backed hair care education, ingredient guides, scalp health articles, routines and research from the Scalvea team.",
  });

  // Filter blogs based on search and category
  const filteredBlogs = useMemo(() => {
    let filtered = blogs;
    
    // Filter out the featured blog if we are on page 1 without search/category to avoid duplication
    // Wait, the prompt says "Automatically show the latest featured article." It's fine to keep it in the grid or remove it. We'll keep it in the grid for simplicity.
    
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

  const totalPages = Math.ceil(filteredBlogs.length / POSTS_PER_PAGE);
  const paginatedBlogs = filteredBlogs.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (activeCategory !== "All") params.set("category", activeCategory);
    setSearchParams(params, { replace: true });
    setCurrentPage(1); // Reset to page 1 on filter change
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
        {featuredBlog && currentPage === 1 && !searchQuery && activeCategory === "All" && (
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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                />
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur-sm text-neutral-800 text-[10px] uppercase tracking-[0.2em] font-semibold px-4 py-2 rounded-full shadow-sm">
                    Featured
                  </span>
                </div>
              </Link>
              
              <div className="p-8 md:p-12 flex flex-col justify-center md:w-1/2">
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-4">
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
                  className="inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all duration-300 w-fit"
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
                className="w-full h-12 pl-12 pr-4 bg-white border border-neutral-200 rounded-full text-sm font-light text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                    activeCategory === cat 
                      ? "bg-black text-white" 
                      : "bg-white text-neutral-500 border border-neutral-200 hover:border-black hover:text-black"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Grid */}
          {paginatedBlogs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedBlogs.map((post, index) => (
                  <BlogCard key={post.meta.slug} post={post} index={index} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        currentPage === i + 1 
                          ? "bg-black text-white" 
                          : "text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-full border border-neutral-200 text-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
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
