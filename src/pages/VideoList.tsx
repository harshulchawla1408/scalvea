import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { VIDEOS } from "@/data/videos";
import { Play, Clock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function VideoList() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Scalvea Video Guides & Hair Care Science",
    "description": "Watch Scalvea educational videos: Follicle 8 application guides, hair growth science breakdowns, and ingredient tutorials.",
    "url": "https://scalvea.com/videos",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": VIDEOS.map((v, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://scalvea.com/videos/${v.slug}`,
        "name": v.title
      }))
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 flex flex-col font-body selection:bg-neutral-900 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        {/* Hero Section */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium tracking-wide mb-4">
            <Sparkles className="h-3 w-3" />
            Educational Library
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-normal text-neutral-950 tracking-tight leading-tight mb-4">
            Hair Care Guides &amp; Application Videos
          </h1>
          <p className="text-neutral-600 text-base sm:text-lg font-light leading-relaxed">
            Step-by-step video tutorials, formulation breakdowns, and clinical science behind Scalvea’s targeted hair wellness routines.
          </p>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {VIDEOS.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              {/* Thumbnail Container with Play Overlay */}
              <Link to={`/videos/${item.slug}`} className="relative block aspect-[16/10] bg-neutral-900 overflow-hidden">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width="640"
                  height="400"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-neutral-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-neutral-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-[11px] font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.duration}s
                </div>
              </Link>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-heading text-lg font-normal text-neutral-950 leading-snug mb-2 group-hover:text-black transition-colors">
                    <Link to={`/videos/${item.slug}`}>{item.title}</Link>
                  </h2>
                  <p className="text-neutral-600 text-xs sm:text-sm font-light leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <Link
                    to={`/videos/${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-neutral-900 group-hover:text-black group-hover:underline"
                  >
                    Watch Guide
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  {item.relatedProductName && (
                    <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[140px]">
                      {item.relatedProductName}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Clinical Trust Banner */}
        <div className="bg-[#F8F6F0] rounded-2xl p-8 border border-neutral-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Evidence-Informed Standards
            </div>
            <h3 className="font-heading text-xl text-neutral-950 font-normal mb-2">
              Looking for detailed ingredient research?
            </h3>
            <p className="text-neutral-600 text-xs sm:text-sm font-light leading-relaxed">
              Explore our clinical journal articles covering Anagain, Redensyl, Baicapil, DHT pathways, and scalp health science.
            </p>
          </div>
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-950 text-white text-xs uppercase tracking-wider font-medium hover:bg-neutral-800 transition-colors shadow-sm shrink-0"
          >
            Read Journal Articles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
