import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, X } from "lucide-react";

export interface CountrySettings {
  country: string;
  currency: string;
  currency_symbol: string;
  tax_percentage: number;
  shipping_charge: number;
  free_shipping_above: number;
  delivery_time: string;
  is_enabled: boolean;
}

export type CountryType = "india" | "australia";

interface CountryContextType {
  selectedCountry: CountryType;
  setSelectedCountry: (country: CountryType) => void;
  market: "IN" | "AU";
  country: string; // "India" | "Australia" (backward compatibility)
  setCountry: (country: string) => void; // (backward compatibility)
  settings: CountrySettings | null; // (backward compatibility)
  countryConfig: CountrySettings | null;
  allCountries: CountrySettings[];
  loading: boolean;
  formatPrice: (priceAud: number, priceInr: number, priceUsd?: number) => string;
  getPrice: (priceAud: number, priceInr: number, priceUsd?: number) => number;
  currencySymbol: string;
  currency: string; // "INR" | "AUD"
  currencyCode: string; // "INR" | "AUD" (backward compatibility)
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

// Fallbacks in case database connection fails or hasn't loaded yet
const COUNTRY_FALLBACKS: Record<CountryType, CountrySettings> = {
  india: {
    country: "India",
    currency: "INR",
    currency_symbol: "₹",
    tax_percentage: 0,
    shipping_charge: 50.00,
    free_shipping_above: 1999.00,
    delivery_time: "3-5 business days",
    is_enabled: true
  },
  australia: {
    country: "Australia",
    currency: "AUD",
    currency_symbol: "A$",
    tax_percentage: 0,
    shipping_charge: 9.50,
    free_shipping_above: 60.00,
    delivery_time: "5-7 business days",
    is_enabled: true
  }
};

const CountrySelectionModal = ({ onSelect, onClose }: { onSelect: (c: CountryType) => void, onClose: () => void }) => {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100%-2rem)] sm:w-auto max-w-sm">
      <div className="bg-background/95 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 relative overflow-hidden rounded-2xl flex flex-col items-start">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-3 text-muted-foreground/60 hover:text-foreground transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Subtle premium accent line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 via-neutral-200 to-green-600" />
        
        <div className="flex items-center gap-3 mb-3">
          <Globe className="h-5 w-5 text-muted-foreground animate-pulse" />
          <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-medium">Welcome to Scalvea</h2>
        </div>
        
        <p className="text-xs text-muted-foreground mb-5 max-w-[280px] leading-relaxed">
          Please select your shopping region for customized pricing and shipping.
        </p>
        
        <div className="w-full space-y-2">
          <button
            onClick={() => onSelect("india")}
            className="w-full py-2.5 px-4 bg-white/50 border border-border/80 hover:border-foreground/40 hover:bg-white transition-all duration-300 flex items-center justify-between group rounded-xl"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">🇮🇳</span>
              <span className="text-[11px] tracking-[0.12em] uppercase font-medium">India (INR)</span>
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300 transform inline-block">→</span>
          </button>
          
          <button
            onClick={() => onSelect("australia")}
            className="w-full py-2.5 px-4 bg-white/50 border border-border/80 hover:border-foreground/40 hover:bg-white transition-all duration-300 flex items-center justify-between group rounded-xl"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">🇦🇺</span>
              <span className="text-[11px] tracking-[0.12em] uppercase font-medium">Australia (AUD)</span>
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300 transform inline-block">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCountry, setSelectedCountryState] = useState<CountryType | null>(() => {
    if (typeof window === 'undefined') return 'australia';
    const stored = localStorage.getItem("scalvea-country");
    if (!stored) return null;
    const cleaned = stored.toLowerCase();
    if (cleaned === "india" || cleaned === "inr") return "india";
    if (cleaned === "australia" || cleaned === "aud") return "australia";
    return null;
  });

  const [allCountries, setAllCountries] = useState<CountrySettings[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-detect country via IP if none selected
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem("scalvea-country")) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data && data.country_code) {
            setSelectedCountry(data.country_code === 'IN' ? 'india' : 'australia');
          }
        })
        .catch(err => console.warn("Geolocation fallback failed:", err));
    }
  }, []);

  useEffect(() => {
    supabase
      .from("country_settings")
      .select("*")
      .eq("is_enabled", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Keep only India and Australia in the settings list and override tax & shipping
          const filtered = (data as unknown as CountrySettings[])
            .map((c) => {
              const countryLower = c.country.toLowerCase();
              if (countryLower === "india") {
                return {
                  ...c,
                  tax_percentage: 0,
                  shipping_charge: 50.00,
                };
              } else if (countryLower === "australia") {
                return {
                  ...c,
                  tax_percentage: 0,
                  shipping_charge: 9.50,
                };
              }
              return c;
            })
            .filter(
              (c) => c.country.toLowerCase() === "india" || c.country.toLowerCase() === "australia"
            );
          setAllCountries(filtered);
        } else {
          setAllCountries([COUNTRY_FALLBACKS.australia, COUNTRY_FALLBACKS.india]);
        }
        setLoading(false);
      })
      .catch(() => {
        setAllCountries([COUNTRY_FALLBACKS.australia, COUNTRY_FALLBACKS.india]);
        setLoading(false);
      });
  }, []);

  const setSelectedCountry = (c: CountryType) => {
    setSelectedCountryState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem("scalvea-country", c);
      localStorage.setItem("scalvea-market", c === "india" ? "IN" : "AU");
    }
  };

  // Backward compatibility helpers
  const country = selectedCountry === "india" ? "India" : "Australia";
  const setCountry = (c: string) => {
    const cleaned = c.toLowerCase();
    if (cleaned === "india") setSelectedCountry("india");
    else if (cleaned === "australia") setSelectedCountry("australia");
  };

  const activeCountry = selectedCountry || "australia";
  const rawSettings = allCountries.find((s) => s.country.toLowerCase() === activeCountry) || COUNTRY_FALLBACKS[activeCountry];
  const settings = rawSettings ? {
    ...rawSettings,
    tax_percentage: 0,
    shipping_charge: activeCountry === "india" ? 50.00 : 9.50
  } : null;
  const countryConfig = settings;

  const currencySymbol = settings?.currency_symbol || (activeCountry === "india" ? "₹" : "A$");
  const currency = settings?.currency || (activeCountry === "india" ? "INR" : "AUD");
  const currencyCode = currency;

  const getPrice = (priceAud: number, priceInr: number, priceUsd?: number) => {
    return activeCountry === "india" ? priceInr : priceAud;
  };

  const formatPrice = (priceAud: number, priceInr: number, priceUsd?: number) => {
    const price = getPrice(priceAud, priceInr);
    // Format INR as whole rupees or standard, AUD with decimals
    if (activeCountry === "india") {
      return `${currencySymbol}${Math.round(price).toLocaleString("en-IN")}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  const market = activeCountry === "india" ? "IN" : "AU";

  return (
    <CountryContext.Provider
      value={{
        selectedCountry: activeCountry,
        setSelectedCountry,
        market,
        country,
        setCountry,
        settings,
        countryConfig,
        allCountries,
        loading,
        formatPrice,
        getPrice,
        currencySymbol,
        currency,
        currencyCode
      }}
    >
      {children}
      {selectedCountry === null && typeof window !== 'undefined' && (
        <CountrySelectionModal 
          onSelect={setSelectedCountry} 
          onClose={() => setSelectedCountry('australia')} 
        />
      )}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
};
