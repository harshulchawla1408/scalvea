import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const AdminInventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateId, setUpdateId] = useState<{ id: string; target: "india" | "australia" } | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    const { data: prods } = await supabase.from("products").select("id, name, inventory_quantity_india, inventory_quantity_australia, low_stock_threshold").order("name");
    setProducts(prods || []);
    const { data: logData } = await supabase.from("inventory_logs").select("*, products(name)").order("created_at", { ascending: false }).limit(25);
    setLogs(logData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async (productId: string, currentQty: number, target: "india" | "australia") => {
    const change = newQty - currentQty;
    const updatePayload = target === "india" 
      ? { inventory_quantity_india: newQty } 
      : { inventory_quantity_australia: newQty };
      
    const logReason = reason ? `${reason} (${target.toUpperCase()})` : `Manual update (${target.toUpperCase()})`;

    await supabase.from("products").update(updatePayload as any).eq("id", productId);
    await supabase.from("inventory_logs").insert({
      product_id: productId,
      change_amount: change,
      previous_quantity: currentQty,
      new_quantity: newQty,
      reason: logReason
    } as any);

    toast({ title: `Stock updated for ${target.toUpperCase()}` });
    setUpdateId(null);
    setNewQty(0);
    setReason("");
    fetchData();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  // Find products with low stock in either country
  const lowStockIndia = products.filter(p => (p.inventory_quantity_india ?? 0) < (p.low_stock_threshold || 10));
  const lowStockAustralia = products.filter(p => (p.inventory_quantity_australia ?? 0) < (p.low_stock_threshold || 10));
  const hasLowStock = lowStockIndia.length > 0 || lowStockAustralia.length > 0;

  return (
    <div className="space-y-8">
      {hasLowStock && (
        <div className="border border-red-200 bg-red-50/50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-xs tracking-[0.1em] uppercase text-red-600 font-semibold">Low Stock Alerts</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {lowStockAustralia.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground font-medium mb-1">🇦🇺 Australia Low Stock</p>
                {lowStockAustralia.map(p => (
                  <p key={`au-${p.id}`} className="text-red-700">{p.name}: {p.inventory_quantity_australia ?? 0} left</p>
                ))}
              </div>
            )}
            {lowStockIndia.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground font-medium mb-1">🇮🇳 India Low Stock</p>
                {lowStockIndia.map(p => (
                  <p key={`in-${p.id}`} className="text-red-700">{p.name}: {p.inventory_quantity_india ?? 0} left</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Stock Levels</h2>
        <div className="border border-border divide-y divide-border bg-background">
          {products.map((p) => {
            const isEditingIndia = updateId?.id === p.id && updateId.target === "india";
            const isEditingAustralia = updateId?.id === p.id && updateId.target === "australia";
            
            return (
              <div key={p.id} className="px-4 py-4 space-y-3">
                <p className="text-sm font-medium">{p.name}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Australia Stock Panel */}
                  <div className="border border-border/60 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">🇦🇺 Australia Stock</p>
                      <p className={`text-sm mt-1 font-mono font-medium ${(p.inventory_quantity_australia ?? 0) < (p.low_stock_threshold || 10) ? "text-red-500 font-bold" : ""}`}>
                        {p.inventory_quantity_australia ?? 0} {(p.inventory_quantity_australia ?? 0) < (p.low_stock_threshold || 10) && "⚠️"}
                      </p>
                    </div>
                    {isEditingAustralia ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 0)} className="w-16 h-8 px-2 text-xs border border-border bg-transparent outline-none" />
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-24 h-8 px-2 text-xs border border-border bg-transparent outline-none" />
                        <Button onClick={() => handleUpdate(p.id, p.inventory_quantity_australia ?? 0, "australia")} className="bg-foreground text-background h-8 px-3 text-[10px] uppercase tracking-[0.05em]">Save</Button>
                        <Button variant="outline" onClick={() => setUpdateId(null)} className="h-8 px-2 text-[10px] uppercase">Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => { setUpdateId({ id: p.id, target: "australia" }); setNewQty(p.inventory_quantity_australia ?? 0); }} className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground underline">Update</button>
                    )}
                  </div>

                  {/* India Stock Panel */}
                  <div className="border border-border/60 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">🇮🇳 India Stock</p>
                      <p className={`text-sm mt-1 font-mono font-medium ${(p.inventory_quantity_india ?? 0) < (p.low_stock_threshold || 10) ? "text-red-500 font-bold" : ""}`}>
                        {p.inventory_quantity_india ?? 0} {(p.inventory_quantity_india ?? 0) < (p.low_stock_threshold || 10) && "⚠️"}
                      </p>
                    </div>
                    {isEditingIndia ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 0)} className="w-16 h-8 px-2 text-xs border border-border bg-transparent outline-none" />
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-24 h-8 px-2 text-xs border border-border bg-transparent outline-none" />
                        <Button onClick={() => handleUpdate(p.id, p.inventory_quantity_india ?? 0, "india")} className="bg-foreground text-background h-8 px-3 text-[10px] uppercase tracking-[0.05em]">Save</Button>
                        <Button variant="outline" onClick={() => setUpdateId(null)} className="h-8 px-2 text-[10px] uppercase">Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => { setUpdateId({ id: p.id, target: "india" }); setNewQty(p.inventory_quantity_india ?? 0); }} className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground underline">Update</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs tracking-[0.15em] uppercase mb-4">Recent Inventory Changes</h2>
        {logs.length === 0 ? <p className="text-sm text-muted-foreground">No changes recorded.</p> : (
          <div className="border border-border divide-y divide-border bg-background">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-xs">{log.products?.name || "Unknown Product"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{log.reason} · {new Date(log.created_at).toLocaleString()}</p>
                </div>
                <p className={`text-xs font-mono font-semibold ${log.change_amount > 0 ? "text-green-600" : "text-red-600"}`}>
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
