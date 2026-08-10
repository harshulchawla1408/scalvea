import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, Minus, Package, Truck, CreditCard, Download } from "lucide-react";
import { generateInvoicePDF } from "@/utils/generateInvoicePDF";

/* ─── Types ─── */
interface CustomLineItem {
  id: string; // random local id
  name: string;
  price: number;
  quantity: number;
}

type DeliveryMethod = "STORE_PICKUP" | "HAND_DELIVERY";
type ManualPaymentMethod = "Cash" | "Online" | "Other";
type CountryType = "India" | "Australia";

interface Props {
  onClose: () => void;
  onOrderCreated: () => void;
}

/* ─── Main Component ─── */
const AdminManualOrder = ({ onClose, onOrderCreated }: Props) => {
  const { user: adminUser } = useAuth();

  /* Customer fields */
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState<CountryType>("India");

  /* Product entry */
  const [lineItems, setLineItems] = useState<CustomLineItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  /* Delivery */
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("STORE_PICKUP");

  /* Payment */
  const [manualPaymentMethod, setManualPaymentMethod] = useState<ManualPaymentMethod>("Cash");

  /* Notes */
  const [adminNotes, setAdminNotes] = useState("");

  /* UI state */
  const [submitting, setSubmitting] = useState(false);

  /* ── Price helpers ── */
  const isIndia = country === "India";
  const currency = isIndia ? "INR" : "AUD";
  const fmt = (v: number) =>
    isIndia ? `₹${Math.round(v).toLocaleString("en-IN")}` : `A$${v.toFixed(2)}`;

  const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);
  const shippingAmount = 0; // Hand delivery & store pickup are always 0
  const grandTotal = subtotal + shippingAmount;

  /* ── Add / update / remove custom products ── */
  const addCustomProduct = () => {
    const name = newItemName.trim();
    const price = parseFloat(newItemPrice);
    if (!name || isNaN(price) || price < 0) {
      toast({ title: "Invalid item", description: "Please provide a valid name and price.", variant: "destructive" });
      return;
    }
    setLineItems(prev => [...prev, { id: crypto.randomUUID(), name, price, quantity: 1 }]);
    setNewItemName("");
    setNewItemPrice("");
  };

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setLineItems(prev => prev.map(li => li.id === id ? { ...li, quantity: newQty } : li));
  };

  const removeProduct = (id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id));
  };

  /* ── Core order submission ── */
  const submitOrder = async (action: "create" | "create_download") => {
    if (lineItems.length === 0) {
      toast({ title: "Add at least one product", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      /* 1. Insert order */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          country,
          currency,
          subtotal,
          tax_amount: 0,
          shipping_amount: shippingAmount,
          discount_amount: 0,
          total_amount: grandTotal,
          order_status: "delivered", // Manual orders mark as delivered/completed directly
          payment_status: "paid",    // Hardcoded as paid for revenue analytics
          payment_method: manualPaymentMethod,
          payment_provider: "manual",
          shipping_address: {},
          market: isIndia ? "IN" : "AU",
          customer_name: customerName.trim() || "Manual Guest",
          customer_email: customerEmail.trim().toLowerCase() || null,
          customer_phone: customerPhone.trim() || null,
          is_guest: true,
          source: "ADMIN",
          order_source: "MANUAL",
          delivery_method: deliveryMethod,
          manual_payment_method: manualPaymentMethod,
          created_by_admin: adminUser?.id ?? null,
          admin_created_at: new Date().toISOString(),
          admin_notes: adminNotes.trim() || null,
        } as any)
        .select("id, order_number")
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;
      const orderNumber = orderData.order_number;

      /* 2. Insert custom order items */
      const { error: itemsError } = await supabase.from("order_items").insert(
        lineItems.map(li => ({
          order_id: orderId,
          product_id: null, // Nullable product ID for custom entries
          product_name: li.name,
          quantity: li.quantity,
          price: li.price,
          currency,
        })) as any
      );
      if (itemsError) throw itemsError;

      toast({ 
        title: `Order ${orderNumber} created!`, 
        description: `${fmt(grandTotal)} added to revenue.` 
      });

      /* 3. Download PDF if requested */
      if (action === "create_download") {
        // Fetch the fully built order to pass to PDF generator
        const { data: fullOrder } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();
          
        if (fullOrder) {
          generateInvoicePDF(fullOrder as any);
        }
      }

      onOrderCreated();
      onClose();

    } catch (err: any) {
      console.error("Manual order error:", err);
      toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end">
      <div className="relative w-full max-w-xl h-full bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-foreground text-background flex-shrink-0">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-60">Admin Panel</p>
            <h2 className="text-sm font-medium tracking-wide mt-0.5">Quick Manual Order</h2>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">

            {/* ── SECTION 1: Customer Details (Optional) ── */}
            <section>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Country</label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value as CountryType)}
                      className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                    >
                      <option value="India">🇮🇳 India (INR)</option>
                      <option value="Australia">🇦🇺 Australia (AUD)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Customer Name</label>
                    <Input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Optional"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="Optional"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Phone</label>
                    <Input
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Optional"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 2: Custom Products ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Package className="h-3 w-3" /> Products
              </p>

              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Item Name" 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="flex-1 h-10 text-sm"
                />
                <Input 
                  placeholder="Price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(e.target.value)}
                  className="w-24 h-10 text-sm"
                />
                <Button onClick={addCustomProduct} type="button" className="h-10 px-4">Add</Button>
              </div>

              {lineItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed border-border">No products added yet</p>
              ) : (
                <div className="space-y-2">
                  {lineItems.map(li => (
                    <div key={li.id} className="flex items-center justify-between border border-border px-4 py-3 bg-secondary/30">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-light truncate">{li.name}</p>
                        <p className="text-[10px] text-muted-foreground">{fmt(li.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => updateQty(li.id, li.quantity - 1)} className="w-7 h-7 border border-border flex items-center justify-center hover:bg-background transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-mono w-6 text-center">{li.quantity}</span>
                        <button type="button" onClick={() => updateQty(li.id, li.quantity + 1)} className="w-7 h-7 border border-border flex items-center justify-center hover:bg-background transition-colors"><Plus className="h-3 w-3" /></button>
                        <span className="text-sm font-mono w-20 text-right">{fmt(li.price * li.quantity)}</span>
                        <button type="button" onClick={() => removeProduct(li.id)} className="ml-2 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── SECTION 3: Logistics ── */}
            <section>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <Truck className="h-3 w-3" /> Delivery
                  </p>
                  <select
                    value={deliveryMethod}
                    onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                  >
                    <option value="STORE_PICKUP">Store Pickup</option>
                    <option value="HAND_DELIVERY">Hand Delivery</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> Payment Method
                  </p>
                  <select 
                    value={manualPaymentMethod} 
                    onChange={e => setManualPaymentMethod(e.target.value as ManualPaymentMethod)} 
                    className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ── SECTION 4: Notes ── */}
            <section>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block mb-2">Admin Notes (optional)</label>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes for this order…" className="text-sm min-h-[70px]" />
            </section>

          </div>
        </div>

        {/* ── Sticky Order Summary + Submit ── */}
        <div className="border-t border-border px-6 py-5 bg-background flex-shrink-0">
          <div className="flex justify-between font-semibold text-lg text-foreground mb-4">
            <span>Total Revenue</span>
            <span className="font-mono">{fmt(grandTotal)}</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => submitOrder("create")}
              disabled={submitting || lineItems.length === 0}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase"
            >
              {submitting ? "Saving..." : `Submit Order`}
            </Button>
            <Button
              onClick={() => submitOrder("create_download")}
              disabled={submitting || lineItems.length === 0}
              variant="outline"
              className="h-10 text-xs tracking-[0.08em] uppercase flex items-center justify-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Submit & Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManualOrder;
