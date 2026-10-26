import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  PenLine,
  Pencil,
  Search,
  X,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminManualOrder from "./AdminManualOrder";
import { formatAusDateTime } from "@/lib/timezone";
import { exportOrdersComprehensiveCSV, exportMetaCustomAudienceCSV } from "@/utils/orderExports";
import { NormalizedOrder, OrderSortField, SortDirection } from "@/types/ordersReporting";

/* ─── Types ─── */
type OrderSource = "All" | "Online" | "Manual";

const STATUS_OPTIONS = [
  "pending", "processing", "packed", "shipped", "out_for_delivery",
  "delivered", "hand_delivered", "store_pickup", "completed", "cancelled", "refunded"
];

const LOCKED_STATUSES = new Set([
  "delivered", "hand_delivered", "store_pickup", "completed", "cancelled", "refunded"
]);

/* ─── Edit Panel ─── */
interface EditPanelProps {
  order: any;
  onSave: () => void;
  onClose: () => void;
}

const EditManualOrderPanel = ({ order, onSave, onClose }: EditPanelProps) => {
  const [form, setForm] = useState({
    order_status:          order.order_status  || "pending",
    payment_status:        order.payment_status || "pending",
    delivery_method:       order.delivery_method || "HAND_DELIVERY",
    courier_name:          order.courier_name  || order.courier || "",
    tracking_number:       order.tracking_number || "",
    admin_notes:           order.admin_notes   || "",
    manual_payment_method: order.manual_payment_method || "",
  });
  const [saving, setSaving] = useState(false);

  const isLocked = LOCKED_STATUSES.has(order.order_status);

  const save = async () => {
    setSaving(true);

    await supabase.from("orders").update({
      order_status:          form.order_status,
      payment_status:        form.payment_status,
      delivery_method:       form.delivery_method,
      courier_name:          form.courier_name || null,
      courier:               form.courier_name || null,
      tracking_number:       form.tracking_number || null,
      admin_notes:           form.admin_notes || null,
      manual_payment_method: form.manual_payment_method || null,
    } as any).eq("id", order.id);

    toast({ title: "Order updated" });
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end">
      <div className="w-full max-w-md h-full bg-background border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-amber-50 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-semibold">Manual Order</p>
            <h2 className="text-sm font-medium mt-0.5 flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit {order.order_number}
            </h2>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
        </div>

        {isLocked && (
          <div className="px-6 py-3 bg-muted text-xs text-muted-foreground border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            Order is {order.order_status} — limited editing. You can still update notes and tracking.
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Order Status */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Order Status</label>
            <select
              value={form.order_status}
              onChange={e => setForm(p => ({ ...p, order_status: e.target.value }))}
              disabled={isLocked}
              className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>

          {/* Payment Status */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Payment Status</label>
            <select
              value={form.payment_status}
              onChange={e => setForm(p => ({ ...p, payment_status: e.target.value }))}
              className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
            >
              {["paid", "pending", "partially_paid", "refunded"].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {/* Delivery Method */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Delivery Method</label>
            <select
              value={form.delivery_method}
              onChange={e => setForm(p => ({ ...p, delivery_method: e.target.value }))}
              disabled={isLocked}
              className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors disabled:opacity-50"
            >
              {["HAND_DELIVERY","STORE_PICKUP","MANUAL_COURIER","SHIPROCKET","STRIPE"].map(m => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          {/* Manual Payment Method */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Payment Method</label>
            <select
              value={form.manual_payment_method}
              onChange={e => setForm(p => ({ ...p, manual_payment_method: e.target.value }))}
              className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
            >
              {["Cash","UPI","Bank Transfer","Card Machine","Stripe Manual","Other"].map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>

          {/* Courier Name */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Courier Name</label>
            <Input
              value={form.courier_name}
              onChange={e => setForm(p => ({ ...p, courier_name: e.target.value }))}
              placeholder="FedEx, India Post, DHL…"
              className="h-10 text-sm"
            />
          </div>

          {/* Tracking Number */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Tracking Number</label>
            <Input
              value={form.tracking_number}
              onChange={e => setForm(p => ({ ...p, tracking_number: e.target.value }))}
              placeholder="Tracking #"
              className="h-10 text-sm font-mono"
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Internal Admin Notes</label>
            <textarea
              value={form.admin_notes}
              onChange={e => setForm(p => ({ ...p, admin_notes: e.target.value }))}
              placeholder="Customer requested morning delivery, etc."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3 flex-shrink-0 bg-secondary/20">
          <Button onClick={onClose} variant="outline" className="flex-1 h-11 text-xs uppercase tracking-wide">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1 h-11 text-xs uppercase tracking-wide bg-foreground text-background">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Cancel Confirmation ─── */
interface CancelConfirmProps {
  order: any;
  onConfirm: () => void;
  onClose: () => void;
}
const CancelConfirm = ({ order, onConfirm, onClose }: CancelConfirmProps) => (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-background border border-border max-w-sm w-full p-6 space-y-4">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-5 w-5" />
        <p className="text-sm font-medium">Cancel Order {order.order_number}?</p>
      </div>
      <p className="text-xs text-muted-foreground">
        This will cancel the order and <strong>restore all inventory</strong> back to their previous stock levels.
        This action is logged.
      </p>
      <div className="flex gap-2">
        <Button onClick={onConfirm} className="flex-1 h-11 text-xs sm:text-sm font-medium uppercase tracking-wide bg-red-600 hover:bg-red-700 text-white">
          Cancel Order & Restore Stock
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 h-11 text-xs sm:text-sm font-medium uppercase tracking-wide">Keep Order</Button>
      </div>
    </div>
  </div>
);

/* ─── Main AdminOrders Component ─── */
const AdminOrders = () => {
  const [orders, setOrders] = useState<NormalizedOrder[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<"All" | "Australia" | "India">("All");
  const [sourceFilter, setSourceFilter] = useState<OrderSource>("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [currencyFilter, setCurrencyFilter] = useState<"All" | "AUD" | "INR">("All");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "7d" | "30d" | "this_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [qualityFilter, setQualityFilter] = useState<"all" | "has_issues" | "complete">("all");
  const [stateFilter, setStateFilter] = useState("All");

  /* Sorting */
  const [sortBy, setSortBy] = useState<OrderSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  /* Modal state */
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [cancelOrder, setCancelOrder] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  /* Admin name cache: UUID → display name */
  const adminNameCache = useRef<Record<string, string>>({});
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setLoading(true);

    try {
      // Step 1: Query orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("[AdminOrders] Failed to fetch orders:", ordersError.message);
        toast({ title: "Failed to load orders", description: ordersError.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const fetchedOrders = (ordersData || []) as NormalizedOrder[];

      // Step 2: Fetch all order_items and bucket by order_id
      const { data: allItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*");

      if (itemsError) {
        console.warn("[AdminOrders] order_items fetch notice:", itemsError.message);
      }

      const itemsByOrder: Record<string, any[]> = {};
      for (const item of allItems || []) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push(item);
      }

      const ordersWithItems = fetchedOrders.map(o => ({
        ...o,
        order_items: itemsByOrder[o.id] || [],
      }));

      setOrders(ordersWithItems);
      setOrderItems(itemsByOrder);
    } catch (err: any) {
      console.error("[AdminOrders] Error in fetchOrders:", err);
      toast({ title: "Error loading orders", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ── Resolve admin UUIDs to names ── */
  useEffect(() => {
    const uuids = [...new Set(
      orders
        .filter(o => o.created_by_admin && !adminNameCache.current[o.created_by_admin])
        .map(o => o.created_by_admin as string)
    )];
    if (uuids.length === 0) return;

    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", uuids)
      .then(({ data }) => {
        if (!data) return;
        const updates: Record<string, string> = {};
        data.forEach((p: any) => {
          const name = p.full_name?.trim() || p.email || p.id.slice(0, 8);
          adminNameCache.current[p.id] = name;
          updates[p.id] = name;
        });
        setAdminNames(prev => ({ ...prev, ...updates }));
      });
  }, [orders]);

  const updateStatus = async (id: string, status: string, prevStatus: string) => {
    if (status === prevStatus) return;
    await supabase.from("orders").update({ order_status: status } as any).eq("id", id);
    toast({ title: `Status → ${status}` });
    fetchOrders();
  };

  /* ── Cancel + Inventory Restore ── */
  const handleCancelOrder = useCallback(async (order: any) => {
    setCancelling(true);
    try {
      const isIndia = order.country === "India";

      let items = orderItems[order.id];
      if (!items) {
        const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
        items = data || [];
        setOrderItems(prev => ({ ...prev, [order.id]: items }));
      }

      for (const item of items) {
        if (!item.product_id) continue;
        const { data: prod } = await supabase
          .from("products")
          .select("inventory_quantity, inventory_quantity_australia")
          .eq("id", item.product_id)
          .single();
        if (!prod) continue;

        const currentQty = isIndia ? (prod.inventory_quantity ?? 0) : (prod.inventory_quantity_australia ?? 0);
        const restoredQty = currentQty + item.quantity;
        const updatePayload = isIndia
          ? { inventory_quantity: restoredQty }
          : { inventory_quantity_australia: restoredQty };

        await supabase.from("products").update(updatePayload as any).eq("id", item.product_id);
        await supabase.from("inventory_logs").insert({
          product_id: item.product_id,
          change_amount: +item.quantity,
          previous_quantity: currentQty,
          new_quantity: restoredQty,
          reason: `Order Cancelled: ${order.order_number} — stock restored (${isIndia ? "India" : "Australia"})`,
        } as any);
      }

      await supabase.from("orders").update({ order_status: "cancelled" } as any).eq("id", order.id);

      toast({ title: `Order ${order.order_number} cancelled`, description: "Inventory restored successfully." });
      setCancelOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }, [orderItems]);

  /* ── Distinct states list for dropdown ── */
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    orders.forEach(o => {
      const st = o.shipping_state || (o.shipping_address as any)?.state;
      if (st && typeof st === "string" && st.trim()) states.add(st.trim());
    });
    return Array.from(states).sort();
  }, [orders]);

  /* ── Comprehensive Filtering & Searching ── */
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthStartStr = todayStr.slice(0, 7);

    return orders.filter(o => {
      // 1. Country filter
      if (countryFilter !== "All") {
        const orderCountry = o.country || "Australia";
        if (orderCountry.toLowerCase() !== countryFilter.toLowerCase()) return false;
      }

      // 2. Source filter
      if (sourceFilter === "Manual" && o.order_source !== "MANUAL") return false;
      if (sourceFilter === "Online" && o.order_source === "MANUAL") return false;

      // 3. Status filter
      if (statusFilter !== "All" && o.order_status !== statusFilter) return false;

      // 4. Payment status filter
      if (paymentStatusFilter !== "All" && o.payment_status !== paymentStatusFilter) return false;

      // 5. Currency filter
      if (currencyFilter !== "All" && o.currency !== currencyFilter) return false;

      // 6. State filter
      if (stateFilter !== "All") {
        const st = (o.shipping_state || (o.shipping_address as any)?.state || "").toLowerCase();
        if (st !== stateFilter.toLowerCase()) return false;
      }

      // 7. Quality flags filter
      if (qualityFilter === "has_issues") {
        const flags = o.data_quality_flags || [];
        const missingPostcode = !o.shipping_postcode && !(o.shipping_address as any)?.postcode;
        const missingLine = !o.shipping_address_line1 && !(o.shipping_address as any)?.address;
        if (flags.length === 0 && !missingPostcode && !missingLine) return false;
      } else if (qualityFilter === "complete") {
        const flags = o.data_quality_flags || [];
        const missingPostcode = !o.shipping_postcode && !(o.shipping_address as any)?.postcode;
        const missingLine = !o.shipping_address_line1 && !(o.shipping_address as any)?.address;
        if (flags.length > 0 || missingPostcode || missingLine) return false;
      }

      // 8. Date Range filter
      if (dateRangeFilter !== "all" && o.created_at) {
        const orderDate = new Date(o.created_at);
        const orderDateKey = o.created_at.slice(0, 10);

        if (dateRangeFilter === "today" && orderDateKey !== todayStr) return false;
        if (dateRangeFilter === "7d" && orderDate < sevenDaysAgo) return false;
        if (dateRangeFilter === "30d" && orderDate < thirtyDaysAgo) return false;
        if (dateRangeFilter === "this_month" && !orderDateKey.startsWith(monthStartStr)) return false;
        if (dateRangeFilter === "custom") {
          if (customStartDate && orderDateKey < customStartDate) return false;
          if (customEndDate && orderDateKey > customEndDate) return false;
        }
      }

      // 9. Global Search (name, email, phone, order number, city, postcode, items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const addr = (o.shipping_address as any) || {};

        const matches =
          (o.order_number || "").toLowerCase().includes(q) ||
          (o.customer_name || "").toLowerCase().includes(q) ||
          (o.customer_first_name || "").toLowerCase().includes(q) ||
          (o.customer_last_name || "").toLowerCase().includes(q) ||
          (o.customer_email || "").toLowerCase().includes(q) ||
          (o.customer_phone || "").toLowerCase().includes(q) ||
          (o.shipping_city || addr.city || "").toLowerCase().includes(q) ||
          (o.shipping_postcode || addr.postcode || "").toLowerCase().includes(q) ||
          (o.shipping_state || addr.state || "").toLowerCase().includes(q) ||
          (o.shipping_address_line1 || addr.address || "").toLowerCase().includes(q);

        if (matches) return true;

        // Search product names
        const items = orderItems[o.id] || o.order_items || [];
        return items.some((item: any) => (item.product_name || "").toLowerCase().includes(q));
      }

      return true;
    });
  }, [
    orders,
    countryFilter,
    sourceFilter,
    statusFilter,
    paymentStatusFilter,
    currencyFilter,
    stateFilter,
    qualityFilter,
    dateRangeFilter,
    customStartDate,
    customEndDate,
    searchQuery,
    orderItems,
  ]);

  /* ── Multi-column Sorting ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "created_at") {
        const tA = new Date(a.created_at || 0).getTime();
        const tB = new Date(b.created_at || 0).getTime();
        comparison = tA - tB;
      } else if (sortBy === "total_amount") {
        const vA = Number(a.total_amount || a.total || 0);
        const vB = Number(b.total_amount || b.total || 0);
        comparison = vA - vB;
      } else if (sortBy === "customer_name") {
        const nA = (a.customer_name || a.customer_first_name || "").toLowerCase();
        const nB = (b.customer_name || b.customer_first_name || "").toLowerCase();
        comparison = nA.localeCompare(nB);
      } else if (sortBy === "order_number") {
        const numA = (a.order_number || "").toLowerCase();
        const numB = (b.order_number || "").toLowerCase();
        comparison = numA.localeCompare(numB);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortBy, sortDirection]);

  /* ── Pagination ── */
  const totalRecords = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedOrders = sorted.slice(startIndex, endIndex);

  const handleSortToggle = (field: OrderSortField) => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setCountryFilter("All");
    setSourceFilter("All");
    setStatusFilter("All");
    setPaymentStatusFilter("All");
    setCurrencyFilter("All");
    setDateRangeFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setQualityFilter("all");
    setStateFilter("All");
    setCurrentPage(1);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8">Loading order management…</p>;

  return (
    <>
      {showManualOrder && (
        <AdminManualOrder
          onClose={() => setShowManualOrder(false)}
          onOrderCreated={fetchOrders}
        />
      )}

      {editingOrder && (
        <EditManualOrderPanel
          order={editingOrder}
          onSave={fetchOrders}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {cancelOrder && (
        <CancelConfirm
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onConfirm={() => handleCancelOrder(cancelOrder)}
        />
      )}

      <div className="space-y-4">
        {/* ── Top Header Row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="text-base font-semibold uppercase tracking-[0.12em]">Order Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} matching order{filtered.length !== 1 ? "s" : ""} · All times displayed in Melbourne Time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export All/Filtered CSV Button */}
            <Button
              onClick={() => exportOrdersComprehensiveCSV(sorted)}
              variant="outline"
              className="h-9 px-3.5 text-xs font-semibold uppercase tracking-wider border-border hover:bg-secondary/40 flex items-center gap-2"
              title="Export complete filtered dataset to Excel CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>

            {/* Meta Audience Export Button */}
            <Button
              onClick={() => exportMetaCustomAudienceCSV(sorted)}
              variant="outline"
              className="h-9 px-3.5 text-xs font-semibold uppercase tracking-wider border-border hover:bg-secondary/40 flex items-center gap-2"
              title="Export Meta value-based custom audience (paid orders only)"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>Meta Audience CSV</span>
            </Button>

            {/* Create Manual Order Button */}
            <button
              id="admin-create-manual-order-btn"
              onClick={() => setShowManualOrder(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.1em] bg-foreground text-background hover:bg-foreground/90 transition-colors font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" />
              + Manual Order
            </button>
          </div>
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-background border border-border p-4 space-y-3 shadow-2xs">
          {/* Row 1: Search + Country + Source + Quality Flag + Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Search */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search order #, customer, email, phone, city, postcode, product…"
                className="w-full h-9 pl-9 pr-8 text-xs bg-transparent border border-border outline-none focus:border-foreground transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Country Selector */}
            <select
              value={countryFilter}
              onChange={e => { setCountryFilter(e.target.value as any); setCurrentPage(1); }}
              className="h-9 text-xs uppercase tracking-wider bg-transparent border border-border px-3 outline-none cursor-pointer"
            >
              <option value="All">All Countries</option>
              <option value="Australia">🇦🇺 Australia</option>
              <option value="India">🇮🇳 India</option>
            </select>

            {/* Source Selector */}
            <div className="flex border border-border h-9">
              {(["All", "Online", "Manual"] as OrderSource[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setSourceFilter(s); setCurrentPage(1); }}
                  className={`px-3 h-full text-[11px] uppercase tracking-wider border-r last:border-r-0 border-border transition-colors ${
                    sourceFilter === s ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:bg-secondary/40 font-medium"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Data Quality / Flag Filter */}
            <select
              value={qualityFilter}
              onChange={e => { setQualityFilter(e.target.value as any); setCurrentPage(1); }}
              className={`h-9 text-xs uppercase tracking-wider border px-3 outline-none cursor-pointer ${
                qualityFilter === "has_issues" ? "border-amber-500 bg-amber-50/50 text-amber-900 font-semibold" : "border-border bg-transparent"
              }`}
            >
              <option value="all">All Quality Status</option>
              <option value="has_issues">⚠️ Missing Info / Issues</option>
              <option value="complete">✓ Complete Records</option>
            </select>

            {/* Reset Filters */}
            <Button
              onClick={resetFilters}
              variant="ghost"
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              title="Reset all filters"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Row 2: Secondary Filters (Date range, Order Status, Payment Status, Currency, State) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
            {/* Date Range Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold mr-1">Date:</span>
              {[
                { id: "all", label: "All" },
                { id: "today", label: "Today" },
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "custom", label: "Custom" },
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDateRangeFilter(d.id as any); setCurrentPage(1); }}
                  className={`px-2.5 py-1 text-[10px] uppercase font-medium border rounded-xs transition-colors ${
                    dateRangeFilter === d.id ? "bg-foreground text-background font-semibold border-foreground" : "border-border text-muted-foreground hover:bg-secondary/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs (when selected) */}
            {dateRangeFilter === "custom" && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto my-1 sm:my-0 bg-muted/40 px-2 py-1 rounded border border-border">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                  className="h-7 text-xs border border-border px-1.5 bg-background rounded-xs"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                  className="h-7 text-xs border border-border px-1.5 bg-background rounded-xs"
                />
              </div>
            )}

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            {/* Order Status */}
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 text-xs uppercase bg-transparent border border-border px-2.5 outline-none cursor-pointer"
            >
              <option value="All">All Order Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>

            {/* Payment Status */}
            <select
              value={paymentStatusFilter}
              onChange={e => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-8 text-xs uppercase bg-transparent border border-border px-2.5 outline-none cursor-pointer"
            >
              <option value="All">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / COD</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={e => { setCurrencyFilter(e.target.value as any); setCurrentPage(1); }}
              className="h-8 text-xs uppercase bg-transparent border border-border px-2 outline-none cursor-pointer"
            >
              <option value="All">All Currencies</option>
              <option value="AUD">AUD (A$)</option>
              <option value="INR">INR (₹)</option>
            </select>

            {/* State Filter */}
            {availableStates.length > 0 && (
              <select
                value={stateFilter}
                onChange={e => { setStateFilter(e.target.value); setCurrentPage(1); }}
                className="h-8 text-xs uppercase bg-transparent border border-border px-2 outline-none cursor-pointer max-w-[140px]"
              >
                <option value="All">All States</option>
                {availableStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            )}

            {/* Sorting Controls */}
            <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-1.5 flex-wrap pt-1 sm:pt-0">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Sort:</span>
              <button
                onClick={() => handleSortToggle("created_at")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 ${
                  sortBy === "created_at" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Date {sortBy === "created_at" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortToggle("total_amount")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 ${
                  sortBy === "total_amount" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Value {sortBy === "total_amount" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
              <button
                onClick={() => handleSortToggle("customer_name")}
                className={`h-8 px-2.5 text-[11px] uppercase border transition-colors flex items-center gap-1 ${
                  sortBy === "customer_name" ? "bg-secondary text-foreground font-semibold border-foreground/40" : "border-border text-muted-foreground"
                }`}
              >
                Name {sortBy === "customer_name" && (sortDirection === "desc" ? "↓" : "↑")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Order Cards ── */}
        {sorted.length === 0 ? (
          <div className="border border-border p-12 text-center bg-background space-y-2">
            <p className="text-sm font-medium text-foreground">No orders found matching your filters</p>
            <p className="text-xs text-muted-foreground">Try clearing search terms or selecting &quot;All Countries&quot; and &quot;All Time&quot;.</p>
            <Button onClick={resetFilters} variant="outline" className="mt-3 text-xs uppercase tracking-wider">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order, index) => {
              const addr = (order.shipping_address as any) || {};
              const billing = (order.billing_address as any) || {};
              const isIndia = order.country?.toLowerCase() === "india" || order.currency === "INR";
              const isManual = order.order_source === "MANUAL";
              const isCancellable = !LOCKED_STATUSES.has(order.order_status);

              // Authoritative total amount
              const authTotal = order.total_amount || order.total || order.total_amount_payable || 0;
              const fmt = (v: number) => isIndia
                ? `₹${Math.round(v || 0).toLocaleString("en-IN")}`
                : `A$${Number(v || 0).toFixed(2)}`;

              const adminDisplay = order.created_by_admin
                ? (adminNames[order.created_by_admin] || adminNameCache.current[order.created_by_admin] || order.created_by_admin.slice(0, 8) + "…")
                : null;

              // Normalized address fields with fallback to JSON
              const shipLine1 = order.shipping_address_line1 || addr.address_line1 || addr.address || addr.line1 || "";
              const shipLine2 = order.shipping_address_line2 || addr.address_line2 || addr.line2 || "";
              const shipCity  = order.shipping_city || addr.city || "";
              const shipState = order.shipping_state || addr.state || "";
              const shipPostcode = order.shipping_postcode || addr.postcode || addr.pincode || "";
              const shipCountry = order.shipping_country || addr.country || (isIndia ? "India" : "Australia");

              const billLine1 = order.billing_address_line1 || billing.address_line1 || billing.address || "";
              const billCity  = order.billing_city || billing.city || "";
              const hasDistinctBilling = billLine1 && billLine1 !== shipLine1;

              // Data quality flags check
              const qualityFlags = order.data_quality_flags || [];
              const hasMissingPostcode = !shipPostcode;
              const hasMissingLine = !shipLine1;

              return (
                <div
                  key={order.id}
                  className={`border p-5 space-y-4 shadow-xs transition-colors ${
                    isManual ? "border-amber-300 bg-amber-50/20" : "border-neutral-200 bg-background"
                  }`}
                >
                  {/* ── Header row: Order number, date/time, and financial totals ── */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-neutral-200">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-lg sm:text-xl font-bold text-black font-mono tracking-tight">
                          {order.order_number}
                        </span>
                        {isManual && (
                          <span className="inline-flex items-center gap-1 text-xs tracking-wider uppercase font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5">
                            <PenLine className="h-3 w-3" /> Manual
                          </span>
                        )}
                        {order.sales_channel && order.sales_channel !== "WEBSITE" && (
                          <span className="text-xs tracking-wider uppercase bg-secondary text-black font-semibold border border-border px-2.5 py-0.5">
                            {order.sales_channel}
                          </span>
                        )}
                        {/* Quality warning badge */}
                        {(hasMissingPostcode || hasMissingLine || qualityFlags.length > 0) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5" title={qualityFlags.join(", ")}>
                            <AlertCircle className="h-3 w-3 text-amber-700" /> Incomplete Address
                          </span>
                        )}
                      </div>

                      {/* Melbourne Time prominently showcased */}
                      <p className="text-sm font-semibold text-black mt-1" title={`Original Database Time: ${order.created_at}`}>
                        {formatAusDateTime(order.created_at)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-mono font-bold text-black">{fmt(Number(authTotal))}</p>
                      <p className="text-xs font-semibold text-black uppercase font-mono mt-1">
                        {order.market || (isIndia ? "IN" : "AU")} | {order.payment_provider || order.payment_method || "Stripe"} | {order.order_status} | {order.payment_status} | {order.currency}
                      </p>
                    </div>
                  </div>

                  {/* ── Normalized Customer & Address Details ── */}
                  <div className={`grid grid-cols-1 ${hasDistinctBilling ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4 text-xs text-black py-1`}>
                    {/* Customer Info */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Customer</p>
                      <p className="font-semibold text-sm">
                        {order.customer_first_name || order.customer_last_name
                          ? `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim()
                          : order.customer_name || "—"}
                      </p>
                      <p className="text-neutral-700 font-mono text-[11px]">{order.customer_email || "No email"}</p>
                      <p className="text-neutral-700 font-mono text-[11px]">{order.customer_phone || "No phone"}</p>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Ship To</p>
                      <p className="font-medium text-black">
                        {shipLine1 || <span className="text-amber-700 font-semibold italic">Missing Street Address</span>}
                        {shipLine2 ? `, ${shipLine2}` : ""}
                      </p>
                      <p className="font-medium text-black">
                        {[shipCity, shipState].filter(Boolean).join(", ")}
                        {shipPostcode ? ` ${shipPostcode}` : <span className="text-amber-700 font-semibold italic"> (No Postcode)</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{shipCountry}</p>
                    </div>

                    {/* Billing Address (only shown when distinctly different from shipping) */}
                    {hasDistinctBilling && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Bill To</p>
                        <p className="font-medium text-black">{billLine1}</p>
                        <p className="font-medium text-black">{[billCity, order.billing_state || billing.state, order.billing_postcode || billing.postcode].filter(Boolean).join(", ")}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Order Items Breakdown ── */}
                  <div className="bg-neutral-50/80 border border-neutral-200 p-4 space-y-2.5">
                    <p className="text-xs tracking-[0.1em] uppercase text-black font-bold">Order Items</p>
                    {(!orderItems[order.id] || orderItems[order.id].length === 0) ? (
                      <p className="text-sm text-black italic">
                        {order.product_summary || "1x Scalvea Hair Growth Formulation"}
                      </p>
                    ) : (
                      orderItems[order.id].map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm font-semibold text-black">
                          <span>{item.product_name} <span className="font-bold text-neutral-600 ml-1.5">× {item.quantity}</span></span>
                          <span className="font-mono text-black">{fmt(Number(item.price * item.quantity))}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ── Footer Row: Status dropdown + Invoice + Manual Edit ── */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-xs uppercase font-mono font-semibold text-black flex-wrap">
                      <span className="bg-neutral-200 text-black px-2.5 py-1 font-semibold">{isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}</span>
                      {order.stripe_session_id && (
                        <span className="bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-1 truncate max-w-[200px]" title={order.stripe_session_id}>
                          Stripe: {order.stripe_session_id}
                        </span>
                      )}
                      {order.shiprocket_order_id && (
                        <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 truncate max-w-[200px]" title={order.shiprocket_order_id}>
                          SR: {order.shiprocket_order_id}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Status select */}
                      <select
                        value={order.order_status}
                        onChange={e => updateStatus(order.id, e.target.value, order.order_status)}
                        className={`h-10 text-xs tracking-wider uppercase bg-white border px-3 py-1 outline-none cursor-pointer font-semibold shadow-xs ${
                          ["delivered","hand_delivered","store_pickup","completed"].includes(order.order_status) ? "border-green-600 text-green-700" :
                          ["cancelled","refunded"].includes(order.order_status) ? "border-red-600 text-red-600" :
                          "border-neutral-300 text-black"
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>

                      {/* Download Invoice */}
                      <Button
                        onClick={async () => {
                          try {
                            const { generateInvoicePDF } = await import("@/utils/generateInvoicePDF");
                            await generateInvoicePDF({
                              ...order,
                              order_items: (orderItems[order.id]?.length ? orderItems[order.id] : order.order_items) || [],
                            });
                          } catch (err: any) {
                            console.error("Failed to generate invoice PDF:", err);
                          }
                        }}
                        variant="outline"
                        className="h-10 px-3.5 text-xs font-semibold tracking-wider uppercase border-black text-black hover:bg-black hover:text-white transition-all shadow-xs flex items-center gap-2"
                      >
                        <Download className="h-3.5 w-3.5" /> Invoice
                      </Button>

                      {/* Manual Order Edit/Cancel */}
                      {isManual && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-amber-900 hover:text-amber-950 font-semibold border border-amber-300 px-3 py-2 bg-amber-50 hover:bg-amber-100 transition-colors h-10"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          {isCancellable && (
                            <button
                              onClick={() => setCancelOrder(order)}
                              disabled={cancelling}
                              className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-red-700 hover:text-red-900 font-semibold border border-red-300 px-3 py-2 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 h-10"
                            >
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination Controls ── */}
        {sorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalRecords}</strong> orders
              </span>
              <span className="text-muted-foreground/60">|</span>
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-7 text-xs border border-border bg-transparent px-2"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPageSafe <= 1}
                variant="outline"
                className="h-8 px-2.5 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>

              <span className="px-3 font-medium">
                Page {currentPageSafe} of {totalPages}
              </span>

              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPageSafe >= totalPages}
                variant="outline"
                className="h-8 px-2.5 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrders;
