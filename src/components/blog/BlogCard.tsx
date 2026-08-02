import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { BlogPost } from "@/types/blog";

export const BlogCard = ({ post, index = 0 }: { post: BlogPost; index?: number }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-neutral-200 transition-all duration-500"
    >
      <Link to={`/blogs/${post.meta.slug}`} className="block relative overflow-hidden aspect-[16/10]">
        <img 
          src={post.meta.featuredImage} 
          alt={post.meta.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
          loading="lazy"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-neutral-800 text-[9px] uppercase tracking-[0.2em] font-medium px-3 py-1.5 rounded-full shadow-sm">
            {post.meta.category}
          </span>
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-3">
          <span>{format(new Date(post.meta.date), "MMM d, yyyy")}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span>{post.meta.readingTime}</span>
        </div>
        
        <Link to={`/blogs/${post.meta.slug}`} className="group-hover:text-black transition-colors">
          <h3 className="text-xl font-heading text-neutral-900 leading-tight mb-3 line-clamp-2">
            {post.meta.title}
          </h3>
        </Link>
        
        <p className="text-sm text-neutral-500 font-light leading-relaxed mb-6 line-clamp-3 flex-1">
          {post.meta.description}
        </p>
        
        <Link 
          to={`/blogs/${post.meta.slug}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors mt-auto w-fit"
        >
          Read Article
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.article>
  );
};
