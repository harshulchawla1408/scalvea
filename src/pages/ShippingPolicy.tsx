import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const ShippingPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="px-6 lg:px-12 py-12 lg:py-16 max-w-3xl">
      <h1 className="text-3xl font-light tracking-[0.04em] mb-8">Shipping Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Domestic Shipping (Australia)</h2>
          <p>Standard shipping: 3-7 business days — $9.95 AUD</p>
          <p>Express shipping: 1-3 business days — $14.95 AUD</p>
          <p>Free standard shipping on orders over $75 AUD.</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">International Shipping</h2>
          <p>International standard: 7-14 business days — $19.95 AUD</p>
          <p>International express: 3-7 business days — $29.95 AUD</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Order Processing</h2>
          <p>Orders are processed within 1-2 business days. You will receive a tracking number via email once your order has shipped.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default ShippingPolicy;
