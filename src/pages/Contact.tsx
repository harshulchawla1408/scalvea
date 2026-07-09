import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageSquare, Share2, Building2, User, Globe } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";

// Asset imports
import heroPng from "@/assets/hero.avif";

const Contact = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  useSEO({
    title: "Contact Us & Regional Offices",
    description: "Get in touch with Scalvea's customer support and business teams in Australia and India for shipping, orders, or distribution queries.",
    keywords: "Scalvea contact, Scalvea customer service, hair growth serum support, Craigieburn office, India distribution",
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Us & Regional Offices | Scalvea",
      "description": "Get in touch with Scalvea's customer support and business teams in Australia and India for shipping, orders, or distribution queries.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Scalvea",
        "url": "https://scalvea.com",
        "logo": "https://scalvea.com/logo.png",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+61 460 309 333",
            "contactType": "customer service",
            "areaServed": "AU",
            "availableLanguage": "en"
          }
        ]
      }
    }
  });

  // Parallax scroll tracker
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ 
      title: "Message Dispatched", 
      description: "Your inquiry has been successfully sent to our customer care team." 
    });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex flex-col justify-between">
      {/* Film Grain overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <div>
        <Header />

        <main className="relative z-10">
          
          {/* 1. CONTACT HERO SECTION */}
          <section className="relative h-[50vh] min-h-[380px] w-full overflow-hidden bg-black flex items-center justify-center">
            <div 
              className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
              style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            >
              <img
                src={heroPng}
                alt="Scalvea Minimalist Laboratory Setup"
                className="absolute inset-0 w-full h-full object-cover object-bottom opacity-40 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-background" />
            </div>

            <div className="relative z-10 text-center max-w-2xl px-6 space-y-5 pt-12">
              <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-light block">
                COMMUNICATION NODE
              </span>
              <h1 className="text-3xl md:text-5xl text-white font-extralight tracking-[0.1em] uppercase select-none">
                Contact Scalvea
              </h1>
              <div className="h-[1px] bg-neutral-800 w-16 mx-auto" />
              <p className="text-xs text-neutral-400 font-light max-w-md mx-auto leading-relaxed">
                Connect with our regional offices and support channels in Australia and India. We respond to all inquiries within 24 hours.
              </p>
            </div>
          </section>

          {/* 2. SPLIT CONTACT & OFFICE SECTION */}
          <section className="py-20 md:py-28 bg-white relative z-20 border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-16">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                {/* LEFT COLUMN: Contact Form */}
                <div className="lg:col-span-7 space-y-8">
                  <div>
                    <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-2">
                      INQUIRIES
                    </span>
                    <h2 className="text-2xl font-light text-neutral-900 tracking-wide uppercase">
                      Direct Message
                    </h2>
                    <p className="text-xs text-neutral-500 font-light mt-1">
                      Complete the details below to start a formal inquiry log with our support desks.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-100 p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Your Name</label>
                        <input
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="e.g. Puneet"
                          className="w-full h-10 px-3 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black transition-all font-light rounded-none"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm({ ...form, email: e.target.value })}
                          required
                          placeholder="e.g. you@example.com"
                          className="w-full h-10 px-3 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black transition-all font-light rounded-none"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Subject</label>
                      <input
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        required
                        placeholder="Inquiry subject summary"
                        className="w-full h-10 px-3 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black transition-all font-light rounded-none"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Message</label>
                      <textarea
                        value={form.message}
                        onChange={e => setForm({ ...form, message: e.target.value })}
                        required
                        rows={6}
                        placeholder="Provide details about your query..."
                        className="w-full px-3 py-3 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black transition-all font-light resize-none rounded-none"
                      />
                    </div>

                    {/* Button */}
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        className="group relative overflow-hidden w-full h-11 flex items-center justify-center text-[10px] tracking-[0.2em] uppercase font-medium bg-black text-white hover:text-black border border-black transition-all duration-300 rounded-none"
                      >
                        <span className="absolute inset-0 w-0 bg-white transition-all duration-300 ease-out group-hover:w-full" />
                        <span className="relative z-10">Send Message</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* RIGHT COLUMN: Premium Contact Cards */}
                <div className="lg:col-span-5 space-y-6 lg:pl-4">
                  <div>
                    <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-2">
                      LOCATIONS
                    </span>
                    <h2 className="text-2xl font-light text-neutral-900 tracking-wide uppercase">
                      Regional Offices
                    </h2>
                    <p className="text-xs text-neutral-500 font-light mt-1">
                      Our official administrative and logistics operations branches.
                    </p>
                  </div>

                  {/* Card 1: Australia Office */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="p-6 md:p-8 bg-[#fafafa]/80 backdrop-blur-md border border-neutral-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-300 space-y-5"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-200/50 pb-3">
                      <div>
                        <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-neutral-900">{settings.au_business_name}</h3>
                        <span className="text-[8px] tracking-[0.1em] text-neutral-400 uppercase">ABN: {settings.au_abn}</span>
                      </div>
                      <span className="text-[7px] tracking-[0.15em] uppercase bg-black text-white px-2 py-0.5 font-medium">AU HQ</span>
                    </div>
                    
                    <div className="space-y-3.5 text-xs font-light text-neutral-600">
                      <div className="flex items-start gap-2.5">
                        <User className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                        <p><span className="text-neutral-400">Owner:</span> {settings.au_owner_name}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                        <p>{settings.au_address}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                        <a href={`tel:${settings.au_phone.replace(/\s+/g, '')}`} className="hover:text-black hover:underline transition-colors">{settings.au_phone}</a>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: India Operations */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="p-6 md:p-8 bg-[#fafafa]/80 backdrop-blur-md border border-neutral-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform transition-all duration-300 space-y-5"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-200/50 pb-3">
                      <div>
                        <h3 className="text-xs tracking-[0.2em] uppercase font-semibold text-neutral-900">India Operations</h3>
                        <span className="text-[8px] tracking-[0.1em] text-neutral-400 uppercase">Secondary Office</span>
                      </div>
                      <span className="text-[7px] tracking-[0.15em] uppercase bg-neutral-100 text-neutral-800 px-2 py-0.5 font-medium border border-neutral-200">IN Hub</span>
                    </div>
                    
                    <div className="space-y-3.5 text-xs font-light text-neutral-600">
                      <div className="flex items-start gap-2.5">
                        <User className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                        <p><span className="text-neutral-400">Owner:</span> {settings.in_owner_name}</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                        <p>{settings.in_address}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                        <a href={`tel:${settings.in_phone.replace(/\s+/g, '')}`} className="hover:text-black hover:underline transition-colors">{settings.in_phone}</a>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                        <a href={`mailto:${settings.in_email}`} className="hover:text-black hover:underline transition-colors break-all">{settings.in_email}</a>
                      </div>
                    </div>
                  </motion.div>

                </div>

              </div>

            </div>
          </section>

          {/* 3. SUPPORT TYPES SECTION */}
          <section className="py-20 bg-[#fafafa]/50 border-b border-neutral-100 relative z-20">
            <div className="max-w-7xl mx-auto px-6 lg:px-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                
                {/* Card 1 */}
                <div className="p-8 bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                  <MessageSquare className="h-6 w-6 text-neutral-800" />
                  <h3 className="text-xs tracking-[0.15em] uppercase font-semibold text-neutral-900">Customer Support</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Direct channel for tracking details, returns processing, order issues, or ingredients guidance.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="p-8 bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                  <Share2 className="h-6 w-6 text-neutral-800" />
                  <h3 className="text-xs tracking-[0.15em] uppercase font-semibold text-neutral-900">Partnerships</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Join the Scalvea hair wellness community. Inquire about research alignment or collaborative content.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="p-8 bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                  <Building2 className="h-6 w-6 text-neutral-800" />
                  <h3 className="text-xs tracking-[0.15em] uppercase font-semibold text-neutral-900">Wholesale & Clinics</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed">
                    Request clinical stocking parameters or direct bulk distributions of our Follicle 8 product line.
                  </p>
                </div>

              </div>
            </div>
          </section>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
