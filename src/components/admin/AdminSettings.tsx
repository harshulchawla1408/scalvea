import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const [exporting, setExporting] = useState(false);

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

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Store Info */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase">Store Information</h2>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Brand:</span> SCALVEA</p>
          <p><span className="text-muted-foreground">Tagline:</span> Nothing To Hide</p>
          <p><span className="text-muted-foreground">Address:</span> 263 Heaths Rd, Werribee VIC 3030, Australia</p>
          <p><span className="text-muted-foreground">Phone:</span> +61 460 309 333</p>
          <p><span className="text-muted-foreground">Email:</span> contact@scalvea.com</p>
        </div>
      </div>

      {/* Data Export */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase">Data Export</h2>
        <p className="text-sm text-muted-foreground">Download store data as CSV files.</p>
        <div className="flex gap-3">
          <Button onClick={exportOrders} disabled={exporting} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9">
            Export Orders
          </Button>
          <Button onClick={exportProducts} disabled={exporting} className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9">
            Export Products
          </Button>
        </div>
      </div>

      {/* Policies */}
      <div className="border border-border p-6 space-y-4">
        <h2 className="text-xs tracking-[0.15em] uppercase">Store Pages</h2>
        <p className="text-sm text-muted-foreground">These pages are live on the storefront:</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: "Privacy Policy", path: "/privacy-policy" },
            { label: "Terms of Service", path: "/terms-of-service" },
            { label: "Shipping Policy", path: "/shipping-policy" },
            { label: "Returns Policy", path: "/returns-policy" },
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
