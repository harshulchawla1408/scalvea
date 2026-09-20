import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  FlaskConical, 
  Feather, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEMANDED_VIDEO_URL = 
  "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos/demanded.mp4";

const ProductInDemand = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const hasTriggeredLoad = useRef(false);

  // Check real reviews from Supabase for Follicle 8
  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews-demanded", "follicle-8"],
    queryFn: async () => {
      try {
        const { data: prod } = await supabase
          .from("products")
          .select("id")
          .or("slug.ilike.%follicle%,name.ilike.%follicle%")
          .limit(1)
          .maybeSingle();

        if (!prod?.id) return [];

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prod.id);
        if (!isUUID) return [];

        const { data, error } = await supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", prod.id);
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviewCount).toFixed(1)
    : "5.0";

  // Lazy-load video and handle autoplay/pause on viewport entry
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!video) return;

        if (entry.isIntersecting) {
          // Lazy-load video source on first viewport intersection
          if (!hasTriggeredLoad.current) {
            hasTriggeredLoad.current = true;
            video.src = DEMANDED_VIDEO_URL;
            video.load();
          }

          if (!prefersReducedMotion) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                setIsPlaying(false);
              });
          }
        } else {
          // Pause when outside viewport to conserve resources
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => {
          setIsPlaying(true);
          setShowPlayOverlay(false);
        })
        .catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
      setShowPlayOverlay(true);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
  }, []);

  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  const benefits = [
    {
      icon: Users,
      label: "Trusted by Many",
      mobileLabel: "Trusted by Many",
    },
    {
      icon: FlaskConical,
      label: "4 Researched Actives",
      mobileLabel: "4 Actives",
    },
    {
      icon: Feather,
      label: "Lightweight Formula",
      mobileLabel: "Lightweight",
    },
    {
      icon: ShieldCheck,
      label: "Suitable for Men & Women",
      mobileLabel: "Men & Women",
    },
  ];

  return (
    <section 
      ref={containerRef}
      className="bg-[#F6F5F2] py-14 md:py-20 lg:py-24 border-t border-border/30 relative select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        
        {/* ========================================================
            TOP SECTION HEADER — Above Video for Mobile & Desktop
            "Product in Demand" is prominently larger than product name
           ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 md:mb-14 text-center lg:text-left"
        >
          <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-neutral-500 font-body font-medium block mb-2.5">
            FEATURED SPOTLIGHT
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.08] font-heading text-[#111111] tracking-tight font-normal">
            Product in Demand
          </h2>
          <p className="text-base sm:text-lg md:text-xl font-heading text-neutral-500 font-normal mt-2 tracking-normal">
            Follicle 8 Hair Growth Serum
          </p>
        </motion.div>

        {/* ========================================================
            2-COLUMN GRID (Video on Left, Editorial on Right)
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* ========================================================
              LEFT COLUMN — 9:16 Vertical Video Player
             ======================================================== */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[360px] lg:max-w-[400px] aspect-[9/16] rounded-[24px] md:rounded-[28px] overflow-hidden border border-neutral-150 shadow-[0_16px_48px_rgba(0,0,0,0.06)] bg-neutral-100 group cursor-pointer"
              onClick={() => togglePlay()}
            >
              {/* Skeleton loading placeholder */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-neutral-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                </div>
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                loop
                muted
                playsInline
                preload="none"
                onLoadedData={handleLoadedData}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
                aria-label="Follicle 8 Hair Growth Serum Product In Demand Video"
              />

              {/* Gradient Scrim for Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

              {/* Center Play/Pause Overlay Indicator */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
                  !isPlaying || showPlayOverlay 
                    ? "opacity-100 scale-100" 
                    : "opacity-0 scale-90 group-hover:opacity-60"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </div>
              </div>

              {/* Bottom Mute / Unmute Control */}
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all duration-200 border border-white/15 shadow-md focus:outline-none"
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-neutral-200" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>

              {/* Top subtle badge */}
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-black/50 backdrop-blur-md text-white/90 text-[9px] tracking-[0.16em] uppercase font-medium px-3 py-1 rounded-full border border-white/10">
                  Featured Reel
                </span>
              </div>
            </motion.div>
          </div>

          {/* ========================================================
              RIGHT COLUMN — Editorial Content & Highlights
             ======================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Feature Focus Headline & High-Visibility Luxury Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#F9F9F7] border border-neutral-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-3">
                <h3 className="text-2xl sm:text-3xl md:text-[32px] font-heading font-semibold text-black tracking-tight leading-[1.2]">
                  For Every Person Facing Hair Fall.
                </h3>
                <p className="text-xs sm:text-[13px] md:text-sm font-body font-semibold text-neutral-800 leading-relaxed tracking-wider uppercase">
                  Twenties, thirties, forties. Thinning, shedding, receding. Men and women.
                </p>
              </div>

              {/* ----------------------------------------------------
                  BENEFITS: Desktop 2x2 Grid
                 ---------------------------------------------------- */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-4 pt-1 pb-1">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div 
                      key={i}
                      className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#F9F9F7] border border-neutral-100 hover:border-neutral-200 transition-colors duration-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-neutral-150 flex items-center justify-center shrink-0 text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                        <Icon className="w-4.5 h-4.5 text-neutral-800 stroke-[1.75]" />
                      </div>
                      <span className="text-xs md:text-sm font-body font-medium text-neutral-900 leading-snug">
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ----------------------------------------------------
                  BENEFITS: Mobile Compact 4-Column Horizontal Row
                 ---------------------------------------------------- */}
              <div className="grid grid-cols-4 gap-2 pt-1 pb-1 sm:hidden">
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="w-11 h-11 rounded-full bg-[#F9F9F7] border border-neutral-200/80 flex items-center justify-center text-neutral-800 mb-1.5 shadow-sm">
                        <Icon className="w-4.5 h-4.5 stroke-[1.75]" />
                      </div>
                      <span className="text-[10px] font-body font-medium text-neutral-800 leading-tight">
                        {b.mobileLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ----------------------------------------------------
                  AVATAR SOCIAL PROOF PILL BADGE WITH STARS
                 ---------------------------------------------------- */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-3 bg-white border border-neutral-200/90 rounded-full px-3.5 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] w-fit">
                  {/* Overlapping customer avatars */}
                  <div className="flex items-center -space-x-2 shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Customer"
                      className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-neutral-200/60"
                      loading="lazy"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Customer"
                      className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-neutral-200/60"
                      loading="lazy"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                      alt="Customer"
                      className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-neutral-200/60"
                      loading="lazy"
                    />
                  </div>
                  {/* 5 Stars and text */}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-0.5 text-[#E5A020]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#E5A020] text-[#E5A020]" />
                      ))}
                    </div>
                    <span className="text-[10.5px] font-body font-medium text-neutral-800 leading-tight">
                      250+ Happy Customers
                    </span>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------
                  CTA BUTTON
                 ---------------------------------------------------- */}
              <div className="pt-2">
                <Link 
                  to="/product/follicle-8-hair-growth-serum"
                  className="group bg-black text-white hover:bg-neutral-900 transition-all duration-300 px-8 py-3.5 text-xs md:text-sm tracking-[0.14em] uppercase font-semibold h-12 flex items-center justify-center gap-2.5 hover:-translate-y-0.5 shadow-sm rounded-none w-full sm:w-fit"
                >
                  <span>Explore Follicle 8</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProductInDemand;
