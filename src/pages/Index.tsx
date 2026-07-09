import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { ArrowRight, Star, Truck, Shield, Leaf, Check, Microscope, CheckCircle, Globe, Beaker } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { useSEO } from "@/hooks/useSEO";

// Asset imports
import follicle8Serum from "@/assets/follicle8-serum.png";
import follicle8Black from "@/assets/follicle8-black.png";
import client1 from "@/assets/client-1.jpg";
import client2 from "@/assets/client-2.jpg";
import client3 from "@/assets/client-3.jpg";
import client4 from "@/assets/client-4.jpg";
import client5 from "@/assets/client-5.jpg";
import heroAvif from "@/assets/hero.avif";
import heroVideo from "@/assets/hero-video.mp4";
import hero2 from "@/assets/hero2.png";
import hero3 from "@/assets/hero3.png";
import aboutMp4 from "@/assets/about.mp4";
import about1 from "@/assets/about1.png";
import about2 from "@/assets/about2.png";

// Testimonial reviews data
const REVIEWS = [
  { name: "Sarah M.", text: "After 8 weeks of using Follicle 8, I can visibly see new baby hairs growing along my hairline. Absolutely love it!", img: client1, location: "Melbourne, AU" },
  { name: "James K.", text: "Finally a brand that tells you exactly what's inside. My hair feels thicker and healthier than ever before.", img: client2, location: "Sydney, AU" },
  { name: "Priya R.", text: "I've tried many hair growth serums but Scalvea is the first one that actually delivered visible results.", img: client3, location: "Mumbai, IN" },
  { name: "Elena P.", text: "The non-greasy formula is amazing. I apply it before styling and it doesn't leave any residue.", img: client4, location: "Sydney, AU" },
  { name: "Marcus T.", text: "My scalp feels so much healthier. The shedding has decreased by at least 70% in 6 weeks.", img: client5, location: "Brisbane, AU" },
];

const MARQUEE_ITEMS = [
  { icon: Truck, text: "FREE SHIPPING" },
  { icon: Shield, text: "CLINICALLY PROVEN" },
  { icon: Microscope, text: "SCIENCE-BACKED FORMULAS" },
  { icon: Globe, text: "MADE IN AUSTRALIA" },
  { icon: Globe, text: "TRUSTED IN INDIA & AUSTRALIA" },
  { icon: Leaf, text: "CLEAN INGREDIENTS" },
  { icon: CheckCircle, text: "LAB TESTED" },
  { icon: Beaker, text: "REDENSYL • BAICAPIL • PROCAPIL • ANAGAIN" },
  { icon: Truck, text: "FAST SHIPPING" },
  { icon: Star, text: "PREMIUM HAIR CARE" },
];

// Helper CountUp Component
const CountUp = ({ value, duration = 1.8 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const totalMiliseconds = duration * 1000;
    const incrementTime = 40;
    const totalSteps = totalMiliseconds / incrementTime;
    const stepValue = end / totalSteps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count}</>;
};

const Index = () => {
  useSEO({
    title: "Premium Hair Growth Solutions",
    description: "Premium hair growth solutions backed by clinical research. Featuring Redensyl, Baicapil, Procapil and AnaGain for healthier, fuller-looking hair.",
    keywords: "hair growth serum, hair growth spray, scalp treatment, hair regrowth, Scalvea, Redensyl, Baicapil, Procapil, AnaGain",
    schema: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "name": "Scalvea",
          "url": "https://scalvea.com",
          "logo": "https://scalvea.com/logo.png",
          "sameAs": [
            "https://www.instagram.com/scalvea",
            "https://instagram.com/scalvea_",
            "https://www.facebook.com/scalvea"
          ]
        },
        {
          "@type": "WebSite",
          "name": "Scalvea",
          "url": "https://scalvea.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://scalvea.com/shop?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
      ]
    }
  });

  const [email, setEmail] = useState("");
  const { products, loading } = useProducts();
  const featured = products.filter((p) => p.featured);
  
  const [scrollY, setScrollY] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [scienceInView, setScienceInView] = useState(false);

  const scrollToProducts = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Scroll tracker for parallax
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Loading screen timer
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2800);

    return () => {
      lenis.destroy();
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      
      {/* 10. WEBSITE-WIDE PRE-LOADING ANIMATION */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Cinematic grain/noise overlay */}
            <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none" />
            
            {/* Ambient background light */}
            <div className="absolute w-[450px] h-[450px] rounded-full bg-amber-50/5 blur-[130px] top-1/4 left-1/3 animate-ambient-light pointer-events-none" />
            
            <div className="relative flex flex-col items-center space-y-8 z-10">
              {/* Coded Typography Logo with letter-by-letter reveal & subtle blur shift */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.4 } 
                  }
                }}
                className="flex items-center tracking-[0.35em] text-2xl md:text-3xl font-sans font-light uppercase select-none text-white/90 relative"
              >
                {"SCALVEA".split("").map((letter, idx) => (
                  <motion.span
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, filter: "blur(8px)", y: 8 },
                      visible: { 
                        opacity: 1, 
                        filter: "blur(0px)", 
                        y: 0,
                        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                      }
                    }}
                    className="inline-block"
                    style={{ textShadow: "0 0 10px rgba(255,255,255,0.06)" }}
                  >
                    {letter}
                  </motion.span>
                ))}
                
                {/* Subtle moving light streak pass overlay */}
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ delay: 1.5, duration: 1.2, ease: "easeInOut" }}
                  className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                />
              </motion.div>

              {/* Subtle Breathing Loading Bar */}
              <div className="w-32 h-[1px] bg-white/10 relative overflow-hidden">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ delay: 0.6, duration: 1.8, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white/40 w-1/3"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.02]" />

      {/* 1. HERO SECTION WITH POSTER IMAGE */}
      <section className="relative w-full overflow-hidden bg-white select-none">
        {/* Desktop/Laptop Hero Section */}
        <div className="relative w-full hidden md:block">
          <img
            src={heroAvif}
            alt="Scalvea - Science-Backed Care for Healthy Hair"
            loading="eager"
            fetchPriority="high"
            className="w-full h-auto block"
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          <a
            href="#products"
            onClick={scrollToProducts}
            className="absolute left-[4.17%] top-[87.39%] w-[16.81%] h-[5.87%] cursor-pointer z-30 transition-all duration-200 hover:bg-white/20 mix-blend-difference focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black rounded-none after:absolute after:-inset-y-4 after:-inset-x-6 after:content-['']"
            aria-label="Discover the Range"
          />
        </div>

        {/* Mobile/Tablet Hero Section */}
        <div className="relative w-full md:hidden">
          <img
            src={heroAvif}
            alt="Scalvea - Science-Backed Care for Healthy Hair"
            loading="eager"
            fetchPriority="high"
            className="w-full h-auto block"
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          {/* Note: The link coordinates below are configured for hero.avif. 
              Once you provide the custom mobile poster, you can adjust these percentage coordinates (left, top, width, height) 
              in Index.tsx to match where the button is in the new image. */}
          <a
            href="#products"
            onClick={scrollToProducts}
            className="absolute left-[4.17%] top-[87.39%] w-[16.81%] h-[5.87%] cursor-pointer z-30 transition-all duration-200 hover:bg-white/20 mix-blend-difference focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black rounded-none after:absolute after:-inset-y-6 after:-inset-x-10 after:content-['']"
            aria-label="Discover the Range"
          />
        </div>
      </section>

      {/* LUXURY TRUST MARQUEE STRIP */}
      <section className="bg-[#111111] border-y border-neutral-900 h-[84px] flex items-center overflow-hidden relative z-20 w-full select-none">
        <div className="animate-marquee-luxury flex items-center gap-16 md:gap-24 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div key={idx} className="flex items-center gap-4 text-white shrink-0">
                <IconComponent className="size-[18px] md:size-[20px] text-white/85" />
                <span className="text-[11px] md:text-[12px] tracking-[0.2em] uppercase font-semibold text-white">
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. BEST SELLERS / PRODUCTS SECTION */}
      <section id="products" className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                BEST SELLERS
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                Our Products
              </h2>
            </div>
            <Link 
              to="/shop" 
              className="text-[10px] tracking-[0.15em] uppercase text-black hover:opacity-60 transition-opacity flex items-center gap-2 font-medium w-fit border-b border-black/15 pb-1"
            >
              View Collection <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            // Mobile horizontal swipe, Desktop 3-column grid
            <div className="overflow-x-auto flex md:grid md:grid-cols-3 gap-8 pb-6 md:pb-0 scrollbar-none snap-x snap-mandatory">
              {(featured.length > 0 ? featured : products.slice(0, 3)).map((product) => (
                <div key={product.id} className="min-w-[280px] md:min-w-0 flex-shrink-0 snap-start w-[85%] md:w-auto">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. PHILOSOPHY SECTION */}
      <section className="bg-[#fafafa] py-16 md:py-24 lg:py-32 overflow-hidden border-t border-border/30 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Image Container (Left side) */}
            <div className="lg:col-span-7 relative overflow-hidden group border border-border/20 shadow-2xl">
              <motion.div
                initial={{ scale: 1.04, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-[4/3] w-full"
              >
                <img
                  src={about1}
                  alt="Scalvea Scientific Lab Ingredients Setup"
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-103"
                />
              </motion.div>
            </div>
            
            {/* Text Overlay Card (Right side, Overlapping Glassmorphism) */}
            <div className="lg:col-span-5 relative z-10 lg:-ml-24">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 md:p-12 shadow-2xl"
              >
                <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                  OUR PHILOSOPHY
                </span>
                <h2 className="text-3xl md:text-4xl leading-tight editorial-heading mb-6">
                  Transparency in Every Drop
                </h2>
                <div className="space-y-4 text-xs md:text-sm text-neutral-500 font-light leading-relaxed">
                  <p>
                    At Scalvea, we believe in full ingredient transparency. Every formula is backed by clinical research and contains only what your hair needs.
                  </p>
                  <p>
                    Our Follicle 8 range combines four clinically validated hair growth actives at effective concentrations, free from fillers or hidden chemicals.
                  </p>
                </div>
                <div className="mt-8">
                  <Link 
                    to="/about" 
                    className="text-[10px] tracking-[0.15em] uppercase text-black hover:opacity-60 transition-opacity flex items-center gap-2 font-medium"
                  >
                    Learn More <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SCIENTIFIC LAB VIDEO BANNER SECTION */}
      <section className="relative h-[65vh] min-h-[420px] w-full overflow-hidden bg-black flex items-center justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src={aboutMp4} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="relative z-10 text-center max-w-xl px-6">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
            className="space-y-4"
          >
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-light block">
              SCIENTIFIC CLINICAL LABS
            </span>
            <h3 className="text-2xl md:text-3xl font-light text-white editorial-heading tracking-wide leading-tight">
              Formulated in Advanced Laboratories
            </h3>
            <p className="text-xs text-neutral-300 font-light max-w-md mx-auto leading-relaxed">
              Every active ingredient is verified using gas chromatography and bio-assays to ensure potency, purity, and clinical efficacy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4. INGREDIENTS / SCIENCE SECTION */}
      <section id="ingredients" className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-white border-y border-border/30">
        {/* Faded Scientific Background Image */}
        <div className="absolute inset-0 z-0 opacity-15 select-none pointer-events-none">
          <img
            src={hero2}
            alt="Ingredients science microscopic texture"
            className="w-full h-full object-cover scale-105 animate-cinematic-zoom"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-16 md:mb-24">
            <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
              CLINICALLY PROVEN ACTIVES
            </span>
            <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
              The Science Behind Follicle 8
            </h2>
            <div className="h-[1px] bg-neutral-200 w-24 mx-auto mt-6" />
          </div>

          <motion.div
            onViewportEnter={() => setScienceInView(true)}
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-12 max-w-5xl mx-auto"
          >
            {[
              { name: "Redensyl", pct: 3, desc: "Targets hair follicle stem cells to reactivate growth" },
              { name: "Baicapil", pct: 3, desc: "Strengthens and nourishes hair from root to tip" },
              { name: "Procapil", pct: 3, desc: "Prevents follicle aging and improves hair anchoring" },
              { name: "Anagain", pct: 4, desc: "Stimulates dermal papilla cells for new hair growth" },
            ].map((ingredient, i) => (
              <motion.div
                key={ingredient.name}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                className="text-center flex flex-col items-center p-3 sm:p-6 border border-neutral-100 bg-white/60 backdrop-blur-sm shadow-sm"
              >
                <div className="text-4xl md:text-5xl font-light text-neutral-900 mb-3 flex items-baseline">
                  {scienceInView ? <CountUp value={ingredient.pct} /> : "0"}
                  <span className="text-lg md:text-xl font-light text-neutral-500">%</span>
                </div>
                <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-neutral-900 mb-2 font-mono">
                  {ingredient.name}
                </p>
                <p className="text-[10px] text-neutral-500 leading-relaxed font-light">
                  {ingredient.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. TESTIMONIAL MARQUEE SECTION */}
      <section className="bg-black text-white py-16 md:py-24 lg:py-32 overflow-hidden relative">
        <div className="absolute inset-0 noise-bg opacity-[0.02] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-16 mb-16">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-light block mb-3">
              REAL CLIENT RESULTS
            </span>
            <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-100">
              What Our Customers Say
            </h2>
          </div>
        </div>

        {/* Infinite marquee block */}
        <div className="relative w-full flex items-center justify-start overflow-hidden py-6 border-y border-neutral-900 bg-neutral-950/40">
          <div className="animate-marquee-scroll flex gap-6 pr-6">
            {[...REVIEWS, ...REVIEWS].map((t, idx) => (
              <div 
                key={idx} 
                className="w-[280px] md:w-[350px] shrink-0 bg-neutral-900/60 backdrop-blur-md border border-neutral-800/40 p-6 md:p-8 flex flex-col space-y-4 hover:border-amber-100/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500"
              >
                <div className="flex items-center gap-4">
                  <img 
                    src={t.img} 
                    alt={t.name} 
                    className="w-12 h-12 rounded-full object-cover border border-neutral-800" 
                    loading="lazy" 
                  />
                  <div>
                    <p className="text-[10px] tracking-[0.12em] uppercase font-medium text-neutral-200">{t.name}</p>
                    <p className="text-[9px] tracking-[0.08em] uppercase text-neutral-500">{t.location}</p>
                  </div>
                </div>
                
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-amber-100/90 text-amber-100/90" />
                  ))}
                </div>
                
                <p className="text-xs leading-relaxed text-neutral-400 font-light italic">
                  "{t.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW TO USE TIMELINE */}
      <section className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-20">
            <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
              SIMPLE ROUTINE
            </span>
            <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
              How To Use
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connect line */}
            <div className="absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-neutral-100 hidden md:block z-0 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative z-10">
              {[
                { step: "01", title: "Apply", desc: "Apply 1ml directly to the scalp in thinning areas" },
                { step: "02", title: "Massage", desc: "Gently massage for 1-2 minutes to improve absorption" },
                { step: "03", title: "Repeat", desc: "Use twice daily for best results. Results in 8-12 weeks" },
              ].map((s, i) => (
                <motion.div 
                  key={s.step} 
                  initial={{ y: 40, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  className="text-center flex flex-col items-center"
                >
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.2 + 0.3 }}
                    className="w-14 h-14 rounded-full bg-[#fafafa] border border-neutral-100 flex items-center justify-center text-sm font-light text-neutral-900 mb-6 shadow-sm font-mono"
                  >
                    {s.step}
                  </motion.div>
                  <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-neutral-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-[200px]">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. LIFESTYLE / CTA SECTION */}
      <section className="bg-[#fafafa] py-16 md:py-24 lg:py-32 overflow-hidden border-t border-border/30 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text details (Left side) */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="space-y-6 order-2 lg:order-1 text-center lg:text-left"
            >
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block">
                START YOUR JOURNEY
              </span>
              <h2 className="text-4xl md:text-5xl leading-tight editorial-heading text-neutral-900">
                Your Hair<br className="hidden md:block" /> Deserves Science
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                Join thousands of customers who have transformed their hair with clinically proven ingredients. See visible density and thickness in as little as 8 weeks.
              </p>
              <div className="pt-4 flex justify-center lg:justify-start">
                <Link 
                  to="/shop" 
                  className="group relative overflow-hidden h-12 px-10 flex items-center justify-center text-[10px] tracking-[0.2em] uppercase font-medium bg-black text-white hover:text-black transition-all duration-500 hover:-translate-y-0.5 transform border border-black shadow-lg"
                >
                  <span className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
                  <span className="relative z-10">Shop Follicle 8</span>
                </Link>
              </div>
            </motion.div>

            {/* Lifestyle Image setup (Right side) */}
            <div className="relative overflow-hidden group border border-border/20 shadow-2xl order-1 lg:order-2">
              <motion.div
                initial={{ scale: 1.05, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="aspect-[4/3] w-full"
              >
                <img
                  src={hero3}
                  alt="Premium lifestyle hair oil application woman"
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-104"
                />
              </motion.div>
              <div className="absolute inset-0 bg-amber-500/5 mix-blend-color-burn pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER SIGNUP SECTION */}
      <section className="bg-white py-16 md:py-24 lg:py-32 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fafafa] to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-lg mx-auto text-center px-6">
          <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
            STAY UPDATED
          </span>
          <h2 className="text-3xl md:text-4xl leading-tight editorial-heading mb-4 text-neutral-900">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-xs text-neutral-500 font-light mb-8 max-w-sm mx-auto leading-relaxed">
            Be the first to know about new products, special offers, and hair care tips.
          </p>
          
          <form 
            onSubmit={(e) => { e.preventDefault(); setEmail(""); }} 
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 h-11 px-4 text-xs bg-transparent border border-neutral-300 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none"
              required
            />
            <button 
              type="submit" 
              className="h-11 px-8 bg-black text-white hover:bg-neutral-900 transition-colors text-[9px] tracking-[0.2em] uppercase font-medium flex items-center justify-center rounded-none"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
