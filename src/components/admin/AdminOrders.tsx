import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, PenLine, Pencil, Search, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminManualOrder from "./AdminManualOrder";

/* ─── Types ─── */
type OrderSource = "All" | "Online" | "Manual" | "Drafts";

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
    const prevStatus = order.order_status;

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

    if (form.order_status !== prevStatus) {
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        previous_status: prevStatus,
        new_status: form.order_status,
        changed_by: "Admin (Edit)",
      } as any);
    }

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
            className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.08em] uppercase"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={onClose} className="h-11 text-xs tracking-[0.08em] uppercase px-6">
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
        <Button onClick={onConfirm} className="flex-1 h-10 text-xs uppercase tracking-wide bg-red-600 hover:bg-red-700 text-white">
          Cancel Order & Restore Stock
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-xs uppercase tracking-wide">Keep Order</Button>
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
    const { data } = await supabase
      .from("orders")
      .select("*, shiprocket_orders(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
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
    if (!orderItems[orderId]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    }
    setExpandedOrder(orderId);
  };

  const updateStatus = async (id: string, status: string, prevStatus: string) => {
    if (status === prevStatus) return;
    await supabase.from("orders").update({ order_status: status } as any).eq("id", id);
    await supabase.from("order_status_history").insert({
      order_id: id, previous_status: prevStatus, new_status: status, changed_by: "Admin"
    } as any);
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
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        previous_status: order.order_status,
        new_status: "cancelled",
        changed_by: "Admin (Cancellation)",
      } as any);

      toast({ title: `Order ${order.order_number} cancelled`, description: "Inventory restored successfully." });
      setCancelOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Cancellation failed", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  }, [orderItems]);

  /* ── Filters + Search (item 7) ── */
  const filtered = orders
    .filter(o => o.country === "India" || o.country === "Australia")
    .filter(o => countryFilter === "All" || o.country === countryFilter)
    .filter(o => {
      if (sourceFilter === "Drafts") return o.order_status === "draft";
      if (o.order_status === "draft") return false; // Hide drafts from other tabs
      
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
            {(["All", "Online", "Manual", "Drafts"] as OrderSource[]).map(s => (
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
            {filtered.map((order) => {
              const addr     = order.shipping_address as any;
              const billing  = order.billing_address  as any;
              const isExpanded = expandedOrder === order.id;
              const isIndia  = order.country?.toLowerCase() === "india";
              const isManual = order.order_source === "MANUAL";
              const isCancellable = !LOCKED_STATUSES.has(order.order_status);
              const fmt      = (v: number) => isIndia
                ? `₹${Math.round(v || 0).toLocaleString("en-IN")}`
                : `A$${Number(v || 0).toFixed(2)}`;
              const srMapping  = order.shiprocket_orders as any;
              const srPayments: any[] = order.shiprocket_payments || [];
              /* Admin name display (item 1) */
              const adminDisplay = order.created_by_admin
                ? (adminNames[order.created_by_admin] || adminNameCache.current[order.created_by_admin] || order.created_by_admin.slice(0, 8) + "…")
                : null;

              return (
                <div
                  key={order.id}
                  className={`border p-4 space-y-3 bg-background ${isManual ? "border-amber-300" : "border-border"}`}
                >
                  {/* ── Header row ── */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => loadOrderItems(order.id)} className="text-sm font-medium hover:underline">
                          {order.order_number}
                        </button>
                        {isManual && (
                          <span className="inline-flex items-center gap-1 text-[9px] tracking-wider uppercase font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5">
                            <PenLine className="h-2.5 w-2.5" /> Manual
                          </span>
                        )}
                        {order.sales_channel && order.sales_channel !== "WEBSITE" && (
                          <span className="text-[9px] tracking-wider uppercase bg-secondary text-muted-foreground border border-border px-2 py-0.5">
                            {order.sales_channel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium">{fmt(Number(order.total_amount))}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                        {order.market || (isIndia ? "IN" : "AU")} | {order.payment_provider || order.payment_method} | {order.order_status} | {order.payment_status} | {order.currency}
                      </p>
                    </div>
                  </div>

                  {/* ── Inline items (expanded) ── */}
                  {isExpanded && orderItems[order.id] && (
                    <div className="bg-secondary/50 border border-border/40 p-3 space-y-2">
                      <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Order Items</p>
                      {orderItems[order.id].length === 0
                        ? <p className="text-xs text-muted-foreground italic">No items stored.</p>
                        : orderItems[order.id].map((item: any) => (
                            <div key={item.id} className="flex justify-between text-xs font-light">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>{fmt(Number(item.price * item.quantity))}</span>
                            </div>
                          ))
                      }
                    </div>
                  )}

                  {/* ── Customer + address row ── */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="text-xs text-muted-foreground font-light space-y-1 flex-1">
                      <div>
                        <span className="font-medium text-foreground">Customer: </span>
                        {order.customer_name || `${addr?.firstName || addr?.first_name || ""} ${addr?.lastName || addr?.last_name || ""}`.trim()}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Contact: </span>
                        {order.customer_email || addr?.email} | Ph: {order.customer_phone || addr?.phone}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Ship To: </span>
                        {addr ? `${addr.address || addr.address_line1 || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.postcode || ""}, ${addr.country || ""}` : "—"}
                      </div>
                      {isIndia && billing && billing.address_line1 && billing.address_line1 !== (addr?.address_line1 || addr?.address) && (
                        <div>
                          <span className="font-medium text-foreground">Bill To: </span>
                          {`${billing.address_line1}, ${billing.city || ""}, ${billing.state || ""} ${billing.postcode || ""}`}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] uppercase font-mono mt-2 flex-wrap">
                        <span className="bg-secondary px-2 py-0.5">{isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}</span>
                        {isManual && order.delivery_method && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">{order.delivery_method.replace(/_/g, " ")}</span>
                        )}
                        {isManual && order.manual_payment_method && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">{order.manual_payment_method}</span>
                        )}
                        {order.stripe_session_id && (
                          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 truncate max-w-[150px]" title={order.stripe_session_id}>Stripe: {order.stripe_session_id}</span>
                        )}
                        {(order.fastrr_order_id || order.shiprocket_order_id) && (
                          <span className="bg-purple-50 text-purple-600 px-2 py-0.5 truncate max-w-[180px]" title={order.fastrr_order_id || order.shiprocket_order_id}>SR: {order.shiprocket_order_id || order.fastrr_order_id}</span>
                        )}
                      </div>
                    </div>

                    {/* Status select + action buttons */}
                    <div className="flex flex-col gap-2 items-end">
                      <select
                        value={order.order_status}
                        onChange={e => updateStatus(order.id, e.target.value, order.order_status)}
                        className={`text-xs tracking-[0.08em] uppercase bg-transparent border px-2 py-1 outline-none ${
                          ["delivered","hand_delivered","store_pickup","completed"].includes(order.order_status) ? "border-green-500 text-green-600 font-medium" :
                          ["cancelled","refunded"].includes(order.order_status) ? "border-red-500 text-red-500 font-medium" :
                          "border-border"
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>

                      {/* Edit / Cancel buttons — only for manual orders (item 2, 3) */}
                      {isManual && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingOrder(order)}
                            className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-700 hover:text-amber-900 border border-amber-300 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 transition-colors"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          {isCancellable && (
                            <button
                              onClick={() => setCancelOrder(order)}
                              disabled={cancelling}
                              className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-red-600 hover:text-red-800 border border-red-300 px-2.5 py-1 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Financials row ── */}
                  <div className="text-[10px] text-muted-foreground border-t border-border/20 pt-2 flex flex-wrap gap-4 font-mono">
                    <span>Subtotal: {fmt(Number(order.subtotal))}</span>
                    {Number(order.gst_amount || order.tax_amount) > 0 && <span>GST: {fmt(Number(order.gst_amount || order.tax_amount))}</span>}
                    <span>Shipping: {fmt(Number(order.shipping_amount))}</span>
                    {Number(order.cod_charges) > 0 && <span>COD: {fmt(Number(order.cod_charges))}</span>}
                    {Number(order.discount_amount) > 0 && <span>Discount: -{fmt(Number(order.discount_amount))}</span>}
                    {order.coupon_code && <span>Coupon: {order.coupon_code}</span>}
                  </div>

                  {/* ── Expanded detail section ── */}
                  {isExpanded && (
                    <div className="border-t border-border/40 pt-3 mt-3 space-y-4">
                      {/* Tracking */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Courier</p>
                          <p>{srMapping?.courier_name || order.courier_name || order.courier || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Tracking ID</p>
                          <p>{srMapping?.tracking_id || order.tracking_number || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">AWB / Shipment</p>
                          <p>{order.awb || order.shipment_id || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Invoice</p>
                          <p>{order.invoice_number || "—"}</p>
                        </div>
                      </div>

                      {/* Manual order audit panel (item 1 — shows admin name) */}
                      {isManual && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono border border-amber-200 bg-amber-50/40 p-3">
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Order Source</p>
                            <p className="text-amber-800 font-semibold">Manual</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Sales Channel</p>
                            <p>{order.sales_channel || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Delivery Method</p>
                            <p>{(order.delivery_method || "—").replace(/_/g, " ")}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Payment Method</p>
                            <p>{order.manual_payment_method || "—"}</p>
                          </div>
                          {order.courier_name && (
                            <div>
                              <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Courier Name</p>
                              <p>{order.courier_name}</p>
                            </div>
                          )}
                          {/* item 1: resolved admin name */}
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Created By</p>
                            <p className="font-medium">{adminDisplay || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-amber-600 tracking-widest mb-1">Created At</p>
                            <p>{order.admin_created_at ? new Date(order.admin_created_at).toLocaleString() : "—"}</p>
                          </div>
                        </div>
                      )}

                      {/* India-specific details */}
                      {isIndia && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono border-t border-border/10 pt-3">
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">EDD</p>
                            <p>{order.edd_date || order.delivery_estimate || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">RTO Risk</p>
                            <p className={order.rto_prediction === "high" ? "text-red-500 font-medium" : ""}>{order.rto_prediction || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Shipping Plan</p>
                            <p>{order.shipping_plan || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Cart ID</p>
                            <p className="truncate">{order.cart_id || "—"}</p>
                          </div>
                          {order.platform_order_id && (
                            <div>
                              <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Platform Order ID</p>
                              <p>{order.platform_order_id}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment details for India */}
                      {isIndia && srPayments.length > 0 && (
                        <div className="border-t border-border/10 pt-3">
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-2">Payment Transactions</p>
                          <div className="space-y-1">
                            {srPayments.map((pmt: any, i: number) => (
                              <div key={i} className="flex flex-wrap gap-3 text-[10px] font-mono bg-secondary/30 px-2 py-1">
                                <span className="text-foreground font-medium">{(pmt.payment_method || "").replace("shiprocket_", "").toUpperCase() || "N/A"}</span>
                                <span>{fmt(Number(pmt.amount || 0))}</span>
                                {pmt.gateway && <span className="text-muted-foreground">{pmt.gateway}</span>}
                                {pmt.pg_transaction_id && <span className="text-muted-foreground">PG: {pmt.pg_transaction_id}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin notes */}
                      <div className="border-t border-border/10 pt-2">
                        <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Admin Notes</p>
                        <p className="text-xs italic text-muted-foreground">{order.admin_notes || "No notes."}</p>
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
