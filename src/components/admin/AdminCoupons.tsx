import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discount_percentage: 10, expires_at: "", max_usage: 0 });

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      discount_percentage: form.discount_percentage,
      expires_at: form.expires_at || null,
      max_usage: form.max_usage || null,
      is_active: true,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Coupon created" });
    setShowForm(false);
    setForm({ code: "", discount_percentage: 10, expires_at: "", max_usage: 0 });
    fetchCoupons();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ is_active: !active } as any).eq("id", id);
    toast({ title: active ? "Coupon deactivated" : "Coupon activated" });
    fetchCoupons();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{coupons.length} coupons</p>
        <Button onClick={() => setShowForm(!showForm)} className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.1em] uppercase h-9">
          <Plus className="h-3 w-3 mr-2" /> Create Coupon
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Coupon Code" required className="h-10 px-3 text-sm border border-border bg-transparent outline-none uppercase" />
            <input type="number" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: parseFloat(e.target.value) || 0 })} placeholder="Discount %" className="h-10 px-3 text-sm border border-border bg-transparent outline-none" />
            <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="h-10 px-3 text-sm border border-border bg-transparent outline-none" />
            <input type="number" value={form.max_usage} onChange={(e) => setForm({ ...form, max_usage: parseInt(e.target.value) || 0 })} placeholder="Max usage (0=unlimited)" className="h-10 px-3 text-sm border border-border bg-transparent outline-none" />
          </div>
          <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9">Create</Button>
        </form>
      )}

      <div className="border border-border divide-y divide-border">
        {coupons.map((c) => (
          <div key={c.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-mono">{c.code}</p>
              <p className="text-xs text-muted-foreground">{Number(c.discount_percentage)}% off · Used: {c.usage_count || 0}{c.max_usage ? `/${c.max_usage}` : ""} {c.expires_at ? `· Expires: ${new Date(c.expires_at).toLocaleDateString()}` : ""}</p>
            </div>
            <button onClick={() => toggleActive(c.id, c.is_active)} className={`text-xs px-3 py-1 border ${c.is_active ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}`}>
              {c.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoupons;
