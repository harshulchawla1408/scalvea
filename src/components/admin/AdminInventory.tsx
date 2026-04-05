import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const AdminInventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    const { data: prods } = await supabase.from("products").select("id, name, inventory_quantity, low_stock_threshold").order("name");
    setProducts(prods || []);
    const { data: logData } = await supabase.from("inventory_logs").select("*, products(name)").order("created_at", { ascending: false }).limit(20);
    setLogs(logData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async (productId: string, currentQty: number) => {
    const change = newQty - currentQty;
    await supabase.from("products").update({ inventory_quantity: newQty } as any).eq("id", productId);
    await supabase.from("inventory_logs").insert({ product_id: productId, change_amount: change, previous_quantity: currentQty, new_quantity: newQty, reason: reason || "Manual update" } as any);
    toast({ title: "Stock updated" });
    setUpdateId(null);
    setNewQty(0);
    setReason("");
    fetchData();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const lowStock = products.filter(p => p.inventory_quantity < (p.low_stock_threshold || 10));

  return (
    <div className="space-y-8">
      {lowStock.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><p className="text-xs tracking-[0.1em] uppercase text-red-600">Low Stock Alerts</p></div>
          {lowStock.map(p => (
            <p key={p.id} className="text-sm text-red-700">{p.name}: {p.inventory_quantity} remaining</p>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Stock Levels</h2>
        <div className="border border-border divide-y divide-border">
          {products.map((p) => (
            <div key={p.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{p.name}</p>
                  <p className={`text-xs ${p.inventory_quantity < (p.low_stock_threshold || 10) ? "text-red-500" : "text-muted-foreground"}`}>
                    Stock: {p.inventory_quantity} {p.inventory_quantity < (p.low_stock_threshold || 10) && "⚠️"}
                  </p>
                </div>
                {updateId === p.id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 0)} className="w-20 h-8 px-2 text-sm border border-border bg-transparent outline-none" />
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-32 h-8 px-2 text-sm border border-border bg-transparent outline-none" />
                    <Button onClick={() => handleUpdate(p.id, p.inventory_quantity)} className="bg-foreground text-background h-8 text-xs">Save</Button>
                    <Button variant="outline" onClick={() => setUpdateId(null)} className="h-8 text-xs">Cancel</Button>
                  </div>
                ) : (
                  <button onClick={() => { setUpdateId(p.id); setNewQty(p.inventory_quantity); }} className="text-xs text-muted-foreground hover:text-foreground underline">Update</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Recent Inventory Changes</h2>
        {logs.length === 0 ? <p className="text-sm text-muted-foreground">No changes recorded.</p> : (
          <div className="border border-border divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-2 flex items-center justify-between text-sm">
                <div>
                  <p>{(log.products as any)?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{log.reason} · {new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <p className={`text-xs ${log.change_amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {log.change_amount > 0 ? "+" : ""}{log.change_amount} ({log.previous_quantity} → {log.new_quantity})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
