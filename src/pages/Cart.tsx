import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const Cart = () => {
  useSEO({
    title: "Your Bag",
    description: "View and manage items in your Scalvea shopping cart.",
    noindex: true
  });

  const { items, removeItem, updateQuantity, total } = useCart();
  const { currencySymbol, currencyCode, settings, selectedCountry } = useCountry();

  const isIndia = selectedCountry === "india";
  const formatVal = (val: number) => {
    if (isIndia) {
      return `₹${Math.round(val).toLocaleString("en-IN")}`;
    }
    return `A$${val.toFixed(2)}`;
  };

  const freeShippingThreshold = settings?.free_shipping_above || (isIndia ? 999 : 100);
  const shipping = total >= freeShippingThreshold ? 0 : (isIndia ? (settings?.shipping_charge || 100) : 7.50);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16">
        <h1 className="text-3xl font-light tracking-[0.04em] mb-12">Your Bag</h1>
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your bag is empty</p>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase"><Link to="/shop">Continue Shopping</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-0">
              <div className="border-b border-border pb-4 mb-6 hidden sm:grid grid-cols-12 gap-4">
                <p className="col-span-6 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">Product</p>
                <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground">Quantity</p>
                <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground text-right">Price</p>
                <p className="col-span-2 text-[10px] tracking-[0.12em] uppercase text-muted-foreground text-right">Total</p>
              </div>
              {items.map((item) => (
                <div key={item.productId} className="border-b border-border py-6 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-12 sm:col-span-6 flex gap-4">
                    <div className="w-20 h-24 bg-secondary flex-shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                    <div className="flex flex-col justify-center">
                      <p className="text-sm">{item.name}</p>
                      <button onClick={() => removeItem(item.productId)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.08em] text-left mt-1">Remove</button>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <div className="flex items-center border border-border w-fit">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-8 w-8 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                      <span className="h-8 w-8 flex items-center justify-center text-xs border-x border-border">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="h-8 w-8 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <p className="text-sm">{formatVal(item.price)}</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">Inclusive of all taxes</p>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <p className="text-sm font-medium">{formatVal(item.price * item.quantity)}</p>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-light mt-0.5 tracking-wide">Inclusive of all taxes</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-32 lg:h-fit bg-secondary p-8 space-y-6">
              <h2 className="text-xs tracking-[0.15em] uppercase">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Subtotal</span>
                  <span className="font-mono">{formatVal(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-light">Shipping</span>
                  <span className="font-mono">
                    {shipping === 0 ? (
                      "Free"
                    ) : (
                      <span>
                        <span className="line-through text-muted-foreground/60 mr-1.5">
                          {isIndia ? "₹100" : "A$10.00"}
                        </span>
                        <span className="font-medium text-foreground">{formatVal(shipping)}</span>
                      </span>
                    )}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-normal">
                  <span>Total</span>
                  <div className="text-right font-mono">
                    <span className="block font-medium">{formatVal(total + shipping)} {currencyCode}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-light tracking-wide block mt-0.5 font-sans">Inclusive of all taxes</span>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase"><Link to="/checkout">Checkout</Link></Button>
              <Link to="/shop" className="block text-center text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors">Continue Shopping</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
