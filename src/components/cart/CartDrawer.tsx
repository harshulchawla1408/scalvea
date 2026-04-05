import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCountry } from "@/contexts/CountryContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const { currencySymbol, currencyCode } = useCountry();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-sm tracking-[0.15em] uppercase font-normal">Your Bag ({itemCount})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your bag is empty</p>
            <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase" onClick={onClose}><Link to="/shop">Continue Shopping</Link></Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-20 h-20 bg-secondary flex-shrink-0"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-normal truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{currencySymbol}{item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></button>
                      <span className="text-xs w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="self-start"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" /></button>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="tracking-[0.08em] uppercase">Subtotal</span>
                <span>{currencySymbol}{total.toFixed(2)} {currencyCode}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Shipping & taxes calculated at checkout</p>
              <Button asChild className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase h-12"><Link to="/checkout" onClick={onClose}>Checkout</Link></Button>
              <button onClick={onClose} className="w-full text-center text-xs tracking-[0.08em] uppercase text-muted-foreground hover:text-foreground transition-colors py-2">Continue Shopping</button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
