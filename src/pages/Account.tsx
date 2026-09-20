import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/contexts/CountryContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProducts } from "@/hooks/useProducts";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";
import ProductCard from "@/components/products/ProductCard";
import { toast } from "@/hooks/use-toast";
import { 
  Package, 
  ChevronRight, 
  Pencil, 
  Eye, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  User, 
  LogOut, 
  Phone, 
  Mail, 
  ShoppingBag
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSEO } from "@/hooks/useSEO";
import dummyAvatar from "@/assets/dummy.webp";

const Account = () => {
  useSEO({
    title: "My Account | Scalvea",
    description: "Manage your personal profile and track your Scalvea orders.",
    noindex: true
  });

  const { user, loading, isAdmin } = useAuth();
  const { country, setCountry, allCountries } = useCountry();
  const { items: recentlyViewedIds } = useRecentlyViewed();
  const { products: allProducts } = useProducts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", email: "" });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  // Real-time Postgres changes for orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("account-orders-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", user.id] });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Fetch User Profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch User Orders
  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      let orQuery = `user_id.eq.${user!.id},customer_email.eq.${user!.email}`;
      if (profile?.phone) {
        const normalizedPhone = profile.phone.replace(/[^0-9]/g, "").replace(/^91/, "");
        orQuery += `,customer_phone.eq.${normalizedPhone},customer_phone.eq.+91${normalizedPhone},customer_phone.eq.91${normalizedPhone}`;
      }

      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .neq("order_status", "draft")
        .or(orQuery)
        .order("created_at", { ascending: false });
      return (data || []).filter(o => o.order_status !== "draft");
    },
    enabled: !!user,
  });

  // Profile Update Mutation
  const updateProfile = useMutation({
    mutationFn: async (form: typeof profileForm) => {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name, 
        phone: form.phone, 
        email: form.email,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setIsEditProfileOpen(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Unable to update profile", description: "Please check your network connection and try again.", variant: "destructive" });
    },
  });

  const startEditProfile = useCallback(() => {
    setProfileForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
    });
    setIsEditProfileOpen(true);
  }, [profile, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
    navigate("/");
  };

  // Download invoice as PDF
  const downloadInvoice = (order: any) => {
    generateInvoicePDF(order);
    toast({ title: "Invoice downloaded" });
  };

  const recentlyViewedProducts = allProducts.filter((p) => recentlyViewedIds.includes(p.id)).slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-4 sm:px-6 lg:px-12 py-10 lg:py-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-44 bg-neutral-100 rounded-lg animate-pulse" />
            <div className="h-44 w-full bg-neutral-100 rounded-2xl animate-pulse" />
            <div className="h-64 w-full bg-neutral-100 rounded-2xl animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || "Scalvea Customer";
  const displayEmail = profile?.email || user.email || "No email available";
  const displayPhone = profile?.phone || "No mobile number added";

  const statusColor = (s: string) => {
    const status = (s || "").toLowerCase();
    if (["delivered", "hand_delivered", "store_pickup", "completed"].includes(status)) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (["processing", "shipped", "packed", "out_for_delivery"].includes(status)) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (["cancelled", "refunded"].includes(status)) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    return "bg-neutral-100 text-neutral-700 border-neutral-200";
  };

  const statusSteps = ["pending", "processing", "shipped", "delivered", "completed"];
  const manualStatusSteps = ["pending", "processing", "packed", "hand_delivered", "completed"];
  const pickupStatusSteps = ["pending", "processing", "packed", "store_pickup", "completed"];

  const getStatusSteps = (order: any) => {
    if (order.delivery_method === "HAND_DELIVERY") return manualStatusSteps;
    if (order.delivery_method === "STORE_PICKUP") return pickupStatusSteps;
    return statusSteps;
  };

  const getStepIndex = (steps: string[], status: string) => {
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Top Account Title Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80">
            <div>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] uppercase text-neutral-500 block mb-1">
                CUSTOMER DASHBOARD
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light font-heading text-neutral-900 tracking-tight">
                My Account
              </h1>
            </div>

            {isAdmin && (
              <Button asChild variant="outline" className="text-xs sm:text-sm font-semibold tracking-[0.08em] uppercase border-neutral-300 hover:border-black rounded-xl h-10 px-4">
                <Link to="/admin">Admin Portal</Link>
              </Button>
            )}
          </div>

          {/* ==================================================
              PROFILE HEADER / CARD (Top of Dashboard)
             ================================================== */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-[24px] p-5 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 sm:gap-6">
            
            {/* Left: Circular Placeholder Avatar & Customer Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left w-full sm:w-auto">
              {/* Circular Avatar using dummy.webp */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-neutral-100 shadow-sm shrink-0 bg-neutral-50 flex items-center justify-center">
                <img
                  src={dummyAvatar}
                  alt="Customer Profile Avatar"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  loading="eager"
                />
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-1.5 min-w-0">
                <h2 className="text-lg sm:text-xl font-medium font-heading text-neutral-900 leading-tight truncate">
                  {displayName}
                </h2>
                
                <div className="flex flex-col gap-1 text-xs text-neutral-600 font-body">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{displayEmail}</span>
                  </div>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Phone className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span>{displayPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Edit Profile Action Button */}
            <Button
              onClick={startEditProfile}
              variant="outline"
              className="w-full sm:w-auto shrink-0 h-10 sm:h-11 px-5 border-neutral-200 hover:border-black rounded-xl text-xs tracking-[0.1em] uppercase font-semibold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
          </div>

          {/* ==================================================
              STREAMLINED DASHBOARD NAVIGATION TABS
              ORDER: 1. PROFILE -> 2. ORDERS -> 3. VIEWED
             ================================================== */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            
            {/* Segmented Touch-Friendly Tab Bar */}
            <div className="bg-neutral-200/60 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none w-full select-none">
              {[
                { value: "profile", label: "Profile", icon: User },
                { value: "orders", label: "Orders", count: orders.length, icon: Package },
                { value: "recently-viewed", label: "Viewed", icon: Eye },
              ].map(({ value, label, count, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`flex-1 min-h-[44px] px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-[0.06em] uppercase flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap shrink-0 ${
                    activeTab === value
                      ? "bg-white text-neutral-900 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-white/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeTab === value ? "bg-neutral-900 text-white" : "bg-neutral-300/80 text-neutral-700"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ==================================================
                TAB 1: PROFILE & ACCOUNT DETAILS (Primary First)
               ================================================== */}
            <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-medium text-neutral-900">
                    Personal Information
                  </h3>
                  <p className="text-xs text-neutral-500 font-body">
                    Your personal contact details for billing and order notifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Full Name</span>
                    <span className="font-medium text-neutral-900">{displayName}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Email Address</span>
                    <span className="font-medium text-neutral-900">{displayEmail}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Mobile Phone</span>
                    <span className="font-medium text-neutral-900">{displayPhone}</span>
                  </div>

                  <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-neutral-150">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-1">Account Region</span>
                    <span className="font-medium text-neutral-900 capitalize">{country}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={startEditProfile}
                    className="h-11 px-6 bg-black text-white hover:bg-neutral-900 rounded-xl text-xs tracking-[0.1em] uppercase font-semibold flex items-center gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit Information
                  </Button>
                </div>
              </div>

              {/* Regional Preferences Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-medium text-neutral-900">
                    Shopping Region & Currency
                  </h3>
                  <p className="text-xs text-neutral-500 font-body">
                    Select your preferred shopping country to calculate local taxes, currency, and shipping times.
                  </p>
                </div>

                <div className="max-w-sm pt-1">
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-11 rounded-xl text-sm border-neutral-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries.map((c) => (
                        <SelectItem key={c.country} value={c.country}>
                          {c.country} ({c.currency_symbol} {c.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sign Out Card */}
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">Sign out of account</h4>
                  <p className="text-xs text-neutral-500 font-body">
                    Safely log out of your current session on this device.
                  </p>
                </div>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="h-11 px-6 border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 rounded-xl text-xs tracking-[0.12em] uppercase font-semibold flex items-center justify-center gap-2 text-neutral-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>SIGN OUT</span>
                </Button>
              </div>
            </TabsContent>

            {/* ==================================================
                TAB 2: ORDERS
               ================================================== */}
            <TabsContent value="orders" className="space-y-4 focus-visible:outline-none">
              {orders.length === 0 ? (
                /* Polished Empty State */
                <div className="bg-white border border-neutral-200/90 rounded-2xl sm:rounded-[24px] p-8 sm:p-14 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-lg font-medium font-heading text-neutral-900">
                      No orders yet
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 font-body font-light leading-relaxed">
                      Discover Scalvea's targeted hair-care solutions designed for healthier, fuller-looking hair.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button asChild className="h-11 sm:h-12 px-8 bg-black text-white hover:bg-neutral-900 rounded-xl text-xs tracking-[0.14em] uppercase font-semibold shadow-sm">
                      <Link to="/shop">
                        <span>Start Shopping</span>
                        <ChevronRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                /* Stacked Order Cards */
                <div className="space-y-4">
                  {orders.map((order: any) => {
                    const isIndia = order.currency === "INR";
                    const isExpanded = expandedOrderId === order.id;
                    const items = (order.order_items as any[]) || [];
                    const addr = (order.shipping_address as any) || {};
                    const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });

                    const formatCurrency = (v: number) => 
                      isIndia 
                        ? `₹${Math.round(v || 0).toLocaleString("en-IN")}` 
                        : `$${Number(v || 0).toFixed(2)} AUD`;

                    return (
                      <div 
                        key={order.id} 
                        className="bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-2xl overflow-hidden shadow-2xs transition-all"
                      >
                        {/* Order Header Summary Bar */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-100">
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-sm font-semibold font-mono text-neutral-900">
                                {order.order_number}
                              </span>
                              
                              {/* Status Pill */}
                              <span className={`text-[10px] font-mono font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${statusColor(order.order_status)}`}>
                                {order.order_status}
                              </span>

                              {/* Manual offline purchase badge */}
                              {order.order_source === "MANUAL" && (
                                <span className="text-[9px] font-mono tracking-wider uppercase font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                  Offline Order
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-neutral-500 font-body">
                              Placed on {formattedDate}
                            </p>
                          </div>

                          {/* Total & Expand Trigger */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-1 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[10px] text-neutral-500 font-mono uppercase block">Total</span>
                              <span className="text-sm sm:text-base font-bold text-neutral-900 font-body">
                                {formatCurrency(Number(order.total_amount))}
                              </span>
                            </div>

                            <Button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              variant="ghost"
                              className="h-9 px-3 rounded-lg text-xs font-semibold tracking-wider uppercase text-neutral-700 hover:text-black hover:bg-neutral-100 flex items-center gap-1.5"
                            >
                              <span>{isExpanded ? "Hide Details" : "View Order"}</span>
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>

                        </div>

                        {/* Order Products Preview Line (When Collapsed) */}
                        {!isExpanded && items.length > 0 && (
                          <div className="px-4 sm:px-5 py-3 bg-[#FAF9F7]/60 flex items-center justify-between text-xs text-neutral-600">
                            <div className="truncate flex items-center gap-2">
                              <ShoppingBag className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                              <span className="truncate">
                                {items.map(i => `${i.product_name} (${i.quantity})`).join(", ")}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-500 shrink-0 font-mono">
                              {items.length} item{items.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {/* Expanded Order Details Accordion */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 bg-[#FAF9F7]/40 space-y-6 border-t border-neutral-150">
                            
                            {/* Visual Status Progression Tracker */}
                            <div className="bg-white border border-neutral-200/80 rounded-xl p-4">
                              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block mb-3">
                                DELIVERY PROGRESS
                              </span>
                              {(() => {
                                const steps = getStatusSteps(order);
                                const stepIdx = getStepIndex(steps, order.order_status);
                                const isCancelled = order.order_status === "cancelled" || order.order_status === "refunded";
                                
                                if (isCancelled) {
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-rose-600 font-medium">
                                      <div className="h-2 flex-1 bg-rose-200 rounded-full" />
                                      <span className="uppercase font-mono text-[10px]">{order.order_status}</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5">
                                      {steps.map((step, i) => (
                                        <div key={step} className="flex-1 h-1.5 rounded-full transition-all" style={{
                                          backgroundColor: i <= stepIdx ? "#111111" : "#E5E5E5"
                                        }} />
                                      ))}
                                    </div>
                                    <div className="flex justify-between">
                                      {steps.map((step, i) => (
                                        <span 
                                          key={step} 
                                          className={`text-[9px] font-mono uppercase tracking-wider ${
                                            i <= stepIdx ? "text-neutral-900 font-semibold" : "text-neutral-500"
                                          }`}
                                        >
                                          {step.replace(/_/g, " ")}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Ordered Items List */}
                            <div className="bg-white border border-neutral-200/80 rounded-xl p-4 space-y-3">
                              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block border-b border-neutral-100 pb-2">
                                ORDERED PRODUCTS
                              </span>
                              <div className="divide-y divide-neutral-100">
                                {items.map((item: any) => (
                                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                                    <div className="space-y-0.5">
                                      <p className="font-medium text-neutral-900">{item.product_name}</p>
                                      <p className="text-[11px] text-neutral-500 font-mono">Qty: {item.quantity}</p>
                                    </div>
                                    <span className="font-semibold text-neutral-900 font-mono">
                                      {formatCurrency(Number(item.price) * Number(item.quantity))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Financial Summary & Logistics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              
                              {/* Left: Financial Breakdown */}
                              <div className="bg-white border border-neutral-200/80 rounded-xl p-4 space-y-2 text-xs">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block border-b border-neutral-100 pb-2">
                                  PAYMENT BREAKDOWN
                                </span>
                                <div className="flex justify-between text-neutral-600">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(Number(order.subtotal))}</span>
                                </div>
                                {Number(order.gst_amount || order.tax_amount) > 0 && (
                                  <div className="flex justify-between text-neutral-600">
                                    <span>{isIndia ? "GST" : "Tax"}</span>
                                    <span>{formatCurrency(Number(order.gst_amount || order.tax_amount))}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-neutral-600">
                                  <span>Shipping</span>
                                  <span>{Number(order.shipping_amount) === 0 ? "FREE" : formatCurrency(Number(order.shipping_amount))}</span>
                                </div>
                                {Number(order.discount_amount) > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(Number(order.discount_amount))}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-neutral-900 border-t border-neutral-100 pt-2">
                                  <span>Total Paid</span>
                                  <span>{formatCurrency(Number(order.total_amount))}</span>
                                </div>
                              </div>

                              {/* Right: Shipping Details & Tracking */}
                              <div className="bg-white border border-neutral-200/80 rounded-xl p-4 space-y-2 text-xs">
                                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 block border-b border-neutral-100 pb-2">
                                  DELIVERY DETAILS
                                </span>
                                
                                {order.shipping_address && (
                                  <div className="space-y-0.5 text-neutral-700">
                                    <p className="font-semibold text-neutral-900">
                                      {(addr.firstName || addr.first_name || "")} {(addr.lastName || addr.last_name || "")}
                                    </p>
                                    <p className="text-neutral-500">
                                      {addr.address || addr.address_line1}, {addr.city} {addr.state} {addr.postcode}
                                    </p>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-neutral-100 space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-neutral-500">Courier:</span>
                                    <span className="text-neutral-800">{order.courier_name || order.courier || "Standard Dispatch"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-500">Tracking:</span>
                                    <span className="text-neutral-900 font-semibold">{order.tracking_number || "Pending dispatch"}</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* Download Invoice Action */}
                            <div className="flex justify-end pt-2">
                              <Button 
                                onClick={() => downloadInvoice(order)} 
                                variant="outline" 
                                className="h-10 px-5 text-xs font-semibold tracking-wider uppercase rounded-xl flex items-center gap-2 border-neutral-300 hover:border-black"
                              >
                                <Download className="h-4 w-4" /> Download Official Invoice (PDF)
                              </Button>
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ==================================================
                TAB 3: RECENTLY VIEWED
               ================================================== */}
            <TabsContent value="recently-viewed" className="space-y-4 focus-visible:outline-none">
              {recentlyViewedProducts.length === 0 ? (
                <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                  <Eye className="h-8 w-8 mx-auto text-neutral-500" />
                  <p className="text-sm text-neutral-600">No recently viewed products yet.</p>
                  <Button asChild variant="outline" className="text-xs uppercase tracking-wider rounded-xl h-10 px-5">
                    <Link to="/shop">Browse Collection</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentlyViewedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </TabsContent>

          </Tabs>

        </div>
      </main>

      {/* ==================================================
          EDIT PROFILE DIALOG / MODAL
         ================================================== */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md bg-white border border-neutral-200 p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-medium text-neutral-900">
              Edit Profile Information
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 font-body">
              Update your full name and mobile phone number.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast({ title: "Saving profile changes..." });
              updateProfile.mutate(profileForm);
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <Label className="text-xs uppercase tracking-wider font-medium text-neutral-700">Full Name</Label>
              <Input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="h-11 text-sm mt-1 rounded-xl"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-medium text-neutral-700">Email Address</Label>
              <Input
                value={profileForm.email}
                disabled
                className="h-11 text-sm mt-1 rounded-xl bg-neutral-100/80 cursor-not-allowed text-neutral-500"
                title="Email is managed via authentication settings"
              />
              <span className="text-[10px] text-neutral-500 font-body mt-1 block">
                Primary account email address
              </span>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider font-medium text-neutral-700">Mobile Phone Number</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="h-11 text-sm mt-1 rounded-xl"
                placeholder="+61 400 000 000 or +91 98765 43210"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-150">
              <Button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                variant="outline"
                className="h-11 px-5 rounded-xl text-xs tracking-wider uppercase font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="h-11 px-6 bg-black text-white hover:bg-neutral-900 rounded-xl text-xs tracking-wider uppercase font-semibold shadow-sm"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Account;
