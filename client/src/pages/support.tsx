import { useState } from "react";
import { Search, ChevronRight, MessageCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Link } from "wouter";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");

  const knowledgeBaseCategories = [
    {
      title: "Getting Started",
      articles: [
        "How to create a Pexly account",
        "Verifying your identity",
        "How to deposit cryptocurrency",
        "Understanding P2P trading"
      ]
    },
    {
      title: "Trading",
      articles: [
        "How to buy crypto on P2P",
        "How to sell crypto on P2P",
        "Understanding escrow system",
        "Dispute resolution process"
      ]
    },
    {
      title: "Wallet & Security",
      articles: [
        "Securing your wallet",
        "Two-factor authentication setup",
        "Withdrawal guidelines",
        "Transaction fees explained"
      ]
    },
    {
      title: "Payment Methods",
      articles: [
        "Supported payment methods",
        "Adding a payment method",
        "Bank transfer guide",
        "Mobile money transfers"
      ]
    }
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      action: "Start Chat",
      available: "24/7"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email",
      email: "support@pexly.com"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      action: "Call Now",
      available: "Mon-Fri, 9AM-6PM EST"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-primary/20 via-primary/10 to-background py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 overflow-hidden">
            <img 
              src="/assets/IMG_2011.jpeg" 
              alt="Support"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Hi, how can we help you?</h1>
          <div className="relative max-w-2xl mx-auto">
            <Input
              type="text"
              placeholder="Enter the search term here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-4 pr-12 text-lg"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </section>

      {/* Browse Articles Card */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 mb-12">
        <Card className="bg-card hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src="/assets/IMG_2018.jpeg" 
                  alt="Browse articles"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Browse articles</h2>
                <p className="text-muted-foreground">
                  Explore How-To's and learn best practices from our knowledge base
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Knowledge Base */}
      <section className="max-w-6xl mx-auto px-0 py-12">
        <div className="text-center mb-12">
          <img 
            src="/assets/IMG_2014.jpeg" 
            alt="Knowledge base"
            className="w-full h-64 object-cover mb-8"
          />
          <h2 className="text-3xl font-bold mb-2">Knowledge base</h2>
          <p className="text-muted-foreground">View all articles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 px-4">
          {knowledgeBaseCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">{category.title}</h3>
                <ul className="space-y-3">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Support Options */}
      <section className="max-w-6xl mx-auto px-0 py-12 bg-muted/30">
        <div className="text-center mb-12">
          <img 
            src="/assets/IMG_2013.jpeg" 
            alt="Need help"
            className="w-full h-64 object-cover mb-8"
          />
          <h2 className="text-3xl font-bold mb-2">Need more help?</h2>
          <p className="text-muted-foreground">Choose how you'd like to reach us</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {supportOptions.map((option, index) => {
            const supportImages = [
              "/assets/IMG_2015.jpeg",
              "/assets/IMG_2016.jpeg",
              "/assets/IMG_2017.jpeg"
            ];
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto overflow-hidden">
                    <img 
                      src={supportImages[index]} 
                      alt={option.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {option.description}
                    </p>
                    {option.available && (
                      <p className="text-xs text-muted-foreground">
                        Available: {option.available}
                      </p>
                    )}
                    {option.email && (
                      <p className="text-xs text-muted-foreground">
                        {option.email}
                      </p>
                    )}
                  </div>
                  <Button className="w-full">{option.action}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-0 py-12">
        <div className="text-center mb-12">
          <img 
            src="/assets/IMG_2012.jpeg" 
            alt="FAQ"
            className="w-full h-64 object-cover mb-8"
          />
          <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Quick answers to common questions</p>
        </div>

        <div className="space-y-4 px-4">
          {[
            {
              q: "How long does verification take?",
              a: "Basic verification usually takes 5-10 minutes. Advanced verification may take up to 24 hours."
            },
            {
              q: "What are the trading fees?",
              a: "P2P trading is free. Standard trading fees range from 0.1% to 0.5% depending on your volume."
            },
            {
              q: "How do I withdraw my funds?",
              a: "Go to Wallet > Select asset > Withdraw. Enter the amount and destination address."
            },
            {
              q: "Is my crypto safe on Pexly?",
              a: "Yes, we use industry-leading security including cold storage and multi-signature wallets."
            }
          ].map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}