import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, PenLine, Pencil, Search, X, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminManualOrder from "./AdminManualOrder";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";

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
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Manual Order</p>
            <h2 className="text-sm font-medium mt-0.5 flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5" /> Edit {order.order_number}
            </h2>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
        </div>

        {isLocked && (
          <div className="px-6 py-3 bg-muted text-xs text-muted-foreground border-b border-border flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
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
              className="h-10 text-sm"
            />
          </div>

          {/* Admin Notes */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Admin Notes</label>
            <Textarea
              value={form.admin_notes}
              onChange={e => setForm(p => ({ ...p, admin_notes: e.target.value }))}
              placeholder="Internal notes…"
              className="text-sm min-h-[80px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex gap-3 flex-shrink-0">
          <Button
            onClick={save}
            disabled={saving}
            className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium tracking-[0.06em] uppercase"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose} className="h-11 text-sm font-medium tracking-[0.06em] uppercase px-6">
            Cancel
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
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
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<OrderSource>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [cancelOrder, setCancelOrder] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  /* Admin name cache: UUID → display name (item 1) */
  const adminNameCache = useRef<Record<string, string>>({});
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setLoading(true);

    // Step 1: Fetch all orders (simple query, no nested join)
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[AdminOrders] Failed to fetch orders:", ordersError.message, ordersError.code);
      toast({ title: "Failed to load orders", description: ordersError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const fetchedOrders = ordersData || [];
    console.log("[AdminOrders] Fetched orders:", fetchedOrders.length);

    // Step 2: Fetch ALL order_items in one query and bucket by order_id
    const { data: allItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*");

    console.log("[AdminOrders] order_items fetch — count:", allItems?.length ?? 0, "| error:", itemsError?.message ?? "none");

    // Merge items into orders as order_items[] array
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
    // Pre-populate the orderItems cache (only for orders that actually have items)
    setOrderItems(itemsByOrder);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  /* ── Resolve admin UUIDs to names (item 1) ── */
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

  const loadOrderItems = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    // Always re-fetch if no items are cached OR if cached array is empty
    // (empty could mean items exist but the bulk fetch was blocked by RLS)
    const cached = orderItems[orderId];
    if (!cached || cached.length === 0) {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      if (error) {
        console.error("[AdminOrders] loadOrderItems error for", orderId, ":", error.message);
      } else {
        console.log("[AdminOrders] loadOrderItems for", orderId, "→", data?.length ?? 0, "items");
      }
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    }
    setExpandedOrder(orderId);
  };

  const updateStatus = async (id: string, status: string, prevStatus: string) => {
    if (status === prevStatus) return;
    await supabase.from("orders").update({ order_status: status } as any).eq("id", id);
    toast({ title: `Status → ${status}` });
    fetchOrders();
  };

  /* ── Cancel + Inventory Restore (item 3) ── */
  const handleCancelOrder = useCallback(async (order: any) => {
    setCancelling(true);
    try {
      const isIndia = order.country === "India";

      /* Load items if not cached */
      let items = orderItems[order.id];
      if (!items) {
        const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
        items = data || [];
        setOrderItems(prev => ({ ...prev, [order.id]: items }));
      }

      /* Restore inventory for each item */
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

      /* Update order status */
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

  /* ── Filters + Search ── */
  const filtered = orders
    .filter(o => countryFilter === "All" || o.country === countryFilter || (!o.country && countryFilter === "Australia"))
    .filter(o => {
      // No draft orders exist in the new flow — all orders are real confirmed orders.
      // Just filter by source (All, Online, Manual).
      if (sourceFilter === "All") return true;
      if (sourceFilter === "Manual") return o.order_source === "MANUAL";
      return !o.order_source || o.order_source === "ONLINE";
    })
    .filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesOrder =
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_email || "").toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q);
      if (matchesOrder) return true;
      // Also search within loaded order_items (product names)
      const items = orderItems[o.id] || [];
      return items.some((item: any) => (item.product_name || "").toLowerCase().includes(q));
    });

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

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
        {/* ── Top row: title + prominent Create button ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} orders</p>
          <button
            id="admin-create-manual-order-btn"
            onClick={() => setShowManualOrder(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.1em] bg-foreground text-background hover:bg-foreground/90 transition-colors font-semibold"
          >
            <Plus className="h-4 w-4" />
            + Create Manual Order
          </button>
        </div>

        {/* ── Bottom row: search + filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search name, email, order #, product…"
              className="w-full h-9 pl-9 pr-4 text-xs bg-transparent border border-border outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="h-9 text-xs tracking-[0.08em] uppercase bg-transparent border border-border px-3 outline-none"
          >
            {["All", "Australia", "India"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Source filter */}
          <div className="flex border border-border h-9">
            {(["All", "Online", "Manual"] as OrderSource[]).map(s => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`px-3 h-full text-[10px] uppercase tracking-[0.08em] border-r last:border-r-0 border-border transition-colors ${
                  sourceFilter === s ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {searchQuery ? `No orders matching "${searchQuery}"` : "No orders found."}
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, index) => {
              const addr     = order.shipping_address as any;
              const billing  = order.billing_address  as any;
              const isExpanded = expandedOrder === order.id;
              const isIndia  = order.country?.toLowerCase() === "india";
              const isManual = order.order_source === "MANUAL";
              const isCancellable = !LOCKED_STATUSES.has(order.order_status);
              const fmt      = (v: number) => isIndia
                ? `₹${Math.round(v || 0).toLocaleString("en-IN")}`
                : `A$${Number(v || 0).toFixed(2)}`;
              /* Admin name display (item 1) */
              const adminDisplay = order.created_by_admin
                ? (adminNames[order.created_by_admin] || adminNameCache.current[order.created_by_admin] || order.created_by_admin.slice(0, 8) + "…")
                : null;

              return (
                <div
                  key={order.id}
                  className={`border p-5 space-y-4 shadow-sm ${index % 2 === 1 ? "bg-muted/30" : "bg-background"} ${isManual ? "border-amber-300" : "border-neutral-200"}`}
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
                      </div>
                      <p className="text-sm font-semibold text-black mt-1">
                        {new Date(order.created_at).toLocaleString("en-US", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-mono font-bold text-black">{fmt(Number(order.total_amount))}</p>
                      <p className="text-xs font-semibold text-black uppercase font-mono mt-1">
                        {order.market || (isIndia ? "IN" : "AU")} | {order.payment_provider || order.payment_method} | {order.order_status} | {order.payment_status} | {order.currency}
                      </p>
                    </div>
                  </div>

                  {/* ── Inline items: Complete black font color and larger ── */}
                  {orderItems[order.id] && (
                    <div className="bg-neutral-50/80 border border-neutral-200 p-4 space-y-2.5">
                      <p className="text-xs tracking-[0.1em] uppercase text-black font-bold">Order Items</p>
                      {orderItems[order.id].length === 0
                        ? <p className="text-sm text-black italic">No items stored.</p>
                        : orderItems[order.id].map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-sm sm:text-base font-semibold text-black">
                              <span>{item.product_name} <span className="font-bold text-neutral-600 ml-1.5">× {item.quantity}</span></span>
                              <span className="font-mono text-black">{fmt(Number(item.price * item.quantity))}</span>
                            </div>
                          ))
                      }
                    </div>
                  )}

                  {/* ── Customer + address row + Action buttons (Status + Download Invoice) ── */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 py-1">
                    <div className="text-sm sm:text-[15px] text-black font-normal space-y-2 flex-1 leading-relaxed">
                      <div>
                        <span className="font-bold text-black">Customer: </span>
                        <span className="text-black font-semibold">{order.customer_name || `${addr?.firstName || addr?.first_name || ""} ${addr?.lastName || addr?.last_name || ""}`.trim() || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-black">Contact: </span>
                        <span className="text-black font-medium">{order.customer_email || addr?.email || "—"} | Ph: {order.customer_phone || addr?.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-black">Ship To: </span>
                        <span className="text-black font-medium">{addr ? `${addr.address || addr.address_line1 || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.postcode || ""}, ${addr.country || ""}` : "—"}</span>
                      </div>
                      {isIndia && billing && billing.address_line1 && billing.address_line1 !== (addr?.address_line1 || addr?.address) && (
                        <div>
                          <span className="font-bold text-black">Bill To: </span>
                          <span className="text-black font-medium">{`${billing.address_line1}, ${billing.city || ""}, ${billing.state || ""} ${billing.postcode || ""}`}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs uppercase font-mono mt-3 flex-wrap font-semibold text-black">
                        <span className="bg-neutral-200 text-black px-2.5 py-1 font-semibold">{isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}</span>
                        {isManual && order.delivery_method && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 font-semibold">{order.delivery_method.replace(/_/g, " ")}</span>
                        )}
                        {isManual && order.manual_payment_method && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 font-semibold">{order.manual_payment_method}</span>
                        )}
                        {order.stripe_session_id && (
                          <span className="bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-1 truncate max-w-[220px] font-semibold" title={order.stripe_session_id}>Stripe: {order.stripe_session_id}</span>
                        )}
                        {(order.fastrr_order_id || order.shiprocket_order_id) && (
                          <span className="bg-purple-100 text-purple-900 border border-purple-200 px-2.5 py-1 truncate max-w-[220px] font-semibold" title={order.fastrr_order_id || order.shiprocket_order_id}>SR: {order.shiprocket_order_id || order.fastrr_order_id}</span>
                        )}
                      </div>
                    </div>

                    {/* Status select + Action buttons (Download Invoice placed cleanly here) */}
                    <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
                      <select
                        value={order.order_status}
                        onChange={e => updateStatus(order.id, e.target.value, order.order_status)}
                        className={`h-11 text-xs sm:text-sm tracking-[0.08em] uppercase bg-white border px-3.5 py-1 outline-none cursor-pointer font-semibold shadow-sm ${
                          ["delivered","hand_delivered","store_pickup","completed"].includes(order.order_status) ? "border-green-600 text-green-700" :
                          ["cancelled","refunded"].includes(order.order_status) ? "border-red-600 text-red-600" :
                          "border-neutral-300 text-black"
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>

                      <Button
                        onClick={() => generateInvoicePDF({
                          ...order,
                          order_items: (orderItems[order.id]?.length ? orderItems[order.id] : order.order_items) || [],
                        })}
                        variant="outline"
                        className="h-11 px-4 text-xs sm:text-sm font-semibold tracking-[0.06em] uppercase border-black text-black hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" /> Download Invoice
                      </Button>

                      {/* Edit / Cancel buttons — only for manual orders */}
                      {isManual && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-amber-900 hover:text-amber-950 font-semibold border border-amber-300 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 transition-colors h-11"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          {isCancellable && (
                            <button
                              onClick={() => setCancelOrder(order)}
                              disabled={cancelling}
                              className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-red-700 hover:text-red-900 font-semibold border border-red-300 px-3.5 py-2 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 h-11"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Financials row: Bold black text and clear spacing ── */}
                  <div className="text-xs sm:text-sm text-black border-t border-neutral-200 pt-3 flex flex-wrap gap-5 font-mono font-medium">
                    <span><strong className="text-black font-bold">Subtotal:</strong> {fmt(Number(order.subtotal))}</span>
                    {Number(order.gst_amount || order.tax_amount) > 0 && <span><strong className="text-black font-bold">GST:</strong> {fmt(Number(order.gst_amount || order.tax_amount))}</span>}
                    <span><strong className="text-black font-bold">Shipping:</strong> {fmt(Number(order.shipping_amount))}</span>
                    {Number(order.cod_charges) > 0 && <span><strong className="text-black font-bold">COD:</strong> {fmt(Number(order.cod_charges))}</span>}
                    {Number(order.discount_amount) > 0 && <span className="text-emerald-700 font-semibold"><strong className="font-bold">Discount:</strong> -{fmt(Number(order.discount_amount))}</span>}
                    {order.coupon_code && <span><strong className="text-black font-bold">Coupon:</strong> {order.coupon_code}</span>}
                  </div>

                  {/* ── Manual order audit panel (only if manual) ── */}
                  {isManual && (
                    <div className="border-t border-neutral-200 pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono border border-amber-200 bg-amber-50/40 p-3.5">
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Order Source</p>
                          <p className="text-black font-semibold">Manual</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Sales Channel</p>
                          <p className="text-black font-medium">{order.sales_channel || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Delivery Method</p>
                          <p className="text-black font-medium">{(order.delivery_method || "—").replace(/_/g, " ")}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Payment Method</p>
                          <p className="text-black font-medium">{order.manual_payment_method || "—"}</p>
                        </div>
                        {order.courier_name && (
                          <div>
                            <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Courier Name</p>
                            <p className="text-black font-medium">{order.courier_name}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Created By</p>
                          <p className="text-black font-semibold">{adminDisplay || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-amber-800 tracking-wider mb-1 font-bold">Created At</p>
                          <p className="text-black font-medium">{order.admin_created_at ? new Date(order.admin_created_at).toLocaleString() : "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── India-specific shipping details (only if India and present) ── */}
                  {isIndia && (order.edd_date || order.rto_prediction || order.shipping_plan || order.cart_id || order.platform_order_id) && (
                    <div className="border-t border-neutral-200 pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-black">
                        {order.edd_date && (
                          <div>
                            <p className="text-[10px] uppercase text-neutral-600 tracking-wider mb-1 font-bold">EDD</p>
                            <p className="text-black font-semibold">{order.edd_date || order.delivery_estimate}</p>
                          </div>
                        )}
                        {order.rto_prediction && (
                          <div>
                            <p className="text-[10px] uppercase text-neutral-600 tracking-wider mb-1 font-bold">RTO Risk</p>
                            <p className={`font-semibold ${order.rto_prediction === "high" ? "text-red-600 font-bold" : "text-black"}`}>{order.rto_prediction}</p>
                          </div>
                        )}
                        {order.shipping_plan && (
                          <div>
                            <p className="text-[10px] uppercase text-neutral-600 tracking-wider mb-1 font-bold">Shipping Plan</p>
                            <p className="text-black font-semibold">{order.shipping_plan}</p>
                          </div>
                        )}
                        {order.cart_id && (
                          <div>
                            <p className="text-[10px] uppercase text-neutral-600 tracking-wider mb-1 font-bold">Cart ID</p>
                            <p className="truncate text-black font-medium">{order.cart_id}</p>
                          </div>
                        )}
                        {order.platform_order_id && (
                          <div>
                            <p className="text-[10px] uppercase text-neutral-600 tracking-wider mb-1 font-bold">Platform Order ID</p>
                            <p className="text-black font-medium">{order.platform_order_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrders;
