import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AUSTRALIA_STATES = [
  "New South Wales (NSW)",
  "Victoria (VIC)",
  "Queensland (QLD)",
  "Western Australia (WA)",
  "South Australia (SA)",
  "Tasmania (TAS)",
  "Australian Capital Territory (ACT)",
  "Northern Territory (NT)"
];

const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry"
];

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { settings, currencySymbol, currencyCode } = useCountry();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percentage: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const isIndia = settings?.country?.toLowerCase() === "india";

  const discountAmount = appliedCoupon ? total * (appliedCoupon.discount_percentage / 100) : 0;
  const subtotalAfterDiscount = total - discountAmount;
  const taxRate = (settings?.tax_percentage || 0) / 100;
  const taxAmount = subtotalAfterDiscount * taxRate;
  
  const freeShippingThreshold = settings?.free_shipping_above || (isIndia ? 999 : 100);
  const shippingAmount = subtotalAfterDiscount >= freeShippingThreshold ? 0 : (settings?.shipping_charge || (isIndia ? 100 : 10));
  const grandTotal = subtotalAfterDiscount + taxAmount + shippingAmount;

  const [form, setForm] = useState({
    email: user?.email || "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    phone: "",
  });
  
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");
  const [placing, setPlacing] = useState(false);

  // Sync state selection when state lists change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      state: isIndia ? INDIA_STATES[0] : AUSTRALIA_STATES[0]
    }));
  }, [isIndia]);

  const formatVal = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      // Find coupon that is active AND matches the selected country
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .eq("country", settings?.country || "Australia")
        .maybeSingle();

      if (error || !data) {
        toast({ title: "Invalid coupon", description: `This coupon is not valid for ${settings?.country || "Australia"}.`, variant: "destructive" });
        setApplyingCoupon(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({ title: "Coupon expired", variant: "destructive" });
        setApplyingCoupon(false);
        return;
      }

      // Check usage limit
      if (data.max_usage && (data.usage_count || 0) >= data.max_usage) {
        toast({ title: "Coupon usage limit reached", variant: "destructive" });
        setApplyingCoupon(false);
        return;
      }

      setAppliedCoupon({ code: data.code, discount_percentage: Number(data.discount_percentage) });
      toast({ title: `Coupon applied! ${Number(data.discount_percentage)}% off` });
    } catch {
      toast({ title: "Error applying coupon", variant: "destructive" });
    }
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    // Pincode/Postcode validation
    if (isIndia) {
      if (!/^\d{6}$/.test(form.postcode)) {
        toast({ title: "Invalid Pincode", description: "Indian pincodes must be exactly 6 digits.", variant: "destructive" });
        return;
      }
      if (!/^[6-9]\d{9}$/.test(form.phone.replace(/[\s-+]/g, ""))) {
        toast({ title: "Invalid Phone Number", description: "Please enter a valid 10-digit Indian phone number.", variant: "destructive" });
        return;
      }
    } else {
      if (!/^\d{4}$/.test(form.postcode)) {
        toast({ title: "Invalid Postcode", description: "Australian postcodes must be exactly 4 digits.", variant: "destructive" });
        return;
      }
    }

    setPlacing(true);

    try {
      // 1. Verify isolated country stock for each item before placing order
      const stockField = isIndia ? "inventory_quantity_india" : "inventory_quantity_australia";

      for (const item of items) {
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select(`id, name, ${stockField}`)
          .eq("id", item.productId)
          .single();

        if (prodError || !prod) {
          toast({ title: "Product unavailable", description: `${item.name} could not be verified.`, variant: "destructive" });
          setPlacing(false);
          return;
        }

        const currentStock = (prod as any)[stockField] ?? 0;
        if (item.quantity > currentStock) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${currentStock} units of ${item.name} are available for shipping in ${settings?.country}. Please adjust your cart.`,
            variant: "destructive"
          });
          setPlacing(false);
          return;
        }
      }

      // 2. Create the order
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          country: settings?.country || "Australia",
          currency: currencyCode,
          subtotal: total,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          coupon_code: appliedCoupon?.code || null,
          total_amount: grandTotal,
          payment_method: paymentMethod,
          payment_status: "unpaid",
          order_status: "pending",
          delivery_estimate: settings?.delivery_time || "5-10 business days",
          shipping_address: {
            firstName: form.firstName,
            lastName: form.lastName,
            address: form.address,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
            country: settings?.country || "Australia",
            phone: form.phone,
            email: form.email,
          },
        } as any)
        .select()
        .single();

      if (error) throw error;

      // 3. Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        currency: currencyCode,
      }));

      await supabase.from("order_items").insert(orderItems as any);

      // 4. Increment coupon usage
      if (appliedCoupon) {
        const { data: coupon } = await supabase.from("coupons").select("usage_count").eq("code", appliedCoupon.code).single();
        if (coupon) {
          await supabase.from("coupons").update({ usage_count: (coupon.usage_count || 0) + 1 } as any).eq("code", appliedCoupon.code);
        }
      }

      // 5. Invoke stripe payment if selected
      if (paymentMethod === "stripe") {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment-intent", {
          body: { orderId: order.id, amount: Math.round(grandTotal * 100), currency: currencyCode.toLowerCase() },
        });

        if (paymentError) {
          toast({ title: "Payment setup failed", description: "Order created. You can pay later.", variant: "destructive" });
        } else {
          await supabase.from("orders").update({ stripe_payment_intent_id: paymentData.paymentIntentId, payment_status: "paid", order_status: "processing" } as any).eq("id", order.id);
        }
      }

      clearCart();
      toast({ title: "Order placed!", description: `Order ${order.order_number} confirmed. ${paymentMethod === "cod" ? "Pay on delivery." : ""}` });
      navigate("/account");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-32 space-y-4">
          <p className="text-sm text-muted-foreground">Your bag is empty</p>
          <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase"><Link to="/shop">Continue Shopping</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="text-2xl font-light tracking-[0.04em] mb-12">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div>
                <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Contact</h2>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
              </div>

              {/* Dynamic Checkout Header & Fields based on India / Australia */}
              <div>
                <h2 className="text-xs tracking-[0.15em] uppercase mb-6">
                  {isIndia ? "🇮🇳 Shiprocket India Shipping Details" : "🇦🇺 Australian Shipping Details"}
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                  </div>
                  
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street Address" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={isIndia ? "City / Town" : "Suburb / Town"} required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                    
                    {/* Country-specific state selector */}
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full h-11 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                      required
                    >
                      {(isIndia ? INDIA_STATES : AUSTRALIA_STATES).map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>

                    <input 
                      value={form.postcode} 
                      onChange={(e) => setForm({ ...form, postcode: e.target.value })} 
                      placeholder={isIndia ? "Pincode (6 digits)" : "Postcode (4 digits)"} 
                      required 
                      className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors font-mono" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <input 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      placeholder="Phone number" 
                      required
                      className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" 
                    />
                    {isIndia && <span className="text-[10px] text-muted-foreground font-light px-1">Required for Shiprocket delivery updates (10 digits).</span>}
                  </div>

                  <div>
                    <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Shipping Destination</p>
                    <div className="w-full h-11 px-4 text-sm bg-secondary border border-border flex items-center text-muted-foreground cursor-not-allowed">
                      {isIndia ? "🇮🇳 India" : "🇦🇺 Australia"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Payment Options</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMethod === "stripe" ? "border-foreground" : "border-border"}`}>
                    <input type="radio" name="payment" value="stripe" checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} className="accent-foreground" />
                    <span className="text-sm font-light">Credit / Debit Card (Stripe Security)</span>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-foreground" : "border-border"}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="accent-foreground" />
                    <span className="text-sm font-light">Cash on Delivery (COD)</span>
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={placing} className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase">
                {placing ? "Processing Order..." : `Place Order — ${formatVal(grandTotal)}`}
              </Button>
            </div>

            <div className="lg:sticky lg:top-32 lg:h-fit">
              <div className="bg-secondary p-8 space-y-6">
                <h2 className="text-xs tracking-[0.15em] uppercase">Order Summary</h2>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="w-16 h-16 bg-background flex-shrink-0 relative border border-border/20">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[9px] w-5 h-5 flex items-center justify-center font-mono">{item.quantity}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{formatVal(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Selection */}
                <div className="space-y-2">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Promo / Discount Code</p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-background border border-border px-4 py-2 animate-fade-in">
                      <span className="text-xs font-mono font-medium">{appliedCoupon.code} — {appliedCoupon.discount_percentage}% off</span>
                      <button type="button" onClick={removeCoupon} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="COUPON10"
                        className="flex-1 h-10 px-3 text-xs bg-transparent border border-border outline-none focus:border-foreground uppercase tracking-wider font-mono"
                      />
                      <Button type="button" onClick={applyCoupon} disabled={applyingCoupon} variant="outline" className="h-10 text-xs tracking-[0.1em] uppercase">
                        {applyingCoupon ? "..." : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground font-light">Subtotal</span><span className="font-mono">{formatVal(total)}</span></div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-xs text-green-600"><span>Discount ({appliedCoupon.discount_percentage}%)</span><span className="font-mono">-{formatVal(discountAmount)}</span></div>
                  )}
                  {taxAmount > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground font-light">Tax ({settings?.tax_percentage}%)</span><span className="font-mono">{formatVal(taxAmount)}</span></div>}
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground font-light">Shipping Charge</span><span className="font-mono">{shippingAmount === 0 ? "Free Shipping" : formatVal(shippingAmount)}</span></div>
                  <div className="border-t border-border pt-3 flex justify-between text-sm font-medium"><span>Total Due</span><span className="font-mono">{formatVal(grandTotal)}</span></div>
                </div>
                {settings && <p className="text-[10px] text-muted-foreground">Estimated Delivery Time: {settings.delivery_time}</p>}
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;