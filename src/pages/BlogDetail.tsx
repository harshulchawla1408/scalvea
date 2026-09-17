import { useMemo, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import slugify from "slugify";
import { format } from "date-fns";
import { ArrowLeft, ChevronRight } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { BlogCard } from "@/components/blog/BlogCard";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/blog";
import { useSEO } from "@/hooks/useSEO";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const post = useMemo(() => getBlogBySlug(slug || ""), [slug]);
  const relatedPosts = useMemo(() => post ? getRelatedBlogs(post.meta.slug, post.meta.category, 3) : [], [post]);

  useSEO(post ? {
    title: post.meta.seoTitle || `${post.meta.title} | Scalvea`,
    description: post.meta.seoDescription || post.meta.description,
    keywords: post.meta.focusKeyword ? `${post.meta.focusKeyword}, scalvea blog` : post.meta.tags.join(", "),
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.meta.title,
      "image": [
        `https://scalvea.com${post.meta.featuredImage}`
      ],
      "datePublished": post.meta.date,
      "dateModified": post.meta.updated || post.meta.date,
      "author": [{
        "@type": "Organization",
        "name": post.meta.author
      }]
    }
  } : { title: "Blog Not Found" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blogs" replace />;
  }

  // Custom renderer for headings to add IDs for the TOC and responsive tables
  const components = {
    h2: ({ node, children, ...props }: any) => {
      const id = slugify(String(children), { lower: true, strict: true });
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }: any) => {
      const id = slugify(String(children), { lower: true, strict: true });
      return <h3 id={id} {...props}>{children}</h3>;
    },
    table: ({ node, ...props }: any) => (
      <div className="w-full my-8 max-w-full">
        {/* Mobile horizontal scroll hint */}
        <div className="sm:hidden flex items-center justify-between text-[11px] text-neutral-400 font-medium mb-1.5 px-0.5 select-none">
          <span className="uppercase tracking-wider">Comparison Table</span>
          <span className="text-[10px] text-neutral-500 font-normal">Scroll horizontally ➔</span>
        </div>
        <div className="w-full overflow-x-auto rounded-xl border border-neutral-200/90 bg-white shadow-sm -webkit-overflow-scrolling-touch scrollbar-thin">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm m-0" {...props} />
        </div>
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead className="bg-[#F8F8F6] text-neutral-900 border-b border-neutral-200" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th className="px-4 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-800 text-left border-b border-neutral-200" {...props} />
    ),
    tbody: ({ node, ...props }: any) => (
      <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700" {...props} />
    ),
    tr: ({ node, ...props }: any) => (
      <tr className="hover:bg-neutral-50/70 transition-colors" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="px-4 py-3 text-xs sm:text-sm text-neutral-600 align-top leading-relaxed" {...props} />
    ),
    pre: ({ node, ...props }: any) => (
      <div className="w-full overflow-x-auto my-6 rounded-xl border border-neutral-200 bg-neutral-900 p-4 text-neutral-100 text-xs sm:text-sm -webkit-overflow-scrolling-touch">
        <pre {...props} />
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-body w-full max-w-full overflow-x-hidden">
      <ReadingProgress />
      <Header />
      
      <main className="flex-1 pt-20 sm:pt-24 pb-0 w-full max-w-full overflow-x-hidden">
        
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-16 pt-6 sm:pt-8 pb-4 w-full">
          <nav className="flex items-center gap-2 text-xs sm:text-[13px] uppercase tracking-[0.06em] font-medium text-neutral-400 flex-wrap">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link to="/blogs" className="hover:text-black transition-colors">Journal</Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-neutral-800 line-clamp-1">{post.meta.title}</span>
          </nav>
        </div>
        
        {/* Hero */}
        <article className="w-full max-w-full overflow-x-hidden">
          <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-16 text-center pt-6 sm:pt-8 pb-8 sm:pb-12 w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-neutral-100 text-neutral-800 text-[10px] uppercase tracking-[0.2em] font-medium px-4 py-2 rounded-full mb-6 sm:mb-8">
                {post.meta.category}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-neutral-900 leading-tight mb-6 sm:mb-8 break-words"
            >
              {post.meta.title}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-light text-neutral-500 uppercase tracking-wider"
            >
              <span>By {post.meta.author}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{format(new Date(post.meta.date), "MMM d, yyyy")}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{post.meta.readingTime}</span>
            </motion.div>
          </header>
          
          {/* Featured Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-16 mb-10 sm:mb-16 w-full"
          >
            <div className="w-full aspect-[16/10] sm:aspect-[2/1] md:aspect-[2.5/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-neutral-100 relative">
              <img 
                src={post.meta.featuredImage} 
                alt={post.meta.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
          </motion.div>
          
          {/* Content Layout */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 pb-16 sm:pb-20 w-full">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start w-full">
              
              {/* Share & TOC (Desktop Left Sidebar) */}
              <div className="hidden lg:flex lg:w-64 flex-col gap-10 shrink-0 sticky top-24">
                <ShareButtons url={typeof window !== "undefined" ? window.location.href : `https://scalvea.com/blogs/${post.meta.slug}`} title={post.meta.title} />
                <TableOfContents content={post.content} />
              </div>
              
              {/* Main Content */}
              <div className="w-full min-w-0 max-w-full lg:max-w-[700px] flex-1">
                <div className="prose prose-neutral prose-base sm:prose-lg prose-headings:font-heading prose-headings:font-medium prose-p:font-light prose-p:leading-relaxed prose-a:text-black prose-a:underline-offset-4 hover:prose-a:text-neutral-500 prose-img:rounded-2xl max-w-none w-full min-w-0 break-words">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
                
                {/* Tags & Mobile Share */}
                <div className="mt-12 sm:mt-16 pt-8 border-t border-neutral-100">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                      {post.meta.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="lg:hidden">
                      <ShareButtons url={typeof window !== "undefined" ? window.location.href : `https://scalvea.com/blogs/${post.meta.slug}`} title={post.meta.title} />
                    </div>
                  </div>
                </div>
                
                {/* Back to blogs */}
                <div className="mt-10 sm:mt-12">
                  <Link 
                    to="/blogs"
                    className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] font-semibold text-neutral-600 hover:text-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Journal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
        
        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="bg-[#F9F9F7] py-16 sm:py-20 border-t border-neutral-100/50 w-full overflow-x-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-2">
                    KEEP READING
                  </span>
                  <h3 className="text-3xl font-heading text-neutral-900 leading-tight">
                    Related Articles
                  </h3>
                </div>
                <Link 
                  to="/blogs"
                  className="hidden md:inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-[0.08em] font-semibold text-neutral-900 hover:text-neutral-500 transition-colors"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((post, i) => (
                  <BlogCard key={post.meta.slug} post={post} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
        
        <NewsletterCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogDetail;
