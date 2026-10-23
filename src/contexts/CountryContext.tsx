import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Check if the user has manually selected a country preference.
 * Manual selections must always take precedence over auto-detection.
 */
function hasManualCountryPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("scalvea-country-manual") === "true";
  } catch {
    return false;
  }
}

/**
 * Detect country from browser timezone — quick synchronous hint before edge call.
 * Returns "india" if timezone indicates India, otherwise "australia".
 */
function detectCountryFromTimezone(): CountryType {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") {
      return "india";
    }
  } catch {
    // Intl not available
  }
  return "australia";
}

/**
 * Inspect server or edge environment headers / cookies / global variables
 * where available (e.g., Cloudflare Workers, Vercel Edge, SSR injection).
 */
function detectCountryFromEdgeEnvironment(): CountryType | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Injected server/edge global (e.g. from SSR or Edge Middleware)
    const win = window as unknown as { __SCALVEA_EDGE_COUNTRY__?: string };
    if (win.__SCALVEA_EDGE_COUNTRY__) {
      const code = win.__SCALVEA_EDGE_COUNTRY__.toUpperCase();
      if (code === "IN" || code === "INDIA") return "india";
      if (code === "AU" || code === "AUSTRALIA") return "australia";
      return "australia"; // Default to Australia for all other international visitors
    }

    // 2. Cookie passed by edge / CDN (e.g. cf_ipcountry or scalvea_edge_country)
    const cookies = document.cookie || "";
    const match = cookies.match(/(?:^|;\s*)(?:cf_ipcountry|scalvea_edge_country)=([A-Z]{2})/i);
    if (match && match[1]) {
      const code = match[1].toUpperCase();
      if (code === "IN") return "india";
      if (code === "AU") return "australia";
      return "australia";
    }
  } catch {
    // Ignore edge environment read errors
  }

  return null;
}

/**
 * Query fast server/edge-based geolocation endpoints asynchronously.
 * Multi-tiered edge fallback:
 * 1. api.country.is (Anycast/edge GeoIP JSON)
 * 2. ipapi.co/json (trusted edge GeoIP fallback)
 * 3. cloudflare.com/cdn-cgi/trace (edge trace endpoint)
 */
async function fetchEdgeGeolocation(): Promise<CountryType | null> {
  // First check if edge injected into environment
  const envCountry = detectCountryFromEdgeEnvironment();
  if (envCountry) return envCountry;

  // Provider 1: api.country.is (ultra-fast, zero-auth edge GeoIP)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.country.is/", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.country === "string") {
        const code = data.country.toUpperCase();
        return code === "IN" ? "india" : "australia";
      }
    }
  } catch {
    // Fall through to next provider
  }

  // Provider 2: ipapi.co/json (established fallback)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", { credentials: "omit", signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.country_code || data.country)) {
        const code = (data.country_code || data.country).toUpperCase();
        return code === "IN" ? "india" : "australia";
      }
    }
  } catch {
    // Fall through to next provider
  }

  // Provider 3: Cloudflare edge trace
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("https://www.cloudflare.com/cdn-cgi/trace", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/loc=([A-Z]{2})/);
      if (match && match[1]) {
        return match[1].toUpperCase() === "IN" ? "india" : "australia";
      }
    }
  } catch {
    // Trace failed
  }

  return null;
}

/**
 * Resolve the initial country synchronously to prevent layout shifts and currency flickering.
 * Priority: Manual choice > Stored auto-choice > Edge environment > Timezone > Default (Australia)
 */
function resolveInitialCountry(): CountryType {
  if (typeof window === 'undefined') return 'australia';

  const stored = localStorage.getItem("scalvea-country");
  if (stored) {
    const cleaned = stored.toLowerCase();
    if (cleaned === "india" || cleaned === "inr") return "india";
    if (cleaned === "australia" || cleaned === "aud") return "australia";
  }

  // Immediate synchronous edge environment check
  const envCountry = detectCountryFromEdgeEnvironment();
  if (envCountry) return envCountry;

  // Secondary hint: Timezone
  const tzCountry = detectCountryFromTimezone();
  if (tzCountry === "india") return "india";

  return "australia";
}

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCountry, setSelectedCountryState] = useState<CountryType>(resolveInitialCountry);

  const [allCountries, setAllCountries] = useState<CountrySettings[]>([]);
  const [loading, setLoading] = useState(true);

  // Asynchronous edge geolocation resolution (runs once on mount)
  useEffect(() => {
    // If the user has manually selected a country, never override it
    if (hasManualCountryPreference()) return;

    let isMounted = true;
    fetchEdgeGeolocation().then((edgeCountry) => {
      if (!isMounted) return;
      if (edgeCountry) {
        // If user made a manual choice while the request was in flight, do not override
        if (hasManualCountryPreference()) return;

        setSelectedCountryState(edgeCountry);
        try {
          localStorage.setItem("scalvea-country", edgeCountry);
          localStorage.setItem("scalvea-market", edgeCountry === "india" ? "IN" : "AU");
        } catch {
          // localStorage unavailable
        }
      }
    }).catch(() => {
      // Default remains Australia on error
    });

    return () => {
      isMounted = false;
    };
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

  const setSelectedCountry = (c: CountryType, isManualChoice = true) => {
    setSelectedCountryState(c);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("scalvea-country", c);
        localStorage.setItem("scalvea-market", c === "india" ? "IN" : "AU");
        if (isManualChoice) {
          localStorage.setItem("scalvea-country-manual", "true");
        }
      } catch (e) {
        console.error("Failed to save country preference:", e);
      }
    }
  };

  // Backward compatibility helpers
  const country = selectedCountry === "india" ? "India" : "Australia";
  const setCountry = (c: string) => {
    const cleaned = c.toLowerCase();
    if (cleaned === "india") setSelectedCountry("india");
    else if (cleaned === "australia") setSelectedCountry("australia");
  };

  const rawSettings = allCountries.find((s) => s.country.toLowerCase() === selectedCountry) || COUNTRY_FALLBACKS[selectedCountry];
  const settings = rawSettings ? {
    ...rawSettings,
    tax_percentage: 0,
    shipping_charge: selectedCountry === "india" ? 50.00 : 9.50
  } : null;
  const countryConfig = settings;

  const currencySymbol = settings?.currency_symbol || (selectedCountry === "india" ? "₹" : "A$");
  const currency = settings?.currency || (selectedCountry === "india" ? "INR" : "AUD");
  const currencyCode = currency;

  const getPrice = (priceAud: number, priceInr: number, _priceUsd?: number) => {
    return selectedCountry === "india" ? priceInr : priceAud;
  };

  const formatPrice = (priceAud: number, priceInr: number, priceUsd?: number) => {
    const price = getPrice(priceAud, priceInr);
    // Format INR as whole rupees or standard, AUD with decimals
    if (selectedCountry === "india") {
      return `${currencySymbol}${Math.round(price).toLocaleString("en-IN")}`;
    }
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  const market = selectedCountry === "india" ? "IN" : "AU";

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
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
    </CountryContext.Provider>
  );
};

export const useCountry = () => {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
};
