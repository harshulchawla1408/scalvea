import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Truck, MapPin, Box, ShieldAlert, Mail, Phone, Globe } from "lucide-react";

const ShippingPolicy = () => {
  useSEO({
    title: "Shipping & Delivery Policy",
    description: "Learn about Scalvea's order processing timelines, delivery networks (Shiprocket and Australia Post), shipping fees, and package damage guidelines.",
    keywords: "Scalvea shipping rates, transit times, Shiprocket India, Australia Post, order tracking, transit damage claim",
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
            <span className="text-[9px] tracking-[0.3em] uppercase text-neutral-455 font-medium block mb-3">
              FULFILLMENT & LOGISTICS
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.05em] mb-4 text-neutral-900 uppercase">
              Shipping Policy
            </h1>
            <div className="h-[1px] bg-neutral-200 w-16 mx-auto mb-6" />
            <p className="text-xs text-neutral-500 max-w-md mx-auto font-light leading-relaxed">
              Fast, reliable delivery networks connecting our laboratory directly to your doorstep in India and Australia.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-12 text-sm text-neutral-600 font-light leading-relaxed">
            
            {/* Section 1: Order Processing */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <Box className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Order Processing Timelines</h2>
              </div>
              <p className="mb-3">
                All standard orders are processed and prepared for dispatch within **1–2 business days** (excluding weekends and public holidays). 
              </p>
              <p>
                Once your order has been packed and handed over to our delivery partners, a shipping confirmation email containing your tracking ID and courier assignment will be dispatched automatically.
              </p>
            </div>

            {/* Section 2: Regional Delivery Networks */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <MapPin className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Regional Delivery Networks & Transit Times</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="border border-neutral-100 p-5 bg-neutral-50/50">
                  <h3 className="text-neutral-900 font-semibold text-xs tracking-[0.08em] uppercase mb-2">🇮🇳 India Shipping</h3>
                  <p className="mb-2 text-xs">
                    Fulfillment is handled via the **Shiprocket courier network**, routing packages through highly trusted express couriers (Bluedart, Delhivery, Amazon Shipping).
                  </p>
                  <ul className="space-y-1 text-xs text-neutral-600 list-disc list-inside">
                    <li>Estimated delivery: <strong>2–7 business days</strong>.</li>
                    <li>Remote locations or containment areas may require additional transit buffer.</li>
                  </ul>
                </div>
                <div className="border border-neutral-100 p-5 bg-neutral-50/50">
                  <h3 className="text-neutral-900 font-semibold text-xs tracking-[0.08em] uppercase mb-2">🇦🇺 Australia Shipping</h3>
                  <p className="mb-2 text-xs">
                    Fulfillment is processed via **Australia Post** and partner local couriers directly from our regional fulfillment centers.
                  </p>
                  <ul className="space-y-1 text-xs text-neutral-600 list-disc list-inside">
                    <li>Standard delivery: <strong>3–8 business days</strong>.</li>
                    <li>Express options available during checkout.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 3: International Shipping */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <Globe className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">International Fulfillments</h2>
              </div>
              <p className="mb-3">
                Scalvea currently operates dedicated warehouses and localized shipping solutions focusing primarily on **India** and **Australia**.
              </p>
              <p>
                International shipping to other regions is temporarily restricted. We are actively expanding our distribution network. Updates on worldwide shipping channels will be shared via our newsletter list.
              </p>
            </div>

            {/* Section 4: Shipping Charges */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <Truck className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Shipping Charges & Promos</h2>
              </div>
              <p className="mb-3">
                Shipping rates are calculated dynamically at checkout and vary based on:
              </p>
              <ul className="space-y-1.5 list-disc list-inside mb-4 pl-2">
                <li>Destination Country and postal code density</li>
                <li>Total package weight and volumetric dimensions</li>
                <li>Overall Order Value</li>
              </ul>
              <p>
                Free standard shipping eligibility thresholds may apply during specific marketing campaigns or promotional seasons.
              </p>
            </div>

            {/* Section 5: Undeliverable Orders */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <ShieldAlert className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Failed Delivery & Returns to Origin</h2>
              </div>
              <p className="mb-3">
                Our logistics partners will attempt package delivery up to three times. An order may be marked undeliverable and returned to our warehouse if:
              </p>
              <ul className="space-y-1.5 list-disc list-inside mb-4 pl-2">
                <li>An incorrect, incomplete, or invalid shipping address was provided at checkout.</li>
                <li>The customer remains unreachable after multiple phone and address attempts.</li>
                <li>The delivery is consistently refused at the destination.</li>
              </ul>
              <p>
                Returned shipments may incur additional surcharge fees to cover logistics, and subsequent re-shipments will be billed to the customer.
              </p>
            </div>

            {/* Section 6: Damaged Packages in Transit */}
            <div className="border-b border-neutral-100 pb-10">
              <div className="flex gap-4 items-start mb-4">
                <ShieldAlert className="size-[20px] text-neutral-800 shrink-0 mt-0.5" />
                <h2 className="text-neutral-950 text-xs tracking-[0.15em] uppercase font-semibold">Damaged Shipments & Claims</h2>
              </div>
              <p className="mb-3">
                Every Scalvea package is checked for strict quality assurance prior to packing. However, if your shipment arrives physically damaged or unsealed:
              </p>
              <ul className="space-y-1.5 list-disc list-inside mb-4 pl-2">
                <li>Contact our customer support team within **48 hours** of package arrival.</li>
                <li>Submit clear photographs of the outer container box, the inner product bottles, and the shipping label.</li>
                <li>Retain all packing materials until the support claim is reviewed.</li>
              </ul>
              <p>
                Failure to file claims within the 48-hour window may result in the claim being rejected by courier partners.
              </p>
            </div>

            {/* Section 7: Contacts */}
            <div className="bg-neutral-50 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <h3 className="text-neutral-900 font-semibold text-xs tracking-[0.1em] uppercase mb-1">Fulfillment Support</h3>
                <p className="text-xs text-neutral-500 font-light">Need to trace a package or change shipping details? Contact us.</p>
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

export default ShippingPolicy;
