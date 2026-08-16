import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  videoSrc: string;
  videoSrcMobile?: string;
  posterSrc: string;
  className?: string;
  videoClassName?: string;
  imgClassName?: string;
}

export function LazyVideo({ 
  videoSrc,
  videoSrcMobile, 
  posterSrc, 
  className = "absolute inset-0 w-full h-full object-cover",
  videoClassName = "absolute inset-0 w-full h-full object-cover",
  imgClassName = "absolute inset-0 w-full h-full object-cover"
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const loadVideo = () => {
      const video = videoRef.current;
      if (!video) return;

      const isMobile = window.innerWidth <= 768;
      video.src = (isMobile && videoSrcMobile) ? videoSrcMobile : videoSrc;
      video.load();

      video.play()
        .then(() => setVideoReady(true))
        .catch(() => {
          // Auto-play was likely prevented by the browser. 
          // We can still show the video (maybe with controls) or keep the poster.
        });
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(loadVideo, { timeout: 2500 });
    } else {
      window.setTimeout(loadVideo, 1500);
    }
  }, [videoSrc, videoSrcMobile]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={posterSrc}
        alt=""
        className={`${imgClassName} transition-opacity duration-700 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className={`${videoClassName} transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
