import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const AdminCountrySettings = () => {
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ tax_percentage: 0, shipping_charge: 0, free_shipping_above: 0, delivery_time: "", is_enabled: true });

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("country_settings")
      .select("*")
      .in("country", ["India", "Australia"])
      .order("country");
    setCountries(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCountries(); }, []);

  const startEdit = (c: any) => {
    setEditId(c.id);
    setForm({ tax_percentage: Number(c.tax_percentage), shipping_charge: Number(c.shipping_charge), free_shipping_above: Number(c.free_shipping_above), delivery_time: c.delivery_time, is_enabled: c.is_enabled });
  };

  const handleSave = async () => {
    if (!editId) return;
    await supabase.from("country_settings").update(form as any).eq("id", editId);
    toast({ title: "Country settings updated" });
    setEditId(null);
    fetchCountries();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Manage tax, shipping, and delivery settings per country.</p>
      <div className="space-y-4">
        {countries.map((c) => (
          <div key={c.id} className="border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.country} ({c.currency_symbol} {c.currency})</p>
                {!c.is_enabled && <span className="text-[10px] text-red-500 uppercase">Disabled</span>}
              </div>
              {editId !== c.id && (
                <button onClick={() => startEdit(c)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">Edit</button>
              )}
            </div>

            {editId === c.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Tax %</label>
                    <input type="number" step="0.01" value={form.tax_percentage} onChange={(e) => setForm({ ...form, tax_percentage: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 text-sm border border-border bg-transparent outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Shipping</label>
                    <input type="number" step="0.01" value={form.shipping_charge} onChange={(e) => setForm({ ...form, shipping_charge: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 text-sm border border-border bg-transparent outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Free Above</label>
                    <input type="number" step="0.01" value={form.free_shipping_above} onChange={(e) => setForm({ ...form, free_shipping_above: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-3 text-sm border border-border bg-transparent outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Delivery Time</label>
                    <input value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} className="w-full h-9 px-3 text-sm border border-border bg-transparent outline-none" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="accent-foreground" /> Enabled</label>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9">Save</Button>
                  <Button variant="outline" onClick={() => setEditId(null)} className="text-xs h-9">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Tax: {Number(c.tax_percentage)}% · Shipping: {c.currency_symbol}{Number(c.shipping_charge).toFixed(2)} · Free above: {c.currency_symbol}{Number(c.free_shipping_above).toFixed(2)} · Delivery: {c.delivery_time}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCountrySettings;
