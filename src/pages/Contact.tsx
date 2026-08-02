import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Instagram, ArrowRight, Send, Linkedin } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

// Asset imports
import worldPng from "@/assets/world.png";

// TikTok icon
const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: "Contact Us | Scalvea",
    description: "Get in touch with Scalvea's support team. Reach us via email, Instagram, or TikTok for product questions, orders, partnerships, or wholesale enquiries.",
    keywords: "Scalvea contact, Scalvea support, hair growth serum help, Scalvea email",
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Us | Scalvea",
      "description": "Get in touch with Scalvea's support team for product questions, orders, and partnerships.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Scalvea",
        "url": "https://scalvea.com",
        "logo": "https://scalvea.com/logo.png",
        "email": "info@scalvea.com"
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Thank you for reaching out. We'll get back to you within 24 hours."
      });
      setForm({ name: "", email: "", subject: "", message: "" });
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden relative flex flex-col">
      {/* Film Grain overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <Header />

      <main className="relative z-10 flex-1">

        {/* ─────────────────────────────────────────────────────
            1. MINIMAL HERO
        ───────────────────────────────────────────────────── */}
        <section className="bg-white pt-32 pb-16 md:pt-40 md:pb-20 border-b border-neutral-100">
          <div className="max-w-5xl mx-auto px-6 lg:px-16 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-heading text-neutral-800 leading-tight tracking-tight mb-6"
            >
              Contact Scalvea
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-sm md:text-base text-neutral-400 font-body font-light leading-relaxed max-w-lg mx-auto"
            >
              Whether you have a question about our products, an order, a partnership, or anything else — our team is ready to help.
            </motion.p>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────
            2. WORLD MAP — GLOBAL PRESENCE
        ───────────────────────────────────────────────────── */}
        <section className="bg-[#F9F9F7] py-16 md:py-24 border-b border-neutral-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-12"
            >
              <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-4">
                WHERE WE ARE
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading text-neutral-900 leading-tight mb-3">
                Global Presence
              </h2>
              <p className="text-xs md:text-sm text-neutral-500 font-body font-light leading-relaxed max-w-md mx-auto">
                Scalvea operates across Australia and India — combining Australian innovation with trusted on-ground operations.
              </p>
            </motion.div>

            {/* World map image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full"
            >
              <img
                src={worldPng}
                alt="Scalvea global presence — Australia and India"
                className="w-full h-auto object-contain select-none"
                loading="lazy"
                draggable={false}
              />
            </motion.div>

            {/* Location info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 max-w-xl mx-auto">
              {[
                { flag: "🇦🇺", label: "Australian Headquarters", city: "Craigieburn, Victoria", country: "Australia" },
                { flag: "🇮🇳", label: "India Operations", city: "Patiala, Punjab", country: "India" },
              ].map((loc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.15 }}
                  className="flex items-start gap-4 bg-white border border-neutral-100 rounded-2xl px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                >
                  <span className="text-2xl mt-0.5 select-none">{loc.flag}</span>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-body font-medium mb-1">{loc.label}</p>
                    <p className="text-sm font-heading text-neutral-900">{loc.city}</p>
                    <p className="text-[11px] text-neutral-500 font-body font-light">{loc.country}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────
            3. CONTACT CHANNELS + FORM (split layout)
        ───────────────────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

              {/* LEFT — channels */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div>
                  <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-4">
                    REACH US
                  </span>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading text-neutral-900 leading-tight mb-4">
                    We'd Love to<br className="hidden md:block" /> Hear From You
                  </h2>
                  <p className="text-sm text-neutral-500 font-body font-light leading-relaxed max-w-sm">
                    Every conversation matters to us. Reach out via any of the channels below and we'll respond as quickly as possible.
                  </p>
                </div>

                {/* Contact channel cards */}
                <div className="space-y-4">
                  {/* Email */}
                  <a
                    href="mailto:info@scalvea.com"
                    className="group flex items-center gap-5 p-5 border border-neutral-100 rounded-2xl bg-[#F9F9F7] hover:border-neutral-300 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-black group-hover:border-black transition-all duration-300">
                      <Mail className="h-4.5 w-4.5 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-body font-medium mb-0.5">Email</p>
                      <p className="text-sm font-body font-medium text-neutral-900 truncate">info@scalvea.com</p>
                      <p className="text-[10px] text-neutral-400 font-body font-light">We respond within 24 hours</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                  </a>

                  {/* Instagram */}
                  <a
                    href="https://www.instagram.com/scalvea_/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 p-5 border border-neutral-100 rounded-2xl bg-[#F9F9F7] hover:border-neutral-300 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-black group-hover:border-black transition-all duration-300">
                      <Instagram className="h-4.5 w-4.5 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-body font-medium mb-0.5">Instagram</p>
                      <p className="text-sm font-body font-medium text-neutral-900">@scalvea_</p>
                      <p className="text-[10px] text-neutral-400 font-body font-light">DM us for quick responses</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                  </a>

                  {/* TikTok */}
                  <a
                    href="https://www.tiktok.com/@scalvea/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 p-5 border border-neutral-100 rounded-2xl bg-[#F9F9F7] hover:border-neutral-300 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-black group-hover:border-black transition-all duration-300">
                      <TiktokIcon className="h-4 w-4 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-body font-medium mb-0.5">TikTok</p>
                      <p className="text-sm font-body font-medium text-neutral-900">@scalvea</p>
                      <p className="text-[10px] text-neutral-400 font-body font-light">Follow for updates & tips</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/scalvea/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-5 p-5 border border-neutral-100 rounded-2xl bg-[#F9F9F7] hover:border-neutral-300 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm shrink-0 group-hover:bg-black group-hover:border-black transition-all duration-300">
                      <Linkedin className="h-4.5 w-4.5 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-neutral-400 font-body font-medium mb-0.5">LinkedIn</p>
                      <p className="text-sm font-body font-medium text-neutral-900">Scalvea</p>
                      <p className="text-[10px] text-neutral-400 font-body font-light">Follow for business & updates</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                  </a>
                </div>

                {/* Response time note */}
                <div className="border-t border-neutral-100 pt-6">
                  <p className="text-[10px] text-neutral-400 font-body font-light leading-relaxed">
                    Our team operates across Australian Eastern Time (AEST) and Indian Standard Time (IST). Response times may vary slightly based on timezone.
                  </p>
                </div>
              </motion.div>

              {/* RIGHT — form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-8">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body font-light block mb-4">
                    SEND A MESSAGE
                  </span>
                  <h2 className="text-2xl md:text-3xl font-heading text-neutral-900 leading-tight mb-2">
                    Direct Enquiry
                  </h2>
                  <p className="text-sm text-neutral-500 font-body font-light leading-relaxed">
                    Fill in the form and we'll get back to you within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-[9px] tracking-[0.18em] uppercase text-neutral-500 font-body font-medium block">
                        Your Name
                      </label>
                      <input
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="e.g. Puneet"
                        className="w-full h-11 px-4 text-xs bg-[#F9F9F7] border border-neutral-200 rounded-xl outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-100 transition-all font-body font-light text-neutral-900 placeholder:text-neutral-400"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-[9px] tracking-[0.18em] uppercase text-neutral-500 font-body font-medium block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="you@example.com"
                        className="w-full h-11 px-4 text-xs bg-[#F9F9F7] border border-neutral-200 rounded-xl outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-100 transition-all font-body font-light text-neutral-900 placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-[9px] tracking-[0.18em] uppercase text-neutral-500 font-body font-medium block">
                      Subject
                    </label>
                    <input
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      required
                      placeholder="What is your enquiry about?"
                      className="w-full h-11 px-4 text-xs bg-[#F9F9F7] border border-neutral-200 rounded-xl outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-100 transition-all font-body font-light text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-[9px] tracking-[0.18em] uppercase text-neutral-500 font-body font-medium block">
                      Message
                    </label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      required
                      rows={5}
                      placeholder="Please describe your question or concern in detail..."
                      className="w-full px-4 py-3.5 text-xs bg-[#F9F9F7] border border-neutral-200 rounded-xl outline-none focus:border-neutral-800 focus:ring-2 focus:ring-neutral-100 transition-all font-body font-light resize-none text-neutral-900 placeholder:text-neutral-400"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group w-full h-12 flex items-center justify-center gap-2.5 bg-black text-white text-[10px] tracking-[0.22em] uppercase font-semibold rounded-xl hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <>
                        Send Message
                        <Send className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-neutral-400 font-body font-light text-center tracking-wide">
                    We respect your privacy and will never share your details.
                  </p>
                </form>
              </motion.div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Contact;
