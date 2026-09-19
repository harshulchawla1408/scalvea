import { useState, useEffect, useRef } from "react";
import { useCountry } from "@/contexts/CountryContext";
import { Truck } from "lucide-react";

interface ShippingAnnouncementBarProps {
  className?: string;
  variant?: "header" | "inline";
}

export const ShippingAnnouncementBar = ({
  className = "",
  variant = "header",
}: ShippingAnnouncementBarProps) => {
  const { selectedCountry } = useCountry();
  const isIndia = selectedCountry === "india";

  const flagUrl = isIndia
    ? "https://flagcdn.com/w20/in.png"
    : "https://flagcdn.com/w20/au.png";
  const flagAlt = isIndia ? "India" : "Australia";

  const message = isIndia
    ? "Free Delivery Across India"
    : "Free Australia-Wide Shipping on Orders A$60+";

  const [displayedText, setDisplayedText] = useState(() => {
    if (typeof window === "undefined") return message;
    return "";
  });
  const [isTypingComplete, setIsTypingComplete] = useState(() => typeof window === "undefined");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayedText(message);
      setIsTypingComplete(true);
      return;
    }

    // Reset for fresh typewriter animation on market change
    setDisplayedText("");
    setIsTypingComplete(false);

    let charIndex = 0;
    const totalChars = message.length;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      charIndex += 1;
      setDisplayedText(message.slice(0, charIndex));

      if (charIndex >= totalChars) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTypingComplete(true);
      }
    }, 22);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [message, selectedCountry]);

  const baseContainerStyles =
    variant === "header"
      ? "bg-black text-white border-t border-neutral-800/80 py-2 px-3 text-center select-none relative lg:absolute lg:top-full lg:left-0 lg:right-0 z-30 shadow-sm lg:bg-black/90 lg:backdrop-blur-md overflow-hidden min-h-[36px] flex items-center justify-center"
      : "bg-black text-white border border-neutral-800/80 py-2 px-3 text-center select-none shadow-sm overflow-hidden min-h-[36px] flex items-center justify-center";

  return (
    <div className={`${baseContainerStyles} ${className}`}>
      <div
        key={selectedCountry}
        className="max-w-7xl mx-auto flex items-center justify-center text-xs sm:text-[13px] md:text-sm font-medium tracking-wide whitespace-nowrap animate-fade-in transition-all duration-300"
      >
        <div className="text-neutral-200 flex items-center justify-center gap-1.5 sm:gap-2">
          {/* Truck Icon in front */}
          <Truck className="size-3.5 sm:size-4 text-white shrink-0 stroke-[1.75]" />

          {/* Dynamic Typed Announcement Text */}
          <span className="font-semibold text-white tracking-tight sm:tracking-normal">
            {displayedText}
          </span>

          {/* Elegant subtle blinking cursor during active typing */}
          {!isTypingComplete && (
            <span
              className="inline-block w-[1.5px] h-3.5 bg-neutral-300 align-middle animate-pulse -ml-0.5"
              aria-hidden="true"
            />
          )}

          {/* Country Flag Image after country text */}
          <img
            src={flagUrl}
            alt={flagAlt}
            className={`w-3.5 sm:w-4 h-auto rounded-[2px] shadow-sm ml-0.5 inline-block shrink-0 transition-opacity duration-300 ${
              isTypingComplete ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingAnnouncementBar;
