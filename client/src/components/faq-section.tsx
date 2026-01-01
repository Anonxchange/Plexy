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
  },
  {
    question: "How do I buy gift cards on Pexly?",
    answer: "Simply navigate to the Gift Cards section, select your preferred retailer (Amazon, Google Play, iTunes, etc.), choose your desired amount, and complete the purchase using your Pexly balance. You'll receive your gift card code instantly via email or in your account."
  },
  {
    question: "Can I sell gift cards on Pexly?",
    answer: "Yes! You can sell your unused gift cards to other Pexly users. Simply create an offer with your gift card details, and interested buyers can purchase from you. Transactions are secured through our smart contract-based Pexly Escrow system, which doesn't hold your funds."
  },
  {
    question: "What is Pexly Escrow and how does it protect me?",
    answer: "Pexly Escrow is a non-custodial smart contract-based system that secures P2P transactions without Pexly holding your funds. Smart contracts automatically lock assets during a transaction and only release them when both parties confirm completion, protecting you from fraud and ensuring fair transactions."
  },
  {
    question: "How does airtime top-up work on Pexly?",
    answer: "Select your mobile provider country, enter your phone number, choose your desired top-up amount, and complete the purchase. Your airtime credit will be delivered to your mobile number within minutes, working with providers globally."
  },
  {
    question: "How can I send crypto to other Pexly users?",
    answer: "Go to 'Send' in your wallet, select the asset and amount, and enter the recipient's Pexly username or wallet address. P2P transfers between Pexly users are often free or have minimal network fees. You can track the transaction status in real-time."
  }
];

export function FAQSection() {
  return (
    <section className="py-20 bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground">
            FAQs
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-b border-border border-t-0 border-x-0 rounded-none bg-transparent px-0 data-[state=open]:border-primary/50 transition-colors"
            >
              <AccordionTrigger className="text-left font-normal text-lg hover:no-underline py-8 text-foreground group transition-all [&[data-state=open]>svg]:rotate-180">
                <span className="flex-1">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-lg pb-8 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
