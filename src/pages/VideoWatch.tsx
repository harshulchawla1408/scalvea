import { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { VIDEOS, getVideoBySlug } from "@/data/videos";
import { Play, Clock, Calendar, CheckCircle2, ArrowRight, Sparkles, BookOpen, ChevronRight } from "lucide-react";

export default function VideoWatch() {
  const { slug } = useParams<{ slug: string }>();
  const video = slug ? getVideoBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!video) {
    return <Navigate to="/videos" replace />;
  }

  // Related videos (the other two videos)
  const relatedVideos = VIDEOS.filter((v) => v.id !== video.id);

  // VideoObject JSON-LD
  const videoSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": [video.thumbnailUrl],
    "uploadDate": video.uploadDate,
    "duration": video.durationIso,
    "contentUrl": video.videoUrl,
    "embedUrl": `https://scalvea.com/videos/${video.slug}`,
    "publisher": {
      "@type": "Organization",
      "name": "Scalvea",
      "logo": {
        "@type": "ImageObject",
        "url": "https://scalvea.com/scalvea-logo.webp"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://scalvea.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Videos",
        "item": "https://scalvea.com/videos"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": video.title,
        "item": `https://scalvea.com/videos/${video.slug}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 flex flex-col font-body selection:bg-neutral-900 selection:text-white">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 mb-6 font-medium">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-neutral-400" />
          <Link to="/videos" className="hover:text-black transition-colors">Videos</Link>
          <ChevronRight className="h-3 w-3 text-neutral-400" />
          <span className="text-neutral-900 truncate max-w-[240px] sm:max-w-md">{video.title}</span>
        </nav>

        {/* Header Block */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white font-medium tracking-wide">
              <Play className="h-3 w-3 fill-white" />
              Watch Guide
            </span>
            <span className="inline-flex items-center gap-1 text-neutral-500 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {video.duration} seconds
            </span>
            <span className="inline-flex items-center gap-1 text-neutral-500 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(video.uploadDate).toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl text-neutral-950 font-normal tracking-tight leading-tight mb-3">
            {video.title}
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            {video.description}
          </p>
        </div>

        {/* Video Player Card */}
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl mb-10 border border-neutral-200/80">
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] max-h-[580px] bg-neutral-950 flex items-center justify-center">
            <video
              src={video.videoUrl}
              controls
              playsInline
              preload="metadata"
              poster={video.thumbnailUrl}
              className="w-full h-full object-contain"
              aria-label={video.title}
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support HTML5 video playback.
            </video>
          </div>
        </div>

        {/* Content & Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Column: Explanation & Transcript */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview / Clinical Summary */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/70 shadow-sm">
              <h2 className="font-heading text-lg sm:text-xl text-neutral-950 font-normal tracking-tight mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neutral-700" />
                Scientific Summary & Overview
              </h2>
              <p className="text-neutral-700 text-sm sm:text-base leading-relaxed font-light">
                {video.summary}
              </p>

              {video.keyIngredients && video.keyIngredients.length > 0 && (
                <div className="mt-5 pt-5 border-t border-neutral-100">
                  <h3 className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-semibold mb-2.5">
                    Highlighted Actives & Standards
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.keyIngredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Video Step-by-Step Transcript */}
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/70 shadow-sm">
              <h2 className="font-heading text-lg sm:text-xl text-neutral-950 font-normal tracking-tight mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-neutral-700" />
                Step-by-Step Guide & Transcript
              </h2>
              <ol className="space-y-4">
                {video.transcript.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-neutral-700 font-light">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Sidebar: Product CTA & Related Info */}
          <div className="space-y-6">
            {/* Related Product Card */}
            {video.relatedProductId && (
              <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Featured Product
                </div>
                <h3 className="font-heading text-lg text-neutral-950 font-normal mb-2">
                  {video.relatedProductName}
                </h3>
                <p className="text-xs text-neutral-600 mb-4 leading-relaxed font-light">
                  Formulated with clinically researched actives for optimal follicular support and scalp comfort.
                </p>
                <Link
                  to={`/product/${video.relatedProductId}`}
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-neutral-950 text-white text-xs uppercase tracking-wider font-medium rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  View Product Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-[#F8F6F0] rounded-2xl p-6 border border-neutral-200/60">
              <h4 className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-semibold mb-3">
                Educational Resources
              </h4>
              <ul className="space-y-2 text-xs font-medium">
                <li>
                  <Link to="/blogs" className="text-neutral-700 hover:text-black flex items-center justify-between py-1 transition-colors">
                    <span>Hair Health Journal</span>
                    <ArrowRight className="h-3 w-3 text-neutral-400" />
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-neutral-700 hover:text-black flex items-center justify-between py-1 transition-colors">
                    <span>Frequently Asked Questions</span>
                    <ArrowRight className="h-3 w-3 text-neutral-400" />
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-neutral-700 hover:text-black flex items-center justify-between py-1 transition-colors">
                    <span>About Scalvea Science</span>
                    <ArrowRight className="h-3 w-3 text-neutral-400" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* More Videos Section */}
        {relatedVideos.length > 0 && (
          <section className="pt-8 border-t border-neutral-200/80">
            <h2 className="font-heading text-xl sm:text-2xl text-neutral-950 font-normal tracking-tight mb-6">
              More Educational Videos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedVideos.map((item) => (
                <Link
                  key={item.id}
                  to={`/videos/${item.slug}`}
                  className="group bg-white rounded-2xl p-5 border border-neutral-200/80 hover:border-neutral-400 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {item.duration}s
                      </span>
                    </div>
                    <h3 className="font-heading text-base font-normal text-neutral-950 group-hover:text-black mb-2 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-600 font-light line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 group-hover:underline">
                    Watch video guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
