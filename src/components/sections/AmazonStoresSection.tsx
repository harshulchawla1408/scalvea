import amazonInLogo from "@/assets/Amazon.in-Logo.webp";
import amazonAuLogo from "@/assets/au.webp";

interface AmazonStoresSectionProps {
  className?: string;
}

export default function AmazonStoresSection({ className = "" }: AmazonStoresSectionProps) {
  return (
    <section className={`bg-[#F6F5F2] py-12 sm:py-14 md:py-16 border-t border-neutral-150 select-none ${className}`}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow */}
        <span className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-body font-medium block mb-1.5 sm:mb-2">
          SHOP SCALVEA ON AMAZON
        </span>

        {/* Heading */}
        <h3 className="text-lg sm:text-xl md:text-2xl font-heading text-neutral-900 font-normal tracking-tight mb-6 sm:mb-7">
          Shop Scalvea products on Amazon
        </h3>

        {/* Equal-Sized Amazon Store Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-md mx-auto">
          {/* Amazon India */}
          <a
            href="https://www.amazon.in/dp/B0HG5S6MTX"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center h-16 sm:h-20 px-4 sm:px-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all duration-300"
            title="Shop Scalvea on Amazon India"
          >
            <img
              src={amazonInLogo}
              alt="Amazon India"
              className="max-h-7 sm:max-h-9 w-auto max-w-[120px] sm:max-w-[140px] object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </a>

          {/* Amazon Australia */}
          <a
            href="https://www.amazon.com.au/Scalvea-Follicle-Anagain-Redensyl-Baicapil/dp/B0HG5S6MTX/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center h-16 sm:h-20 px-4 sm:px-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-sm transition-all duration-300"
            title="Shop Scalvea on Amazon Australia"
          >
            <img
              src={amazonAuLogo}
              alt="Amazon Australia"
              className="max-h-7 sm:max-h-9 w-auto max-w-[120px] sm:max-w-[140px] object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

