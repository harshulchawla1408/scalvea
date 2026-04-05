import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.04em] mb-4">Contact Us</h1>
          <p className="text-sm text-muted-foreground mb-12">We'd love to hear from you.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Subject</label>
                <input
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                  className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground block mb-2">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>
              <Button type="submit" className="h-12 px-10 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase">
                Send Message
              </Button>
            </form>

            {/* Info + Map */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs tracking-[0.12em] uppercase mb-2">Address</h3>
                  <p className="text-sm text-muted-foreground">263 Heaths Rd, Werribee<br />VIC 3030, Australia</p>
                </div>
                <div>
                  <h3 className="text-xs tracking-[0.12em] uppercase mb-2">Phone</h3>
                  <a href="tel:+61460309333" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    +61 460 309 333
                  </a>
                </div>
                <div>
                  <h3 className="text-xs tracking-[0.12em] uppercase mb-2">Hours</h3>
                  <p className="text-sm text-muted-foreground">Monday — Friday: 9am — 5pm AEST</p>
                </div>
              </div>

              {/* Map */}
              <div className="aspect-[4/3] bg-secondary">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3148.5!2d144.66!3d-37.88!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDUyJzQ4LjAiUyAxNDTCsDM5JzM2LjAiRQ!5e0!3m2!1sen!2sau!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Scalvea Store Location"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
