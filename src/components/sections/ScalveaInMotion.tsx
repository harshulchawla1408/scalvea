import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, ChevronLeft, ChevronRight, X, Play, Pause } from "lucide-react";

// ---------------------------------------------------------------------------
// Video Data — public Supabase Storage URLs (no signed tokens, no secrets)
// ---------------------------------------------------------------------------
const SUPABASE_VIDEOS_BASE =
  "https://dtehgajreecaonqalxlf.supabase.co/storage/v1/object/public/Videos";

interface SocialVideo {
  id: string;
  src: string;
  title: string;
  description: string;
}

const socialVideos: SocialVideo[] = [
  {
    id: "reel-1",
    src: `${SUPABASE_VIDEOS_BASE}/Reel1.mp4`,
    title: "Scalvea Hair Care",
    description: "A closer look at Scalvea hair care products in action.",
  },
  {
    id: "reel-2",
    src: `${SUPABASE_VIDEOS_BASE}/Reel2.mp4`,
    title: "Follicle 8 Hair Growth Serum",
    description: "Exploring the texture and application of Follicle 8.",
  },
  {
    id: "reel-3",
    src: `${SUPABASE_VIDEOS_BASE}/Reel3.mp4`,
    title: "Scalp Care Routine",
    description: "A real scalp care routine with Scalvea products.",
  },
  {
    id: "reel-4",
    src: `${SUPABASE_VIDEOS_BASE}/Reel4.mp4`,
    title: "Scalp-5 Anti-Dandruff Serum",
    description: "Lightweight anti-dandruff care for everyday use.",
  },
  {
    id: "reel-5",
    src: `${SUPABASE_VIDEOS_BASE}/Reel5.mp4`,
    title: "Hair Growth Journey",
    description: "Real moments from a hair growth journey with Scalvea.",
  },
  {
    id: "reel-6",
    src: `${SUPABASE_VIDEOS_BASE}/Reel6.mp4`,
    title: "Product Texture Close-Up",
    description: "The lightweight, non-greasy feel of Scalvea serums.",
  },
  {
    id: "reel-7",
    src: `${SUPABASE_VIDEOS_BASE}/Reel7.mp4`,
    title: "Daily Hair Care",
    description: "Scalvea as part of a daily hair care ritual.",
  },
  {
    id: "reel-8",
    src: `${SUPABASE_VIDEOS_BASE}/Reel8.mp4`,
    title: "Healthy Scalp, Stronger Hair",
    description: "Supporting healthier scalp and stronger-looking hair.",
  },
];

// ---------------------------------------------------------------------------
// VideoCard — individual video with IntersectionObserver autoplay + mute
// ---------------------------------------------------------------------------
interface VideoCardProps {
  video: SocialVideo;
  onOpenLightbox: (video: SocialVideo) => void;
  unmutedVideoId: string | null;
  onToggleMute: (videoId: string) => void;
}

const VideoCard = ({ video, onOpenLightbox, unmutedVideoId, onToggleMute }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMuted = unmutedVideoId !== video.id;
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasBeenVisible = useRef(false);

  // Sync muted state to the video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) videoEl.muted = isMuted;
  }, [isMuted]);

  // IntersectionObserver — autoplay when ~25% visible
  useEffect(() => {
    const container = containerRef.current;
    const videoEl = videoRef.current;
    if (!container || !videoEl) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoEl) return;

        if (entry.isIntersecting) {
          // First time visible — set src to trigger load
          if (!hasBeenVisible.current) {
            hasBeenVisible.current = true;
            videoEl.src = video.src;
            videoEl.load();
          }

          if (!prefersReducedMotion) {
            videoEl.play().catch(() => {
              // Autoplay blocked — silently handle
            });
          }
        } else {
          videoEl.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [video.src]);

  const toggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleMute(video.id);
    },
    [onToggleMute, video.id]
  );

  const handleError = useCallback(() => {
    setHasError(true);
    if (process.env.NODE_ENV === "development") {
      console.warn(`[ScalveaInMotion] Failed to load video: ${video.src}`);
    }
  }, [video.src]);

  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (hasError) return null;

  return (
    <div
      ref={containerRef}
      className="relative flex-shrink-0 snap-start group cursor-pointer"
      style={{ width: "var(--card-width)" }}
      onClick={() => onOpenLightbox(video)}
      role="button"
      tabIndex={0}
      aria-label={`Watch: ${video.title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLightbox(video);
        }
      }}
    >
      {/* 9:16 aspect container */}
      <div className="relative w-full overflow-hidden rounded-[6px]" style={{ aspectRatio: "9 / 16" }}>
        {/* Loading skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
        )}

        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          onError={handleError}
          onLoadedData={handleLoadedData}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          aria-label={video.description}
        />

        {/* Subtle bottom gradient for mute button contrast */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Mute / Unmute button */}
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/90 hover:bg-black/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Hover scale — desktop only, respects reduced motion */}
        <style>{`
          @media (hover: hover) and (prefers-reduced-motion: no-preference) {
            .group:hover video {
              transform: scale(1.015);
              transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Lightbox — fullscreen video viewer
// ---------------------------------------------------------------------------
interface LightboxProps {
  video: SocialVideo;
  onClose: () => void;
}

const VideoLightbox = ({ video, onClose }: LightboxProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Focus trap + escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Start playing on mount
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = !videoEl.muted;
    setIsMuted(videoEl.muted);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Watching: ${video.title}`}
    >
      <div
        className="relative w-full max-w-[400px] mx-4"
        style={{ aspectRatio: "9 / 16" }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={video.src}
          muted={isMuted}
          loop
          playsInline
          autoPlay
          className="w-full h-full object-cover rounded-lg"
          aria-label={video.description}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close video"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bottom controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ScalveaInMotion — main section component
// ---------------------------------------------------------------------------
const ScalveaInMotion = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [lightboxVideo, setLightboxVideo] = useState<SocialVideo | null>(null);
  const [unmutedVideoId, setUnmutedVideoId] = useState<string | null>(null);

  // Toggle mute — only one video unmuted at a time
  const handleToggleMute = useCallback((videoId: string) => {
    setUnmutedVideoId((prev) => (prev === videoId ? null : videoId));
  }, []);

  // Track scroll position for arrow visibility
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by roughly one card width
    const cardWidth = el.querySelector<HTMLElement>("[data-video-card]")?.offsetWidth ?? 300;
    const gap = 16;
    const scrollAmount = direction === "left" ? -(cardWidth + gap) : cardWidth + gap;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  const openLightbox = useCallback((video: SocialVideo) => {
    setLightboxVideo(video);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxVideo(null);
  }, []);

  return (
    <section
      className="bg-white py-16 md:py-24 lg:py-28 overflow-hidden relative select-none"
      aria-label="Scalvea In Motion — hair care video showcase"
    >
      {/* Header — aligned to main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 mb-10 md:mb-14">
        <span className="text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-neutral-400 font-body font-medium block mb-3">
          REAL HAIR CARE. REAL MOMENTS.
        </span>
        <h2 className="text-3xl md:text-[42px] lg:text-[50px] leading-[1.1] font-heading text-neutral-900 tracking-tight mb-4">
          Scalvea In Motion
        </h2>
        <p className="text-xs md:text-sm text-neutral-500 font-body font-light leading-relaxed max-w-md">
          Explore Scalvea through real product moments, textures, routines and
          hair-care stories.
        </p>
      </div>

      {/* Carousel container — aligned to main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 relative group/carousel">
        {/* Navigation arrows — desktop only */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden lg:flex absolute -left-1 xl:left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-neutral-700 shadow-sm border border-neutral-100 hover:bg-white hover:shadow-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden lg:flex absolute -right-1 xl:right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-neutral-700 shadow-sm border border-neutral-100 hover:bg-white hover:shadow-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-300"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={
            {
              "--card-width": "clamp(240px, 68vw, 280px)",
            } as React.CSSProperties
          }
        >
          {socialVideos.map((video) => (
            <div key={video.id} data-video-card>
              <VideoCard video={video} onOpenLightbox={openLightbox} unmutedVideoId={unmutedVideoId} onToggleMute={handleToggleMute} />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxVideo && (
        <VideoLightbox video={lightboxVideo} onClose={closeLightbox} />
      )}
    </section>
  );
};

export default ScalveaInMotion;
