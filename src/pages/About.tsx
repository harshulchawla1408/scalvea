import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ShieldCheck, ClipboardCheck, Microscope, HeartHandshake, ArrowRight } from "lucide-react";

// Asset imports
import aboutMp4 from "@/assets/about.mp4";
import about1 from "@/assets/about1.png";
import about2 from "@/assets/about2.png";
import about3 from "@/assets/about3.png";
import hero3 from "@/assets/hero3.png";
import client1 from "@/assets/client-1.jpg";
import client2 from "@/assets/client-2.jpg";
import client3 from "@/assets/client-3.jpg";
import client4 from "@/assets/client-4.jpg";
import client5 from "@/assets/client-5.jpg";

const About = () => {
  const [scrollY, setScrollY] = useState(0);

  // Monitor scroll for subtle parallax effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Header />

      {/* Global Grain Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <main className="relative z-10">
        
        {/* 1. CINEMATIC HERO SECTION */}
        <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-black flex items-center justify-center">
          {/* Looped Background Video */}
          <div 
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            >
              <source src={aboutMp4} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
          </div>

          {/* Centered Content */}
          <div className="relative z-10 text-center max-w-3xl px-6 space-y-6 pt-16">
            <div 
              className="h-[1px] bg-white/20 w-16 mx-auto animate-draw-line" 
              style={{ animationDelay: "0.2s" }} 
            />
            
            {/* Animated Word */}
            <motion.h1 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="text-[44px] md:text-[68px] lg:text-[84px] leading-tight text-white editorial-heading tracking-wide uppercase select-none"
            >
              {"NOTHING TO HIDE".split(" ").map((word, wIdx) => (
                <span key={wIdx} className="inline-block mr-4 last:mr-0">
                  {word.split("").map((letter, lIdx) => (
                    <motion.span
                      key={lIdx}
                      variants={{
                        hidden: { opacity: 0, filter: "blur(8px)", y: 5 },
                        visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 1, ease: "easeOut" } }
                      }}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="text-xs md:text-sm tracking-[0.2em] text-neutral-300 font-light uppercase"
            >
              Australian science. Global confidence.
            </motion.p>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 1.2 }}
              className="text-xs md:text-sm text-neutral-400 font-light max-w-lg mx-auto leading-relaxed"
            >
              Clinically backed hair care created for real results, ingredient transparency, and modern hair wellness.
            </motion.p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1.5 }}
              className="text-[9px] tracking-[0.25em] text-neutral-500 font-light uppercase pt-4"
            >
              Designed in Australia. Trusted across Australia & India.
            </motion.p>
          </div>
        </section>

        {/* 2. BRAND STORY SECTION */}
        <section className="bg-white py-24 md:py-32 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Portrait Brand Image (Left) */}
              <div className="lg:col-span-6 relative overflow-hidden group shadow-2xl border border-neutral-100">
                <motion.div
                  initial={{ scale: 1.05, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 1.4 }}
                  className="aspect-[3/4] w-full"
                >
                  <img
                    src={hero3}
                    alt="Scalvea Clean Hair Care Ritual"
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-103"
                  />
                </motion.div>
              </div>

              {/* Editorial story text (Right) */}
              <div className="lg:col-span-6 space-y-6 lg:pl-6">
                <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block">
                  THE FOUNDATION
                </span>
                <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                  Why SCALVEA Exists
                </h2>
                <div className="h-[1px] bg-neutral-200 w-20" />
                
                <div className="space-y-6 text-xs md:text-sm text-neutral-500 font-light leading-relaxed">
                  <p>
                    SCALVEA was established with a singular, clear directive: to strip away the mystery surrounding hair loss treatments and provide honest, clinical formulations that actually work.
                  </p>
                  <p>
                    For years, cosmetic and wellness companies have hidden behind proprietary chemical blends, complex formulas, and inflated claims. We set out to change that by listing exactly what goes into each bottle, down to the precise percentages.
                  </p>
                  <p className="border-l-2 border-neutral-900 pl-4 py-1 text-neutral-800 font-normal italic">
                    "Created in Australia with globally trusted standards and thoughtfully introduced for customers across India and beyond."
                  </p>
                  <p>
                    Whether in Melbourne or Mumbai, our community shares a common desire: premium, science-first hair care that respects their intelligence and wellness values.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. AUSTRALIA + INDIA GLOBAL PRESENCE SECTION */}
        <section className="bg-black text-white py-24 md:py-32 relative overflow-hidden">
          {/* Subtle world map ambient layout */}
          <div className="absolute inset-0 bg-neutral-950/40" />
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.015] blur-[150px] pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Country descriptors & statistics */}
              <div className="lg:col-span-5 space-y-8">
                <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-500 font-light block">
                  GLOBAL PATHWAYS
                </span>
                <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-100">
                  Australia to India.<br />A Shared Journey.
                </h2>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  From Melbourne to Mumbai, SCALVEA is building a modern hair care movement rooted in transparency and scientific integrity. We bridge Australian formulation benchmarks with global hair needs.
                </p>
                
                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-light font-mono text-neutral-100">100%</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-neutral-500 font-medium">AU Sourced Standards</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-light font-mono text-neutral-100">15k+</p>
                    <p className="text-[9px] tracking-[0.15em] uppercase text-neutral-500 font-medium">Active Users Worldwide</p>
                  </div>
                </div>
              </div>

              {/* Asymmetric Map Visual Frame */}
              <div className="lg:col-span-7 relative h-[380px] md:h-[450px] border border-neutral-800 bg-neutral-900/20 backdrop-blur-md flex flex-col justify-between p-8 md:p-12 overflow-hidden shadow-2xl">
                
                {/* Visual coordinate graphics */}
                <div className="absolute top-6 right-6 font-mono text-[9px] text-neutral-600 space-y-1 select-none">
                  <p>LAT: -37.8136° S (MEL)</p>
                  <p>LAT: 19.0760° N (BOM)</p>
                </div>

                {/* Locator Dot 1: Melbourne */}
                <div className="relative mt-8 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white relative">
                      <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                    </div>
                    <span className="text-xs tracking-[0.2em] uppercase font-semibold text-neutral-200 font-sans">Melbourne, Australia</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-light max-w-xs pl-5">
                    Our formulation base. Clean lab testing, research approvals, and shipping operations.
                  </p>
                </div>

                {/* Connecting Line vector representation */}
                <div className="h-[100px] w-[1px] bg-gradient-to-b from-neutral-800 via-white/20 to-neutral-800 ml-1.5 select-none" />

                {/* Locator Dot 2: Mumbai */}
                <div className="relative mb-8 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-white relative">
                      <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                    </div>
                    <span className="text-xs tracking-[0.2em] uppercase font-semibold text-neutral-200 font-sans">Mumbai, India</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-light max-w-xs pl-5">
                    Direct local distribution hubs, regional customer service, and dual-currency support channels.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 4. SCIENTIFIC PHILOSOPHY SECTION */}
        <section className="bg-[#fafafa] py-24 md:py-32 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center max-w-xl mx-auto mb-20">
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                FORMULATION LABS
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                The Science Journals
              </h2>
              <div className="h-[1px] bg-neutral-200 w-20 mx-auto mt-6" />
            </div>

            {/* Layered Asymmetric Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left text column */}
              <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
                <div className="space-y-6 text-xs md:text-sm text-neutral-500 font-light leading-relaxed">
                  <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-neutral-800">
                    Validated Active Concentrations
                  </h3>
                  <p>
                    Rather than dropping tiny amounts of raw materials for label claims, we use clinically validated doses. If a study concludes that 3% active ingredient is the threshold for success, we formulate with exactly 3%.
                  </p>
                  <p>
                    Each batch is subjected to strict purity tests, identifying molecular weights, solubility factors, and preservative performance to match international dermatological criteria.
                  </p>
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h4 className="text-[10px] tracking-[0.2em] uppercase font-medium text-neutral-900 mb-2">
                    Research Standards
                  </h4>
                  <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    Our database lists molecular structures, origin records, and clinical references for Redensyl, Baicapil, Procapil, and Anagain. We treat cosmetics like clinical science.
                  </p>
                </div>
              </div>

              {/* Layered Images (Right) */}
              <div className="lg:col-span-7 grid grid-cols-12 gap-4 relative order-1 lg:order-2">
                <div className="col-span-8 overflow-hidden shadow-2xl border border-white">
                  <motion.div
                    initial={{ scale: 1.04, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4 }}
                    className="aspect-[4/3] w-full"
                  >
                    <img 
                      src={about1} 
                      alt="Laboratory chemical setup" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>
                </div>
                <div className="col-span-4 self-end -mb-8 overflow-hidden shadow-2xl border border-white relative z-10">
                  <motion.div
                    initial={{ scale: 1.08, y: 20, opacity: 0 }}
                    whileInView={{ scale: 1, y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.2 }}
                    className="aspect-[3/4] w-full"
                  >
                    <img 
                      src={about3} 
                      alt="Microscopic ingredients analysis" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. MANUFACTURING & QUALITY SECTION */}
        <section className="bg-white py-24 md:py-32 overflow-hidden border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              
              {/* Header block */}
              <div className="lg:col-span-1 space-y-4">
                <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block">
                  MANUFACTURING METRICS
                </span>
                <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                  Pure Origins
                </h2>
                <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-sm">
                  We formulate under strict laboratory environments matching the highest global manufacturing directives, ensuring every bottle is chemically identical and structurally stable.
                </p>
              </div>

              {/* Quality Icons grid */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Australian Quality Standards",
                    desc: "Our labs adhere strictly to local manufacturing practices, ensuring safety metrics pass international safety benchmarks."
                  },
                  {
                    icon: Microscope,
                    title: "Clinical Integrity Sourcing",
                    desc: "Raw materials are tested for density, chemical structure, and potential impurities before batch integration."
                  },
                  {
                    icon: ClipboardCheck,
                    title: "Batch Verification Trials",
                    desc: "Every assembly is logged, dated, and sampled. If a batch varies by even 0.05% in pH or color, it is discarded."
                  },
                  {
                    icon: HeartHandshake,
                    title: "Ethical Science Commitments",
                    desc: "100% cruelty-free formulation processes. We test our ingredients on reconstructed human models, never animals."
                  }
                ].map((item, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <item.icon className="h-5 w-5 text-neutral-900" />
                    <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-neutral-900">{item.title}</h3>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* 6. REAL PEOPLE / COMMUNITY SECTION */}
        <section className="bg-[#fafafa] py-24 md:py-32 overflow-hidden border-y border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="text-center max-w-xl mx-auto mb-20">
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                THE COMMUNION
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                Confidence Starts With Transparency
              </h2>
            </div>

            {/* Documentary Portrait Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Sarah M.", quote: "Confidence starts with transparency. Knowing exactly what goes onto my scalp gave me the trust to stay consistent.", img: client1, loc: "Melbourne" },
                { name: "Priya R.", quote: "Real routines. Real consistency. Scalvea took the guesswork out of my daily hair density regimen.", img: client3, loc: "Mumbai" },
                { name: "James K.", quote: "Seeing active ingredients listed so clearly in proper doses is a game changer for haircare.", img: client2, loc: "Sydney" }
              ].map((client, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: idx * 0.15 }}
                  className="space-y-4 group"
                >
                  {/* Portrait frame */}
                  <div className="aspect-[4/5] overflow-hidden bg-neutral-200 border border-neutral-100 shadow-lg">
                    <img 
                      src={client.img} 
                      alt={client.name} 
                      className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-[1s] ease-out scale-102 group-hover:scale-105" 
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] tracking-[0.15em] uppercase font-medium text-neutral-900">
                      {client.name} — <span className="text-neutral-400 font-light">{client.loc}</span>
                    </p>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed italic">
                      "{client.quote}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CINEMATIC VIDEO INTERLUDE */}
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black flex items-center justify-center">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          >
            <source src={aboutMp4} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          <div className="relative z-10 text-center max-w-xl px-6">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4 }}
              className="space-y-4"
            >
              <h3 className="text-2xl md:text-3xl font-light text-white editorial-heading tracking-wide leading-tight">
                Science without confusion.<br />Hair care without compromise.
              </h3>
            </motion.div>
          </div>
        </section>

        {/* 8. FINAL MANIFESTO SECTION */}
        <section className="bg-black text-white py-28 md:py-36 relative overflow-hidden text-center">
          {/* Subtle glowing light streak */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-amber-500/[0.015] blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto px-6 space-y-8">
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-500 font-light block">
              THE MANIFESTO
            </span>
            <h2 className="text-4xl md:text-5xl leading-tight editorial-heading text-neutral-100">
              The future of hair care is honest.
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 font-light leading-relaxed max-w-md mx-auto">
              SCALVEA exists to combine scientific integrity, transparency, and modern hair wellness for a global generation across Australia and India.
            </p>
            <div className="pt-6 flex justify-center">
              <Link 
                to="/shop" 
                className="group relative overflow-hidden h-12 px-10 flex items-center justify-center text-[10px] tracking-[0.2em] uppercase font-medium bg-white text-black border border-white hover:text-white transition-all duration-500 hover:-translate-y-0.5 transform shadow-lg"
              >
                <span className="absolute inset-0 w-0 bg-black transition-all duration-500 ease-out group-hover:w-full" />
                <span className="relative z-10 flex items-center gap-2">
                  Explore Products <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default About;
