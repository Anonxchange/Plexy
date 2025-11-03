"use client";
import { useState } from "react";
import { MessageCircle, Mail, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");

  const knowledgeBaseCategories = [
    {
      title: "Getting Started",
      articles: [
        "How to create a Pexly account",
        "Verifying your identity",
        "How to deposit cryptocurrency",
        "Understanding P2P trading",
      ],
    },
    {
      title: "Trading",
      articles: [
        "How to buy crypto on P2P",
        "How to sell crypto on P2P",
        "Understanding escrow system",
        "Dispute resolution process",
      ],
    },
    {
      title: "Wallet & Security",
      articles: [
        "Securing your wallet",
        "Two-factor authentication setup",
        "Withdrawal guidelines",
        "Transaction fees explained",
      ],
    },
    {
      title: "Payment Methods",
      articles: [
        "Supported payment methods",
        "Adding a payment method",
        "Bank transfer guide",
        "Mobile money transfers",
      ],
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      action: "Start Chat",
      available: "24/7",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email",
      email: "support@pexly.com",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      action: "Call Now",
      available: "Mon-Fri, 9AM-6PM EST",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/20 via-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <img
            src="/assets/IMG_2011.jpeg"
            alt="Support Hero"
            className="w-full max-w-5xl mx-auto h-56 sm:h-64 md:h-80 lg:h-96 object-cover rounded-xl"
          />

          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Welcome to Pexly Support</h1>
            <p className="text-lg text-muted-foreground mb-6">
              We’re here to help you 24/7. Find answers, get assistance, and explore our knowledge base.
            </p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Base */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <img
            src="/assets/IMG_2014.jpeg"
            alt="Knowledge base"
            className="w-full max-w-5xl mx-auto h-56 sm:h-64 md:h-80 object-cover rounded-xl mb-10"
          />

          <h2 className="text-3xl font-bold text-center mb-12">Knowledge Base</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {knowledgeBaseCategories.map((category, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all">
                <h3 className="font-semibold text-xl mb-4">{category.title}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {category.articles.map((article, i) => (
                    <li key={i} className="hover:text-primary cursor-pointer transition">
                      {article}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Need More Help */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto text-center">
          <img
            src="/assets/IMG_2013.jpeg"
            alt="Need help"
            className="w-full max-w-5xl mx-auto h-56 sm:h-64 md:h-80 object-cover rounded-xl mb-10"
          />

          <h2 className="text-3xl font-bold mb-12">Need More Help?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <Card
                key={index}
                className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl"
              >
                <div className="relative w-full h-48 sm:h-56 md:h-64">
                  <img
                    src={`/assets/${option.title.replace(/\s/g, "").toLowerCase()}.jpeg`}
                    alt={option.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6 text-center">
                  <option.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                  <p className="text-muted-foreground mb-2">{option.description}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {option.available || option.email}
                  </p>
                  <Button className="bg-primary text-black hover:bg-primary/90 w-full">
                    {option.action}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img
            src="/assets/IMG_2012.jpeg"
            alt="FAQ"
            className="w-full max-w-5xl mx-auto h-56 sm:h-64 md:h-80 object-cover rounded-xl mb-10"
          />
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                How long does verification take?
              </h3>
              <p className="text-muted-foreground">
                Verification typically takes 5–10 minutes once all documents are submitted correctly.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I cancel a trade after payment?
              </h3>
              <p className="text-muted-foreground">
                No, once payment is made, cancellation isn’t allowed. Always confirm before sending funds.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                How can I contact support directly?
              </h3>
              <p className="text-muted-foreground">
                Use live chat or email us anytime — we’re available 24/7 for urgent matters.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}