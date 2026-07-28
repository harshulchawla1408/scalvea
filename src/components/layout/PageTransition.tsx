import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
          className="fixed inset-0 z-[9999] bg-[#111111] flex flex-col items-center justify-center overflow-hidden pointer-events-none"
        >
          <div className="relative flex flex-col items-center justify-center -mt-16">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <h1 className="text-[#F5F5F5] text-4xl md:text-5xl font-chillax font-medium tracking-normal select-none">
                Scalvea
              </h1>
              <p className="text-[#F5F5F5] text-[10px] md:text-xs font-chillax font-light uppercase tracking-[0.4em] mt-3 md:mt-4 select-none">
                CARE YOU DESERVE
              </p>
            </motion.div>

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-[2px] overflow-hidden flex justify-center">
              <motion.div
                initial={{ width: "0%", opacity: 1 }}
                animate={{ width: "100%", opacity: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.15, // start slightly after logo
                  ease: [0.25, 1, 0.5, 1],
                  times: [0, 0.8, 1]
                }}
                className="h-full bg-[#F5F5F5]"
              />
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
