import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X, Search, Plus, Minus, User, CheckCircle, UserX, Package,
  Truck, CreditCard, AlertTriangle, Printer, Download, AlertCircle
} from "lucide-react";

/* ─── Types ─── */
interface ProductRow {
  id: string;
  name: string;
  inventory_quantity: number | null;
  inventory_quantity_australia: number | null;
  price_inr: number;
  price_aud: number;
}

interface OrderLineItem {
  product: ProductRow;
  quantity: number;
}

interface FoundUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

type DeliveryMethod = "HAND_DELIVERY" | "STORE_PICKUP" | "MANUAL_COURIER" | "SHIPROCKET" | "STRIPE";
type ManualPaymentMethod = "Cash" | "UPI" | "Bank Transfer" | "Card Machine" | "Stripe Manual" | "Other";
type PaymentStatus = "paid" | "pending" | "partially_paid" | "refunded";
type CountryType = "India" | "Australia";
type SalesChannel = "WEBSITE" | "ADMIN" | "PHONE" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "EXHIBITION" | "SALON" | "OTHER";

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: "HAND_DELIVERY", label: "Hand Delivery (Free)" },
  { value: "STORE_PICKUP", label: "Store Pickup (Free)" },
  { value: "MANUAL_COURIER", label: "Manual Courier" },
  { value: "SHIPROCKET", label: "Shiprocket" },
  { value: "STRIPE", label: "Stripe" },
];

const PAYMENT_METHODS: ManualPaymentMethod[] = [
  "Cash", "UPI", "Bank Transfer", "Card Machine", "Stripe Manual", "Other"
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "refunded", label: "Refunded" },
];

const SALES_CHANNELS: { value: SalesChannel; label: string }[] = [
  { value: "ADMIN",      label: "Admin (Default)" },
  { value: "PHONE",      label: "Phone Call" },
  { value: "WHATSAPP",   label: "WhatsApp" },
  { value: "INSTAGRAM",  label: "Instagram" },
  { value: "FACEBOOK",   label: "Facebook" },
  { value: "EXHIBITION", label: "Exhibition / Event" },
  { value: "SALON",      label: "Salon / Retailer" },
  { value: "WEBSITE",    label: "Website" },
  { value: "OTHER",      label: "Other" },
];

/* ─── Props ─── */
interface Props {
  onClose: () => void;
  onOrderCreated: () => void;
}

/* ─── Invoice generator (shared logic with Account.tsx) ─── */
function buildInvoiceHtml(order: any, items: OrderLineItem[], isIndia: boolean, fmt: (v: number) => string): string {
  const addr = order.shippingAddress || {};
  return `<!DOCTYPE html><html><head><title>Invoice ${order.orderNumber || "Draft"}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  body { font-family: Inter, -apple-system, sans-serif; padding: 40px; max-width: 700px; margin: auto; color: #111; }
  h1 { font-size: 22px; letter-spacing: 4px; font-weight: 300; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .meta { font-size: 11px; color: #666; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #111; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #888; }
  td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
  .total-row td { font-weight: 600; border-top: 2px solid #111; border-bottom: none; font-size: 15px; }
  .badge { display: inline-block; font-size: 9px; padding: 2px 8px; background: #f5f0e8; color: #8b6914; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #e6d9b8; }
  footer { margin-top: 40px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head><body>
<div class="header">
  <div>
    <h1>SCALVEA</h1>
    <p style="font-size:9px;color:#aaa;letter-spacing:3px;margin:4px 0 0">CARE YOU DESERVE</p>
    ${order.isManual ? '<span class="badge">Offline Purchase</span>' : ''}
  </div>
  <div style="text-align:right">
    <p style="font-size:13px;font-weight:600;margin:0;letter-spacing:1px">TAX INVOICE</p>
    <p class="meta">${order.orderNumber || "—"}<br>${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>
    ${order.salesChannel ? `<p class="meta">Channel: ${order.salesChannel}</p>` : ""}
  </div>
</div>
<div class="meta" style="margin-bottom:24px">
  <strong>Bill To / Ship To:</strong><br>
  ${order.customerName || ""}<br>
  ${addr.address_line1 || ""}<br>
  ${addr.city || ""} ${addr.state || ""} ${addr.postcode || ""}<br>
  ${addr.country || order.country || ""}
  ${order.customerPhone ? `<br>Ph: ${order.customerPhone}` : ""}
  ${order.customerEmail ? `<br>${order.customerEmail}` : ""}
</div>
<table>
  <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>
    ${items.map(li => {
      const price = isIndia ? li.product.price_inr : li.product.price_aud;
      return `<tr><td>${li.product.name}</td><td>${li.quantity}</td><td style="text-align:right">${fmt(price)}</td><td style="text-align:right">${fmt(price * li.quantity)}</td></tr>`;
    }).join("")}
  </tbody>
</table>
<table>
  <tr><td>Subtotal</td><td style="text-align:right">${fmt(order.subtotal)}</td></tr>
  ${order.shippingAmount > 0 ? `<tr><td>Shipping</td><td style="text-align:right">${fmt(order.shippingAmount)}</td></tr>` : ""}
  <tr class="total-row"><td>Total (${order.currency})</td><td style="text-align:right">${fmt(order.grandTotal)}</td></tr>
</table>
<div class="meta" style="margin-top:16px">
  <strong>Payment:</strong> ${order.paymentMethod || "—"} · Status: ${order.paymentStatus || "—"}
  ${order.deliveryMethod ? `<br><strong>Delivery:</strong> ${order.deliveryMethod.replace(/_/g, " ")}` : ""}
  ${order.courierName ? `<br><strong>Courier:</strong> ${order.courierName}` : ""}
  ${order.trackingNumber ? `<br><strong>Tracking:</strong> ${order.trackingNumber}` : ""}
  ${order.adminNotes ? `<br><strong>Notes:</strong> ${order.adminNotes}` : ""}
</div>
<footer>SCALVEA GROUPS PTY LTD · ABN: 99 696 417 679 · 17 Travers St, Craigieburn VIC 3064, Australia · scalvea.com</footer>
</body></html>`;
}

/* ─── Main Component ─── */
const AdminManualOrder = ({ onClose, onOrderCreated }: Props) => {
  const { user: adminUser } = useAuth();

  /* Customer fields */
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState<CountryType>("Australia");

  /* Customer lookup */
  const [lookingUpUser, setLookingUpUser] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);

  /* Country settings (dynamic free-shipping thresholds) */
  const [countrySettings, setCountrySettings] = useState<Record<string, { free_shipping_above: number; shipping_charge: number }>>({
    Australia: { free_shipping_above: 0, shipping_charge: 9.5 },
    India:     { free_shipping_above: 0, shipping_charge: 50 },
  });

  /* Product search */
  const [productSearch, setProductSearch] = useState("");
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductRow[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  /* Delivery */
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("HAND_DELIVERY");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [customShippingCharge, setCustomShippingCharge] = useState<number>(0);

  /* Payment */
  const [manualPaymentMethod, setManualPaymentMethod] = useState<ManualPaymentMethod>("Cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");

  /* Sales channel (item 9) */
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("ADMIN");

  /* Notes */
  const [adminNotes, setAdminNotes] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    address_line1: "", city: "", state: "", postcode: "", country: "Australia"
  });

  /* Duplicate detection (item 4) */
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<null | "create" | "create_print" | "create_download">(null);

  /* UI state */
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch country settings (item 10: dynamic free-shipping) ── */
  useEffect(() => {
    supabase
      .from("country_settings")
      .select("country, free_shipping_above, shipping_charge")
      .in("country", ["Australia", "India"])
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { free_shipping_above: number; shipping_charge: number }> = {};
        data.forEach((row: any) => {
          map[row.country] = {
            free_shipping_above: 0,
            shipping_charge: Number(row.shipping_charge) || (row.country === "India" ? 50 : 9.5),
          };
        });
        if (Object.keys(map).length > 0) setCountrySettings(prev => ({ ...prev, ...map }));
      });
  }, []);

  /* ── Fetch all products ── */
  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, inventory_quantity, inventory_quantity_australia, product_prices(price_inr, price_aud)")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        const products: ProductRow[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          inventory_quantity: p.inventory_quantity,
          inventory_quantity_australia: p.inventory_quantity_australia,
          price_inr: p.product_prices?.price_inr ?? 0,
          price_aud: p.product_prices?.price_aud ?? 0,
        }));
        setAllProducts(products);
      });
  }, []);

  /* ── Product search filter ── */
  useEffect(() => {
    if (!productSearch.trim()) { setFilteredProducts([]); return; }
    const q = productSearch.toLowerCase();
    setFilteredProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
  }, [productSearch, allProducts]);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Sync shipping address country with selected country ── */
  useEffect(() => {
    setShippingAddress(prev => ({ ...prev, country }));
  }, [country]);

  /* ── Customer lookup on email blur ── */
  const lookupUser = useCallback(async () => {
    const email = customerEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    setLookingUpUser(true);
    setFoundUser(null);
    setUserNotFound(false);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone")
      .eq("email", email)
      .maybeSingle();
    if (data) {
      setFoundUser(data as FoundUser);
      if (!customerName) setCustomerName(data.full_name || "");
      if (!customerPhone) setCustomerPhone(data.phone || "");
    } else {
      setUserNotFound(true);
    }
    setLookingUpUser(false);
  }, [customerEmail, customerName, customerPhone]);

  /* ── Price helpers ── */
  const isIndia = country === "India";
  const currency = isIndia ? "INR" : "AUD";
  const fmt = (v: number) =>
    isIndia ? `₹${Math.round(v).toLocaleString("en-IN")}` : `A$${v.toFixed(2)}`;

  const getItemPrice = (product: ProductRow) =>
    isIndia ? product.price_inr : product.price_aud;

  /* ── Calculations — using live country_settings thresholds ── */
  const currentSettings = countrySettings[country] || (isIndia
    ? { free_shipping_above: 0, shipping_charge: 50 }
    : { free_shipping_above: 0, shipping_charge: 9.5 });

  const subtotal = lineItems.reduce((sum, li) => sum + getItemPrice(li.product) * li.quantity, 0);

  const shippingAmount =
    deliveryMethod === "HAND_DELIVERY" || deliveryMethod === "STORE_PICKUP"
      ? 0
      : deliveryMethod === "MANUAL_COURIER"
      ? customShippingCharge
      : currentSettings.shipping_charge;

  const grandTotal = subtotal + shippingAmount;

  /* ── Stock helper ── */
  const getStock = (p: ProductRow) =>
    isIndia ? (p.inventory_quantity ?? 0) : (p.inventory_quantity_australia ?? 0);

  /* ── Add / update / remove products ── */
  const addProduct = (product: ProductRow) => {
    setLineItems(prev => {
      const existing = prev.find(li => li.product.id === product.id);
      if (existing) {
        return prev.map(li =>
          li.product.id === product.id
            ? { ...li, quantity: Math.min(li.quantity + 1, getStock(product)) }
            : li
        );
      }
      if (getStock(product) === 0) {
        toast({ title: "Out of stock", description: `${product.name} has no stock for ${country}.`, variant: "destructive" });
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { removeProduct(productId); return; }
    const li = lineItems.find(l => l.product.id === productId);
    if (!li) return;
    if (qty > getStock(li.product)) {
      toast({ title: "Exceeds stock", description: `Max: ${getStock(li.product)}`, variant: "destructive" });
      return;
    }
    setLineItems(prev => prev.map(l => l.product.id === productId ? { ...l, quantity: qty } : l));
  };

  const removeProduct = (productId: string) =>
    setLineItems(prev => prev.filter(li => li.product.id !== productId));

  /* ── Duplicate detection (item 4) ── */
  const checkForDuplicates = async (): Promise<boolean> => {
    if (!customerEmail.trim()) return false;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, order_items(product_id)")
      .eq("customer_email", customerEmail.trim().toLowerCase())
      .eq("order_source", "MANUAL")
      .gte("created_at", tenMinutesAgo);

    if (!recentOrders || recentOrders.length === 0) return false;

    const currentProductIds = new Set(lineItems.map(li => li.product.id));
    for (const recentOrder of recentOrders) {
      const recentItems: any[] = (recentOrder as any).order_items || [];
      const overlap = recentItems.some((ri: any) => currentProductIds.has(ri.product_id));
      if (overlap) {
        const num = (recentOrder as any).order_number || recentOrder.id.slice(0, 8);
        setDuplicateWarning(`Order ${num} for this customer with overlapping products was created within the last 10 minutes.`);
        return true;
      }
    }
    return false;
  };

  /* ── Invoice generation helpers (item 5) ── */
  const buildOrderContext = () => ({
    orderNumber: null as string | null,
    customerName,
    customerEmail,
    customerPhone,
    country,
    currency,
    isManual: true,
    salesChannel,
    subtotal,
    shippingAmount,
    grandTotal,
    paymentMethod: manualPaymentMethod,
    paymentStatus,
    deliveryMethod,
    courierName: courierName || null,
    trackingNumber: trackingNumber || null,
    adminNotes: adminNotes || null,
    shippingAddress,
  });

  const downloadInvoice = (orderNumber?: string) => {
    const ctx = { ...buildOrderContext(), orderNumber: orderNumber || "DRAFT" };
    const html = buildInvoiceHtml(ctx, lineItems, isIndia, fmt);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${ctx.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Invoice downloaded" });
  };

  const printInvoice = (orderNumber?: string) => {
    const ctx = { ...buildOrderContext(), orderNumber: orderNumber || "DRAFT" };
    const html = buildInvoiceHtml(ctx, lineItems, isIndia, fmt);
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Pop-up blocked — please allow pop-ups", variant: "destructive" }); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  /* ── Core order submission ── */
  const submitOrder = async (action: "create" | "create_print" | "create_download") => {
    /* Validation */
    if (!customerName.trim()) { toast({ title: "Customer name required", variant: "destructive" }); return; }
    if (!customerEmail.trim()) { toast({ title: "Customer email required", variant: "destructive" }); return; }
    if (!customerPhone.trim()) { toast({ title: "Customer phone required", variant: "destructive" }); return; }
    if (lineItems.length === 0) { toast({ title: "Add at least one product", variant: "destructive" }); return; }

    /* Stock check */
    for (const li of lineItems) {
      const stock = getStock(li.product);
      if (li.quantity > stock) {
        toast({ title: "Insufficient stock", description: `${li.product.name}: only ${stock} available.`, variant: "destructive" });
        return;
      }
    }

    /* Duplicate check (item 4) — only if not already confirmed */
    const isDuplicate = await checkForDuplicates();
    if (isDuplicate) {
      setPendingAction(action);
      return; // show warning modal — user must confirm
    }

    await doSubmit(action);
  };

  const doSubmit = async (action: "create" | "create_print" | "create_download") => {
    setSubmitting(true);
    setDuplicateWarning(null);
    setPendingAction(null);

    try {
      const orderData = {
        tax_amount: 0,
        shipping_amount: shippingAmount,
        discount_amount: 0,
        total_amount: grandTotal,
        order_status: "pending",
        payment_status: paymentStatus,
        payment_method: manualPaymentMethod,
        payment_provider: "manual",
        shipping_address: {
          ...shippingAddress,
          firstName: customerName.split(" ")[0] || customerName,
          lastName: customerName.split(" ").slice(1).join(" ") || "",
          phone: customerPhone,
          email: customerEmail,
        },
        market: isIndia ? "IN" : "AU",
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone.trim(),
        is_guest: false,
        source: "ADMIN",
        order_source: "MANUAL",
        sales_channel: salesChannel,
        delivery_method: deliveryMethod,
        manual_payment_method: manualPaymentMethod,
        courier_name: deliveryMethod === "MANUAL_COURIER" ? courierName.trim() || null : null,
        tracking_number: deliveryMethod === "MANUAL_COURIER" ? trackingNumber.trim() || null : null,
        created_by_admin: adminUser?.id ?? null,
        admin_notes: adminNotes.trim() || null,
        courier: deliveryMethod === "MANUAL_COURIER" ? courierName.trim() || null : null,
        user_id: foundUser?.id || null,
      };

      const lineItemsPayload = lineItems.map(li => ({
        product_id: li.product.id,
        product_name: li.product.name,
        quantity: li.quantity,
        price: getItemPrice(li.product),
        currency,
      }));

      const { data: rpcData, error: rpcError } = await supabase.rpc("create_admin_manual_order", {
        p_order_data: orderData,
        p_line_items: lineItemsPayload,
      });

      if (rpcError) throw rpcError;
      if (!rpcData || !rpcData.success) {
        throw new Error(rpcData?.error || "Failed to create transactional manual order.");
      }

      const orderNumber = rpcData.order_number;

      toast({ title: `Order ${orderNumber} created!`, description: `${fmt(grandTotal)} · ${foundUser?.email || ""}` });

      /* 5. Invoice action */
      if (action === "create_print") printInvoice(orderNumber);
      if (action === "create_download") downloadInvoice(orderNumber);

      onOrderCreated();
      onClose();

    } catch (err: any) {
      console.error("Manual order error:", err);
      toast({ title: "Failed to create order", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Render ─── */
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end">
      <div className="relative w-full max-w-2xl h-full bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden">

        {/* ── Duplicate Warning Modal (item 4) ── */}
        {duplicateWarning && (
          <div className="absolute inset-0 z-20 bg-background/95 flex items-center justify-center p-8">
            <div className="border border-amber-300 bg-amber-50 p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">Possible Duplicate Order</p>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">{duplicateWarning}</p>
              <p className="text-xs text-amber-700">A very similar order was recently created for this customer. Create another anyway?</p>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => { if (pendingAction) doSubmit(pendingAction); }}
                  className="flex-1 h-10 text-xs tracking-wide uppercase bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Create Anyway
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setDuplicateWarning(null); setPendingAction(null); }}
                  className="flex-1 h-10 text-xs tracking-wide uppercase"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-foreground text-background flex-shrink-0">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-60">Admin Panel</p>
            <h2 className="text-sm font-medium tracking-wide mt-0.5">Create Manual Order</h2>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">

            {/* ── SECTION 1: Customer Details ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <User className="h-3 w-3" /> Customer Details
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Country *</label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value as CountryType)}
                      className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                    >
                      <option value="Australia">🇦🇺 Australia (AUD)</option>
                      <option value="India">🇮🇳 India (INR)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Customer Name *</label>
                    <Input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Full name"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Email with live user lookup */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Email *</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={e => { setCustomerEmail(e.target.value); setFoundUser(null); setUserNotFound(false); }}
                      onBlur={lookupUser}
                      placeholder="customer@example.com"
                      className="h-10 text-sm pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {lookingUpUser && <div className="w-3.5 h-3.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />}
                      {foundUser && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {userNotFound && <UserX className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                  </div>
                  {foundUser && (
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Linked to account: {foundUser.full_name || foundUser.email}
                    </p>
                  )}
                  {userNotFound && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      User account not found. Orders must be linked to an existing account.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Phone *</label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder={isIndia ? "+91 98765 43210" : "+61 4XX XXX XXX"}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Sales Channel (item 9) */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Sales Channel</label>
                  <select
                    value={salesChannel}
                    onChange={e => setSalesChannel(e.target.value as SalesChannel)}
                    className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                  >
                    {SALES_CHANNELS.map(sc => (
                      <option key={sc.value} value={sc.value}>{sc.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── SECTION 2: Shipping Address ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Shipping Address</p>
              <div className="space-y-3">
                <Input
                  value={shippingAddress.address_line1}
                  onChange={e => setShippingAddress(p => ({ ...p, address_line1: e.target.value }))}
                  placeholder="Street address"
                  className="h-10 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={shippingAddress.city}
                    onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="h-10 text-sm"
                  />
                  <Input
                    value={shippingAddress.state}
                    onChange={e => setShippingAddress(p => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={shippingAddress.postcode}
                    onChange={e => setShippingAddress(p => ({ ...p, postcode: e.target.value }))}
                    placeholder="Postcode / PIN"
                    className="h-10 text-sm"
                  />
                  <div className="h-10 px-3 border border-border bg-secondary text-sm flex items-center text-muted-foreground cursor-not-allowed">{country}</div>
                </div>
              </div>
            </section>

            {/* ── SECTION 3: Products ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Package className="h-3 w-3" /> Products
              </p>

              <div className="relative mb-4" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search products…"
                    className="w-full h-10 pl-9 pr-4 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                  />
                </div>
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full bg-background border border-border shadow-lg mt-1 max-h-52 overflow-y-auto">
                    {filteredProducts.map(p => {
                      const stock = getStock(p);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addProduct(p)}
                          disabled={stock === 0}
                          className="w-full px-4 py-2.5 text-left hover:bg-secondary transition-colors border-b border-border/30 last:border-0 flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <div>
                            <p className="text-sm font-light">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{fmt(getItemPrice(p))} · Stock: {stock}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
                {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full bg-background border border-border shadow-lg mt-1 px-4 py-3 text-xs text-muted-foreground">
                    No products matching "{productSearch}"
                  </div>
                )}
              </div>

              {lineItems.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4 border border-dashed border-border">No products added yet</p>
              ) : (
                <div className="space-y-2">
                  {lineItems.map(li => (
                    <div key={li.product.id} className="flex items-center justify-between border border-border px-4 py-3 bg-secondary/30">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-light truncate">{li.product.name}</p>
                        <p className="text-[10px] text-muted-foreground">{fmt(getItemPrice(li.product))} · Stock: {getStock(li.product)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => updateQty(li.product.id, li.quantity - 1)} className="w-7 h-7 border border-border flex items-center justify-center hover:bg-background transition-colors"><Minus className="h-3 w-3" /></button>
                        <span className="text-sm font-mono w-6 text-center">{li.quantity}</span>
                        <button type="button" onClick={() => updateQty(li.product.id, li.quantity + 1)} className="w-7 h-7 border border-border flex items-center justify-center hover:bg-background transition-colors"><Plus className="h-3 w-3" /></button>
                        <span className="text-sm font-mono w-20 text-right">{fmt(getItemPrice(li.product) * li.quantity)}</span>
                        <button type="button" onClick={() => removeProduct(li.product.id)} className="ml-2 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}


            </section>

            {/* ── SECTION 4: Delivery ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <Truck className="h-3 w-3" /> Delivery Method
              </p>
              <div className="space-y-3">
                <select
                  value={deliveryMethod}
                  onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)}
                  className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors"
                >
                  {DELIVERY_METHODS.map(dm => <option key={dm.value} value={dm.value}>{dm.label}</option>)}
                </select>

                {deliveryMethod === "MANUAL_COURIER" && (
                  <div className="grid grid-cols-1 gap-3 pl-3 border-l-2 border-border">
                    <Input value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Courier name (e.g. India Post, FedEx)" className="h-10 text-sm" />
                    <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking number" className="h-10 text-sm" />
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Shipping Charge ({currency})</label>
                      <Input type="number" min={0} value={customShippingCharge} onChange={e => setCustomShippingCharge(parseFloat(e.target.value) || 0)} className="h-10 text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION 5: Payment ── */}
            <section>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Payment
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Payment Method</label>
                  <select value={manualPaymentMethod} onChange={e => setManualPaymentMethod(e.target.value as ManualPaymentMethod)} className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors">
                    {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Payment Status</label>
                  <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)} className="w-full h-10 px-3 text-sm bg-transparent border border-border outline-none focus:border-foreground transition-colors">
                    {PAYMENT_STATUSES.map(ps => <option key={ps.value} value={ps.value}>{ps.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* ── SECTION 6: Notes ── */}
            <section>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground block mb-2">Admin Notes (optional)</label>
              <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes for this order…" className="text-sm min-h-[70px]" />
            </section>

          </div>
        </div>

        {/* ── Sticky Order Summary + Submit (item 5 — three buttons) ── */}
        <div className="border-t border-border px-6 py-5 bg-background flex-shrink-0">
          {/* Totals */}
          <div className="space-y-1 mb-4 text-xs font-mono">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({lineItems.length} item{lineItems.length !== 1 ? "s" : ""})</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping {deliveryMethod === "HAND_DELIVERY" ? "(Hand Delivery)" : deliveryMethod === "STORE_PICKUP" ? "(Store Pickup)" : ""}</span>
              <span>{shippingAmount === 0 ? "Free" : fmt(shippingAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-sm text-foreground border-t border-border pt-2 mt-2">
              <span>Grand Total</span>
              <span className="text-base">{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Customer info chip */}
          {foundUser && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 mb-3">
              <CheckCircle className="h-3 w-3 flex-shrink-0" />
              Linked to account: <strong>{foundUser.email}</strong>
            </div>
          )}
          {userNotFound && customerEmail && (
            <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 mb-3">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Orders must be linked to an existing customer account.
            </div>
          )}

          {/* Three action buttons (item 5) */}
          <div className="space-y-2">
            <Button
              id="admin-manual-order-submit"
              onClick={() => submitOrder("create")}
              disabled={submitting || lineItems.length === 0 || !foundUser}
              className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.12em] uppercase"
            >
              {submitting ? "Creating Order…" : `Create Order — ${fmt(grandTotal)}`}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                id="admin-manual-order-print"
                onClick={() => submitOrder("create_print")}
                disabled={submitting || lineItems.length === 0 || !foundUser}
                variant="outline"
                className="h-10 text-xs tracking-[0.08em] uppercase flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Create & Print
              </Button>
              <Button
                id="admin-manual-order-download"
                onClick={() => submitOrder("create_download")}
                disabled={submitting || lineItems.length === 0 || !foundUser}
                variant="outline"
                className="h-10 text-xs tracking-[0.08em] uppercase flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Create & Save PDF
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            No Stripe or Shiprocket API calls · Channel: {salesChannel}
          </p>
        </div>
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 -z-10" onClick={() => { if (!duplicateWarning) onClose(); }} />
    </div>
  );
};

export default AdminManualOrder;
