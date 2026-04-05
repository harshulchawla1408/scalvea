import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="px-6 lg:px-12 py-12 lg:py-16 max-w-3xl">
      <h1 className="text-3xl font-light tracking-[0.04em] mb-8">Terms of Service</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Welcome to Scalvea. By accessing or using our website, you agree to be bound by these Terms of Service.</p>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Products & Pricing</h2>
          <p>All prices are listed in Australian Dollars (AUD) and include GST where applicable. We reserve the right to modify prices at any time without notice.</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Orders</h2>
          <p>By placing an order, you warrant that you are at least 18 years old. We reserve the right to refuse or cancel orders at our discretion.</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Governing Law</h2>
          <p>These terms are governed by the laws of the State of Victoria, Australia.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
