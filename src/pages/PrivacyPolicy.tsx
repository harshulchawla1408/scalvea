import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { getStoreSettings, StoreSettings, DEFAULT_SETTINGS } from "@/utils/settingsService";

const PrivacyPolicy = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  useSEO({
    title: "Privacy Policy",
    description: "Learn how Scalvea collects, uses, and safeguards your personal data under global data protection standards.",
    keywords: "Scalvea privacy, data security, customer information protection",
  });

  return (
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
            <p>For privacy inquiries, contact us at {settings.au_address} or call {settings.au_phone}.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
