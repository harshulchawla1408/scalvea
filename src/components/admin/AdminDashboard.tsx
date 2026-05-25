import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const COLORS = ["#000000", "#555555", "#898989", "#c5c5c5"];

const AdminDashboard = () => {
  const [selectedCountry, setSelectedCountry] = useState<"All" | "Australia" | "India">("All");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      supabase.from("orders").select("*"),
      supabase.from("products").select("id, name, inventory_quantity_india, inventory_quantity_australia, low_stock_threshold"),
      supabase.from("order_items").select("*, orders(country)"),
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
        return (p.inventory_quantity_india ?? 0) < lowLimit;
      } else {
        return (p.inventory_quantity_australia ?? 0) < lowLimit || (p.inventory_quantity_india ?? 0) < lowLimit;
      }
    });

    // Time calculations
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const ordersToday = filteredOrders.filter(o => o.created_at?.startsWith(todayStr));
    const ordersMonth = filteredOrders.filter(o => o.created_at >= monthStart);

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
          ? `🇮🇳 ${p.inventory_quantity_india ?? 0} left`
          : `🇦🇺 ${p.inventory_quantity_australia ?? 0} · 🇮🇳 ${p.inventory_quantity_india ?? 0}`
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
        ...(selectedCountry === "All" || selectedCountry === "India" ? { "India": p.inventory_quantity_india ?? 0 } : {}),
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

    // Monthly charts mapping
    const monthMap: Record<string, { aud: number; inr: number; orders: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
      monthMap[key] = { aud: 0, inr: 0, orders: 0 };
    }

    filteredOrders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
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
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-medium">Dashboard Overview</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Real-time metrics for Scalvea dual-country store.</p>
        </div>
        <div className="flex border border-border">
          {(["All", "Australia", "India"] as const).map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] transition-colors border-r last:border-r-0 border-border ${
                selectedCountry === country ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-secondary/40"
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
          <div key={card.label} className="border border-border p-5 space-y-1.5 bg-background">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-muted-foreground/80" />
            </div>
            <p className="text-lg font-mono font-medium tracking-tight whitespace-nowrap">{card.value}</p>
            <p className="text-[10px] text-muted-foreground/80">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Revenue (Last 6 Months)</h2>
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

        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Orders (Last 6 Months)</h2>
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
        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Sales Distribution</h2>
          {salesByCountry.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No orders recorded</p>
          ) : (
            <div className="space-y-4 py-3">
              {salesByCountry.map((item, idx) => (
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

        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Inventory Stock Levels</h2>
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
        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Top Selling Products</h2>
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

        <div className="border border-border p-6 bg-background">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
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

      {/* Recent Orders */}
      <div className="bg-background">
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders recorded.</p>
        ) : (
          <div className="border border-border divide-y divide-border">
            {recentOrders.map((order) => {
              const isIndia = order.country?.toLowerCase() === "india";
              return (
                <div key={order.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">
                      {isIndia ? "₹" : "A$"}{Number(order.total_amount).toLocaleString(isIndia ? "en-IN" : "en-AU")}
                    </p>
                    <p className={`text-xs uppercase font-medium ${order.order_status === "delivered" ? "text-green-600" : order.order_status === "cancelled" ? "text-red-500" : "text-muted-foreground"}`}>{order.order_status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
