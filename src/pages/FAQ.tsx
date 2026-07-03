import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      { q: "How long does shipping take?", a: "Shipping times vary by country. Australia: 3–7 business days, India: 7–14 business days, USA: 5–10 business days. You'll receive a tracking number once your order ships." },
      { q: "Do you offer free shipping?", a: "Yes! Free shipping is available on orders above a certain threshold, which varies by country. Check the announcement bar at the top of the site for your country's free shipping minimum." },
      { q: "Can I track my order?", a: "Absolutely. Once your order has been dispatched, you'll receive an email with a tracking link. You can also check your order status from your Account page." },
      { q: "Do you ship internationally?", a: "We currently ship to Australia, India, and the USA. Select your country from the globe icon in the navigation bar to see local pricing and shipping details." },
    ],
  },
  {
    category: "Products",
    items: [
      { q: "What is Follicle 8 Serum?", a: "Follicle 8 is our flagship hair growth serum formulated with 8 clinically proven active ingredients including Redensyl, Baicapil, Procapil, and Anagain. It targets hair thinning at the root cause." },
      { q: "Are your products suitable for all hair types?", a: "Yes, all SCALVEA products are formulated to work across all hair types — straight, wavy, curly, and coily. They are also suitable for both men and women." },
      { q: "Are your products cruelty-free?", a: "Yes. SCALVEA is 100% cruelty-free. We never test on animals and our formulations are vegan-friendly." },
      { q: "How long before I see results?", a: "Most customers begin noticing reduced hair fall within 4–6 weeks and visible new growth within 8–12 weeks of consistent daily use." },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      { q: "What is your return policy?", a: "We accept returns within 30 days of delivery for unopened products in their original packaging. Please visit our Returns Policy page for full details." },
      { q: "How do I initiate a return?", a: "Contact us at scalvea.operations@gmail.com with your order number and reason for return. Our team will provide return instructions within 24 hours." },
      { q: "When will I receive my refund?", a: "Refunds are processed within 5–7 business days after we receive and inspect the returned product. The refund will be credited to your original payment method." },
    ],
  },
  {
    category: "Account & Payments",
    items: [
      { q: "Do I need an account to place an order?", a: "Yes, you'll need to create an account or sign in before checkout. This allows you to track orders, save addresses, and manage your profile." },
      { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards via Stripe, as well as Cash on Delivery (COD) for eligible regions." },
      { q: "Is my payment information secure?", a: "Absolutely. All payments are processed through Stripe, which uses bank-level encryption and is PCI DSS compliant. We never store your card details." },
    ],
  },
];

const FAQ = () => {
  useSEO({
    title: "Frequently Asked Questions (FAQs)",
    description: "Find answers to frequently asked questions about Scalvea products, order tracking, shipping rates, and returns policy.",
    keywords: "Scalvea FAQ, Scalvea questions, hair growth serum guide, track order, refund status",
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.flatMap(section => 
        section.items.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      )
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.04em] mb-4">Frequently Asked Questions</h1>
          <p className="text-sm text-muted-foreground mb-12">
            Everything you need to know about SCALVEA products, orders, and policies.
          </p>

          <div className="space-y-10">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-xs tracking-[0.15em] uppercase mb-4">{section.category}</h2>
                <Accordion type="single" collapsible className="border-t border-border">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.category}-${i}`} className="border-b border-border">
                      <AccordionTrigger className="text-sm font-normal py-4 hover:no-underline">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-16 border border-border p-8 text-center">
            <h3 className="text-xs tracking-[0.15em] uppercase mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">We're here to help. Reach out and we'll get back to you within 24 hours.</p>
            <a href="/contact" className="inline-block text-xs tracking-[0.12em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
