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

  // Custom renderer for headings to add IDs for the TOC
  const components = {
    h2: ({ node, children, ...props }: any) => {
      const id = slugify(String(children), { lower: true, strict: true });
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }: any) => {
      const id = slugify(String(children), { lower: true, strict: true });
      return <h3 id={id} {...props}>{children}</h3>;
    },
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-body">
      <ReadingProgress />
      <Header />
      
      <main className="flex-1 pt-24 pb-0">
        
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-6 lg:px-16 pt-8 pb-4">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium text-neutral-400">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/blogs" className="hover:text-black transition-colors">Journal</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-neutral-800 line-clamp-1">{post.meta.title}</span>
          </nav>
        </div>
        
        {/* Hero */}
        <article>
          <header className="max-w-4xl mx-auto px-6 lg:px-16 text-center pt-8 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-neutral-100 text-neutral-800 text-[10px] uppercase tracking-[0.2em] font-medium px-4 py-2 rounded-full mb-8">
                {post.meta.category}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-heading text-neutral-900 leading-tight mb-8"
            >
              {post.meta.title}
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 text-xs font-light text-neutral-500 uppercase tracking-wider"
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
            className="max-w-5xl mx-auto px-6 lg:px-16 mb-16"
          >
            <div className="w-full aspect-[2/1] md:aspect-[2.5/1] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.08)] bg-neutral-100 relative">
              <img 
                src={post.meta.featuredImage} 
                alt={post.meta.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            </div>
          </motion.div>
          
          {/* Content Layout */}
          <div className="max-w-6xl mx-auto px-6 lg:px-16 pb-20">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              
              {/* Share & TOC (Desktop Left Sidebar) */}
              <div className="hidden lg:flex lg:w-64 flex-col gap-10 shrink-0 sticky top-24">
                <ShareButtons url={window.location.href} title={post.meta.title} />
                <TableOfContents content={post.content} />
              </div>
              
              {/* Main Content */}
              <div className="w-full lg:max-w-[700px] shrink-0">
                <div className="prose prose-neutral prose-lg prose-headings:font-heading prose-headings:font-medium prose-p:font-light prose-p:leading-relaxed prose-a:text-black prose-a:underline-offset-4 hover:prose-a:text-neutral-500 prose-img:rounded-2xl max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                    components={components}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>
                
                {/* Tags & Mobile Share */}
                <div className="mt-16 pt-8 border-t border-neutral-100">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                      {post.meta.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="lg:hidden">
                      <ShareButtons url={window.location.href} title={post.meta.title} />
                    </div>
                  </div>
                </div>
                
                {/* Back to blogs */}
                <div className="mt-12">
                  <Link 
                    to="/blogs"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium text-neutral-500 hover:text-black transition-colors"
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
          <section className="bg-[#F9F9F7] py-20 border-t border-neutral-100/50">
            <div className="max-w-6xl mx-auto px-6 lg:px-16">
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
                  className="hidden md:inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium text-neutral-900 hover:text-neutral-500 transition-colors"
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
