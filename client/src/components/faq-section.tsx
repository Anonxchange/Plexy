import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I deposit crypto from an exchange?",
    answer: "You can deposit crypto easily by selecting 'Receive' in your wallet, choosing your asset, and copying your unique address. Then, simply paste this address into the withdrawal section of your preferred exchange like Binance or Coinbase."
  },
  {
    question: "Is my recovery phrase stored anywhere?",
    answer: "No. Your recovery phrase and private keys are stored locally on your device and are never uploaded to our servers. You have 100% ownership and control over your assets."
  },
  {
    question: "What are the fees for trading?",
    answer: "Pexly offers competitive fees. Internal transfers between Pexly users are often free or have minimal network costs, while exchange trades depend on the specific liquidity provider and asset."
  },
  {
    question: "How does the cloud backup work?",
    answer: "Our Encrypted Cloud Backup allows you to store an encrypted version of your wallet's secret phrase in your personal cloud storage (like iCloud or Google Drive). This provides an extra layer of safety if you lose your physical device."
  },
  {
    question: "Is Pexly available in my country?",
    answer: "Pexly is a global platform available in over 140 countries. However, some specific features like fiat-to-crypto purchases may be restricted based on local regulations in certain jurisdictions."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Pexly
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-2xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
