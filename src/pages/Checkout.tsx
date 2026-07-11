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
import { loadStripe } from "@stripe/stripe-js";
import { useSEO } from "@/hooks/useSEO";

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

const Checkout = () => {
  useSEO({
    title: "Checkout",
    description: "Securely complete your purchase on Scalvea.",
    noindex: true
  });

  const { items, total, clearCart } = useCart();
  const { settings, currencySymbol, currencyCode, market } = useCountry();
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
  
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  const [placing, setPlacing] = useState(false);

  // Sync state selection when state lists change
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      state: isIndia ? "" : AUSTRALIA_STATES[0]
    }));
    setPaymentMethod(isIndia ? "shiprocket" : "stripe");
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

  // Dynamic load Shiprocket Checkout script
  useEffect(() => {
    if (isIndia) {
      import("@/utils/shiprocket").then(({ loadShiprocketAssets }) => {
        loadShiprocketAssets();
      });
    }
  }, [isIndia]);

  const handleShiprocketCheckout = async (e?: any) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setPlacing(true);

    try {
      // 1. Ensure the Shiprocket SDK is loaded before proceeding
      const { loadShiprocketAssets } = await import("@/utils/shiprocket");
      const sdkReady = await loadShiprocketAssets();
      console.log("Shiprocket SDK ready:", sdkReady);

      // 2. Invoke Supabase Edge Function to generate access token
      const { data, error } = await supabase.functions.invoke("create-shiprocket-checkout-token", {
        body: {
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      });

      if (error || !data || !data.token) {
        throw new Error(error?.message || data?.error || "Failed to create checkout token");
      }

      const token = data.token;
      const redirectUrl = data.redirect_url || "";

      console.log("Checkout token received:", token);
      console.log("Redirect URL received:", redirectUrl || "(empty — SDK will construct URL from token)");

      // 3. Call HeadlessCheckout.addToCart or fallback to direct redirect
      const headless = (window as any).HeadlessCheckout;
      if (headless && typeof headless.addToCart === "function") {
        // SDK is available — it constructs the checkout URL internally from the token.
        // The fallbackUrl is shown in the preloader if the iframe takes too long.
        console.log("Loading Shiprocket Checkout via Headless SDK");
        clearCart();
        headless.addToCart(e || null, token, {
          fallbackUrl: redirectUrl || undefined,
          isInitiatedFromApp: true
        });
      } else {
        // SDK not available — need redirectUrl to fall back to direct navigation
        if (!redirectUrl) {
          throw new Error("Shiprocket checkout unavailable. Please try again in a moment.");
        }
        console.log("HeadlessCheckout SDK not available. Redirecting to:", redirectUrl);
        clearCart();
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      console.error("Shiprocket checkout error:", err);
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  const startStripeCheckout = async () => {
    try {
      // 1. Verify stock for each item before redirecting
      for (const item of items) {
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select("id, name, inventory_quantity_australia")
          .eq("id", item.productId)
          .single();

        if (prodError || !prod) {
          toast({ title: "Product unavailable", description: `${item.name} could not be verified.`, variant: "destructive" });
          setPlacing(false);
          return;
        }

        const currentStock = prod.inventory_quantity_australia ?? 0;
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

      // 2. Call our create-stripe-session Edge Function
      const { data, error } = await supabase.functions.invoke("create-stripe-session", {
        body: {
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          email: form.email,
          shipping_address: {
            firstName: form.firstName,
            lastName: form.lastName,
            address: form.address,
            city: form.city,
            state: form.state,
            postcode: form.postcode,
            country: "Australia",
            phone: form.phone,
            email: form.email,
          },
          coupon_code: appliedCoupon?.code || null,
          shipping_type: "standard" // default to standard shipping
        }
      });

      if (error || !data || !data.sessionId) {
        throw new Error(error?.message || "Failed to create Stripe Checkout Session");
      }

      const sessionId = data.sessionId;
      const checkoutUrl = data.checkoutUrl;

      // Clear local cart before redirecting so the success page starts with an empty cart
      clearCart();

      // 3. Redirect using @stripe/stripe-js
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripePublishableKey) {
        console.warn("VITE_STRIPE_PUBLISHABLE_KEY is not configured. Redirecting directly using session URL.");
        window.location.href = checkoutUrl;
        return;
      }

      const stripe = await loadStripe(stripePublishableKey);
      if (stripe) {
        const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
        if (redirectError) {
          throw redirectError;
        }
      } else {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      console.error("Stripe Checkout error:", err);
      toast({ title: "Payment redirection failed", description: err.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    // Pincode/Postcode validation (Australia only)
    if (!/^\d{4}$/.test(form.postcode)) {
      toast({ title: "Invalid Postcode", description: "Australian postcodes must be exactly 4 digits.", variant: "destructive" });
      return;
    }

    setPlacing(true);
    await startStripeCheckout();
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
              {isIndia ? (
                <div className="space-y-6 border border-border/80 p-8 bg-secondary/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400 via-neutral-100 to-green-600" />
                  <h2 className="text-sm tracking-[0.2em] uppercase font-light flex items-center gap-2">🇮🇳 Shiprocket Fast Checkout</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Indian orders are processed securely via Shiprocket. You can complete your purchase using saved addresses, OTP-based login, and multiple payment methods:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-mono">
                    <div>✓ UPI (GPay, PhonePe, etc.)</div>
                    <div>✓ Credit/Debit Cards</div>
                    <div>✓ Net Banking & Wallets</div>
                    <div>✓ Cash on Delivery (COD)</div>
                    <div>✓ EMI / BNPL options</div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleShiprocketCheckout} 
                    disabled={placing} 
                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase mt-6 animate-pulse"
                  >
                    {placing ? "Launching Shiprocket..." : "Proceed with Shiprocket Checkout"}
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Contact</h2>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                  </div>

                  <div>
                    <h2 className="text-xs tracking-[0.15em] uppercase mb-6">
                      🇦🇺 Australian Shipping Details
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                      </div>
                      
                      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street Address" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Suburb / Town" required className="w-full h-11 px-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors" />
                        
                        <select
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="w-full h-11 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                          required
                        >
                          {AUSTRALIA_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>

                        <input 
                          value={form.postcode} 
                          onChange={(e) => setForm({ ...form, postcode: e.target.value })} 
                          placeholder="Postcode (4 digits)" 
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
                      </div>

                      <div>
                        <p className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">Shipping Destination</p>
                        <div className="w-full h-11 px-4 text-sm bg-secondary border border-border flex items-center text-muted-foreground cursor-not-allowed">
                          🇦🇺 Australia
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xs tracking-[0.15em] uppercase mb-6">Payment Options</h2>
                    <div className="space-y-3">
                      <div className="p-4 border border-foreground bg-secondary/10 flex items-center justify-between animate-fade-in">
                        <div className="space-y-1">
                          <span className="text-sm font-light block">Credit / Debit Card, Apple Pay, Google Pay</span>
                          <span className="text-[10px] text-muted-foreground font-light block">Processed securely via Stripe Checkout</span>
                        </div>
                        <div className="flex gap-1.5 text-[9px] tracking-wider font-mono text-muted-foreground uppercase">
                          <span>Visa</span> · <span>MC</span> · <span>Amex</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={placing} className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase">
                    {placing ? "Processing Order..." : `Place Order — ${formatVal(grandTotal)}`}
                  </Button>
                </>
              )}
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
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">Inclusive of all taxes</p>
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
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-light">Shipping Charge</span>
                    <span className="font-mono">
                      {shippingAmount === 0 ? (
                        "Free Shipping"
                      ) : (
                        <span>
                          <span className="line-through text-muted-foreground/60 mr-1.5">
                            {isIndia ? "₹100" : "A$10.00"}
                          </span>
                          <span className="font-medium text-foreground">{formatVal(shippingAmount)}</span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-sm font-medium">
                    <span>Total Due</span>
                    <div className="text-right font-mono">
                      <span className="block font-medium">{formatVal(grandTotal)}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5 font-sans">Inclusive of all taxes</span>
                    </div>
                  </div>
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