import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Mail, Phone, Clock, MapPin, MessageSquare, Share2, Building2, Globe } from "lucide-react";

// Asset imports
import heroPng from "@/assets/hero.png";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", country: "Australia", message: "" });
  const [scrollY, setScrollY] = useState(0);
  const [emailSub, setEmailSub] = useState("");

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
      title: "Message Initiated", 
      description: `Your inquiry has been successfully dispatched to our ${form.country === "India" ? "Mumbai/Chandigarh" : "Melbourne"} team.` 
    });
    setForm({ name: "", email: "", subject: "", country: "Australia", message: "" });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Header />

      {/* Film Grain overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <main className="relative z-10">
        
        {/* 1. CONTACT HERO SECTION */}
        <section className="relative h-[65vh] min-h-[420px] w-full overflow-hidden bg-black flex items-center justify-center">
          <div 
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          >
            <img
              src={heroPng}
              alt="Scalvea Minimalist Laboratory Setup"
              className="absolute inset-0 w-full h-full object-cover object-bottom opacity-50 scale-105 animate-cinematic-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/35 to-background" />
          </div>

          <div className="relative z-10 text-center max-w-2xl px-6 space-y-6 pt-12">
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-light block">
              INTERNATIONAL RELATIONS
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl text-white editorial-heading tracking-wide uppercase select-none">
              Contact Scalvea
            </h1>
            <p className="text-xs md:text-sm tracking-[0.2em] text-neutral-300 font-light uppercase">
              Australia to India. We’re here to help.
            </p>
            <p className="text-xs text-neutral-400 font-light max-w-md mx-auto leading-relaxed">
              Reach out to our teams for regional support, order logs, clinical research partnerships, or wholesale distribution inquiries.
            </p>
          </div>
        </section>

        {/* 2. INTERNATIONAL CONTACT SECTION */}
        <section className="py-24 md:py-32 bg-white relative z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            
            <div className="text-center max-w-xl mx-auto mb-16 md:mb-24">
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                REGIONAL OPERATIONS
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                Global Offices
              </h2>
              <div className="h-[1px] bg-neutral-200 w-20 mx-auto mt-6" />
            </div>

            {/* Dual Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
              
              {/* Australia Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="group relative p-8 md:p-10 bg-[#fafafa]/80 backdrop-blur-md border border-neutral-100/60 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-500 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-neutral-200/50 pb-4">
                    <h3 className="text-sm tracking-[0.2em] uppercase font-semibold text-neutral-900">AUSTRALIA OFFICE</h3>
                    <span className="text-[8px] tracking-[0.15em] uppercase bg-black text-white px-2 py-0.5 font-medium">Head Office</span>
                  </div>
                  
                  <div className="space-y-4 text-xs font-light text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                      <p>263 Heaths Rd, Werribee VIC 3030, Australia</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                      <a href="tel:+61460309333" className="hover:text-black transition-colors">+61 460 309 333</a>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                      <div>
                        <p>Monday – Friday</p>
                        <p className="text-neutral-400">9am – 5pm AEST</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center gap-1.5 text-[9px] tracking-[0.1em] text-neutral-400 uppercase">
                  <Globe className="h-3.5 w-3.5" /> Regional Shipping Hub
                </div>
              </motion.div>

              {/* India Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 }}
                className="group relative p-8 md:p-10 bg-[#fafafa]/80 backdrop-blur-md border border-neutral-100/60 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform transition-all duration-500 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-neutral-200/50 pb-4">
                    <h3 className="text-sm tracking-[0.2em] uppercase font-semibold text-neutral-900">INDIA SUPPORT</h3>
                    <span className="text-[8px] tracking-[0.15em] uppercase bg-black text-white px-2 py-0.5 font-medium">Distribution</span>
                  </div>
                  
                  <div className="space-y-4 text-xs font-light text-neutral-600 leading-relaxed">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                      <div>
                        <p>India Operations & Customer Support</p>
                        <p className="text-neutral-400">Chandigarh, India</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="text-neutral-400">+91 [Support Line Pending]</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                      <div>
                        <p>Monday – Saturday</p>
                        <p className="text-neutral-400">10am – 7pm IST</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center gap-1.5 text-[9px] tracking-[0.1em] text-neutral-400 uppercase">
                  <Globe className="h-3.5 w-3.5" /> Regional Distribution Node
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* 3. CONTACT FORM SECTION */}
        <section className="py-24 md:py-32 bg-[#fafafa] border-y border-neutral-100 relative z-20">
          <div className="max-w-4xl mx-auto px-6">
            
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                ENQUIRIES
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                Direct Message
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-neutral-100 p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Your Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Enter your name"
                    className="w-full h-11 px-4 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="Enter your email"
                    className="w-full h-11 px-4 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Subject</label>
                  <input
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    required
                    placeholder="Subject of inquiry"
                    className="w-full h-11 px-4 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none"
                  />
                </div>

                {/* Country selector */}
                <div className="space-y-2">
                  <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Regional Direction</label>
                  <select
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full h-11 px-4 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none appearance-none"
                  >
                    <option value="Australia">Australia Office</option>
                    <option value="India">India Support</option>
                    <option value="Global">Other / General</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-medium block">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  placeholder="How can we assist you?"
                  className="w-full px-4 py-3 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light resize-none rounded-none"
                />
              </div>

              {/* Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  className="group relative overflow-hidden w-full h-12 flex items-center justify-center text-[10px] tracking-[0.2em] uppercase font-medium bg-black text-white hover:text-black border border-black transition-all duration-500 hover:-translate-y-0.5 transform shadow-lg rounded-none"
                >
                  <span className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full" />
                  <span className="relative z-10">Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* 4. GLOBAL MAP SECTION */}
        <section className="py-24 md:py-32 bg-white relative z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
                LOCATOR MAPS
              </span>
              <h2 className="text-3xl md:text-4xl leading-tight editorial-heading text-neutral-900">
                Strategic Locations
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Australia Map Location */}
              <div className="relative overflow-hidden group border border-neutral-100 shadow-xl">
                <div className="aspect-[16/9] w-full filter grayscale contrast-[1.1] hover:grayscale-0 transition-all duration-[1.2s] ease-out group-hover:scale-[1.02]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3148.5!2d144.66!3d-37.88!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDUyJzQ4LjAiUyAxNDTCsDM5JzM2LjAiRQ!5e0!3m2!1sen!2sau!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Scalvea Melbourne Head Office Map"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-neutral-100 px-3 py-1.5 shadow-md">
                  <p className="text-[9px] tracking-[0.15em] uppercase font-semibold text-neutral-900">Melbourne, Australia</p>
                </div>
              </div>

              {/* India Map Location */}
              <div className="relative overflow-hidden group border border-neutral-100 shadow-xl">
                <div className="aspect-[16/9] w-full filter grayscale contrast-[1.1] hover:grayscale-0 transition-all duration-[1.2s] ease-out group-hover:scale-[1.02]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13717.339678142714!2d76.77941785!3d30.7333148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390fed0be66ec96b%3A0xa5ff90f907e0d9b5!2sChandigarh%2C%20India!5e0!3m2!1sen!2sin!4v1684323214532!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Scalvea India Hub Chandigarh Map"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-neutral-100 px-3 py-1.5 shadow-md">
                  <p className="text-[9px] tracking-[0.15em] uppercase font-semibold text-neutral-900">India Support Hub</p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 5. SUPPORT TYPES SECTION */}
        <section className="py-24 md:py-32 bg-[#fafafa] border-t border-neutral-100 relative z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              
              {/* Card 1 */}
              <div className="p-8 bg-white border border-neutral-100/80 shadow-md hover:shadow-lg transition-all duration-300 space-y-4">
                <MessageSquare className="h-6 w-6 text-neutral-900" />
                <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-neutral-900">Customer Support</h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  Direct contact for order status, regional shipments, tracking details, and product usage guidance.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-8 bg-white border border-neutral-100/80 shadow-md hover:shadow-lg transition-all duration-300 space-y-4">
                <Share2 className="h-6 w-6 text-neutral-900" />
                <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-neutral-900">Partnerships</h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  Join the Scalvea hair wellness network. Collaborate on research, creative branding, or content.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-8 bg-white border border-neutral-100/80 shadow-md hover:shadow-lg transition-all duration-300 space-y-4">
                <Building2 className="h-6 w-6 text-neutral-900" />
                <h3 className="text-xs tracking-[0.15em] uppercase font-medium text-neutral-900">Wholesale / Distribution</h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  Inquire about stocking our Follicle 8 line in your clinics, salons, or luxury storefronts.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 6. NEWSLETTER / COMMUNITY SECTION */}
        <section className="bg-white py-24 md:py-32 overflow-hidden relative z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fafafa] to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-lg mx-auto text-center px-6">
            <span className="text-[9px] tracking-[0.25em] uppercase text-neutral-400 font-light block mb-3">
              THE SCALVEA COMMUNION
            </span>
            <h2 className="text-3xl md:text-4xl leading-tight editorial-heading mb-4 text-neutral-900">
              Join the SCALVEA Community
            </h2>
            <p className="text-xs text-neutral-500 font-light mb-8 max-w-sm mx-auto leading-relaxed">
              Hair wellness updates, product launches, and exclusive insights.
            </p>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); setEmailSub(""); }} 
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={emailSub}
                onChange={(e) => setEmailSub(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 h-11 px-4 text-xs bg-transparent border border-neutral-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-light rounded-none"
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

      </main>

      <Footer />
    </div>
  );
};

export default Contact;
