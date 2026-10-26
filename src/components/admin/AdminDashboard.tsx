import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, Search, MapPin, Building2, Calendar, RefreshCw, ChevronDown, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";
import { formatAusDateTime, getAusDateKey, AUS_TIMEZONE } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLORS = ["#000000", "#555555", "#898989", "#c5c5c5"];

const AdminDashboard = () => {
  const [selectedCountry, setSelectedCountry] = useState<"All" | "Australia" | "India">("All");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Searching & Sorting filters for Dashboard
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7d" | "30d" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "city" | "product">("date");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const [stats, setStats] = useState({
    ordersCount: 0,
    revenueText: "",
    revenueMonthText: "",
    productsCount: 0,
    lowStockCount: 0,
    ordersToday: 0,
    ordersMonth: 0,
    revenueTodayText: "",
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesByCountry, setSalesByCountry] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [ordersByMonth, setOrdersByMonth] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, productsRes, orderItemsRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").neq("order_status", "draft"),
      supabase.from("products").select("id, name, inventory_quantity, inventory_quantity_australia, low_stock_threshold"),
      supabase.from("order_items").select("*, orders!inner(country)").neq("orders.order_status", "draft"),
    ]);

    setAllOrders(ordersRes.data || []);
    setAllProducts(productsRes.data || []);
    setOrderItems(orderItemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Filter orders by country if not "All"
    const filteredOrders = selectedCountry === "All" 
      ? allOrders 
      : allOrders.filter(o => o.country === selectedCountry);

    // Calculate low stock count
    const threshold = 10;
    const lowStockProds = allProducts.filter(p => {
      const lowLimit = p.low_stock_threshold || threshold;
      if (selectedCountry === "Australia") {
        return (p.inventory_quantity_australia ?? 0) < lowLimit;
      } else if (selectedCountry === "India") {
        return (p.inventory_quantity ?? 0) < lowLimit;
      } else {
        return (p.inventory_quantity_australia ?? 0) < lowLimit || (p.inventory_quantity ?? 0) < lowLimit;
      }
    });

    // Time calculations using Australian Eastern Time (GMT+11 / AEDT)
    const todayAusStr = getAusDateKey();
    const monthStartAusStr = todayAusStr.slice(0, 7); // 'YYYY-MM'

    const ordersToday = filteredOrders.filter(o => o.created_at && getAusDateKey(o.created_at) === todayAusStr);
    const ordersMonth = filteredOrders.filter(o => o.created_at && getAusDateKey(o.created_at).startsWith(monthStartAusStr));

    // Helper for revenue formatting
    const formatRevenueSummary = (ordersList: any[]) => {
      const audRev = ordersList.filter(o => o.currency === "AUD").reduce((sum, o) => sum + Number(o.total_amount), 0);
      const inrRev = ordersList.filter(o => o.currency === "INR").reduce((sum, o) => sum + Number(o.total_amount), 0);

      if (selectedCountry === "Australia") {
        return `A$${audRev.toFixed(2)}`;
      } else if (selectedCountry === "India") {
        return `₹${Math.round(inrRev).toLocaleString("en-IN")}`;
      } else {
        return `A$${audRev.toFixed(0)} / ₹${Math.round(inrRev).toLocaleString("en-IN")}`;
      }
    };

    setStats({
      ordersCount: filteredOrders.length,
      revenueText: formatRevenueSummary(filteredOrders),
      revenueMonthText: formatRevenueSummary(ordersMonth),
      productsCount: allProducts.length,
      lowStockCount: lowStockProds.length,
      ordersToday: ordersToday.length,
      ordersMonth: ordersMonth.length,
      revenueTodayText: formatRevenueSummary(ordersToday),
    });

    // Recent orders
    setRecentOrders(filteredOrders.slice(0, 5));

    // Low stock products mapping
    setLowStockProducts(
      lowStockProds.map(p => ({
        id: p.id,
        name: p.name,
        stockText: selectedCountry === "Australia" 
          ? `🇦🇺 ${p.inventory_quantity_australia ?? 0} left`
          : selectedCountry === "India"
          ? `🇮🇳 ${p.inventory_quantity ?? 0} left`
          : `🇦🇺 ${p.inventory_quantity_australia ?? 0} · 🇮🇳 ${p.inventory_quantity ?? 0}`
      })).slice(0, 5)
    );

    // Sales by country
    const countryMap: Record<string, { orders: number; revenue: number }> = {};
    filteredOrders.forEach((o: any) => {
      if (!countryMap[o.country]) countryMap[o.country] = { orders: 0, revenue: 0 };
      countryMap[o.country].orders++;
      countryMap[o.country].revenue += Number(o.total_amount);
    });
    setSalesByCountry(Object.entries(countryMap).map(([country, data]) => ({ country, ...data })));

    // Inventory chart mapping
    setInventoryData(
      allProducts.map((p: any) => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
        ...(selectedCountry === "All" || selectedCountry === "Australia" ? { "Australia": p.inventory_quantity_australia ?? 0 } : {}),
        ...(selectedCountry === "All" || selectedCountry === "India" ? { "India": p.inventory_quantity ?? 0 } : {}),
      }))
    );

    // Top selling products by country filter
    const productSales: Record<string, { name: string; qty: number; revenueText: string; rawQty: number }> = {};
    
    orderItems.forEach((item: any) => {
      const orderCountry = item.orders?.country || "Australia";
      if (selectedCountry !== "All" && orderCountry !== selectedCountry) return;

      if (!productSales[item.product_name]) {
        productSales[item.product_name] = { name: item.product_name, qty: 0, revenueText: "", rawQty: 0 };
      }
      productSales[item.product_name].rawQty += item.quantity;
      productSales[item.product_name].qty += item.quantity;
    });

    setTopProducts(
      Object.values(productSales)
        .sort((a, b) => b.rawQty - a.rawQty)
        .slice(0, 5)
    );

    // Monthly charts mapping (Australian timezone)
    const now = new Date();
    const monthMap: Record<string, { aud: number; inr: number; orders: number }> = {};
    for (let i = 5; i >= 0; i--) {
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

    setRevenueByMonth(
      Object.entries(monthMap).map(([month, d]) => ({
        month,
        ...(selectedCountry === "All" || selectedCountry === "Australia" ? { "Australia (AUD)": d.aud } : {}),
        ...(selectedCountry === "All" || selectedCountry === "India" ? { "India (INR)": d.inr } : {}),
      }))
    );

    setOrdersByMonth(
      Object.entries(monthMap).map(([month, d]) => ({
        month,
        orders: d.orders,
      }))
    );

  }, [selectedCountry, allOrders, allProducts, orderItems, loading]);

  // Helper to extract city and state from order record
  const getOrderAddress = (order: any) => {
    let addr: any = {};
    if (order.shipping_address) {
      if (typeof order.shipping_address === "string") {
        try { addr = JSON.parse(order.shipping_address); } catch { addr = {}; }
      } else {
        addr = order.shipping_address;
      }
    }
    const city = (order.shipping_city || addr.city || addr.town || order.city || "").trim();
    const state = (order.shipping_state || addr.state || addr.province || order.state || "").trim();
    return { city, state };
  };

  // Extract available states, cities and products dynamically
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

  // Filtered & Sorted orders for the Dashboard Live Feed
  const filteredDashboardOrders = useMemo(() => {
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

    // 6. Global Search query
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

    // 7. Sorting
    const sorted = [...list].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "amount") {
        comparison = Number(b.total_amount) - Number(a.total_amount);
      } else if (sortBy === "city") {
        const { city: cityA } = getOrderAddress(a);
        const { city: cityB } = getOrderAddress(b);
        comparison = cityA.localeCompare(cityB);
      } else if (sortBy === "product") {
        const itemsA = (a.order_items?.length || 1);
        const itemsB = (b.order_items?.length || 1);
        comparison = itemsB - itemsA;
      }
      return sortDirection === "desc" ? comparison : -comparison;
    });

    return sorted;
  }, [allOrders, selectedCountry, dateFilter, customStartDate, customEndDate, selectedState, selectedCity, selectedProduct, searchQuery, sortBy, sortDirection]);

  // Top Geographic Highlights
  const topGeoHighlights = useMemo(() => {
    const cityTotals: Record<string, { count: number; aud: number; inr: number }> = {};
    const stateTotals: Record<string, { count: number; aud: number; inr: number }> = {};

    filteredDashboardOrders.forEach((o) => {
      const { city, state } = getOrderAddress(o);
      const isAud = o.currency === "AUD";
      const amt = Number(o.total_amount) || 0;

      if (city) {
        if (!cityTotals[city]) cityTotals[city] = { count: 0, aud: 0, inr: 0 };
        cityTotals[city].count++;
        if (isAud) cityTotals[city].aud += amt; else cityTotals[city].inr += amt;
      }
      if (state) {
        if (!stateTotals[state]) stateTotals[state] = { count: 0, aud: 0, inr: 0 };
        stateTotals[state].count++;
        if (isAud) stateTotals[state].aud += amt; else stateTotals[state].inr += amt;
      }
    });

    const topCities = Object.entries(cityTotals)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    const topStates = Object.entries(stateTotals)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    return { topCities, topStates };
  }, [filteredDashboardOrders]);

  const resetDashboardFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedProduct("all");
    setSelectedState("all");
    setSelectedCity("all");
    setSortBy("date");
    setSortDirection("desc");
  };

  const handleSortToggle = (field: "date" | "amount" | "city" | "product") => {
    if (sortBy === field) {
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;

  const cards = [
    { label: "Revenue", value: stats.revenueText, icon: DollarSign, sub: `${stats.revenueTodayText} today` },
    { label: "Orders", value: stats.ordersCount, icon: ShoppingCart, sub: `${stats.ordersToday} today · ${stats.ordersMonth} this month` },
    { label: "Products Listed", value: stats.productsCount, icon: Package, sub: `${stats.lowStockCount} low stock` },
    { label: "Revenue This Month", value: stats.revenueMonthText, icon: TrendingUp, sub: `${stats.ordersMonth} orders` },
  ];

  return (
    <div className="space-y-8">
      {/* Country Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-sm uppercase tracking-[0.15em] font-semibold">Dashboard Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time metrics for Scalvea store · All order times displayed in Melbourne Time.</p>
        </div>
        <div className="flex border border-border self-start sm:self-auto">
          {(["All", "Australia", "India"] as const).map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.06em] transition-colors border-r last:border-r-0 border-border ${
                selectedCountry === country ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:bg-secondary/40 font-medium"
              }`}
            >
              {country === "All" ? "All Regions" : country}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-border p-5 space-y-1.5 bg-background rounded-lg shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] uppercase text-muted-foreground font-medium">{card.label}</p>
              <card.icon className="h-4 w-4 text-muted-foreground/80" />
            </div>
            <p className="text-lg font-mono font-medium tracking-tight whitespace-nowrap">{card.value}</p>
            <p className="text-xs text-muted-foreground/80">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-6">Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
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

        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-6">Orders (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              <Bar dataKey="orders" fill="#000000" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Country + Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-6">Sales Distribution</h2>
          {salesByCountry.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No orders recorded</p>
          ) : (
            <div className="space-y-4 py-3">
              {salesByCountry.map((item) => (
                <div key={item.country} className="flex justify-between items-center border-b border-border/40 pb-2 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.country === "India" ? "🇮🇳" : "🇦🇺"}</span>
                    <span className="text-xs font-medium">{item.country}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-medium">
                      {item.country === "India" ? `₹${Math.round(item.revenue).toLocaleString("en-IN")}` : `A$${item.revenue.toFixed(2)}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-6">Inventory Stock Levels</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              {selectedCountry !== "India" && <Bar dataKey="Australia" fill="#000000" name="Australia Stock" />}
              {selectedCountry !== "Australia" && <Bar dataKey="India" fill="#898989" name="India Stock" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data recorded.</p>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={p.name} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span>{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">{p.qty} units sold</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border p-5 sm:p-6 bg-background rounded-lg shadow-2xs">
          <h2 className="text-sm tracking-[0.1em] uppercase font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Low Stock Products
          </h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well-stocked.</p>
          ) : (
            <div className="divide-y divide-border">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="text-xs text-red-500 font-medium font-mono">{p.stockText}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── LIVE ORDERS EXPLORER & ADVANCED SEARCH/SORT ────────────────────── */}
      <div className="space-y-4 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-sm tracking-[0.1em] uppercase font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Live Orders Explorer
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search and sort orders date-wise, product-wise, city-wise, and state-wise.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filteredDashboardOrders.length} matching {filteredDashboardOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="border border-border p-4 bg-card rounded-xl space-y-3 shadow-2xs">
          {/* Row 1: Search & Date Presets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search order #, customer, city, state, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Date Presets */}
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

          {/* Row 2: Product, State, City Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
            {/* Product Dropdown */}
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

            {/* State Dropdown */}
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

            {/* City Dropdown */}
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

            {/* Sorting Controls */}
            <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-1.5 flex-wrap pt-1 sm:pt-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Sort:</span>
              <button
                onClick={() => handleSortToggle("date")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 rounded-xs ${
                  sortBy === "date" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Date {sortBy === "date" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortToggle("amount")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 rounded-xs ${
                  sortBy === "amount" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Value {sortBy === "amount" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortToggle("city")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 rounded-xs ${
                  sortBy === "city" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                City {sortBy === "city" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortToggle("product")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 rounded-xs ${
                  sortBy === "product" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Products {sortBy === "product" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>

              {(searchQuery || dateFilter !== "all" || selectedProduct !== "all" || selectedState !== "all" || selectedCity !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDashboardFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Quick Geographic Filter Badges */}
          {(topGeoHighlights.topCities.length > 0 || topGeoHighlights.topStates.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40 text-[11px]">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Top Cities:</span>
              {topGeoHighlights.topCities.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCity(selectedCity === c.name ? "all" : c.name)}
                  className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                    selectedCity === c.name
                      ? "bg-foreground text-background font-semibold border-foreground"
                      : "bg-muted/30 border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              ))}
              <span className="text-[10px] uppercase font-semibold text-muted-foreground ml-2 mr-1">Top States:</span>
              {topGeoHighlights.topStates.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSelectedState(selectedState === s.name ? "all" : s.name)}
                  className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                    selectedState === s.name
                      ? "bg-foreground text-background font-semibold border-foreground"
                      : "bg-muted/30 border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {s.name} ({s.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Orders Feed */}
        {filteredDashboardOrders.length === 0 ? (
          <div className="border border-border p-10 text-center bg-card rounded-xl space-y-2">
            <ShoppingCart className="w-7 h-7 mx-auto stroke-[1.2] opacity-40 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No orders match your filter criteria</p>
            <p className="text-xs text-muted-foreground">Try clearing your search term, city, state, or product selection.</p>
            <Button variant="outline" size="sm" onClick={resetDashboardFilters} className="text-xs mt-2">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs divide-y divide-border">
            {filteredDashboardOrders.slice(0, 15).map((order) => {
              const isIndia = order.country?.toLowerCase() === "india";
              const { city, state } = getOrderAddress(order);
              const items = order.order_items || [];
              const productTitle =
                items.length > 0
                  ? items.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join(", ")
                  : order.product_summary || "1x Scalvea Hair Growth Serum";

              return (
                <div key={order.id} className="p-3.5 sm:p-4 hover:bg-muted/15 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Left: Order #, Customer, Date */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted text-foreground">
                          {isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            order.order_status === "delivered"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.order_status === "cancelled"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-semibold text-foreground">
                          {order.customer_name || "Guest"}
                        </span>
                        {(city || state) && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-[11px] text-foreground">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {[city, state].filter(Boolean).join(", ")}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="text-[11px]">
                          {formatAusDateTime(order.created_at)}
                        </span>
                      </div>

                      {/* Product Preview */}
                      <p className="text-xs text-muted-foreground line-clamp-1 font-light">
                        <Package className="w-3 h-3 inline mr-1 text-muted-foreground" />
                        {productTitle}
                      </p>
                    </div>

                    {/* Right: Total amount */}
                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-mono font-bold text-base text-foreground">
                        {isIndia ? "₹" : "A$"}{Number(order.total_amount).toLocaleString(isIndia ? "en-IN" : "en-AU")}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">
                        {order.payment_status || "completed"} · {order.currency}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredDashboardOrders.length > 15 && (
              <div className="p-3 text-center bg-muted/20 text-xs text-muted-foreground">
                Showing top 15 of {filteredDashboardOrders.length} orders matching your filters. View the full list under <strong>Orders</strong>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
