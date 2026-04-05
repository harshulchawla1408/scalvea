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

  const updateStatus = async (id: string, status: string, prevStatus: string) => {
    await supabase.from("orders").update({ order_status: status } as any).eq("id", id);

    // Deduct inventory when order is delivered
    if (status === "delivered" && prevStatus !== "delivered") {
      const items = orderItems[id] || (await supabase.from("order_items").select("*").eq("order_id", id)).data || [];
      for (const item of items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase.from("products").select("inventory_quantity").eq("id", item.product_id).single();
        if (product) {
          const prevQty = product.inventory_quantity;
          const newQty = Math.max(0, prevQty - item.quantity);
          await supabase.from("products").update({ inventory_quantity: newQty } as any).eq("id", item.product_id);
          await supabase.from("inventory_logs").insert({
            product_id: item.product_id,
            change_amount: -(item.quantity),
            previous_quantity: prevQty,
            new_quantity: newQty,
            reason: `Order delivered (${id.slice(0, 8)})`,
          } as any);
        }
      }
    }

    // Restore inventory if cancelled from a non-cancelled/non-delivered state
    if (status === "cancelled" && prevStatus !== "cancelled" && prevStatus !== "delivered") {
      // No inventory was deducted before delivery, so nothing to restore
    }

    toast({ title: `Order status updated to ${status}` });
    fetchOrders();
  };

  const filtered = countryFilter === "All" ? orders : orders.filter(o => o.country === countryFilter);
  const countries = ["All", ...new Set(orders.map(o => o.country))];

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
            return (
              <div key={order.id} className="border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <button onClick={() => loadOrderItems(order.id)} className="text-sm font-medium hover:underline">{order.order_number}</button>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{order.currency === "INR" ? "₹" : "$"}{Number(order.total_amount).toFixed(2)} {order.currency}</p>
                    <p className="text-xs text-muted-foreground uppercase">{order.payment_status} · {order.payment_method}</p>
                  </div>
                </div>

                {isExpanded && orderItems[order.id] && (
                  <div className="bg-secondary p-3 space-y-2">
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Order Items</p>
                    {orderItems[order.id].map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.product_name} × {item.quantity}</span>
                        <span>{order.currency === "INR" ? "₹" : "$"}{Number(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {addr && <span>{addr.firstName} {addr.lastName}, {addr.city}, {addr.country}</span>}
                    <span className="ml-2">· {order.country}</span>
                  </div>
                  <select
                    value={order.order_status}
                    onChange={(e) => updateStatus(order.id, e.target.value, order.order_status)}
                    className={`text-xs tracking-[0.08em] uppercase bg-transparent border px-2 py-1 outline-none ${
                      order.order_status === "delivered" ? "border-green-500 text-green-600" :
                      order.order_status === "cancelled" ? "border-red-500 text-red-500" :
                      "border-border"
                    }`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="text-xs text-muted-foreground">
                  Subtotal: {order.currency === "INR" ? "₹" : "$"}{Number(order.subtotal).toFixed(2)} · Tax: {order.currency === "INR" ? "₹" : "$"}{Number(order.tax_amount).toFixed(2)} · Shipping: {order.currency === "INR" ? "₹" : "$"}{Number(order.shipping_amount).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
