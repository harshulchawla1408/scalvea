import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Mail } from "lucide-react";

// Asset imports
import heroMp4 from "@/assets/about.mp4";
import puneetPng from "@/assets/puneet.webp";
import puneetMobPng from "@/assets/puneet-mob.webp";
import lap1 from "@/assets/lap1.webp";
import { LazyVideo } from "@/components/ui/LazyVideo";

// ─── Story blocks data ───────────────────────────────────────────────────────
const STORY_BLOCKS = [
  {
    index: "01",
    label: "FROM THE BARBER'S CHAIR",
    heading: "A Question I Couldn't Answer",
    body: "People often ask me: \"Why did a barber start a hair care brand?\" It's a fair question. And the honest answer is that it wasn't a business decision — it was a moment of discomfort I couldn't ignore.",
  },
  {
    index: "02",
    label: "THE MOMENT EVERYTHING CHANGED",
    heading: "Real People, Real Concerns",
    body: "For years, my clients sat in my chair and asked me the same question — \"What should I actually use for my hair?\" I would recommend what I knew. Products with familiar names, trusted shelf presence. Then they'd come back — and too often, the results weren't there.",
  },
  {
    index: "03",
    label: "THE REAL PROBLEM",
    heading: "Hidden Ingredients. Empty Claims.",
    body: "The more I looked into what was inside these bottles, the more I understood why. Proprietary blends. Vague ingredient lists. Concentrations so low they could never actually work. Hair loss is deeply personal — and the industry was treating it like a branding exercise.",
  },
  {
    index: "04",
    label: "THE DECISION",
    heading: "I Decided to Build Something I Could Stand Behind",
    body: "I didn't want to keep recommending products I couldn't fully trust. So I started from scratch. I spent months studying the science — understanding which ingredients actually had clinical backing, what concentrations worked, and how to build formulations without unnecessary fillers or compromise.",
  },
  {
    index: "05",
    label: "THE MISSION",
    heading: "Transparency. Science. Trust.",
    body: "Scalvea exists to give people honest, clearly formulated hair care. Every ingredient is listed. Every concentration is intentional. Every bottle is something I would confidently put in the hands of the person sitting in my chair — because that's exactly where this began.",
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

// ─── Component ────────────────────────────────────────────────────────────────
const About = () => {
  useSEO({
    title: "About Scalvea | Care You Deserve",
    description: "Scalvea was built on one belief: that hair care should be honest, transparent, and clinically grounded. Read the story behind the brand.",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Scalvea | Care You Deserve",
      "description": "Scalvea was built on one belief: that hair care should be honest, transparent, and clinically grounded.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Scalvea",
        "url": "https://scalvea.com",
        "logo": "https://scalvea.com/scalvea-logo.webp"
      }
    }
  });

  return (
    <div className="min-h-screen bg-white overflow-hidden relative">
      {/* Grain overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <Header />

      <main className="relative z-10">

        {/* ══════════════════════════════════════════════════════════════
            1. HERO VIDEO
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-black flex items-center justify-center">
          <LazyVideo 
            videoSrc={heroMp4} 
            posterSrc={lap1}
            className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105" 
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center max-w-3xl px-6 space-y-6 pt-20">

            {/* Main heading */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="text-[52px] md:text-[80px] lg:text-[96px] leading-none text-white font-heading tracking-tight uppercase select-none"
            >
              {"CARE YOU DESERVE".split(" ").map((word, wIdx) => (
                <span key={wIdx} className="inline-block mr-4 last:mr-0">
                  {word.split("").map((letter, lIdx) => (
                    <motion.span
                      key={lIdx}
                      variants={{
                        hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
                        visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: "easeOut" } }
                      }}
                      className="inline-block"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.0, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="h-[1px] bg-white/20 w-16 mx-auto origin-left"
            />

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.2 }}
              className="text-sm md:text-base text-white/70 font-body font-light leading-relaxed max-w-xl mx-auto"
            >
              Science-first hair care built around transparency,<br className="hidden sm:block" />
              clinically researched ingredients,<br className="hidden sm:block" />
              and everyday confidence.
            </motion.p>

            {/* Micro text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.8 }}
              className="text-[9px] tracking-[0.25em] text-white/35 font-body font-light uppercase pt-4"
            >
              Clinically developed formulations for healthier scalp and hair.
            </motion.p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. WHY I STARTED SCALVEA — STORY BLOCKS
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-white py-20 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 lg:px-16">

            {/* Section header */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mb-20 md:mb-28"
            >
              <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-5">
                THE FOUNDER'S STORY
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-[56px] font-heading text-neutral-900 leading-tight tracking-tight max-w-xl">
                Why I Started Scalvea?
              </h2>
            </motion.div>

            {/* Story blocks */}
            <div className="space-y-0">
              {STORY_BLOCKS.map((block, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={fadeUp}
                  transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 border-t border-neutral-100 py-12 md:py-14 hover:bg-[#FAFAFA] transition-colors duration-500 -mx-6 px-6 md:-mx-8 md:px-8"
                >
                  {/* Left — index + label */}
                  <div className="md:col-span-4 flex flex-row md:flex-col gap-4 md:gap-3 items-baseline md:items-start">
                    <span className="text-[11px] md:text-xs font-mono text-neutral-400 font-medium shrink-0 select-none">
                      {block.index}
                    </span>
                    <span className="text-[9px] tracking-[0.22em] uppercase text-neutral-700 font-body font-semibold">
                      {block.label}
                    </span>
                  </div>

                  {/* Right — heading + body */}
                  <div className="md:col-span-8 space-y-4">
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-heading text-neutral-900 leading-snug">
                      {block.heading}
                    </h3>
                    <p className="text-sm md:text-base text-neutral-500 font-body font-light leading-[1.8] max-w-xl">
                      {block.body}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Final border */}
              <div className="border-t border-neutral-100" />
            </div>

            {/* Pull quote */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="mt-20 md:mt-28 border-l-[3px] border-neutral-900 pl-8 py-2 max-w-2xl"
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-heading text-neutral-900 leading-snug">
                "I didn't want to keep recommending products I couldn't genuinely stand behind."
              </p>
              <p className="text-[10px] tracking-[0.22em] uppercase text-neutral-600 font-body font-semibold mt-5">
                — Puneet, The Barber Behind The Brand
              </p>
            </motion.div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. PUNEET POSTER — Responsive (same as Home page)
        ══════════════════════════════════════════════════════════════ */}
        <section className="w-full bg-white py-10 md:py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-0">
            {/* Desktop/Laptop poster */}
            <motion.img
              src={puneetPng}
              alt="Scalvea Campaign Poster"
              className="hidden md:block w-full h-auto object-contain"
              loading="lazy"
              draggable={false}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Mobile poster */}
            <motion.img
              src={puneetMobPng}
              alt="Scalvea Campaign Poster"
              className="block md:hidden w-full h-auto object-contain"
              loading="lazy"
              draggable={false}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. CAREERS
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-[#F4F4F2] py-20 md:py-28 lg:py-36 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 lg:px-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-neutral-100 rounded-[28px] px-8 md:px-16 py-14 md:py-20 text-center shadow-[0_8px_48px_rgba(0,0,0,0.05)]"
            >
              {/* Eyebrow */}
              <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-5">
                JOIN THE TEAM
              </span>

              {/* Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading text-neutral-900 leading-tight mb-6">
                Careers
              </h2>

              {/* Subheading */}
              <p className="text-sm md:text-base text-neutral-600 font-body font-light leading-relaxed max-w-xl mx-auto mb-3">
                Grow with a team passionate about building transparent, science-first hair care.
              </p>
              <p className="text-xs md:text-sm text-neutral-400 font-body font-light leading-relaxed max-w-lg mx-auto mb-10">
                We're always excited to connect with talented individuals who share our vision for thoughtful innovation and exceptional customer experiences.
              </p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <a
                  href="mailto:info@scalvea.com"
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-10 text-[10px] tracking-[0.22em] uppercase font-semibold bg-black text-white border border-black hover:bg-transparent hover:text-black transition-all duration-500 hover:-translate-y-0.5 rounded-none shadow-lg"
                >
                  <span className="absolute inset-0 w-0 bg-neutral-50 transition-all duration-500 ease-out group-hover:w-full" />
                  <Mail className="relative z-10 h-3.5 w-3.5" />
                  <span className="relative z-10">Email Us</span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default About;
