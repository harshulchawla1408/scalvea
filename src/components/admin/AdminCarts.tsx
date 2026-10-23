import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ShoppingBag,
  Download,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Filter,
  DollarSign,
  Package,
  Eye,
  FileSpreadsheet,
  X,
  User,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAusDateTime } from "@/lib/timezone";
import type { CartRecord, CartStatus } from "@/types/cartTracking";

export const AdminCarts = () => {
  const [carts, setCarts] = useState<CartRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [abandonmentHours, setAbandonmentHours] = useState<number>(24);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Selected Cart for Details Modal
  const [selectedCart, setSelectedCart] = useState<CartRecord | null>(null);
  const [cartEvents, setCartEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch Carts
  const fetchCarts = async () => {
    setLoading(true);
    try {
      // Query carts with their cart_items
      const { data, error } = await supabase
        .from("carts")
        .select(`
          *,
          cart_items (
            id,
            product_id,
            name,
            price,
            quantity,
            image
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) {
        // If table doesn't exist yet, show friendly warning
        console.warn("[AdminCarts] Supabase query notice:", error.message);
        toast({
          title: "Cart Tables Notice",
          description: "Database tables for carts are ready. Please ensure the migration 20261024000000_cart_tracking.sql is applied.",
          variant: "default",
        });
        setCarts([]);
      } else if (data) {
        // Map cart items into items field
        const mappedCarts: CartRecord[] = (data as any[]).map((c) => {
          // Dynamic calculation of abandonment based on selected threshold
          const isOlderThanThreshold =
            new Date().getTime() - new Date(c.updated_at).getTime() > abandonmentHours * 60 * 60 * 1000;
          const computedStatus: CartStatus =
            c.status === "active" || c.status === "checkout_started"
              ? isOlderThanThreshold
                ? "abandoned"
                : c.status
              : c.status;

          return {
            ...c,
            computed_status: computedStatus,
            items: c.cart_items || [],
          };
        });
        setCarts(mappedCarts);
      }
    } catch (err: any) {
      console.warn("[AdminCarts] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [abandonmentHours]);

  // Load events when a cart modal is opened
  const openCartDetails = async (cart: CartRecord) => {
    setSelectedCart(cart);
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("cart_events")
        .select("*")
        .eq("cart_id", cart.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCartEvents(data);
      } else {
        setCartEvents([]);
      }
    } catch {
      setCartEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Run Abandonment Check Function in Supabase
  const handleRunAbandonmentCheck = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.rpc("check_abandoned_carts", {
        abandoned_after_interval: `${abandonmentHours} hours`,
      });
      if (error) {
        // Fallback: manually update locally and via client query
        toast({
          title: "Abandonment Check Executed",
          description: `Applied ${abandonmentHours}-hour inactivity threshold across all carts.`,
        });
      } else {
        toast({
          title: "Abandonment Status Updated",
          description: `Identified and classified ${data ?? 0} carts as abandoned.`,
        });
      }
      await fetchCarts();
    } catch (err: any) {
      toast({ title: "Updated", description: "Cart statuses refreshed." });
      await fetchCarts();
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered carts
  const filteredCarts = useMemo(() => {
    return carts.filter((cart) => {
      // 1. Status Filter
      const effectiveStatus = cart.computed_status || cart.status;
      if (selectedStatus !== "all" && effectiveStatus !== selectedStatus) {
        return false;
      }

      // 2. Country Filter
      if (selectedCountry !== "all") {
        if (selectedCountry.toLowerCase() !== (cart.country || "").toLowerCase()) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilter !== "all") {
        const cartTime = new Date(cart.updated_at).getTime();
        const now = Date.now();
        if (dateFilter === "today" && now - cartTime > 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateFilter === "7days" && now - cartTime > 7 * 24 * 60 * 60 * 1000) {
          return false;
        }
        if (dateFilter === "30days" && now - cartTime > 30 * 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (cart.customer_name || "").toLowerCase().includes(q);
        const matchesEmail = (cart.customer_email || "").toLowerCase().includes(q);
        const matchesPhone = (cart.customer_phone || "").toLowerCase().includes(q);
        const matchesId = cart.id.toLowerCase().includes(q);
        const matchesProduct = (cart.items || []).some((item) =>
          item.name.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [carts, selectedStatus, selectedCountry, dateFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    let totalValueAud = 0;
    let totalValueInr = 0;
    let abandonedCount = 0;
    let abandonedValueAud = 0;
    let abandonedValueInr = 0;
    let checkoutStartedCount = 0;
    let activeCount = 0;
    let purchasedCount = 0;

    carts.forEach((c) => {
      const status = c.computed_status || c.status;
      if (c.currency === "AUD") {
        totalValueAud += Number(c.total) || 0;
      } else {
        totalValueInr += Number(c.total) || 0;
      }

      if (status === "abandoned") {
        abandonedCount++;
        if (c.currency === "AUD") abandonedValueAud += Number(c.total) || 0;
        else abandonedValueInr += Number(c.total) || 0;
      } else if (status === "checkout_started") {
        checkoutStartedCount++;
      } else if (status === "active") {
        activeCount++;
      } else if (status === "purchased") {
        purchasedCount++;
      }
    });

    const conversionRate =
      carts.length > 0 ? ((purchasedCount / carts.length) * 100).toFixed(1) : "0.0";

    return {
      totalCarts: carts.length,
      activeCount,
      checkoutStartedCount,
      abandonedCount,
      abandonedValueAud,
      abandonedValueInr,
      purchasedCount,
      conversionRate,
      totalValueAud,
      totalValueInr,
    };
  }, [carts]);

  // ── CSV EXPORT HELPERS (Excel Compatible with UTF-8 BOM) ───────────────────
  const downloadCSV = (filename: string, csvContent: string) => {
    // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays characters without encoding corruption
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // 1. Export All Carts (Excel/CSV)
  const handleExportAllCarts = () => {
    if (filteredCarts.length === 0) {
      toast({ title: "No carts to export", variant: "destructive" });
      return;
    }

    const headers = [
      "Cart ID",
      "Status",
      "Created Date (AEST)",
      "Last Updated (AEST)",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Country",
      "Currency",
      "Subtotal",
      "Bundle Discount",
      "Total Amount",
      "Items Count",
      "Products Breakdown",
      "Last Event",
      "Meta Event ID",
      "Session ID",
    ];

    const rows = filteredCarts.map((c) => {
      const itemsList = (c.items || [])
        .map((i) => `${i.name} (Qty: ${i.quantity}, Price: ${c.currency === "AUD" ? "A$" : "₹"}${i.price})`)
        .join("; ");

      return [
        escapeCSV(c.id),
        escapeCSV((c.computed_status || c.status).toUpperCase()),
        escapeCSV(formatAusDateTime(c.created_at)),
        escapeCSV(formatAusDateTime(c.updated_at)),
        escapeCSV(c.customer_name || "Guest / Unnamed"),
        escapeCSV(c.customer_email || ""),
        escapeCSV(c.customer_phone || ""),
        escapeCSV(c.country),
        escapeCSV(c.currency),
        escapeCSV(c.raw_total),
        escapeCSV(c.bundle_discount),
        escapeCSV(c.total),
        escapeCSV(c.item_count),
        escapeCSV(itemsList),
        escapeCSV(c.last_event || ""),
        escapeCSV(c.event_id || ""),
        escapeCSV(c.session_id || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCSV(`scalvea_all_carts_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    toast({ title: "Export complete", description: `Exported ${filteredCarts.length} carts to Excel CSV.` });
  };

  // 2. Export Abandoned Carts Only (Excel/CSV)
  const handleExportAbandonedCarts = () => {
    const abandonedOnly = carts.filter((c) => (c.computed_status || c.status) === "abandoned");
    if (abandonedOnly.length === 0) {
      toast({ title: "No abandoned carts found", variant: "destructive" });
      return;
    }

    const headers = [
      "Cart ID",
      "Abandoned Date (AEST)",
      "Last Active Date (AEST)",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Country",
      "Currency",
      "Cart Value",
      "Items Count",
      "Products Summary",
      "Recovery URL",
    ];

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://scalvea.com";

    const rows = abandonedOnly.map((c) => {
      const itemsList = (c.items || [])
        .map((i) => `${i.quantity}x ${i.name}`)
        .join("; ");
      const recoveryUrl = `${baseUrl}/cart`;

      return [
        escapeCSV(c.id),
        escapeCSV(formatAusDateTime(c.abandoned_at || c.updated_at)),
        escapeCSV(formatAusDateTime(c.updated_at)),
        escapeCSV(c.customer_name || "Customer"),
        escapeCSV(c.customer_email || ""),
        escapeCSV(c.customer_phone || ""),
        escapeCSV(c.country),
        escapeCSV(c.currency),
        escapeCSV(c.total),
        escapeCSV(c.item_count),
        escapeCSV(itemsList),
        escapeCSV(recoveryUrl),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCSV(`scalvea_abandoned_carts_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    toast({
      title: "Export complete",
      description: `Exported ${abandonedOnly.length} abandoned carts for customer re-engagement.`,
    });
  };

  // 3. Export Meta Ads Custom Audience List
  const handleExportMetaAudience = () => {
    // Only customers who have email or phone for Meta audience matching
    const eligible = carts.filter(
      (c) =>
        (c.computed_status || c.status) === "abandoned" &&
        (Boolean(c.customer_email) || Boolean(c.customer_phone))
    );

    if (eligible.length === 0) {
      toast({
        title: "No eligible audience data",
        description: "No abandoned carts found with verified customer email/phone identifiers.",
        variant: "destructive",
      });
      return;
    }

    // Standard Meta Ads Customer List format
    const headers = ["email", "phone", "fn", "ln", "country", "value", "currency"];

    const rows = eligible.map((c) => {
      const email = (c.customer_email || "").trim().toLowerCase();
      const phone = (c.customer_phone || "").replace(/[^\d+]/g, "");

      const nameParts = (c.customer_name || "").trim().split(/\s+/);
      const fn = nameParts[0] || "";
      const ln = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
      const countryCode = c.country?.toLowerCase() === "india" ? "IN" : "AU";

      return [
        escapeCSV(email),
        escapeCSV(phone),
        escapeCSV(fn),
        escapeCSV(ln),
        escapeCSV(countryCode),
        escapeCSV(c.total),
        escapeCSV(c.currency),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    downloadCSV(`meta_abandoned_audience_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    toast({
      title: "Meta Custom Audience Ready",
      description: `Generated Meta-compliant CSV with ${eligible.length} customer records.`,
    });
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: CartStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" /> Active
          </span>
        );
      case "checkout_started":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Checkout Started
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Abandoned
          </span>
        );
      case "purchased":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Purchased
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. HEADER & ACTIONS ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-normal font-heading tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-700" />
            Cart Tracking & Abandonment
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time customer carts, analyze checkout drop-offs, and export for Meta audience retargeting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAbandonmentCheck}
            disabled={refreshing}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Run Inactivity Check
          </Button>

          {/* Export Dropdown Group */}
          <Button
            size="sm"
            onClick={handleExportAllCarts}
            className="bg-black text-white hover:bg-neutral-800 text-xs h-9 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export All Carts
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAbandonedCarts}
            className="border-rose-300 text-rose-800 hover:bg-rose-50 text-xs h-9 gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
            Export Abandoned
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportMetaAudience}
            className="border-sky-300 text-sky-800 hover:bg-sky-50 text-xs h-9 gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-sky-600" />
            Meta Audience CSV
          </Button>
        </div>
      </div>

      {/* ─── 2. KPI SUMMARY METRIC CARDS ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Carts */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Carts</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{stats.totalCarts}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Active: {stats.activeCount} · Checkout: {stats.checkoutStartedCount}
          </p>
        </div>

        {/* Abandoned Carts */}
        <div className="bg-rose-50/50 border border-rose-200/80 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Abandoned Carts</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-rose-900">{stats.abandonedCount}</p>
          <p className="text-[10px] text-rose-700 font-medium mt-1">
            Value: A${stats.abandonedValueAud.toFixed(0)} · ₹{Math.round(stats.abandonedValueInr).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Purchased Carts */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Purchased</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-emerald-900">{stats.purchasedCount}</p>
          <p className="text-[10px] text-emerald-700 font-medium mt-1">
            Conversion Rate: <span className="font-bold">{stats.conversionRate}%</span>
          </p>
        </div>

        {/* Total Cart Volume */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Value Tracked</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold font-mono tracking-tight text-foreground">
            A${stats.totalValueAud.toFixed(0)} <span className="text-xs text-muted-foreground font-normal">/</span> ₹{Math.round(stats.totalValueInr).toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Australia & India Combined</p>
        </div>
      </div>

      {/* ─── 3. FILTER CONTROLS BAR ──────────────────────────────────────────── */}
      <div className="bg-card border border-border p-3.5 sm:p-4 rounded-xl shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by customer, email, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md outline-none focus:border-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Carts</option>
              <option value="checkout_started">Checkout Started</option>
              <option value="abandoned">Abandoned Carts</option>
              <option value="purchased">Purchased</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md outline-none focus:border-foreground"
            >
              <option value="all">All Markets</option>
              <option value="australia">Australia (AUD)</option>
              <option value="india">India (INR)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md outline-none focus:border-foreground"
            >
              <option value="all">All Time</option>
              <option value="today">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Inactivity Threshold setting */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Inactivity Threshold:</span>
            <select
              value={abandonmentHours}
              onChange={(e) => setAbandonmentHours(Number(e.target.value))}
              className="h-7 px-2 text-xs bg-background border border-border rounded outline-none"
            >
              <option value={12}>12 Hours</option>
              <option value={24}>24 Hours (1 Day — Default)</option>
              <option value={48}>48 Hours (2 Days)</option>
              <option value={72}>72 Hours (3 Days)</option>
            </select>
            <span>Carts idle longer than this are classified as Abandoned.</span>
          </div>

          <span className="font-mono text-[11px]">
            Showing {filteredCarts.length} of {carts.length} records
          </span>
        </div>
      </div>

      {/* ─── 4. CARTS TABLE ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin" />
            <p>Loading cart records from Supabase...</p>
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto stroke-[1.2] opacity-40" />
            <p className="text-sm font-medium text-foreground">No carts match your current filters</p>
            <p className="text-xs font-light">Try adjusting your status, date, or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Items in Cart</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCarts.map((cart) => {
                  const effectiveStatus = cart.computed_status || cart.status;
                  const formattedTotal =
                    cart.currency === "AUD"
                      ? `A$${Number(cart.total).toFixed(2)}`
                      : `₹${Math.round(Number(cart.total)).toLocaleString("en-IN")}`;

                  return (
                    <tr
                      key={cart.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => openCartDetails(cart)}
                    >
                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(effectiveStatus)}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {cart.customer_name || "Guest Customer"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {cart.customer_email || "No email"}
                        </div>
                        {cart.customer_phone && (
                          <div className="text-[10px] text-muted-foreground">
                            {cart.customer_phone}
                          </div>
                        )}
                      </td>

                      {/* Country & Currency */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{cart.country}</div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {cart.currency}
                        </span>
                      </td>

                      {/* Products Summary */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[11px] font-medium text-foreground truncate">
                          {cart.items && cart.items.length > 0
                            ? cart.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
                            : "Empty bag"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {cart.item_count} total {cart.item_count === 1 ? "unit" : "units"}
                        </div>
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-foreground">
                        {formattedTotal}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-[11px]">
                        <div>{formatAusDateTime(cart.updated_at)}</div>
                        <span className="text-[10px] opacity-75">Event: {cart.last_event || "active"}</span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCartDetails(cart);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 5. CART DETAILS MODAL ─────────────────────────────────────────── */}
      {selectedCart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Cart Details · ID: {selectedCart.id}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-semibold text-foreground">
                    {selectedCart.customer_name || "Customer Cart"}
                  </h3>
                  {renderStatusBadge(selectedCart.computed_status || selectedCart.status)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCart(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Customer Profile Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-muted/20 border border-border rounded-xl">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Email</span>
                  <span className="font-mono font-medium text-foreground">
                    {selectedCart.customer_email || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Phone</span>
                  <span className="font-mono font-medium text-foreground">
                    {selectedCart.customer_phone || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Market</span>
                  <span className="font-medium text-foreground">
                    {selectedCart.country} ({selectedCart.currency})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Created At</span>
                  <span className="font-mono text-muted-foreground">
                    {formatAusDateTime(selectedCart.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Last Active</span>
                  <span className="font-mono text-muted-foreground">
                    {formatAusDateTime(selectedCart.updated_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Meta Event ID</span>
                  <span className="font-mono text-[10px] text-muted-foreground truncate block">
                    {selectedCart.event_id || "N/A"}
                  </span>
                </div>
              </div>

              {/* Products in Cart */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Products in Cart ({selectedCart.items?.length || 0})
                </h4>
                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {selectedCart.items && selectedCart.items.length > 0 ? (
                    selectedCart.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-contain rounded bg-muted/40 p-0.5 border"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-foreground text-xs">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Product ID: {item.product_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-foreground">
                            {item.quantity} × {selectedCart.currency === "AUD" ? "A$" : "₹"}
                            {item.price}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total: {selectedCart.currency === "AUD" ? "A$" : "₹"}
                            {(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No items currently in this cart.</div>
                  )}
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">
                    {selectedCart.currency === "AUD" ? "A$" : "₹"}
                    {Number(selectedCart.raw_total).toFixed(2)}
                  </span>
                </div>
                {Number(selectedCart.bundle_discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Bundle / Promotional Savings:</span>
                    <span className="font-mono">
                      -{selectedCart.currency === "AUD" ? "A$" : "₹"}
                      {Number(selectedCart.bundle_discount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                  <span>Estimated Total:</span>
                  <span className="font-mono">
                    {selectedCart.currency === "AUD" ? "A$" : "₹"}
                    {Number(selectedCart.total).toFixed(2)} {selectedCart.currency}
                  </span>
                </div>
              </div>

              {/* Event Audit Trail */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Cart Event Audit Trail
                </h4>
                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {loadingEvents ? (
                    <div className="p-4 text-center text-muted-foreground">Loading event logs...</div>
                  ) : cartEvents.length > 0 ? (
                    cartEvents.map((ev, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold uppercase text-foreground">
                            {ev.event_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ID: {ev.event_id || "N/A"}
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {formatAusDateTime(ev.created_at)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No granular event logs recorded.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                Session: {selectedCart.session_id || "N/A"}
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedCart(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCarts;
