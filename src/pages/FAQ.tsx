import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";

const faqs = [
  {
    category: "Orders & Shipping",
    items: [
      {
        q: "Which countries does Scalvea currently ship to?",
        a: "Scalvea currently ships exclusively to Australia and India. Select your country using the country selector to view local pricing, payment methods, and shipping information."
      },
      {
        q: "How long does shipping take?",
        a: "Australia: approximately 3–7 business days. India: approximately 4–6 business days depending on your location. Delivery estimates are shown during checkout."
      },
      {
        q: "Can I track my order?",
        a: "Yes. Once your order has been dispatched, you'll receive a tracking link via email. You can also view your order status anytime from your Scalvea account."
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes. Free shipping is available once your order reaches the minimum purchase amount for your selected country. The current threshold is displayed throughout the website."
      },
      {
        q: "Can I change or cancel my order after placing it?",
        a: "If your order has not yet been processed or shipped, please contact our support team as soon as possible. Once an order has been dispatched, modifications or cancellations may no longer be possible."
      }
    ]
  },

  {
    category: "Products",
    items: [
      {
        q: "What is Follicle 8 Hair Growth Serum?",
        a: "Follicle 8 is Scalvea's advanced hair growth serum formulated with clinically researched active ingredients including Anagain®, Redensyl®, Baicapil®, and Procapil® to support stronger, healthier-looking hair from the root."
      },
      {
        q: "What is Scalp-5 Anti Dandruff Serum?",
        a: "Scalp-5 is a lightweight scalp serum formulated with Rosemary Oil, Piroctone Olamine, Salicylic Acid, and Vitamin E to help reduce visible dandruff, soothe scalp irritation, and promote a healthier scalp environment."
      },
      {
        q: "Can I use both products together?",
        a: "Yes. Follicle 8 and Scalp-5 are designed to complement each other. A healthy scalp creates a better environment for stronger, healthier hair growth."
      },
      {
        q: "Are Scalvea products suitable for both men and women?",
        a: "Yes. All Scalvea products are suitable for both men and women and work across all hair types including straight, wavy, curly, and coily hair."
      },
      {
        q: "Are your products cruelty-free?",
        a: "Yes. Scalvea products are cruelty-free and are never tested on animals."
      }
    ]
  },

  {
    category: "Hair Care & Results",
    items: [
      {
        q: "How long does it take to see results?",
        a: "Results vary from person to person depending on hair condition and consistency of use. Many customers notice reduced hair fall within 4–6 weeks, while healthier-looking hair growth typically becomes more visible after 8–12 weeks."
      },
      {
        q: "How often should I use the serums?",
        a: "For best results, use the products consistently as directed on the packaging. Daily application is recommended unless otherwise instructed."
      },
      {
        q: "Can I use the serums with other hair care products?",
        a: "Yes. Scalvea serums can be incorporated into most hair care routines. Apply them to a clean scalp and allow sufficient time for absorption before using styling products."
      },
      {
        q: "Will the serum make my hair greasy?",
        a: "No. Our lightweight formulations are designed for everyday use and absorb quickly without leaving a heavy or greasy residue."
      }
    ]
  },

  {
    category: "Ingredients & Safety",
    items: [
      {
        q: "What makes Scalvea different?",
        a: "Scalvea focuses on ingredient transparency and clinically researched formulations. Every product is developed using carefully selected active ingredients at effective concentrations without unnecessary fillers."
      },
      {
        q: "Are the ingredients clinically researched?",
        a: "Yes. Our formulations feature clinically researched ingredients such as Anagain®, Redensyl®, Baicapil®, Procapil®, Piroctone Olamine, Rosemary Oil, Salicylic Acid, and Vitamin E."
      },
      {
        q: "Are your products suitable for sensitive scalps?",
        a: "Our formulations are designed to be gentle for everyday use. If you have a particularly sensitive scalp or known allergies, we recommend performing a patch test before full application."
      },
      {
        q: "Can pregnant or breastfeeding individuals use these products?",
        a: "If you are pregnant, breastfeeding, or under medical treatment, we recommend consulting your healthcare professional before using any new hair care product."
      }
    ]
  },

  {
    category: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns for eligible unopened products in accordance with our Returns & Refund Policy. Please review the policy page for complete eligibility requirements."
      },
      {
        q: "How do I request a return?",
        a: "Simply contact our support team through the Contact page with your order number and reason for the request. We'll guide you through the process."
      },
      {
        q: "When will I receive my refund?",
        a: "Once your returned product has been received and inspected, eligible refunds are generally processed within 5–7 business days back to the original payment method."
      }
    ]
  },

  {
    category: "Account & Payments",
    items: [
      {
        q: "Do I need an account to place an order?",
        a: "Yes. Creating a Scalvea account allows you to securely place orders, track deliveries, manage addresses, and view your order history."
      },
      {
        q: "Which payment methods are available?",
        a: "Payment options depend on your selected country. Australian orders are securely processed through Stripe using major debit and credit cards. Eligible Indian orders may also have Cash on Delivery available where applicable."
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. Payments are processed using secure, industry-standard payment providers. Scalvea never stores your complete card details."
      }
    ]
  },

  {
    category: "Scalvea",
    items: [
      {
        q: "Where is Scalvea based?",
        a: "Scalvea is an Australian hair care brand with operations in both Australia and India, focused on delivering clinically inspired, science-backed hair care solutions."
      },
      {
        q: "How can I contact Scalvea?",
        a: "Our support team is available through the Contact page. Simply submit your enquiry and we'll respond as quickly as possible."
      },
      {
        q: "Where can I learn more about your ingredients?",
        a: "Detailed ingredient information is available on individual product pages, where you'll find the purpose and benefits of every key active ingredient used in our formulations."
      }
    ]
  }
];

const FAQ = () => {
  useSEO({
    title: "Frequently Asked Questions",
    description: "Find answers to frequently asked questions about Scalvea products, order tracking, shipping rates, and our returns policy.",
    canonical: "https://scalvea.com/faq",
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
