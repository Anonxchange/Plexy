import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";
import { Send } from "lucide-react";
import { BitrefillWidget } from "@/components/bitrefill-widget";

const faqs = [
  {
    question: "What payment options do you accept?",
    answer: "We accept cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), and USDT. This ensures fast, secure, and private transactions."
  },
  {
    question: "Do I need to create an account to purchase a gift card?",
    answer: "No! You can purchase gift cards without creating an account. Simply select your card, pay with crypto, and receive your gift card code via email."
  },
  {
    question: "How long does it take to receive my purchased gift card?",
    answer: "Most gift cards are delivered instantly via email after your cryptocurrency payment is confirmed. Delivery typically takes 5-15 minutes depending on network congestion."
  },
  {
    question: "Who determines the price when buying or selling a gift card?",
    answer: "Prices are determined by individual sellers in our P2P marketplace. You can browse multiple offers and choose the best rate that suits your needs."
  },
  {
    question: "Is it safe to sell a gift card on Pexly?",
    answer: "Yes! We use an escrow system that holds the cryptocurrency until both parties confirm the transaction is complete. This protects both buyers and sellers."
  },
  {
    question: "Is ID verification required to sell a gift card?",
    answer: "For small transactions, ID verification is not required. However, higher transaction limits require identity verification to ensure platform security and compliance."
  }
];

export function GiftCards() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Buy Gift Cards with Crypto
          </h1>
          <p className="text-lg text-muted-foreground">
            Instantly purchase digital gift cards and items with cryptocurrency
          </p>
        </div>

        {/* Sell Button */}
        <div className="text-center mb-8">
          <Link href="/p2p">
            <Button size="lg" variant="outline" className="gap-2">
              <Send className="h-5 w-5" />
              Sell Gift Cards
            </Button>
          </Link>
        </div>

        {/* Bitrefill Widget */}
        <div className="mb-8">
          <BitrefillWidget />
        </div>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center">Frequently asked questions</h2>
            <p className="text-muted-foreground text-center mb-8">
              Find answers to the most popular questions asked by our users
            </p>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Info Card */}
        <Card className="bg-muted/30 border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-3">Why use Bitrefill?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Instant delivery - Get your gift cards immediately</li>
              <li>✓ Wide selection - 500+ products available</li>
              <li>✓ Secure transactions - Industry-leading security</li>
              <li>✓ Competitive rates - Best prices available</li>
              <li>✓ Global coverage - Shop worldwide</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
