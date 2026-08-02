import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const NewsletterCTA = () => {
  return (
    <section className="bg-black py-20 px-6 lg:px-16 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-white/5 blur-[120px] rounded-full rotate-12" />
      </div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-4"
        >
          STAY INFORMED
        </motion.span>
        
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-heading text-white leading-tight mb-6"
        >
          Elevate Your Hair Care Knowledge
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-neutral-400 font-body font-light leading-relaxed max-w-xl mx-auto mb-10"
        >
          Explore more of our science-backed educational content and take control of your hair health journey.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link 
            to="/shop"
            className="inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-neutral-200 transition-colors group"
          >
            Explore Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
