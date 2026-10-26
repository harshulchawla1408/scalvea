import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const PageTransition = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const firstMount = useRef(true);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }

    setIsTransitioning(true);
    
    // Target visible duration max 700-800ms
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isTransitioning) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#111111] flex flex-col items-center justify-center overflow-hidden pointer-events-none transition-opacity duration-200"
    >
      <div className="relative flex flex-col items-center justify-center -mt-16">
        <div className="flex flex-col items-center">
          <div className="text-[#F5F5F5] text-4xl md:text-5xl font-display font-light tracking-tight select-none">
            Scalvea
          </div>
          <p className="text-[#F5F5F5] text-[10px] md:text-xs font-display font-light uppercase tracking-[0.35em] mt-3 md:mt-4 select-none">
            CARE YOU DESERVE
          </p>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-[2px] overflow-hidden flex justify-center">
          <div
            className="h-full bg-[#F5F5F5] animate-slide-progress"
          />
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
