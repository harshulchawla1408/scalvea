import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Search,
  MapPin,
  Building2,
  Package,
  Calendar,
  RefreshCw,
  ArrowUpDown,
  DollarSign,
  ShoppingCart,
  Users,
  Globe,
  TrendingUp,
} from "lucide-react";
import { AUS_TIMEZONE, getAusDateKey, formatAusDateTime } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLORS = ["#000000", "#444444", "#777777", "#aaaaaa", "#cccccc"];

const AdminAnalytics = () => {
  const [selectedCountry, setSelectedCountry] = useState<"All" | "Australia" | "India">("All");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  // Sorting
  const [citySortBy, setCitySortBy] = useState<"revenue" | "orders" | "name">("revenue");
  const [citySortDir, setCitySortDir] = useState<"desc" | "asc">("desc");
  const [productSortBy, setProductSortBy] = useState<"revenue" | "units" | "name">("revenue");
  const [productSortDir, setProductSortDir] = useState<"desc" | "asc">("desc");

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, profilesRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").neq("order_status", "draft"),
      supabase.from("profiles").select("id"),
      supabase.from("products").select("id, name"),
    ]);

    setAllOrders((ordersRes.data || []).filter((o) => o.order_status !== "draft"));
    setTotalCustomers(profilesRes.data?.length || 0);
    setAllProducts(productsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to extract city and state
  const getOrderAddress = (order: any) => {
    let addr: any = {};
    if (order.shipping_address) {
      if (typeof order.shipping_address === "string") {
        try {
          addr = JSON.parse(order.shipping_address);
        } catch {
          addr = {};
        }
      } else {
        addr = order.shipping_address;
      }
    }
    const city = (order.shipping_city || addr.city || addr.town || order.city || "").trim();
    const state = (order.shipping_state || addr.state || addr.province || order.state || "").trim();
    return { city, state };
  };

  // Dynamic state/city/product options
  const { availableStates, availableCities, availableProductNames } = useMemo(() => {
    const states = new Set<string>();
    const cities = new Set<string>();
    const prods = new Set<string>();

    allOrders.forEach((o) => {
      const { city, state } = getOrderAddress(o);
      if (state) states.add(state);
      if (city) cities.add(city);
      (o.order_items || []).forEach((item: any) => {
        if (item.product_name) prods.add(item.product_name);
        else if (item.name) prods.add(item.name);
      });
      if (o.product_summary) prods.add(o.product_summary);
    });

    allProducts.forEach((p) => {
      if (p.name) prods.add(p.name);
    });

    return {
      availableStates: Array.from(states).sort(),
      availableCities: Array.from(cities).sort(),
      availableProductNames: Array.from(prods).sort(),
    };
  }, [allOrders, allProducts]);

  // Filtered orders for analytics
  const filteredOrders = useMemo(() => {
    let list = allOrders;

    // 1. Country filter
    if (selectedCountry !== "All") {
      list = list.filter((o) => o.country?.toLowerCase() === selectedCountry.toLowerCase());
    }

    // 2. Date filter
    const now = new Date();
    const todayStr = getAusDateKey();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      list = list.filter((o) => o.created_at && getAusDateKey(o.created_at) === todayStr);
    } else if (dateFilter === "7d") {
      list = list.filter((o) => o.created_at && new Date(o.created_at) >= sevenDaysAgo);
    } else if (dateFilter === "30d") {
      list = list.filter((o) => o.created_at && new Date(o.created_at) >= thirtyDaysAgo);
    } else if (dateFilter === "custom") {
      if (customStartDate) {
        list = list.filter((o) => o.created_at && o.created_at.slice(0, 10) >= customStartDate);
      }
      if (customEndDate) {
        list = list.filter((o) => o.created_at && o.created_at.slice(0, 10) <= customEndDate);
      }
    }

    // 3. State filter
    if (selectedState !== "all") {
      list = list.filter((o) => {
        const { state } = getOrderAddress(o);
        return state.toLowerCase() === selectedState.toLowerCase();
      });
    }

    // 4. City filter
    if (selectedCity !== "all") {
      list = list.filter((o) => {
        const { city } = getOrderAddress(o);
        return city.toLowerCase() === selectedCity.toLowerCase();
      });
    }

    // 5. Product filter
    if (selectedProduct !== "all") {
      list = list.filter((o) => {
        const items = o.order_items || [];
        const hasItem = items.some((i: any) =>
          (i.product_name || i.name || "").toLowerCase().includes(selectedProduct.toLowerCase())
        );
        const hasSummary = (o.product_summary || "").toLowerCase().includes(selectedProduct.toLowerCase());
        return hasItem || hasSummary;
      });
    }

    // 6. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const { city, state } = getOrderAddress(o);
        const orderNum = (o.order_number || "").toLowerCase();
        const custName = (o.customer_name || "").toLowerCase();
        const custEmail = (o.customer_email || "").toLowerCase();
        const prodSummary = (o.product_summary || "").toLowerCase();
        const itemsMatch = (o.order_items || []).some((i: any) =>
          (i.product_name || i.name || "").toLowerCase().includes(q)
        );
        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custEmail.includes(q) ||
          city.toLowerCase().includes(q) ||
          state.toLowerCase().includes(q) ||
          prodSummary.includes(q) ||
          itemsMatch
        );
      });
    }

    return list;
  }, [allOrders, selectedCountry, dateFilter, customStartDate, customEndDate, selectedState, selectedCity, selectedProduct, searchQuery]);

  // Derived Analytics Data
  const analytics = useMemo(() => {
    const audOrders = filteredOrders.filter((o) => o.currency === "AUD");
    const inrOrders = filteredOrders.filter((o) => o.currency === "INR");

    const audTotal = audOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const inrTotal = inrOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    const audAov = audOrders.length > 0 ? audTotal / audOrders.length : 0;
    const inrAov = inrOrders.length > 0 ? inrTotal / inrOrders.length : 0;

    let avgOrderValueText = "";
    let totalRevenueText = "";

    if (selectedCountry === "Australia") {
      avgOrderValueText = `A$${audAov.toFixed(2)}`;
      totalRevenueText = `A$${audTotal.toFixed(2)}`;
    } else if (selectedCountry === "India") {
      avgOrderValueText = `₹${Math.round(inrAov).toLocaleString("en-IN")}`;
      totalRevenueText = `₹${Math.round(inrTotal).toLocaleString("en-IN")}`;
    } else {
      avgOrderValueText = `A$${audAov.toFixed(0)} / ₹${Math.round(inrAov).toLocaleString("en-IN")}`;
      totalRevenueText = `A$${audTotal.toFixed(0)} / ₹${Math.round(inrTotal).toLocaleString("en-IN")}`;
    }

    // Daily revenue (last 14 days)
    const dailyMap: Record<string, { aud: number; inr: number }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-AU", { timeZone: AUS_TIMEZONE, month: "short", day: "numeric" });
      dailyMap[key] = { aud: 0, inr: 0 };
    }

    filteredOrders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en-AU", { timeZone: AUS_TIMEZONE, month: "short", day: "numeric" });
      if (key in dailyMap) {
        if (o.currency === "INR") dailyMap[key].inr += Number(o.total_amount);
        else dailyMap[key].aud += Number(o.total_amount);
      }
    });

    const dailyRevenue = Object.entries(dailyMap).map(([day, val]) => ({
      day,
      ...(selectedCountry === "All" || selectedCountry === "Australia" ? { "Australia (AUD)": val.aud } : {}),
      ...(selectedCountry === "All" || selectedCountry === "India" ? { "India (INR)": val.inr } : {}),
    }));

    // Monthly Sales (last 12 months)
    const monthMap: Record<string, { aud: number; inr: number; orders: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-AU", { timeZone: AUS_TIMEZONE, month: "short", year: "2-digit" });
      monthMap[key] = { aud: 0, inr: 0, orders: 0 };
    }

    filteredOrders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en-AU", { timeZone: AUS_TIMEZONE, month: "short", year: "2-digit" });
      if (key in monthMap) {
        if (o.currency === "INR") monthMap[key].inr += Number(o.total_amount);
        else monthMap[key].aud += Number(o.total_amount);
        monthMap[key].orders++;
      }
    });

    const monthlySales = Object.entries(monthMap).map(([month, val]) => ({
      month,
      orders: val.orders,
      ...(selectedCountry === "All" || selectedCountry === "Australia" ? { "Australia (AUD)": val.aud } : {}),
      ...(selectedCountry === "All" || selectedCountry === "India" ? { "India (INR)": val.inr } : {}),
    }));

    // Payment Methods Breakdown
    const pmMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      const pm = (o.payment_provider || o.payment_method || "Stripe").toUpperCase();
      pmMap[pm] = (pmMap[pm] || 0) + 1;
    });
    const paymentMethods = Object.entries(pmMap).map(([name, value]) => ({ name, value }));

    // Status breakdown
    const statusMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      const status = (o.order_status || "unknown").replace(/_/g, " ").toUpperCase();
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Country breakdown
    const countryMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      countryMap[o.country] = (countryMap[o.country] || 0) + Number(o.total_amount);
    });
    const countryBreakdown = Object.entries(countryMap).map(([name, value]) => ({ name, value }));

    return {
      avgOrderValueText,
      totalRevenueText,
      dailyRevenue,
      monthlySales,
      paymentMethods,
      statusBreakdown,
      countryBreakdown,
    };
  }, [filteredOrders, selectedCountry]);

  // ─── Geographic City & State Performance Table ───────────────────────────
  const cityStateAnalysis = useMemo(() => {
    const map: Record<string, { city: string; state: string; country: string; orders: number; aud: number; inr: number }> = {};

    filteredOrders.forEach((o) => {
      const { city, state } = getOrderAddress(o);
      const country = o.country || "Australia";
      const key = `${city || "Unknown"}__${state || "Unknown"}__${country}`;

      if (!map[key]) {
        map[key] = {
          city: city || "Unknown City",
          state: state || "—",
          country,
          orders: 0,
          aud: 0,
          inr: 0,
        };
      }

      map[key].orders++;
      if (o.currency === "AUD") {
        map[key].aud += Number(o.total_amount) || 0;
      } else {
        map[key].inr += Number(o.total_amount) || 0;
      }
    });

    const rows = Object.values(map);

    rows.sort((a, b) => {
      let comparison = 0;
      if (citySortBy === "revenue") {
        const totalA = a.aud * 55 + a.inr;
        const totalB = b.aud * 55 + b.inr;
        comparison = totalB - totalA;
      } else if (citySortBy === "orders") {
        comparison = b.orders - a.orders;
      } else if (citySortBy === "name") {
        comparison = a.city.localeCompare(b.city);
      }
      return citySortDir === "desc" ? comparison : -comparison;
    });

    return rows;
  }, [filteredOrders, citySortBy, citySortDir]);

  // ─── Product Performance Analysis Table ──────────────────────────────────
  const productAnalysis = useMemo(() => {
    const map: Record<string, { name: string; units: number; aud: number; inr: number }> = {};

    filteredOrders.forEach((o) => {
      const items = o.order_items || [];
      const isAud = o.currency === "AUD";

      if (items.length > 0) {
        items.forEach((item: any) => {
          const name = item.product_name || item.name || "Scalvea Product";
          if (!map[name]) map[name] = { name, units: 0, aud: 0, inr: 0 };
          map[name].units += Number(item.quantity) || 1;
          const amt = Number(item.price) * (Number(item.quantity) || 1);
          if (isAud) map[name].aud += amt; else map[name].inr += amt;
        });
      } else if (o.product_summary) {
        const name = o.product_summary;
        if (!map[name]) map[name] = { name, units: 0, aud: 0, inr: 0 };
        map[name].units += 1;
        if (isAud) map[name].aud += Number(o.total_amount); else map[name].inr += Number(o.total_amount);
      }
    });

    const rows = Object.values(map);

    rows.sort((a, b) => {
      let comparison = 0;
      if (productSortBy === "revenue") {
        const totalA = a.aud * 55 + a.inr;
        const totalB = b.aud * 55 + b.inr;
        comparison = totalB - totalA;
      } else if (productSortBy === "units") {
        comparison = b.units - a.units;
      } else if (productSortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }
      return productSortDir === "desc" ? comparison : -comparison;
    });

    return rows;
  }, [filteredOrders, productSortBy, productSortDir]);

  const resetFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedProduct("all");
    setSelectedState("all");
    setSelectedCity("all");
  };

  const handleCitySort = (field: "revenue" | "orders" | "name") => {
    if (citySortBy === field) {
      setCitySortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setCitySortBy(field);
      setCitySortDir("desc");
    }
  };

  const handleProductSort = (field: "revenue" | "units" | "name") => {
    if (productSortBy === field) {
      setProductSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setProductSortBy(field);
      setProductSortDir("desc");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  const summaryCards = [
    { label: "Filtered Revenue", value: analytics.totalRevenueText, icon: DollarSign },
    { label: "Orders Count", value: filteredOrders.length, icon: ShoppingCart },
    { label: "Avg. Order Value", value: analytics.avgOrderValueText, icon: TrendingUp },
    { label: "Total Customers", value: totalCustomers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* ─── 1. HEADER & COUNTRY SELECTOR ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] font-semibold">Sales & Geographic Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deep financial and regional intelligence for Australia and India operations.
          </p>
        </div>
        <div className="flex border border-border self-start sm:self-auto">
          {(["All", "Australia", "India"] as const).map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.06em] transition-colors border-r last:border-r-0 border-border ${
                selectedCountry === country
                  ? "bg-foreground text-background font-semibold"
                  : "text-muted-foreground hover:bg-secondary/40 font-medium"
              }`}
            >
              {country === "All" ? "All Regions" : country}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. SEARCH & FILTER TOOLBAR ──────────────────────────────────────── */}
      <div className="border border-border p-4 bg-card rounded-xl space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search analytics by city, state, product, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Date Range Presets */}
          <div className="md:col-span-7 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Date:</span>
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "custom", label: "Custom" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={`px-2.5 py-1 text-[10px] uppercase font-medium border rounded-xs transition-colors ${
                  dateFilter === d.id
                    ? "bg-foreground text-background font-semibold border-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                {d.label}
              </button>
            ))}

            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0 bg-muted/40 px-2 py-1 rounded border border-border">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-7 text-xs border border-border px-1.5 bg-background rounded-xs"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-7 text-xs border border-border px-1.5 bg-background rounded-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Product, State, City Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Product:</span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="h-8 px-2 text-xs bg-background border border-border rounded-md outline-none max-w-[150px]"
            >
              <option value="all">All Products</option>
              {availableProductNames.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-8 px-2 text-xs bg-background border border-border rounded-md outline-none max-w-[140px]"
            >
              <option value="all">All States</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-8 px-2 text-xs bg-background border border-border rounded-md outline-none max-w-[140px]"
            >
              <option value="all">All Cities</option>
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>

          {(searchQuery || dateFilter !== "all" || selectedProduct !== "all" || selectedState !== "all" || selectedCity !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* ─── 3. SUMMARY KPI CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="border border-border p-5 bg-background rounded-lg shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] tracking-[0.12em] uppercase font-semibold">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground/80" />
            </div>
            <p className="text-base sm:text-lg font-mono font-bold mt-1 text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ─── 4. REVENUE CHARTS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-xs tracking-[0.15em] uppercase font-semibold mb-6">Daily Revenue (Last 14 Days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={analytics.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              {selectedCountry !== "India" && (
                <Area type="monotone" dataKey="Australia (AUD)" stroke="#000000" fill="#00000005" strokeWidth={2} name="Australia (AUD)" />
              )}
              {selectedCountry !== "Australia" && (
                <Area type="monotone" dataKey="India (INR)" stroke="#898989" fill="#89898905" strokeWidth={2} name="India (INR)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Sales */}
        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-xs tracking-[0.15em] uppercase font-semibold mb-6">Monthly Revenue & Orders (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              {selectedCountry !== "India" && (
                <Line yAxisId="left" type="monotone" dataKey="Australia (AUD)" stroke="#000000" strokeWidth={2} name="Australia (AUD)" />
              )}
              {selectedCountry !== "Australia" && (
                <Line yAxisId="left" type="monotone" dataKey="India (INR)" stroke="#898989" strokeWidth={2} name="India (INR)" />
              )}
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#555" strokeWidth={1.5} strokeDasharray="4 4" name="Orders Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── 5. PIE CHARTS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Revenue Share by Country", data: analytics.countryBreakdown, key: "value", isCurrency: true },
          { title: "Payment Methods", data: analytics.paymentMethods, key: "value" },
          { title: "Order Status", data: analytics.statusBreakdown, key: "value" },
        ].map((chart) => (
          <div key={chart.title} className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
            <h2 className="text-xs tracking-[0.15em] uppercase font-semibold mb-4">{chart.title}</h2>
            {chart.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey={chart.key}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chart.data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }}
                    formatter={(val: number) => (chart.isCurrency ? `Value: ${val.toFixed(0)}` : `Count: ${val}`)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>

      {/* ─── 6. CITY & STATE GEOGRAPHIC PERFORMANCE BREAKDOWN ────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-sm tracking-[0.1em] uppercase font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              City & State Performance Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Regional sales distribution across cities and states.
            </p>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Sort By:</span>
            <button
              onClick={() => handleCitySort("revenue")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                citySortBy === "revenue"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Revenue {citySortBy === "revenue" && (citySortDir === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleCitySort("orders")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                citySortBy === "orders"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Orders {citySortBy === "orders" && (citySortDir === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleCitySort("name")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                citySortBy === "name"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              City {citySortBy === "name" && (citySortDir === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>

        {cityStateAnalysis.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No city or state data available for current filters.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4">City</th>
                    <th className="py-2.5 px-4">State</th>
                    <th className="py-2.5 px-4">Country</th>
                    <th className="py-2.5 px-4 text-center">Orders</th>
                    <th className="py-2.5 px-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cityStateAnalysis.slice(0, 15).map((row, idx) => (
                    <tr key={`${row.city}_${row.state}_${idx}`} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{row.city}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{row.state}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-muted">
                          {row.country === "India" ? "🇮🇳 India" : "🇦🇺 Australia"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-medium">{row.orders}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                        {row.country === "India"
                          ? `₹${Math.round(row.inr).toLocaleString("en-IN")}`
                          : `A$${row.aud.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-border">
              {cityStateAnalysis.slice(0, 15).map((row, idx) => (
                <div key={`${row.city}_${row.state}_${idx}`} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{row.city}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.state !== "—" ? `${row.state} · ` : ""}{row.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-foreground text-sm">
                      {row.country === "India"
                        ? `₹${Math.round(row.inr).toLocaleString("en-IN")}`
                        : `A$${row.aud.toFixed(2)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{row.orders} {row.orders === 1 ? "order" : "orders"}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── 7. PRODUCT PERFORMANCE BREAKDOWN ───────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-2xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-sm tracking-[0.1em] uppercase font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Performance Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales volume and gross revenue analyzed by individual product.
            </p>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Sort By:</span>
            <button
              onClick={() => handleProductSort("revenue")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                productSortBy === "revenue"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Revenue {productSortBy === "revenue" && (productSortDir === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleProductSort("units")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                productSortBy === "units"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Units {productSortBy === "units" && (productSortDir === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleProductSort("name")}
              className={`h-7 px-2.5 text-[10px] uppercase border rounded transition-colors ${
                productSortBy === "name"
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              Name {productSortBy === "name" && (productSortDir === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>

        {productAnalysis.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No product sales recorded for current filters.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4 text-center">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Revenue Tracked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productAnalysis.map((prod) => (
                    <tr key={prod.name} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{prod.name}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-medium">{prod.units} units</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                        {prod.aud > 0 && `A$${prod.aud.toFixed(2)}`}
                        {prod.aud > 0 && prod.inr > 0 && " / "}
                        {prod.inr > 0 && `₹${Math.round(prod.inr).toLocaleString("en-IN")}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-border">
              {productAnalysis.map((prod) => (
                <div key={prod.name} className="py-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-foreground text-sm truncate">{prod.name}</p>
                    <p className="text-[11px] text-muted-foreground">{prod.units} {prod.units === 1 ? "unit sold" : "units sold"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-foreground text-sm">
                      {prod.aud > 0 && `A$${prod.aud.toFixed(0)}`}
                      {prod.aud > 0 && prod.inr > 0 && " / "}
                      {prod.inr > 0 && `₹${Math.round(prod.inr).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
