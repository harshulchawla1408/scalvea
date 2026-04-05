import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="px-6 lg:px-12 py-12 lg:py-16 max-w-3xl">
      <h1 className="text-3xl font-light tracking-[0.04em] mb-8">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>Scalvea ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Information We Collect</h2>
          <p>We collect information you provide directly, including your name, email address, shipping address, phone number, and payment information when you make a purchase.</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">How We Use Your Information</h2>
          <p>We use your information to process orders, communicate about your purchases, improve our products and services, and send marketing communications (with your consent).</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Data Security</h2>
          <p>We implement industry-standard security measures to protect your personal information. Payment processing is handled securely through encrypted channels.</p>
        </div>
        <div>
          <h2 className="text-foreground text-xs tracking-[0.12em] uppercase mb-2">Contact</h2>
          <p>For privacy inquiries, contact us at 263 Heaths Rd, Werribee VIC 3030, Australia or call +61 460 309 333.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
