import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LayoutDashboard, Package, ShoppingCart, Users, Globe, Tag, BarChart3, LogOut, Menu, X, Star, LineChart, Settings } from "lucide-react";

import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCountrySettings from "@/components/admin/AdminCountrySettings";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminInventory from "@/components/admin/AdminInventory";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminSettings from "@/components/admin/AdminSettings";

const adminPages = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "inventory", label: "Inventory", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "countries", label: "Country / Tax / Shipping", icon: Globe },
  { key: "coupons", label: "Coupons", icon: Tag },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "analytics", label: "Analytics", icon: LineChart },
  { key: "settings", label: "Settings", icon: Settings },
];

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast({ title: "Access denied", description: "Admin privileges required.", variant: "destructive" });
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="space-y-3 w-64"><div className="h-6 bg-muted animate-pulse" /><div className="h-4 bg-muted animate-pulse w-3/4" /><div className="h-4 bg-muted animate-pulse w-1/2" /></div></div>);
  if (!user || !isAdmin) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <AdminDashboard />;
      case "products": return <AdminProducts />;
      case "orders": return <AdminOrders />;
      case "inventory": return <AdminInventory />;
      case "users": return <AdminUsers />;
      case "countries": return <AdminCountrySettings />;
      case "coupons": return <AdminCoupons />;
      case "reviews": return <AdminReviews />;
      case "analytics": return <AdminAnalytics />;
      case "settings": return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-foreground text-primary-foreground transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-primary-foreground/10 flex items-center justify-between">
            <Link to="/" className="text-lg tracking-[0.2em] uppercase">Scalvea</Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="h-5 w-5" /></button>
          </div>
          <p className="px-6 pt-4 pb-2 text-[10px] tracking-[0.15em] uppercase opacity-40">Admin Panel</p>
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {adminPages.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActivePage(key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.06em] transition-colors ${activePage === key ? "bg-primary-foreground/10 opacity-100" : "opacity-60 hover:opacity-100"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-primary-foreground/10">
            <button onClick={handleSignOut} className="flex items-center gap-3 text-xs opacity-60 hover:opacity-100 transition-opacity">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="h-5 w-5" /></button>
            <h1 className="text-sm tracking-[0.1em] uppercase font-normal">{adminPages.find(p => p.key === activePage)?.label}</h1>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Store</Link>
        </header>
        <main className="p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
