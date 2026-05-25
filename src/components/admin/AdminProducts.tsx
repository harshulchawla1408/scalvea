import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, X, Image } from "lucide-react";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", category: "Serums", ingredients: "", how_to_use: "",
    key_ingredients: "", size: "30 mL / 1.01 fl oz", imageUrls: [] as string[], featured: false, badge: "",
    price_aud: 0, price_inr: 0,
    inventory_quantity_india: 0, inventory_quantity_australia: 0,
    is_active_india: true, is_active_australia: true,
    sku_india: "", sku_australia: "",
  });

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*, product_prices(*)").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({
      name: "", slug: "", description: "", category: "Serums", ingredients: "", how_to_use: "", key_ingredients: "", size: "30 mL / 1.01 fl oz", imageUrls: [], featured: false, badge: "",
      price_aud: 0, price_inr: 0,
      inventory_quantity_india: 0, inventory_quantity_australia: 0,
      is_active_india: true, is_active_australia: true,
      sku_india: "", sku_australia: "",
    });
    setEditProduct(null);
    setShowForm(false);
  };

  const handleEdit = (p: any) => {
    const prices = Array.isArray(p.product_prices) ? p.product_prices[0] : p.product_prices || {};
    setForm({
      name: p.name, slug: p.slug, description: p.description || "", category: p.category, ingredients: p.ingredients || "",
      how_to_use: p.how_to_use || "", key_ingredients: (p.key_ingredients || []).join(", "), size: p.size || "",
      imageUrls: p.images || [], featured: p.featured, badge: p.badge || "",
      price_aud: Number(prices.price_aud) || 0, price_inr: Number(prices.price_inr) || 0,
      inventory_quantity_india: p.inventory_quantity_india || 0, inventory_quantity_australia: p.inventory_quantity_australia || 0,
      is_active_india: p.is_active_india ?? true, is_active_australia: p.is_active_australia ?? true,
      sku_india: p.sku_india || "", sku_australia: p.sku_australia || "",
    });
    setEditProduct(p);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error } = await supabase.storage.from("product-images").upload(filePath, file);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      newUrls.push(urlData.publicUrl);
    }

    setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (newUrls.length > 0) toast({ title: `${newUrls.length} image(s) uploaded` });
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: form.name, slug: form.slug, description: form.description, category: form.category,
      ingredients: form.ingredients, how_to_use: form.how_to_use,
      key_ingredients: form.key_ingredients.split(",").map(s => s.trim()).filter(Boolean),
      size: form.size, images: form.imageUrls,
      featured: form.featured, badge: form.badge || null,
      inventory_quantity_india: form.inventory_quantity_india,
      inventory_quantity_australia: form.inventory_quantity_australia,
      is_active_india: form.is_active_india,
      is_active_australia: form.is_active_australia,
      sku_india: form.sku_india || null,
      sku_australia: form.sku_australia || null,
      // Fallback fields for legacy compatibility
      inventory_quantity: form.inventory_quantity_australia,
      is_active: form.is_active_australia,
    };

    try {
      if (editProduct) {
        await supabase.from("products").update(productData as any).eq("id", editProduct.id);
        await supabase.from("product_prices").update({ price_aud: form.price_aud, price_inr: form.price_inr, price_usd: 0 } as any).eq("product_id", editProduct.id);
        toast({ title: "Product updated" });
      } else {
        const { data, error } = await supabase.from("products").insert(productData as any).select().single();
        if (error) throw error;
        await supabase.from("product_prices").insert({ product_id: data.id, price_aud: form.price_aud, price_inr: form.price_inr, price_usd: 0 } as any);
        toast({ title: "Product created" });
      }
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("product_prices").delete().eq("product_id", id);
    await supabase.from("inventory_logs").delete().eq("product_id", id);
    await supabase.from("reviews").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting product", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Product deleted" });
    fetchProducts();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{products.length} products</p>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.1em] uppercase h-9">
          <Plus className="h-3 w-3 mr-2" /> Add Product
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border p-6 space-y-6 bg-background">
          <h3 className="text-xs tracking-[0.15em] uppercase mb-4">{editProduct ? "Edit Product" : "New Product"}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Product Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" required className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Slug (URL)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug-url-here" required className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Size</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="Size" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Badge</label>
              <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Badge (e.g., NEW)" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Ingredients</label>
            <textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="Ingredients" rows={2} className="w-full px-3 py-2 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">How to use</label>
            <textarea value={form.how_to_use} onChange={(e) => setForm({ ...form, how_to_use: e.target.value })} placeholder="How to use" rows={2} className="w-full px-3 py-2 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Key ingredients (comma separated)</label>
            <input value={form.key_ingredients} onChange={(e) => setForm({ ...form, key_ingredients: e.target.value })} placeholder="Key ingredients (comma separated)" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block">Product Images</label>
            <div className="flex flex-wrap gap-3">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 border border-border overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-foreground text-background p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 border border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-foreground transition-colors text-muted-foreground hover:text-foreground animate-pulse"
              >
                {uploading ? (
                  <span className="text-[9px]">Uploading…</span>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="text-[9px]">Upload</span>
                  </>
                )}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Australia specific settings */}
          <div className="border border-border p-4 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.15em] font-medium border-b border-border pb-2 flex items-center gap-2">🇦🇺 Australia Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Price (AUD)</label>
                <input type="number" step="0.01" value={form.price_aud} onChange={(e) => setForm({ ...form, price_aud: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Stock Count</label>
                <input type="number" value={form.inventory_quantity_australia} onChange={(e) => setForm({ ...form, inventory_quantity_australia: parseInt(e.target.value) || 0 })} className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">SKU</label>
                <input type="text" value={form.sku_australia} onChange={(e) => setForm({ ...form, sku_australia: e.target.value })} placeholder="e.g. F8-AUD-01" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.08em]"><input type="checkbox" checked={form.is_active_australia} onChange={(e) => setForm({ ...form, is_active_australia: e.target.checked })} className="accent-foreground" /> Active in Australia</label>
          </div>

          {/* India specific settings */}
          <div className="border border-border p-4 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.15em] font-medium border-b border-border pb-2 flex items-center gap-2">🇮🇳 India Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Price (INR)</label>
                <input type="number" step="0.01" value={form.price_inr} onChange={(e) => setForm({ ...form, price_inr: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">Stock Count</label>
                <input type="number" value={form.inventory_quantity_india} onChange={(e) => setForm({ ...form, inventory_quantity_india: parseInt(e.target.value) || 0 })} className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground block mb-1">SKU</label>
                <input type="text" value={form.sku_india} onChange={(e) => setForm({ ...form, sku_india: e.target.value })} placeholder="e.g. F8-INR-01" className="w-full h-10 px-3 text-sm border border-border bg-transparent outline-none focus:border-foreground" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.08em]"><input type="checkbox" checked={form.is_active_india} onChange={(e) => setForm({ ...form, is_active_india: e.target.checked })} className="accent-foreground" /> Active in India</label>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-foreground" /> Featured (Global)</label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.1em] uppercase h-10">{editProduct ? "Update Product" : "Create Product"}</Button>
            <Button type="button" variant="outline" onClick={resetForm} className="text-xs tracking-[0.1em] uppercase h-10">Cancel</Button>
          </div>
        </form>
      )}

      <div className="border border-border divide-y divide-border bg-background">
        {products.map((p) => {
          const prices = Array.isArray(p.product_prices) ? p.product_prices[0] : p.product_prices || {};
          return (
            <div key={p.id} className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {p.images?.[0] ? (
                  <div className="w-12 h-12 bg-secondary overflow-hidden flex-shrink-0"><img src={p.images[0]} alt="" className="w-full h-full object-cover" /></div>
                ) : (
                  <div className="w-12 h-12 bg-secondary flex-shrink-0 flex items-center justify-center"><Image className="h-4 w-4 text-muted-foreground" /></div>
                )}
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      🇦🇺 AUD: {p.is_active_australia ? `A$${Number(prices.price_aud || 0).toFixed(2)}` : "Inactive"} · Stock: {p.inventory_quantity_australia ?? 0}
                    </span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1">
                      🇮🇳 INR: {p.is_active_india ? `₹${Math.round(prices.price_inr || 0)}` : "Inactive"} · Stock: {p.inventory_quantity_india ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-2 hover:bg-secondary transition-colors" title="Edit product"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-secondary transition-colors text-red-500" title="Delete product"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProducts;
