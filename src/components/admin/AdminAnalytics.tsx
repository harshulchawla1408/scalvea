import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ["#000000", "#444444", "#888888", "#bbbbbb"];

const AdminAnalytics = () => {
  const [data, setData] = useState<{
    dailyRevenue: any[]; monthlySales: any[];
    countryBreakdown: any[]; paymentMethods: any[];
    statusBreakdown: any[]; avgOrderValue: number;
    totalCustomers: number; conversionData: any[];
  }>({
    dailyRevenue: [], monthlySales: [], countryBreakdown: [],
    paymentMethods: [], statusBreakdown: [], avgOrderValue: 0,
    totalCustomers: 0, conversionData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("id"),
      ]);

      const orders = ordersRes.data || [];
      const totalCustomers = profilesRes.data?.length || 0;
      const avgOrderValue = orders.length > 0 ? orders.reduce((s, o) => s + Number(o.total_amount), 0) / orders.length : 0;

      // Daily revenue last 14 days
      const dailyMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        dailyMap[d.toLocaleDateString("en", { month: "short", day: "numeric" })] = 0;
      }
      orders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString("en", { month: "short", day: "numeric" });
        if (key in dailyMap) dailyMap[key] += Number(o.total_amount);
      });
      const dailyRevenue = Object.entries(dailyMap).map(([day, revenue]) => ({ day, revenue }));

      // Monthly sales (last 12 months)
      const monthMap: Record<string, { revenue: number; orders: number }> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
        monthMap[key] = { revenue: 0, orders: 0 };
      }
      orders.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
        if (key in monthMap) { monthMap[key].revenue += Number(o.total_amount); monthMap[key].orders++; }
      });
      const monthlySales = Object.entries(monthMap).map(([month, d]) => ({ month, ...d }));

      // Country breakdown
      const countryMap: Record<string, number> = {};
      orders.forEach((o: any) => { countryMap[o.country] = (countryMap[o.country] || 0) + Number(o.total_amount); });
      const countryBreakdown = Object.entries(countryMap).map(([name, value]) => ({ name, value }));

      // Payment methods
      const pmMap: Record<string, number> = {};
      orders.forEach((o: any) => { pmMap[o.payment_method || "unknown"] = (pmMap[o.payment_method || "unknown"] || 0) + 1; });
      const paymentMethods = Object.entries(pmMap).map(([name, value]) => ({ name, value }));

      // Order status
      const statusMap: Record<string, number> = {};
      orders.forEach((o: any) => { statusMap[o.order_status || "unknown"] = (statusMap[o.order_status || "unknown"] || 0) + 1; });
      const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      setData({ dailyRevenue, monthlySales, countryBreakdown, paymentMethods, statusBreakdown, avgOrderValue, totalCustomers, conversionData: [] });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  const summaryCards = [
    { label: "Avg. Order Value", value: `$${data.avgOrderValue.toFixed(2)}` },
    { label: "Total Customers", value: data.totalCustomers },
    { label: "Payment Methods", value: data.paymentMethods.length },
    { label: "Countries", value: data.countryBreakdown.length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="border border-border p-5">
            <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{c.label}</p>
            <p className="text-xl font-light mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Revenue */}
      <div className="border border-border p-6">
        <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Daily Revenue (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
            <Area type="monotone" dataKey="revenue" stroke="#000" fill="#00000010" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Sales */}
      <div className="border border-border p-6">
        <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Monthly Sales (Last 12 Months)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.monthlySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} name="Revenue ($)" />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#888" strokeWidth={2} strokeDasharray="5 5" name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Revenue by Country", data: data.countryBreakdown, key: "value" },
          { title: "Payment Methods", data: data.paymentMethods, key: "value" },
          { title: "Order Status", data: data.statusBreakdown, key: "value" },
        ].map((chart) => (
          <div key={chart.title} className="border border-border p-6">
            <h2 className="text-xs tracking-[0.15em] uppercase mb-4">{chart.title}</h2>
            {chart.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chart.data} dataKey={chart.key} nameKey="name" cx="50%" cy="50%" outerRadius={65}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnalytics;
