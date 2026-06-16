import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";

const ReturnsPolicy = () => {
  useSEO({
    title: "Returns & Refunds Policy",
    description: "Read about Scalvea's 30-day money-back guarantee, return shipment procedures, and refund processing timelines.",
    keywords: "Scalvea returns, refund policy, money back guarantee",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-16 max-w-3xl">
        <h1 className="text-3xl font-light tracking-[0.04em] mb-8">Returns & Refunds</h1>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <div>
            <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">30-Day Money-Back Guarantee</h2>
            <p>If you're not satisfied with your purchase, you may return unopened products within 30 days of delivery for a full refund. Opened products may be returned within 14 days if you experience any adverse reaction.</p>
          </div>
          <div>
            <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">How to Return</h2>
            <p>Contact our customer care team at +61 460 309 333 or email us through the contact page. We will provide a return shipping label and instructions.</p>
          </div>
          <div>
            <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Refund Processing</h2>
            <p>Refunds are processed within 5-7 business days after we receive your returned item. The refund will be issued to your original payment method.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReturnsPolicy;
