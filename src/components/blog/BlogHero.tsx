import { motion } from "framer-motion";

const BlogHero = () => {
  return (
    <section className="bg-white pt-32 pb-16 md:pt-40 md:pb-20 border-b border-neutral-100 relative overflow-hidden">
      {/* Film Grain overlay */}
      <div className="absolute inset-0 noise-bg pointer-events-none z-10 select-none opacity-[0.015]" />
      <div className="max-w-5xl mx-auto px-6 lg:px-16 text-center relative z-20">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-4"
        >
          READ & LEARN
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-7xl font-heading text-neutral-800 leading-tight tracking-tight mb-6"
        >
          Hair Care Journal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-base text-neutral-400 font-body font-light leading-relaxed max-w-lg mx-auto"
        >
          Science-backed hair care education, ingredient guides, scalp health articles, routines and research.
        </motion.p>
      </div>
    </section>
  );
};

export default BlogHero;
