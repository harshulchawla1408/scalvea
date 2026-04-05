import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Check, Truck, Shield, Leaf } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import follicle8Serum from "@/assets/follicle8-serum.png";
import follicle8Black from "@/assets/follicle8-black.png";
import client1 from "@/assets/client-1.jpg";
import client2 from "@/assets/client-2.jpg";
import client3 from "@/assets/client-3.jpg";
import ingredientsBg from "@/assets/ingredients-bg.jpg";

const Index = () => {
  const [email, setEmail] = useState("");
  const { products, loading } = useProducts();
  const featured = products.filter((p) => p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Video Hero */}
      <section className="relative h-[70vh] md:h-[80vh] max-h-[700px] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/scalvea-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col justify-end h-full px-6 lg:px-16 pb-16 lg:pb-24">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/70 mb-3">Science-Backed Hair Growth</p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light leading-[1.05] tracking-[0.02em] text-white mb-4 max-w-2xl">
            Nothing<br />To Hide
          </h2>
          <p className="text-sm text-white/70 leading-relaxed max-w-md mb-8">
            Clinically formulated with Redensyl, Baicapil, Procapil & Anagain at proven concentrations.
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-white text-foreground hover:bg-white/90 text-[10px] tracking-[0.15em] uppercase h-11 px-8">
              <Link to="/shop">Shop Now</Link>
            </Button>
            <Button asChild variant="outline" className="text-[10px] tracking-[0.15em] uppercase h-11 px-8 border-white/40 text-white hover:bg-white/10">
              <Link to="/about">Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { icon: Truck, label: "Free Shipping", sub: "On orders over $50" },
            { icon: Shield, label: "Clinically Proven", sub: "4 key actives" },
            { icon: Leaf, label: "Clean Formula", sub: "No hidden ingredients" },
            { icon: Check, label: "Made in Australia", sub: "Quality guaranteed" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-6 py-5">
              <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[10px] tracking-[0.1em] uppercase font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products — compact cards */}
      <section className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Best Sellers</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">Our Products</h2>
          </div>
          <Link to="/shop" className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {(featured.length > 0 ? featured : products).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Split: Product + Philosophy */}
      <section className="bg-secondary">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="aspect-[4/5] lg:aspect-auto lg:max-h-[550px] relative overflow-hidden">
            <img src={follicle8Black} alt="Scalvea Black Edition" className="w-full h-full object-cover object-center" loading="lazy" />
          </div>
          <div className="flex flex-col justify-center px-6 lg:px-16 py-14 lg:py-0">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Our Philosophy</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em] mb-5">
              Transparency<br />in Every Drop
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mb-3">
              At Scalvea, we believe in full ingredient transparency. Every formula is backed by clinical research and contains only what your hair needs.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mb-6">
              Our Follicle 8 range combines four clinically validated hair growth actives at effective concentrations.
            </p>
            <Link to="/about" className="text-[10px] tracking-[0.12em] uppercase flex items-center gap-2 hover:opacity-60 transition-opacity w-fit">
              Learn More <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Ingredients Section with background image */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img src={ingredientsBg} alt="" className="w-full h-full object-cover opacity-10" loading="lazy" />
        </div>
        <div className="relative z-10 px-6 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Clinically Proven Actives</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">The Science Behind Follicle 8</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {[
              { name: "Redensyl", pct: "3%", desc: "Targets hair follicle stem cells to reactivate growth" },
              { name: "Baicapil", pct: "3%", desc: "Strengthens and nourishes hair from root to tip" },
              { name: "Procapil", pct: "3%", desc: "Prevents follicle aging and improves hair anchoring" },
              { name: "Anagain", pct: "4%", desc: "Stimulates dermal papilla cells for new hair growth" },
            ].map((ingredient) => (
              <div key={ingredient.name} className="text-center">
                <p className="text-3xl md:text-4xl font-light mb-2">{ingredient.pct}</p>
                <p className="text-[10px] tracking-[0.12em] uppercase font-medium mb-2">{ingredient.name}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{ingredient.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Client Results / Testimonials */}
      <section className="bg-foreground text-primary-foreground">
        <div className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-50 mb-3">Real Results</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Sarah M.", text: "After 8 weeks of using Follicle 8, I can visibly see new baby hairs growing along my hairline. Absolutely love it!", img: client1, location: "Melbourne, AU" },
              { name: "James K.", text: "Finally a brand that tells you exactly what's inside. My hair feels thicker and healthier than ever before.", img: client2, location: "Sydney, AU" },
              { name: "Priya R.", text: "I've tried many hair growth serums but Scalvea is the first one that actually delivered visible results.", img: client3, location: "Mumbai, IN" },
            ].map((t, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto overflow-hidden rounded-full">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" loading="lazy" width={80} height={80} />
                </div>
                <div className="flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-primary-foreground text-primary-foreground" />
                  ))}
                </div>
                <p className="text-xs leading-relaxed opacity-80 italic max-w-xs mx-auto">"{t.text}"</p>
                <div>
                  <p className="text-[10px] tracking-[0.12em] uppercase opacity-80">{t.name}</p>
                  <p className="text-[9px] tracking-[0.08em] uppercase opacity-40">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-center mb-14">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Simple Routine</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">How To Use</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-3xl mx-auto">
          {[
            { step: "01", title: "Apply", desc: "Apply 1ml directly to the scalp in thinning areas" },
            { step: "02", title: "Massage", desc: "Gently massage for 1-2 minutes to improve absorption" },
            { step: "03", title: "Repeat", desc: "Use twice daily for best results. Results in 8-12 weeks" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <p className="text-3xl font-light text-muted-foreground/30 mb-3">{s.step}</p>
              <h3 className="text-xs tracking-[0.15em] uppercase font-medium mb-2">{s.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner with product image */}
      <section className="bg-secondary">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-6 lg:px-16 py-14 lg:py-0 order-2 lg:order-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Start Your Journey</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em] mb-4">
              Your Hair<br />Deserves Science
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mb-6">
              Join thousands of customers who have transformed their hair with clinically proven ingredients. See results in as little as 8 weeks.
            </p>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 text-[10px] tracking-[0.12em] uppercase h-11 px-8 w-fit">
              <Link to="/shop">Shop Follicle 8</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center py-12 lg:py-16 order-1 lg:order-2">
            <img src={follicle8Serum} alt="Follicle 8 Serum" className="max-h-[280px] lg:max-h-[350px] object-contain drop-shadow-2xl" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Stay Updated</p>
          <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em] mb-3">Subscribe to Our Newsletter</h2>
          <p className="text-xs text-muted-foreground mb-8">Be the first to know about new products, special offers, and hair care tips.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 h-11 px-4 text-xs bg-transparent border border-border border-r-0 outline-none focus:border-foreground transition-colors"
            />
            <Button type="submit" className="h-11 px-6 bg-foreground text-background hover:bg-foreground/90 text-[10px] tracking-[0.12em] uppercase">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
