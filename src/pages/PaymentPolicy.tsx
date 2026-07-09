import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { CreditCard, ShieldCheck, Mail, Phone, RefreshCw, DollarSign } from "lucide-react";

const PaymentPolicy = () => {
  useSEO({
    title: "Payment Policy",
    description: "Learn about Scalvea's secure payment methods, billing, tax regulations, and failed transaction resolution guidelines for India and Australia.",
    keywords: "Scalvea payment methods, UPI, credit cards, Stripe, secure checkout, billing support",
  });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col justify-between">
      {/* Global Grain/Noise Overlay */}
      <div className="fixed inset-0 noise-bg pointer-events-none z-40 select-none opacity-[0.015]" />

      <div>
        <Header />
        
        <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
          {/* Page Header */}
          <div className="text-center mb-16 md:mb-20">
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-450 font-medium block mb-3">
              BILLING & PAYMENTS
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.05em] mb-4 text-neutral-900 uppercase">
              Payment Policy
            </h1>
            <div className="h-[1px] bg-neutral-200 w-16 mx-auto mb-6" />
            <p className="text-xs text-neutral-500 max-w-md mx-auto font-light leading-relaxed">
              Transparent transactions, state-of-the-art encryption, and multi-currency compliance across India and Australia.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-12 text-sm text-neutral-600 font-light leading-relaxed">
            
            {/* Section 1: Payment Methods */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <CreditCard className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Accepted Payment Methods</h2>
              </div>
              <p className="mb-4">
                Scalvea offers multiple payment modes tailored to local customer convenience in our primary operational regions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="border border-neutral-100 p-5 bg-neutral-50/50">
                  <h3 className="text-neutral-900 font-medium text-xs tracking-[0.08em] uppercase mb-2">🇮🇳 India Payments</h3>
                  <ul className="space-y-1.5 text-xs text-neutral-600 list-disc list-inside">
                    <li>Unified Payments Interface (UPI) — GPay, PhonePe, Paytm, BHIM</li>
                    <li>Major Credit Cards (Visa, Mastercard, RuPay)</li>
                    <li>Debit Cards issued by Indian Banks</li>
                    <li>Net Banking with 50+ major financial institutions</li>
                    <li>Popular Mobile Wallets</li>
                    <li>Cash on Delivery (COD) — subject to location availability</li>
                  </ul>
                </div>
                <div className="border border-neutral-100 p-5 bg-neutral-50/50">
                  <h3 className="text-neutral-900 font-medium text-xs tracking-[0.08em] uppercase mb-2">🇦🇺 Australia & International</h3>
                  <ul className="space-y-1.5 text-xs text-neutral-600 list-disc list-inside">
                    <li>Credit and Debit Cards (Visa, Mastercard, American Express)</li>
                    <li>Stripe Secure Checkout</li>
                    <li>Apple Pay & Google Pay (where supported)</li>
                    <li>International Transactions processed in Australian Dollars (AUD)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2: Secure Payments */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <ShieldCheck className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Secure Checkout & Compliance</h2>
              </div>
              <p className="mb-3">
                Your online security is our absolute priority. We employ industry-standard encryption protocols (SSL/TLS) to secure all data transmissions during checkout.
              </p>
              <p className="mb-3">
                All transactions are processed through Payment Card Industry (PCI) compliant gateways. Scalvea does not store, capture, or have access to your raw credit/debit card numbers or CVV. Financial tokens are securely routed directly to payment processors.
              </p>
            </div>

            {/* Section 3: Currency & Taxes */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <DollarSign className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Currency & Taxation</h2>
              </div>
              <p className="mb-3">
                Prices dynamically update according to your selected delivery region:
              </p>
              <ul className="space-y-2 mb-4 list-disc list-inside pl-2">
                <li><strong>India:</strong> Transactions are billed in Indian Rupees (INR). Pricing includes all applicable local taxes.</li>
                <li><strong>Australia:</strong> Transactions are billed in Australian Dollars (AUD). Listed pricing is inclusive of Goods and Services Tax (GST) where required.</li>
              </ul>
              <p>
                International bank conversion fees or local import custom duties are the sole responsibility of the customer.
              </p>
            </div>

            {/* Section 4: Payment Confirmation */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <ShieldCheck className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Order & Payment Confirmation</h2>
              </div>
              <p className="mb-3">
                Once a transaction is authorized, you will receive:
              </p>
              <ul className="space-y-1.5 list-disc list-inside pl-2 mb-3">
                <li>An automated **Order Confirmation Email** confirming details of your purchase.</li>
                <li>A digital **Payment Receipt** showing items, totals, and transactional reference codes.</li>
              </ul>
              <p>
                In cases of pending payment verification (e.g. wire delays), orders will remain in a "Payment Pending" state and dispatch will hold until clearance.
              </p>
            </div>

            {/* Section 5: Failed Transactions */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <RefreshCw className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Resolving Failed Transactions</h2>
              </div>
              <p className="mb-3">
                If money has been deducted from your account, but you have not received an order confirmation email or a redirect message:
              </p>
              <ol className="space-y-2 list-decimal list-inside pl-2">
                <li><strong>Do Not Re-Attempt Immediately:</strong> Wait 5–10 minutes to verify if you receive a delayed confirmation email.</li>
                <li><strong>Automatic Bank Reversal:</strong> In most cases of connection failure, payment gateways initiate an automatic refund to your source bank account within 3–7 business days.</li>
                <li><strong>Contact Support:</strong> If the funds remain debited after 24 hours, contact us with transaction IDs, dates, and account details. We will manually trace the status and coordinate reconciliation.</li>
              </ol>
            </div>

            {/* Section 6: Contacts */}
            <div className="bg-neutral-50 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <h3 className="text-neutral-900 font-semibold text-xs tracking-[0.1em] uppercase mb-1">Billing Support</h3>
                <p className="text-xs text-neutral-500 font-light">Have questions about a charge or pending invoice? Get in touch.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-xs shrink-0">
                <a href="mailto:scalvea.operations@gmail.com" className="flex items-center gap-2 text-neutral-700 hover:text-black transition-colors font-medium">
                  <Mail className="size-[15px] text-neutral-450" />
                  <span>scalvea.operations@gmail.com</span>
                </a>
                <a href="tel:+919877191114" className="flex items-center gap-2 text-neutral-700 hover:text-black transition-colors font-medium">
                  <Phone className="size-[15px] text-neutral-450" />
                  <span>+91 98771 91114</span>
                </a>
              </div>
            </div>

          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default PaymentPolicy;
