import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getStoreSettings, updateStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";

const AdminSettings = () => {
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<StoreSettings>({
    au_business_name: "",
    au_abn: "",
    au_owner_name: "",
    au_address: "",
    au_phone: "",
    in_owner_name: "",
    in_address: "",
    in_phone: "",
    in_email: "",
    cancellation_policy: "",
    refund_policy: "",
  });

  useEffect(() => {
    getStoreSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStoreSettings(settings);
      toast({
        title: "Settings Saved",
        description: "Store configurations have been successfully updated in backend and local memory.",
      });
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: "Could not persist details to settings index.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportOrders = async () => {
    setExporting(true);
    const { data } = await supabase.from("orders").select("order_number, country, currency, subtotal, tax_amount, shipping_amount, total_amount, payment_method, payment_status, order_status, created_at");
    if (!data || data.length === 0) {
      toast({ title: "No orders to export" });
      setExporting(false);
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "scalvea-orders.csv"; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "Orders exported" });
  };

  const exportProducts = async () => {
    setExporting(true);
    const { data } = await supabase.from("products").select("name, slug, category, inventory_quantity, is_active, created_at");
    if (!data || data.length === 0) {
      toast({ title: "No products to export" });
      setExporting(false);
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(r => Object.values(r).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "scalvea-products.csv"; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: "Products exported" });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground animate-pulse">Loading settings registry...</p>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Store & Office Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Australia Office Details */}
        <div className="border border-border p-6 space-y-4 bg-[#fafafa]/50">
          <h2 className="text-xs tracking-[0.15em] uppercase font-semibold text-foreground">Australia HQ Office Details</h2>
          <p className="text-xs text-muted-foreground">Manage official Australian business coordinates and registry identification.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Business Name</label>
              <input 
                value={settings.au_business_name} 
                onChange={(e) => setSettings({ ...settings, au_business_name: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">ABN (Australian Business Number)</label>
              <input 
                value={settings.au_abn} 
                onChange={(e) => setSettings({ ...settings, au_abn: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Owner Name</label>
              <input 
                value={settings.au_owner_name} 
                onChange={(e) => setSettings({ ...settings, au_owner_name: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Contact Phone</label>
              <input 
                value={settings.au_phone} 
                onChange={(e) => setSettings({ ...settings, au_phone: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Office Street Address</label>
              <input 
                value={settings.au_address} 
                onChange={(e) => setSettings({ ...settings, au_address: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* India Operations Details */}
        <div className="border border-border p-6 space-y-4 bg-[#fafafa]/50">
          <h2 className="text-xs tracking-[0.15em] uppercase font-semibold text-foreground">India Operations details</h2>
          <p className="text-xs text-muted-foreground">Manage distribution node operations information and client care desk details.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Owner Name</label>
              <input 
                value={settings.in_owner_name} 
                onChange={(e) => setSettings({ ...settings, in_owner_name: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Contact Phone</label>
              <input 
                value={settings.in_phone} 
                onChange={(e) => setSettings({ ...settings, in_phone: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Operations Email</label>
              <input 
                type="email"
                value={settings.in_email} 
                onChange={(e) => setSettings({ ...settings, in_email: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Office Street Address</label>
              <input 
                value={settings.in_address} 
                onChange={(e) => setSettings({ ...settings, in_address: e.target.value })} 
                required
                className="w-full h-9 px-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* Policies Content */}
        <div className="border border-border p-6 space-y-4 bg-[#fafafa]/50">
          <h2 className="text-xs tracking-[0.15em] uppercase font-semibold text-foreground">Cancellation & Refund Policies</h2>
          <p className="text-xs text-muted-foreground">Manage legal terms rendered directly on storefront policy pages.</p>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Cancellation Policy Text</label>
              <textarea 
                value={settings.cancellation_policy} 
                onChange={(e) => setSettings({ ...settings, cancellation_policy: e.target.value })} 
                required
                rows={6}
                className="w-full p-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 font-light resize-y transition-colors" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block font-medium">Returns & Refund Policy Text</label>
              <textarea 
                value={settings.refund_policy} 
                onChange={(e) => setSettings({ ...settings, refund_policy: e.target.value })} 
                required
                rows={10}
                className="w-full p-3 text-xs border border-border bg-white outline-none focus:border-neutral-900 font-light resize-y transition-colors" 
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-10 w-full sm:w-auto px-8 rounded-none">
            {saving ? "Saving Changes..." : "Save Business Configurations"}
          </Button>
        </div>

      </form>

      {/* Data Export */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase font-semibold text-foreground">Data Export</h2>
        <p className="text-xs text-muted-foreground">Download store transactional and inventory logs as CSV reports.</p>
        <div className="flex gap-3">
          <Button onClick={exportOrders} disabled={exporting} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9 rounded-none">
            Export Orders
          </Button>
          <Button onClick={exportProducts} disabled={exporting} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9 rounded-none">
            Export Products
          </Button>
        </div>
      </div>

      {/* Policies */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase font-semibold text-foreground">Live Store Pages</h2>
        <p className="text-xs text-muted-foreground">Quick access links to verify updated storefront contents:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: "Privacy Policy", path: "/privacy-policy" },
            { label: "Terms of Service", path: "/terms-of-service" },
            { label: "Shipping Policy", path: "/shipping-policy" },
            { label: "Returns Policy", path: "/returns-policy" },
            { label: "Cancellation Policy", path: "/cancellation-policy" },
            { label: "FAQ", path: "/faq" },
            { label: "Contact", path: "/contact" },
            { label: "About", path: "/about" },
          ].map((p) => (
            <a key={p.path} href={p.path} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground underline">
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
