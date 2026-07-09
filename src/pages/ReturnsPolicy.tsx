import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { ShieldAlert, CheckCircle2, XCircle, Clock, RefreshCw, Mail, Phone, ArrowLeftRight } from "lucide-react";

const ReturnsPolicy = () => {
  useSEO({
    title: "Return & Refund Policy",
    description: "Review Scalvea's Return and Refund Policy. Learn about eligibility criteria under Australian Consumer Law and Indian Consumer Guidelines.",
    keywords: "Scalvea returns policy, refund guidelines, change of mind, product leakage refund, unboxing video verification",
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
              TERMS & CONDITIONS
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.05em] mb-4 text-neutral-900 uppercase">
              Return & Refund Policy
            </h1>
            <div className="h-[1px] bg-neutral-200 w-16 mx-auto mb-6" />
            <p className="text-xs text-neutral-500 max-w-md mx-auto font-light leading-relaxed">
              Transparent, strict guidelines on safety, hygiene, and transit damage claims to preserve laboratory-grade quality.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-12 text-sm text-neutral-600 font-light leading-relaxed">
            
            {/* Section 1: Change of Mind Declaration */}
            <div className="border border-neutral-100 bg-neutral-50/50 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="flex gap-4 items-start">
                <ShieldAlert className="size-[22px] text-neutral-800 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs tracking-[0.15em] uppercase font-semibold text-neutral-950 mb-2">
                    No Change of Mind Returns
                  </h3>
                  <p className="text-xs text-neutral-600 font-light leading-relaxed">
                    Due to the clinical nature and strict hygiene and health safety protocols of personal haircare products, **Scalvea does not accept returns or refunds simply because a customer changed their mind.** Once a product leaves our fulfillment center, its integrity cannot be guaranteed for re-sale. Please choose your products carefully.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Eligibility Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-neutral-100 pb-10">
              {/* Eligible */}
              <div>
                <div className="flex gap-3 items-center mb-4">
                  <CheckCircle2 className="size-[18px] text-neutral-800" />
                  <h3 className="text-neutral-950 text-xs tracking-[0.1em] uppercase font-semibold">Eligible for Claim</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-3 font-light">Claims can only be filed if products arrive in the following conditions:</p>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✔</span>
                    <span>Incorrect product or variant delivered.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✔</span>
                    <span>Product damaged physically during transit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✔</span>
                    <span>Manufacturing defects in pump, spray, or bottle.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✔</span>
                    <span>Shipping box arrived completely opened/unsealed.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✔</span>
                    <span>Product leakage or bottle seal failure during transit.</span>
                  </li>
                </ul>
              </div>

              {/* Ineligible */}
              <div>
                <div className="flex gap-3 items-center mb-4">
                  <XCircle className="size-[18px] text-neutral-800" />
                  <h3 className="text-neutral-950 text-xs tracking-[0.1em] uppercase font-semibold">Ineligible for Claim</h3>
                </div>
                <p className="text-xs text-neutral-500 mb-3 font-light">Claims will be immediately rejected for the following reasons:</p>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✘</span>
                    <span>Used, tested, or partially consumed products.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✘</span>
                    <span>Opened products (seal broken or cap removed).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✘</span>
                    <span>Change of mind or personal preference.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✘</span>
                    <span>Allergic reactions (unless required by consumer law).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neutral-900 font-medium">✘</span>
                    <span>Incorrect product ordering selected by the customer.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3: The Claim Process */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <RefreshCw className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">The Refund & Replacement Process</h2>
              </div>
              <p className="mb-3">
                To submit a claim, please follow these steps:
              </p>
              <ol className="space-y-3 list-decimal list-inside pl-2">
                <li>
                  <strong>Contact Support:</strong> Email `scalvea.operations@gmail.com` within **48 hours** of package delivery. Include your Order Number in the subject line.
                </li>
                <li>
                  <strong>Provide Evidence:</strong> Attach clear photos of the damaged items and the shipping box. *An unboxing video is highly recommended* to ensure smooth and fast processing.
                </li>
                <li>
                  <strong>Evaluation:</strong> Our quality assurance team will inspect the case details within 2 business days.
                </li>
                <li>
                  <strong>Reverse Pickup:</strong> If eligible, we will arrange a reverse pickup at our cost, or request you to return the item (which will be reimbursed).
                </li>
              </ol>
            </div>

            {/* Section 4: Refund Timelines */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <Clock className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Refund Timelines</h2>
              </div>
              <p className="mb-4">
                Refunds are processed back to the original payment source once the returned package is received and inspected at our fulfillment center.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-neutral-100 p-4">
                  <span className="text-[10px] uppercase font-semibold tracking-wider block mb-1">🇮🇳 India Refund Timeline</span>
                  <span className="text-xs font-semibold text-neutral-850">5–7 business days</span>
                </div>
                <div className="border border-neutral-100 p-4">
                  <span className="text-[10px] uppercase font-semibold tracking-wider block mb-1">🇦🇺 Australia Refund Timeline</span>
                  <span className="text-xs font-semibold text-neutral-850">5–10 business days</span>
                </div>
              </div>
            </div>

            {/* Section 5: Replacement & Cancellation */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <ArrowLeftRight className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Replacement & Order Cancellation</h2>
              </div>
              <p className="mb-3">
                <strong>Replacement Preference:</strong> To resolve claims quickly and efficiently, Scalvea will always prioritize shipping a replacement product over processing a monetary refund whenever stock is available.
              </p>
              <p>
                <strong>Order Cancellation:</strong> You can request order cancellation only *prior to dispatch*. Once the shipment leaves our fulfillment facility and tracking details are generated, cancellations cannot be processed.
              </p>
            </div>

            {/* Section 6: Legal Declarations */}
            <div className="border-b border-neutral-100 pb-10">
              <h2 className="text-neutral-950 text-[10px] tracking-[0.12em] uppercase font-semibold mb-2">Legal Compliance Statements</h2>
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                This policy is structured to align generally with the Consumer Protection rules in India and the Australian Consumer Law (ACL) regarding guarantees on items fit for purpose. It outlines operational procedures and does not substitute or constitute official legal advice.
              </p>
            </div>

            {/* Section 7: Contacts */}
            <div className="bg-neutral-50 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <h3 className="text-neutral-900 font-semibold text-xs tracking-[0.1em] uppercase mb-1">Returns Support</h3>
                <p className="text-xs text-neutral-500 font-light">Need to file a claim or check return status? Get in touch.</p>
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

export default ReturnsPolicy;
