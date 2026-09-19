import amazonInLogo from "@/assets/Amazon.in-Logo.webp";
import amazonAuLogo from "@/assets/au.webp";

interface AmazonStoresSectionProps {
  className?: string;
}

export default function AmazonStoresSection({ className = "" }: AmazonStoresSectionProps) {
  return (
    <section className={`bg-neutral-50/90 py-5 sm:py-6 border-y border-neutral-200/80 ${className}`}>
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-neutral-500 mb-3.5">
          Scalvea Products Available On Amazon
        </p>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          {/* Amazon India */}
          <a
            href="https://www.amazon.in/dp/B0HG5S6MTX"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center w-36 sm:w-48 h-14 sm:h-18 p-2 sm:p-3 rounded-xl bg-white border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-800 transition-all duration-300"
            title="Shop Scalvea on Amazon India"
          >
            <img
              src={amazonInLogo}
              alt="Amazon India"
              className="max-h-full max-w-full h-9 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </a>

          {/* Amazon Australia */}
          <a
            href="https://www.amazon.com.au/Scalvea-Follicle-Anagain-Redensyl-Baicapil/dp/B0HG5S6MTX/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center w-36 sm:w-48 h-14 sm:h-18 p-2 sm:p-3 rounded-xl bg-white border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-800 transition-all duration-300"
            title="Shop Scalvea on Amazon Australia"
          >
            <img
              src={amazonAuLogo}
              alt="Amazon Australia"
              className="max-h-full max-w-full h-9 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

