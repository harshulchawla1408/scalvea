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

interface CountryContextType {
  country: string;
  setCountry: (country: string) => void;
  settings: CountrySettings | null;
  allCountries: CountrySettings[];
  loading: boolean;
  formatPrice: (priceAud: number, priceInr: number, priceUsd: number) => string;
  getPrice: (priceAud: number, priceInr: number, priceUsd: number) => number;
  currencySymbol: string;
  currencyCode: string;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const PRICE_KEY_MAP: Record<string, "aud" | "inr" | "usd"> = {
  Australia: "aud",
  India: "inr",
  USA: "usd",
};

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem("scalvea-country") || "Australia";
  });
  const [allCountries, setAllCountries] = useState<CountrySettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("country_settings")
      .select("*")
      .eq("is_enabled", true)
      .then(({ data }) => {
        if (data) setAllCountries(data as unknown as CountrySettings[]);
        setLoading(false);
      });
  }, []);

  const setCountry = (c: string) => {
    setCountryState(c);
    localStorage.setItem("scalvea-country", c);
  };

  const settings = allCountries.find((s) => s.country === country) || null;
  const currencySymbol = settings?.currency_symbol || "$";
  const currencyCode = settings?.currency || "AUD";

  const getPrice = (priceAud: number, priceInr: number, priceUsd: number) => {
    const key = PRICE_KEY_MAP[country] || "aud";
    if (key === "inr") return priceInr;
    if (key === "usd") return priceUsd;
    return priceAud;
  };

  const formatPrice = (priceAud: number, priceInr: number, priceUsd: number) => {
    const price = getPrice(priceAud, priceInr, priceUsd);
    return `${currencySymbol}${price.toFixed(2)} ${currencyCode}`;
  };

  return (
    <CountryContext.Provider
      value={{ country, setCountry, settings, allCountries, loading, formatPrice, getPrice, currencySymbol, currencyCode }}
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
