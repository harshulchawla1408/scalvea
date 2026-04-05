import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import follicle8Serum from "@/assets/follicle8-serum.png";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Video Hero */}
        <section className="relative h-[50vh] md:h-[60vh] max-h-[550px] overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/scalvea-about.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex flex-col justify-end h-full px-6 lg:px-16 pb-14">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/60 mb-3">Our Story</p>
            <h1 className="text-3xl md:text-5xl font-light tracking-[0.04em] leading-[1.1] text-white mb-3">
              Nothing To Hide
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
              Scalvea was born from a simple belief: you deserve to know exactly what you're putting on your scalp.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="bg-secondary">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center p-12 lg:p-16">
              <img src={follicle8Serum} alt="Follicle 8 Serum" className="max-h-[320px] object-contain" loading="lazy" />
            </div>
            <div className="flex flex-col justify-center px-6 lg:px-16 py-14 lg:py-0">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Our Mission</p>
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em] mb-5">
                Science First,<br />Always
              </h2>
              <div className="space-y-3 text-xs text-muted-foreground leading-relaxed max-w-md">
                <p>
                  Every Scalvea product is formulated with clinically validated ingredients at
                  effective concentrations. We don't hide behind proprietary blends or marketing jargon.
                </p>
                <p>
                  Our Follicle 8 range features four of the most researched hair growth actives —
                  Redensyl, Baicapil, Procapil, and Anagain — each at concentrations proven
                  to deliver results in clinical studies.
                </p>
                <p>
                  We believe that when you understand what's in your products and why, you can
                  make better choices for your hair health.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="px-6 lg:px-12 py-16 lg:py-24">
          <div className="text-center mb-14">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Our Values</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            {[
              { title: "Transparency", desc: "Every ingredient, every concentration, clearly listed. No proprietary blends, no hidden formulas." },
              { title: "Science", desc: "Formulations backed by clinical research and peer-reviewed studies. We only use ingredients with proven efficacy." },
              { title: "Quality", desc: "Manufactured in Australia under strict quality control. Every batch tested for purity and potency." },
            ].map(v => (
              <div key={v.title} className="text-center space-y-3">
                <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy CTA */}
        <section className="bg-foreground text-primary-foreground px-6 lg:px-12 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-50">Hair Care Philosophy</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.04em]">
              Less Is More.<br />But What's There Matters.
            </h2>
            <p className="text-xs opacity-60 leading-relaxed max-w-xl mx-auto">
              We don't believe in 20-ingredient formulas where most do nothing. We believe in precise,
              targeted formulations where every ingredient earns its place through clinical evidence.
            </p>
            <Button asChild className="bg-white text-foreground hover:bg-white/90 text-[10px] tracking-[0.12em] uppercase h-11 px-8 mt-4">
              <Link to="/shop">Explore Products</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
