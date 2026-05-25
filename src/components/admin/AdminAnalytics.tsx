import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ["#000000", "#555555", "#898989", "#c5c5c5"];

const AdminAnalytics = () => {
  const [selectedCountry, setSelectedCountry] = useState<"All" | "Australia" | "India">("All");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState({
    avgOrderValueText: "",
    dailyRevenue: [] as any[],
    monthlySales: [] as any[],
    paymentMethods: [] as any[],
    statusBreakdown: [] as any[],
    countryBreakdown: [] as any[],
  });

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("profiles").select("id"),
    ]);

    setAllOrders(ordersRes.data || []);
    setTotalCustomers(profilesRes.data?.length || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Filter orders
    const filteredOrders = selectedCountry === "All"
      ? allOrders.filter(o => o.country === "India" || o.country === "Australia")
      : allOrders.filter(o => o.country === selectedCountry);

    // 1. Average Order Value (AOV)
    const audOrders = filteredOrders.filter(o => o.currency === "AUD");
    const inrOrders = filteredOrders.filter(o => o.currency === "INR");

    const audAov = audOrders.length > 0 ? audOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) / audOrders.length : 0;
    const inrAov = inrOrders.length > 0 ? inrOrders.reduce((sum, o) => sum + Number(o.total_amount), 0) / inrOrders.length : 0;

    let avgOrderValueText = "";
    if (selectedCountry === "Australia") {
      avgOrderValueText = `A$${audAov.toFixed(2)}`;
    } else if (selectedCountry === "India") {
      avgOrderValueText = `₹${Math.round(inrAov).toLocaleString("en-IN")}`;
    } else {
      avgOrderValueText = `A$${audAov.toFixed(0)} / ₹${Math.round(inrAov).toLocaleString("en-IN")}`;
    }

    // 2. Daily Revenue (Last 14 days)
    const dailyMap: Record<string, { aud: number; inr: number }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en", { month: "short", day: "numeric" });
      dailyMap[key] = { aud: 0, inr: 0 };
    }

    filteredOrders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("en", { month: "short", day: "numeric" });
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

    // 3. Monthly Sales (Last 12 months)
    const monthMap: Record<string, { aud: number; inr: number; orders: number }> = {};
    for (let i = 11; i >= 0; i--) {
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

    const monthlySales = Object.entries(monthMap).map(([month, val]) => ({
      month,
      orders: val.orders,
      ...(selectedCountry === "All" || selectedCountry === "Australia" ? { "Australia (AUD)": val.aud } : {}),
      ...(selectedCountry === "All" || selectedCountry === "India" ? { "India (INR)": val.inr } : {}),
    }));

    // 4. Country breakdown (AUD vs INR total)
    const countryMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      countryMap[o.country] = (countryMap[o.country] || 0) + Number(o.total_amount);
    });
    const countryBreakdown = Object.entries(countryMap).map(([name, value]) => ({ name, value }));

    // 5. Payment Methods
    const pmMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      const pm = o.payment_method || "unknown";
      pmMap[pm] = (pmMap[pm] || 0) + 1;
    });
    const paymentMethods = Object.entries(pmMap).map(([name, value]) => ({ name, value }));

    // 6. Order Status
    const statusMap: Record<string, number> = {};
    filteredOrders.forEach((o: any) => {
      const status = o.order_status || "unknown";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    setAnalytics({
      avgOrderValueText,
      dailyRevenue,
      monthlySales,
      paymentMethods,
      statusBreakdown,
      countryBreakdown,
    });

  }, [selectedCountry, allOrders, loading]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  const summaryCards = [
    { label: "Avg. Order Value", value: analytics.avgOrderValueText },
    { label: "Total Customers", value: totalCustomers },
    { label: "Payment Types", value: analytics.paymentMethods.length },
    { label: "Active Countries", value: "2 (AU / IN)" },
  ];

  return (
    <div className="space-y-8">
      {/* Country Filter Selector */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-medium">Sales Analytics</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">In-depth financial tracking for Australia and India operations.</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="border border-border p-5 bg-background">
            <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground">{c.label}</p>
            <p className="text-base font-mono font-medium mt-1.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Revenue */}
      <div className="border border-border p-6 bg-background">
        <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Daily Revenue (Last 14 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
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
      <div className="border border-border p-6 bg-background">
        <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Monthly Revenue & Orders (Last 12 Months)</h2>
        <ResponsiveContainer width="100%" height={280}>
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

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Revenue Share by Country", data: analytics.countryBreakdown, key: "value", isCurrency: true },
          { title: "Payment Methods", data: analytics.paymentMethods, key: "value" },
          { title: "Order Status", data: analytics.statusBreakdown, key: "value" },
        ].map((chart) => (
          <div key={chart.title} className="border border-border p-6 bg-background">
            <h2 className="text-xs tracking-[0.15em] uppercase mb-4">{chart.title}</h2>
            {chart.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chart.data} dataKey={chart.key} nameKey="name" cx="50%" cy="50%" outerRadius={65}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", borderRadius: 0 }} 
                    formatter={(val: number) => chart.isCurrency ? `Value: ${val.toFixed(0)}` : `Count: ${val}`}
                  />
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
