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
  },
  {
    question: "What security measures does Pexly use?",
    answer: "Pexly uses industry-leading security including 256-bit encryption, biometric authentication (fingerprint/face ID), multi-signature wallets, and regular security audits. We also never store your private keys or recovery phrases on our servers."
  },
  {
    question: "How do I verify my Pexly account?",
    answer: "Pexly uses a tiered verification system. Level 1 requires basic information, Level 2 involves document verification (ID, passport), and Level 3 includes liveness checks. Higher verification levels unlock increased transaction limits and features."
  },
  {
    question: "What happens if I lose my device?",
    answer: "With our Encrypted Cloud Backup enabled, you can recover your wallet on any new device using your backup phrase. Without backup, only you can access your funds since private keys never leave your device. Make sure to enable cloud backup!"
  },
  {
    question: "Can I trade crypto on Pexly?",
    answer: "Yes! Pexly integrates with leading DEXs (Decentralized Exchanges) and swap providers. Access the 'Trade' or 'Swap' section to exchange one cryptocurrency for another at competitive rates powered by third-party liquidity providers."
  },
  {
    question: "What payment methods can I use for peer-to-peer transactions?",
    answer: "On Pexly's P2P marketplace, you can negotiate various payment methods directly with other users including bank transfers, mobile money (M-Pesa, etc.), Wise transfers, LocalBitcoins payments, and other regional payment options."
  },
  {
    question: "Is there a minimum or maximum transaction limit?",
    answer: "Transaction limits vary based on your account verification level, payment method, and local regulations. Level 1 accounts have basic limits that increase significantly with Level 2 and Level 3 verification. Check your account settings for your current limits."
  },
  {
    question: "How do I earn rewards on Pexly?",
    answer: "Pexly rewards referrals and active traders. Invite friends using your referral code to earn bonuses, and earn cashback on certain transactions. Higher verification levels and consistent trading activity can unlock additional rewards."
  },
  {
    question: "What should I do if I made a transaction mistake?",
    answer: "For pending transactions on the blockchain, you cannot cancel them once submitted. For P2P disputes, our support team can help mediate. Always double-check recipient addresses before confirming transactions - crypto transactions are irreversible."
  },
  {
    question: "How are my taxes handled through Pexly transactions?",
    answer: "Pexly does not calculate or file taxes on your behalf. You're responsible for tracking your transactions and reporting them to tax authorities as required by your jurisdiction. We provide transaction history reports to help with tax filing."
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
