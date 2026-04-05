import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const COLORS = ["#000000", "#555555", "#999999", "#cccccc"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0, totalRevenue: 0, totalProducts: 0, lowStock: 0,
    ordersToday: 0, ordersMonth: 0, revenueToday: 0, revenueMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesByCountry, setSalesByCountry] = useState<any[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [ordersByMonth, setOrdersByMonth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, productsRes, lowStockRes, orderItemsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, currency, country, created_at, order_status"),
        supabase.from("products").select("id, name, inventory_quantity, low_stock_threshold"),
        supabase.from("products").select("id, name, inventory_quantity").lt("inventory_quantity", 10),
        supabase.from("order_items").select("product_name, quantity, price"),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0);

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const ordersToday = orders.filter(o => o.created_at?.startsWith(todayStr));
      const ordersMonth = orders.filter(o => o.created_at >= monthStart);

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        lowStock: lowStockRes.data?.length || 0,
        ordersToday: ordersToday.length,
        ordersMonth: ordersMonth.length,
        revenueToday: ordersToday.reduce((s, o) => s + Number(o.total_amount), 0),
        revenueMonth: ordersMonth.reduce((s, o) => s + Number(o.total_amount), 0),
      });

      // Top products by quantity sold
      const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
      orderItems.forEach((item: any) => {
        if (!productSales[item.product_name]) productSales[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
        productSales[item.product_name].qty += item.quantity;
        productSales[item.product_name].revenue += Number(item.price) * item.quantity;
      });
      setTopProducts(Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5));

      // Low stock
      setLowStockProducts((lowStockRes.data || []).slice(0, 5));

      // Sales by country
      const countryMap: Record<string, { orders: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        if (!countryMap[o.country]) countryMap[o.country] = { orders: 0, revenue: 0 };
        countryMap[o.country].orders++;
        countryMap[o.country].revenue += Number(o.total_amount);
      });
      setSalesByCountry(Object.entries(countryMap).map(([country, data]) => ({ country, ...data })));

      // Revenue & orders by month (last 6 months)
      const monthMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
        monthMap[key] = { revenue: 0, orders: 0 };
      }
      orders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
        if (key in monthMap) {
          monthMap[key].revenue += Number(o.total_amount);
          monthMap[key].orders++;
        }
      });
      setRevenueByMonth(Object.entries(monthMap).map(([month, d]) => ({ month, revenue: d.revenue })));
      setOrdersByMonth(Object.entries(monthMap).map(([month, d]) => ({ month, orders: d.orders })));

      // Inventory chart
      setInventoryData(products.map((p: any) => ({ name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name, stock: p.inventory_quantity })));

      const { data: recent } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);
      setRecentOrders(recent || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;

  const cards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, sub: `$${stats.revenueToday.toFixed(0)} today` },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, sub: `${stats.ordersToday} today · ${stats.ordersMonth} this month` },
    { label: "Total Products", value: stats.totalProducts, icon: Package, sub: `${stats.lowStock} low stock` },
    { label: "Revenue This Month", value: `$${stats.revenueMonth.toFixed(2)}`, icon: TrendingUp, sub: `${stats.ordersMonth} orders` },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-border p-6 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-light">{card.value}</p>
            <p className="text-[10px] text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-6">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              <Area type="monotone" dataKey="revenue" stroke="#000000" fill="#00000010" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border p-6">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Orders (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              <Bar dataKey="orders" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Country + Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-6">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Sales by Country</h2>
          {salesByCountry.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={salesByCountry} dataKey="revenue" nameKey="country" cx="50%" cy="50%" outerRadius={80} label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}>
                  {salesByCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} formatter={(val: number) => `$${val.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-border p-6">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Inventory Stock Levels</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
              <Bar dataKey="stock" fill="#555555" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border p-6">
          <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={p.name} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                    <span>{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">{p.qty} sold · ${p.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border p-6">
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
                  <span className="text-xs text-red-500 font-medium">{p.inventory_quantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="border border-border divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p>{order.currency === "INR" ? "₹" : "$"}{Number(order.total_amount).toFixed(2)} {order.currency}</p>
                  <p className={`text-xs uppercase ${order.order_status === "delivered" ? "text-green-600" : order.order_status === "cancelled" ? "text-red-500" : "text-muted-foreground"}`}>{order.order_status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
