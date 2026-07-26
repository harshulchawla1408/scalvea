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
    const { data } = await supabase
      .from("orders")
      .select("*, shiprocket_orders(*)")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

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
    toast({ title: `Order status updated to ${status}` });
    fetchOrders();
  };

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
            const addr     = order.shipping_address as any;
            const billing  = order.billing_address  as any;
            const isExpanded = expandedOrder === order.id;
            const isIndia  = order.country?.toLowerCase() === "india";
            const fmt      = (v: number) => isIndia
              ? `₹${Math.round(v || 0).toLocaleString("en-IN")}`
              : `A$${Number(v || 0).toFixed(2)}`;
            const srMapping = order.shiprocket_orders as any;
            const srPayments: any[] = order.shiprocket_payments || [];

            return (
              <div key={order.id} className="border border-border p-4 space-y-3 bg-background">
                {/* ── Header row ── */}
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => loadOrderItems(order.id)} className="text-sm font-medium hover:underline">{order.order_number}</button>
                    <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{fmt(Number(order.total_amount))}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                      {order.market || (isIndia ? "IN" : "AU")} | {order.payment_provider || order.payment_method} | {order.order_status} | {order.payment_status} | {order.currency}
                    </p>
                  </div>
                </div>

                {/* ── Items ── */}
                {isExpanded && orderItems[order.id] && (
                  <div className="bg-secondary/50 border border-border/40 p-3 space-y-2">
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Order Items</p>
                    {orderItems[order.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No items stored yet.</p>
                    ) : orderItems[order.id].map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs font-light">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{fmt(Number(item.price * item.quantity))}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Customer + address row ── */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2">
                  <div className="text-xs text-muted-foreground font-light space-y-1">
                    <div>
                      <span className="font-medium text-foreground">Customer:</span>{" "}
                      {order.customer_name || `${addr?.firstName || addr?.first_name || ""} ${addr?.lastName || addr?.last_name || ""}`.trim()}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Contact:</span>{" "}
                      {order.customer_email || addr?.email} | Ph: {order.customer_phone || addr?.phone}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Ship To:</span>{" "}
                      {addr ? `${addr.address || addr.address_line1 || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.postcode || ""}, ${addr.country || ""}` : "—"}
                    </div>
                    {isIndia && billing && billing.address_line1 && billing.address_line1 !== (addr?.address_line1 || addr?.address) && (
                      <div>
                        <span className="font-medium text-foreground">Bill To:</span>{" "}
                        {`${billing.address_line1}, ${billing.city || ""}, ${billing.state || ""} ${billing.postcode || ""}`}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono mt-2 flex-wrap">
                      <span className="bg-secondary px-2 py-0.5 rounded text-foreground">
                        {isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}
                      </span>
                      {order.stripe_session_id && (
                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded truncate max-w-[150px]" title={order.stripe_session_id}>
                          Stripe: {order.stripe_session_id}
                        </span>
                      )}
                      {(order.fastrr_order_id || order.shiprocket_order_id) && (
                        <span className="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-0.5 rounded truncate max-w-[180px]" title={order.fastrr_order_id || order.shiprocket_order_id}>
                          SR: {order.shiprocket_order_id || order.fastrr_order_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <select
                    value={order.order_status}
                    onChange={(e) => updateStatus(order.id, e.target.value, order.order_status)}
                    className={`text-xs tracking-[0.08em] uppercase bg-transparent border px-2 py-1 outline-none ${
                      order.order_status === "delivered" ? "border-green-500 text-green-600 font-medium" :
                      order.order_status === "cancelled" ? "border-red-500 text-red-500 font-medium" :
                      "border-border"
                    }`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
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
                        <p>{srMapping?.courier_name || order.courier || "—"}</p>
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
                        <div>
                          <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Fastrr Order ID</p>
                          <p className="truncate">{order.fastrr_order_id || "—"}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment details for India */}
                    {isIndia && srPayments.length > 0 && (
                      <div className="border-t border-border/10 pt-3">
                        <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-2">Payment Transactions</p>
                        <div className="space-y-1">
                          {srPayments.map((pmt: any, i: number) => (
                            <div key={i} className="flex flex-wrap gap-3 text-[10px] font-mono bg-secondary/30 px-2 py-1 rounded">
                              <span className="text-foreground font-medium">{(pmt.payment_method || "").replace("shiprocket_","").toUpperCase() || "N/A"}</span>
                              <span>{fmt(Number(pmt.amount || 0))}</span>
                              {pmt.amount_received != null && <span>Rcvd: {fmt(Number(pmt.amount_received))}</span>}
                              {pmt.gateway && <span className="text-muted-foreground">{pmt.gateway}</span>}
                              {pmt.pg_transaction_id && <span className="text-muted-foreground">PG: {pmt.pg_transaction_id}</span>}
                              {pmt.txn_id && <span className="text-muted-foreground">TXN: {pmt.txn_id}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coupon / discount detail */}
                    {isIndia && (order.coupon_codes?.length > 0 || order.discount_detail) && (
                      <div className="border-t border-border/10 pt-3 grid grid-cols-2 gap-3 text-xs font-mono">
                        {order.coupon_codes?.length > 0 && (
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Coupon Codes</p>
                            <p>{Array.isArray(order.coupon_codes) ? order.coupon_codes.join(", ") : order.coupon_codes}</p>
                          </div>
                        )}
                        {order.discount_detail && (
                          <div>
                            <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Discount Detail</p>
                            <p className="text-[10px] break-all">{JSON.stringify(order.discount_detail)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {isIndia && Array.isArray(order.order_tags) && order.order_tags.length > 0 && (
                      <div className="border-t border-border/10 pt-2 text-xs font-mono">
                        <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {order.order_tags.map((tag: string, i: number) => (
                            <span key={i} className="bg-secondary text-foreground px-2 py-0.5 rounded text-[10px]">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin notes */}
                    <div className="border-t border-border/10 pt-2">
                      <p className="text-[9px] uppercase text-muted-foreground tracking-widest mb-1">Admin Notes</p>
                      <p className="text-xs italic">{order.admin_notes || "No notes."}</p>
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
