import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCountry } from "@/contexts/CountryContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/products/ProductCard";
import { toast } from "@/hooks/use-toast";
import { Package, ChevronRight, Pencil, Plus, Trash2, Check, X, Clock, MapPin, Heart, Eye, Download, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Address {
  id: string;
  label: string | null;
  first_name: string | null;
  last_name: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postcode: string | null;
  country: string;
  phone: string | null;
  is_default: boolean | null;
}

const Account = () => {
  const { user, loading, isAdmin } = useAuth();
  const { country, setCountry, allCountries, formatPrice } = useCountry();
  const { items: recentlyViewedIds } = useRecentlyViewed();
  const { products: allProducts } = useProducts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", email: "" });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    label: "Home", first_name: "", last_name: "", address_line1: "", address_line2: "",
    city: "", state: "", postcode: "", country: "Australia", phone: "",
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false });
      return (data || []) as Address[];
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (form: typeof profileForm) => {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name, phone: form.phone, email: form.email,
      }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditingProfile(false);
      toast({ title: "Profile updated" });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const saveAddress = useMutation({
    mutationFn: async ({ id, ...form }: Partial<Address> & { id?: string }) => {
      if (id && id !== "new") {
        const { error } = await supabase.from("addresses").update(form).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert({ ...form, user_id: user!.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setEditingAddressId(null);
      setShowAddAddress(false);
      toast({ title: "Address saved" });
    },
    onError: () => toast({ title: "Failed to save address", variant: "destructive" }),
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({ title: "Address deleted" });
    },
  });

  const startEditProfile = useCallback(() => {
    setProfileForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
    });
    setEditingProfile(true);
  }, [profile, user]);

  const startEditAddress = (addr: Address) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setShowAddAddress(false);
  };

  const startAddAddress = () => {
    setAddressForm({
      label: "Home", first_name: "", last_name: "", address_line1: "", address_line2: "",
      city: "", state: "", postcode: "", country, phone: "",
    });
    setShowAddAddress(true);
    setEditingAddressId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/");
  };

  // Download invoice as text/html
  const downloadInvoice = (order: any) => {
    const addr = order.shipping_address || {};
    const html = `
<!DOCTYPE html><html><head><title>Invoice ${order.order_number}</title>
<style>body{font-family:Inter,sans-serif;padding:40px;max-width:700px;margin:auto}h1{font-size:20px;margin-bottom:4px}
table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;padding:8px;border-bottom:1px solid #eee;font-size:13px}
th{text-transform:uppercase;letter-spacing:1px;font-size:10px;color:#888}.total{font-weight:600;font-size:15px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px}
.meta{font-size:12px;color:#666;line-height:1.8}</style></head><body>
<div class="header"><div><h1>SCALVEA</h1><p style="font-size:11px;color:#888;letter-spacing:2px">NOTHING TO HIDE</p></div>
<div style="text-align:right"><h2 style="font-size:16px;margin:0">INVOICE</h2>
<p class="meta">${order.order_number}<br>${new Date(order.created_at).toLocaleDateString()}</p></div></div>
<div class="meta" style="margin-bottom:20px"><strong>Ship To:</strong><br>
${addr.first_name || ""} ${addr.last_name || ""}<br>${addr.address_line1 || ""}<br>
${addr.city || ""} ${addr.state || ""} ${addr.postcode || ""}<br>${addr.country || order.country}</div>
<table><tr><th>Item</th><th>Qty</th><th>Price</th></tr>
<tr><td colspan="3" style="font-size:12px;color:#888">Order items — see order confirmation email for details</td></tr></table>
<table><tr><td>Subtotal</td><td class="total">${order.currency === "INR" ? "₹" : "$"}${Number(order.subtotal).toFixed(2)}</td></tr>
<tr><td>Tax</td><td>${order.currency === "INR" ? "₹" : "$"}${Number(order.tax_amount).toFixed(2)}</td></tr>
<tr><td>Shipping</td><td>${order.currency === "INR" ? "₹" : "$"}${Number(order.shipping_amount).toFixed(2)}</td></tr>
${order.discount_amount > 0 ? `<tr><td>Discount</td><td>-${order.currency === "INR" ? "₹" : "$"}${Number(order.discount_amount).toFixed(2)}</td></tr>` : ""}
<tr><td><strong>Total</strong></td><td class="total">${order.currency === "INR" ? "₹" : "$"}${Number(order.total_amount).toFixed(2)} ${order.currency}</td></tr></table>
<p style="font-size:11px;color:#888;margin-top:30px;text-align:center">SCALVEA · 263 Heaths Rd, Werribee VIC 3030, Australia · scalvea.com</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Invoice downloaded" });
  };

  const recentlyViewedProducts = allProducts.filter((p) => recentlyViewedIds.includes(p.id)).slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-4xl">
            <div className="h-8 w-48 bg-muted animate-pulse mb-8" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-muted animate-pulse" />
              <div className="h-32 w-full bg-muted animate-pulse" />
              <div className="h-32 w-full bg-muted animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // useEffect will redirect to /auth
  }

  const statusColor = (s: string) => {
    if (s === "delivered") return "text-green-600";
    if (s === "processing" || s === "shipped") return "text-amber-600";
    return "text-muted-foreground";
  };

  const statusSteps = ["pending", "processing", "shipped", "delivered"];
  const getStepIndex = (status: string) => statusSteps.indexOf(status);

  const AddressForm = ({ onSave, onCancel, initial }: { onSave: (d: Partial<Address>) => void; onCancel: () => void; initial: Partial<Address> }) => {
    const { country: selectedCountry } = useCountry();
    const [form, setForm] = useState({ ...initial, country: selectedCountry });
    return (
      <div className="border border-border p-4 space-y-3">
        <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
          Adding address for <span className="text-foreground font-medium">{selectedCountry}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">First Name</Label>
            <Input value={form.first_name || ""} onChange={e => setForm({ ...form, first_name: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">Last Name</Label>
            <Input value={form.last_name || ""} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-9 text-sm" />
          </div>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.1em]">Label</Label>
          <Input value={form.label || ""} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Home, Office..." className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.1em]">Address Line 1</Label>
          <Input value={form.address_line1 || ""} onChange={e => setForm({ ...form, address_line1: e.target.value })} className="h-9 text-sm" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.1em]">Address Line 2</Label>
          <Input value={form.address_line2 || ""} onChange={e => setForm({ ...form, address_line2: e.target.value })} className="h-9 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">City</Label>
            <Input value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">State</Label>
            <Input value={form.state || ""} onChange={e => setForm({ ...form, state: e.target.value })} className="h-9 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">Postcode</Label>
            <Input value={form.postcode || ""} onChange={e => setForm({ ...form, postcode: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-[0.1em]">Country</Label>
            <Input value={selectedCountry} disabled className="h-9 text-sm bg-secondary cursor-not-allowed" />
          </div>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-[0.1em]">Phone</Label>
          <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={() => onSave(form)} className="h-9 text-[10px] tracking-[0.1em] uppercase bg-foreground text-background hover:bg-foreground/90">
            <Check className="h-3 w-3 mr-1" /> Save
          </Button>
          <Button onClick={onCancel} variant="outline" className="h-9 text-[10px] tracking-[0.1em] uppercase">
            <X className="h-3 w-3 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light tracking-[0.04em]">My Account</h1>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase border-foreground">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="orders" className="space-y-8">
            <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-0">
              {[
                { value: "orders", label: "Orders", icon: Package },
                { value: "addresses", label: "Addresses", icon: MapPin },
                { value: "profile", label: "Profile", icon: Pencil },
                { value: "recently-viewed", label: "Recently Viewed", icon: Eye },
                { value: "country", label: "Country", icon: Globe },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs tracking-[0.1em] uppercase px-4 py-3">
                  <Icon className="h-3.5 w-3.5 mr-1.5" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                  <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
                    <Link to="/shop">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="border border-border">
                    <button
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm">{order.currency === "INR" ? "₹" : "$"}{Number(order.total_amount).toFixed(2)} {order.currency}</p>
                          <p className={`text-xs uppercase tracking-[0.08em] ${statusColor(order.order_status)}`}>{order.order_status}</p>
                        </div>
                        {expandedOrderId === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>

                    {expandedOrderId === order.id && (
                      <div className="border-t border-border p-4 space-y-4">
                        {/* Order Tracker */}
                        <div>
                          <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3">Order Status</p>
                          <div className="flex items-center gap-2">
                            {statusSteps.map((step, i) => {
                              const active = i <= getStepIndex(order.order_status);
                              return (
                                <div key={step} className="flex items-center gap-2 flex-1">
                                  <div className={`h-2 flex-1 rounded-full ${active ? "bg-foreground" : "bg-border"}`} />
                                  {i === statusSteps.length - 1 ? null : null}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1">
                            {statusSteps.map((step) => (
                              <span key={step} className="text-[9px] tracking-[0.08em] uppercase text-muted-foreground">{step}</span>
                            ))}
                          </div>
                        </div>

                        {/* Order details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Subtotal</p>
                            <p>{order.currency === "INR" ? "₹" : "$"}{Number(order.subtotal).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Tax</p>
                            <p>{order.currency === "INR" ? "₹" : "$"}{Number(order.tax_amount).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Shipping</p>
                            <p>{order.currency === "INR" ? "₹" : "$"}{Number(order.shipping_amount).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Delivery Estimate</p>
                            <p>{order.delivery_estimate || "—"}</p>
                          </div>
                        </div>

                        {order.shipping_address && (
                          <div className="text-sm">
                            <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Shipping Address</p>
                            <p>{(order.shipping_address as any).first_name} {(order.shipping_address as any).last_name}</p>
                            <p className="text-muted-foreground">{(order.shipping_address as any).address_line1}, {(order.shipping_address as any).city} {(order.shipping_address as any).state} {(order.shipping_address as any).postcode}</p>
                          </div>
                        )}

                        <Button onClick={() => downloadInvoice(order)} variant="outline" className="text-xs tracking-[0.1em] uppercase h-9">
                          <Download className="h-3 w-3 mr-1.5" /> Download Invoice
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-4">
              <div className="flex justify-end">
                <button onClick={startAddAddress} className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Address
                </button>
              </div>

              {showAddAddress && (
                <AddressForm initial={addressForm} onCancel={() => setShowAddAddress(false)} onSave={(d) => saveAddress.mutate({ ...d } as any)} />
              )}

              {addresses.length === 0 && !showAddAddress && (
                <p className="text-sm text-muted-foreground">No addresses saved.</p>
              )}

              <div className="space-y-3">
                {addresses.map((addr) =>
                  editingAddressId === addr.id ? (
                    <AddressForm key={addr.id} initial={addr} onCancel={() => setEditingAddressId(null)} onSave={(d) => saveAddress.mutate({ ...d, id: addr.id })} />
                  ) : (
                    <div key={addr.id} className="border border-border p-4 flex items-start justify-between">
                      <div className="text-sm space-y-0.5">
                        <p className="font-medium text-xs tracking-[0.08em] uppercase">
                          {addr.label || "Address"}
                          {addr.is_default && <span className="ml-2 text-[9px] text-muted-foreground">(Default)</span>}
                        </p>
                        <p>{addr.first_name} {addr.last_name}</p>
                        <p className="text-muted-foreground">{addr.address_line1}</p>
                        {addr.address_line2 && <p className="text-muted-foreground">{addr.address_line2}</p>}
                        <p className="text-muted-foreground">{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postcode}</p>
                        <p className="text-muted-foreground">{addr.country}</p>
                        {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditAddress(addr)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteAddress.mutate(addr.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="max-w-md">
                {editingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.1em]">Full Name</Label>
                      <Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.1em]">Email</Label>
                      <Input value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-[0.1em]">Phone</Label>
                      <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+61 400 000 000" className="h-9 text-sm" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={() => updateProfile.mutate(profileForm)} disabled={updateProfile.isPending} className="h-9 text-[10px] tracking-[0.1em] uppercase bg-foreground text-background hover:bg-foreground/90">
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button onClick={() => setEditingProfile(false)} variant="outline" className="h-9 text-[10px] tracking-[0.1em] uppercase">
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-muted-foreground">Name: </span>{profile?.full_name || "—"}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Email: </span>{profile?.email || user?.email}</p>
                      <p className="text-sm"><span className="text-muted-foreground">Phone: </span>{profile?.phone || "—"}</p>
                    </div>
                    <Button onClick={startEditProfile} variant="outline" className="text-xs tracking-[0.1em] uppercase h-9">
                      <Pencil className="h-3 w-3 mr-1.5" /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border">
                <Button onClick={handleSignOut} variant="outline" className="text-xs tracking-[0.1em] uppercase border-foreground">
                  Sign Out
                </Button>
              </div>
            </TabsContent>

            {/* Recently Viewed Tab */}
            <TabsContent value="recently-viewed">
              {recentlyViewedProducts.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No recently viewed products</p>
                  <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
                    <Link to="/shop">Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentlyViewedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Country Tab */}
            <TabsContent value="country" className="space-y-4">
              <div className="max-w-sm">
                <p className="text-sm text-muted-foreground mb-4">
                  Select your country to see prices, taxes, and shipping in your local currency.
                </p>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map((c) => (
                      <SelectItem key={c.country} value={c.country}>
                        {c.country} ({c.currency_symbol} {c.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Currently selected: <span className="text-foreground font-medium">{country}</span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
