import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";

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
    tax_percentage: 18.00,
    shipping_charge: 100.00,
    free_shipping_above: 999.00,
    delivery_time: "3-5 business days",
    is_enabled: true
  },
  australia: {
    country: "Australia",
    currency: "AUD",
    currency_symbol: "A$",
    tax_percentage: 10.00,
    shipping_charge: 10.00,
    free_shipping_above: 100.00,
    delivery_time: "5-7 business days",
    is_enabled: true
  }
};

const CountrySelectionModal = ({ onSelect }: { onSelect: (c: CountryType) => void }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-background border border-border max-w-md w-full p-8 mx-4 shadow-2xl relative overflow-hidden text-center rounded-none flex flex-col items-center">
        {/* Subtle premium accent line */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 via-neutral-100 to-green-600" />
        
        <Globe className="h-8 w-8 text-muted-foreground mb-4 animate-pulse" />
        
        <h2 className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">Welcome to</h2>
        <h1 className="text-2xl font-extralight tracking-[0.2em] mb-4">SCALVEA</h1>
        <p className="text-xs text-muted-foreground mb-8 max-w-[280px]">
          Please select your shopping region. This will customize currency, shipping, and product availability.
        </p>
        
        <div className="w-full space-y-3">
          <button
            onClick={() => onSelect("india")}
            className="w-full py-3.5 px-6 border border-border hover:border-foreground transition-all duration-300 flex items-center justify-between group"
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">🇮🇳</span>
              <span className="text-xs tracking-[0.15em] uppercase font-light">India (INR)</span>
            </span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300 transform inline-block">→</span>
          </button>
          
          <button
            onClick={() => onSelect("australia")}
            className="w-full py-3.5 px-6 border border-border hover:border-foreground transition-all duration-300 flex items-center justify-between group"
          >
            <span className="flex items-center gap-3">
              <span className="text-xl">🇦🇺</span>
              <span className="text-xs tracking-[0.15em] uppercase font-light">Australia (AUD)</span>
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
    const stored = localStorage.getItem("scalvea-country");
    if (!stored) return null;
    const cleaned = stored.toLowerCase();
    if (cleaned === "india" || cleaned === "inr") return "india";
    if (cleaned === "australia" || cleaned === "aud") return "australia";
    return null;
  });

  const [allCountries, setAllCountries] = useState<CountrySettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("country_settings")
      .select("*")
      .eq("is_enabled", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Keep only India and Australia in the settings list
          const filtered = (data as unknown as CountrySettings[]).filter(
            (c) => c.country === "India" || c.country === "Australia"
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
    localStorage.setItem("scalvea-country", c);
  };

  // Backward compatibility helpers
  const country = selectedCountry === "india" ? "India" : "Australia";
  const setCountry = (c: string) => {
    const cleaned = c.toLowerCase();
    if (cleaned === "india") setSelectedCountry("india");
    else if (cleaned === "australia") setSelectedCountry("australia");
  };

  const activeCountry = selectedCountry || "australia";
  const settings = allCountries.find((s) => s.country.toLowerCase() === activeCountry) || COUNTRY_FALLBACKS[activeCountry];
  const countryConfig = settings;

  const currencySymbol = settings.currency_symbol;
  const currency = settings.currency;
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

  return (
    <CountryContext.Provider
      value={{
        selectedCountry: activeCountry,
        setSelectedCountry,
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
      {selectedCountry === null && <CountrySelectionModal onSelect={setSelectedCountry} />}
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
};
