import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    setExpandedOrder(orderId);
  };

  const updateStatus = async (id: string, status: string, prevStatus: string, orderCountry: string) => {
    await supabase.from("orders").update({ order_status: status } as any).eq("id", id);

    // Deduct country-specific inventory when order is delivered, unless Stripe order (which deducts at payment/webhook)
    if (status === "delivered" && prevStatus !== "delivered") {
      const { data: orderDetails } = await supabase.from("orders").select("payment_provider").eq("id", id).maybeSingle();
      if (orderDetails?.payment_provider !== "stripe" && orderDetails?.payment_provider !== "shiprocket") {
        const items = orderItems[id] || (await supabase.from("order_items").select("*").eq("order_id", id)).data || [];
        const isIndia = orderCountry?.toLowerCase() === "india";
        const stockField = isIndia ? "inventory_quantity" : "inventory_quantity_australia";

        for (const item of items) {
          if (!item.product_id) continue;
          const { data: product } = await supabase
            .from("products")
            .select(`id, ${stockField}`)
            .eq("id", item.product_id)
            .single();

          if (product) {
            const prevQty = (product as any)[stockField] ?? 0;
            const newQty = Math.max(0, prevQty - item.quantity);
            await supabase
              .from("products")
              .update({ [stockField]: newQty } as any)
              .eq("id", item.product_id);

            await supabase.from("inventory_logs").insert({
              product_id: item.product_id,
              change_amount: -(item.quantity),
              previous_quantity: prevQty,
              new_quantity: newQty,
              reason: `Order delivered (${id.slice(0, 8)}) - ${orderCountry.toUpperCase()}`,
            } as any);
          }
        }
      } else {
        console.log("Skipping inventory deduction on status change: Stripe/Shiprocket inventory already deducted by payment webhook.");
      }
    }

    toast({ title: `Order status updated to ${status}` });
    fetchOrders();
  };

  // Only support India and Australia filtering (plus All)
  const filtered = countryFilter === "All" 
    ? orders.filter(o => o.country === "India" || o.country === "Australia")
    : orders.filter(o => o.country === countryFilter);

  const countries = ["All", "Australia", "India"];

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} orders</p>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="text-xs tracking-[0.08em] uppercase bg-transparent border border-border px-3 py-2 outline-none">
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const addr = order.shipping_address as any;
            const isExpanded = expandedOrder === order.id;
            const isIndia = order.country?.toLowerCase() === "india";
            
            return (
              <div key={order.id} className="border border-border p-4 space-y-3 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => loadOrderItems(order.id)} className="text-sm font-medium hover:underline">{order.order_number}</button>
                    <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">
                      {isIndia ? "₹" : "A$"}{Number(order.total_amount).toLocaleString(isIndia ? "en-IN" : "en-AU")}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                      {order.market || (isIndia ? "IN" : "AU")} | {order.payment_provider || order.payment_method} | {order.order_status} | {order.payment_status} | {order.currency}
                    </p>
                  </div>
                </div>

                {isExpanded && orderItems[order.id] && (
                  <div className="bg-secondary/50 border border-border/40 p-3 space-y-2">
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Order Items</p>
                    {orderItems[order.id].map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs font-light">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{isIndia ? "₹" : "A$"}{Number(item.price * item.quantity).toLocaleString(isIndia ? "en-IN" : "en-AU")}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2">
                  <div className="text-xs text-muted-foreground font-light space-y-1">
                    <div>
                      <span className="font-medium text-foreground">Customer:</span> {order.customer_name || `${addr?.firstName || addr?.first_name || ""} ${addr?.lastName || addr?.last_name || ""}`}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Contact:</span> {order.customer_email || addr?.email} | Ph: {order.customer_phone || addr?.phone}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Address:</span> {addr ? `${addr.address || addr.address_line1}, ${addr.city}, ${addr.state} ${addr.postcode}, ${addr.country}` : "—"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono mt-2">
                      <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{order.market === "IN" ? "🇮🇳 India" : "🇦🇺 Australia"}</span>
                      {order.stripe_session_id && <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded truncate max-w-[150px]" title={order.stripe_session_id}>Stripe: {order.stripe_session_id}</span>}
                      {order.fastrr_order_id && <span className="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded truncate max-w-[150px]" title={order.fastrr_order_id}>Shiprocket: {order.fastrr_order_id}</span>}
                    </div>
                  </div>
                  <select
                    value={order.order_status}
                    onChange={(e) => updateStatus(order.id, e.target.value, order.order_status, order.country)}
                    className={`text-xs tracking-[0.08em] uppercase bg-transparent border px-2 py-1 outline-none ${
                      order.order_status === "delivered" ? "border-green-500 text-green-600 font-medium" :
                      order.order_status === "cancelled" ? "border-red-500 text-red-500 font-medium" :
                      "border-border"
                    }`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border/20 pt-2 flex gap-4 font-mono">
                  <span>Subtotal: {isIndia ? "₹" : "A$"}{Number(order.subtotal).toLocaleString(isIndia ? "en-IN" : "en-AU")}</span>
                  <span>Tax: {isIndia ? "₹" : "A$"}{Number(order.tax_amount).toLocaleString(isIndia ? "en-IN" : "en-AU")}</span>
                  <span>Shipping: {isIndia ? "₹" : "A$"}{Number(order.shipping_amount).toLocaleString(isIndia ? "en-IN" : "en-AU")}</span>
                </div>
                {isExpanded && (
                  <div className="border-t border-border/40 pt-3 mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Courier</p>
                      <p>{order.courier || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Tracking ID</p>
                      <p>{order.tracking_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">AWB / Shipment</p>
                      <p>{order.awb || order.shipment_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Invoice</p>
                      <p>{order.invoice_number || "—"}</p>
                    </div>
                    <div className="col-span-2 md:col-span-4 border-t border-border/10 pt-2 mt-1">
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Admin Notes</p>
                      <p className="italic">{order.admin_notes || "No notes."}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
