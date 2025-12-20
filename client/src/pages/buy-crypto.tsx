import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    RampInstantSDK?: any;
  }
}

export default function BuyCrypto() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/signin");
      return;
    }

    // Load Ramp Instant SDK
    const script = document.createElement("script");
    script.src = "https://instant.ramp.network/ramp.js";
    script.async = true;

    script.onload = () => {
      if (containerRef.current && window.RampInstantSDK) {
        // Initialize Ramp widget
        new window.RampInstantSDK.RampInstant({
          hostAppName: "Pexly",
          hostLogoUrl: "/favicon.svg",
          userEmail: user.email || "",
          userAddress: "", // Can be populated from user's wallet
          useSandbox: import.meta.env.VITE_RAMP_SANDBOX === "true",
          variant: "hosted",
          webhookStatusUrl: `${window.location.origin}/api/ramp-webhook`,
          defaultAsset: "ETH",
          containerNode: containerRef.current,
        });
      }
    };

    script.onerror = () => {
      console.error("Failed to load Ramp Instant SDK");
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const faqItems = [
    {
      question: "What payment methods does Ramp Network accept?",
      answer: "Ramp Network accepts a wide variety of payment methods including credit cards (Visa, Mastercard, American Express), bank transfers (SEPA, ACH), and mobile payment options. The available methods depend on your location."
    },
    {
      question: "How long does it take to receive my crypto?",
      answer: "With credit/debit cards, your crypto is typically delivered instantly. Bank transfers may take 1-3 business days depending on your bank. Processing times vary by payment method and location."
    },
    {
      question: "What are the fees?",
      answer: "Ramp Network's fees vary depending on your payment method and location. Credit cards typically have a 2-3% fee, while bank transfers may be lower. The exact fee will be displayed before you complete the transaction."
    },
    {
      question: "Is it safe to buy crypto through Ramp Network?",
      answer: "Yes, Ramp Network is a secure, regulated platform that uses bank-level encryption and follows strict KYC/AML compliance. Your personal and financial information is protected with industry-standard security measures."
    },
    {
      question: "Do I need to verify my identity?",
      answer: "Depending on your transaction amount and location, you may need to complete identity verification. Ramp Network will guide you through this process if required."
    },
    {
      question: "What cryptocurrencies can I buy?",
      answer: "Ramp Network supports a wide range of cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, and many others. The available coins may vary based on your location."
    },
    {
      question: "Can I buy crypto from any country?",
      answer: "Ramp Network is available in many countries worldwide. However, some countries and regions have restrictions due to local regulations. You'll see which payment methods are available in your region during the purchase process."
    },
    {
      question: "What should I do if my transaction fails?",
      answer: "If your transaction fails, Ramp Network will provide an explanation. Most failures are due to bank declines or regulatory blocks. You can try again with a different payment method or contact Ramp Network support for assistance."
    },
    {
      question: "Can I buy crypto with cash?",
      answer: "Ramp Network primarily supports digital payment methods. However, in some regions, you may be able to use bank transfers or other digital payment options to purchase crypto."
    },
    {
      question: "Is there a minimum or maximum purchase amount?",
      answer: "Yes, Ramp Network has minimum and maximum limits that vary by payment method and location. These limits will be displayed when you enter your payment details."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary/10 to-background py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Buy Crypto
            </h1>
            <p className="text-base text-muted-foreground">
              Purchase cryptocurrency quickly and securely with Ramp Network
            </p>
          </div>
        </div>

        {/* Ramp Widget Container */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div ref={containerRef} className="w-full min-h-[600px]" />
        </div>

        {/* FAQ Section */}
        <div className="bg-muted/30 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about buying crypto with Ramp Network
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-semibold text-foreground">
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pt-2">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
