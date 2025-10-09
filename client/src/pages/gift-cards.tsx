import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";
import { 
  ShoppingBag, 
  Send, 
  Mail, 
  Lock, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const giftCardBrands = [
  {
    id: 1,
    name: "PlayStation Romania",
    minAmount: 50,
    maxAmount: 1000,
    currency: "lei",
    discount: -14.13,
    image: "/gift-cards/playstation_gift_car_1a8c15ea.jpg",
    color: "from-blue-500 to-blue-700"
  },
  {
    id: 2,
    name: "Zalando Romania",
    minAmount: 25,
    maxAmount: 1000,
    currency: "lei",
    discount: -0.06,
    image: "/gift-cards/shopping_gift_card_v_57220edc.jpg",
    color: "from-orange-400 to-orange-600"
  },
  {
    id: 3,
    name: "Amazon Gift Card",
    minAmount: 10,
    maxAmount: 500,
    currency: "USD",
    discount: -8.5,
    image: "/gift-cards/amazon_gift_card_99d2e9e3.jpg",
    color: "from-yellow-500 to-orange-600"
  },
  {
    id: 4,
    name: "eMag Romania",
    minAmount: 10,
    maxAmount: 500,
    currency: "lei",
    discount: -5.2,
    image: "/gift-cards/shopping_gift_card_v_98f797da.jpg",
    color: "from-pink-400 to-pink-600"
  },
  {
    id: 5,
    name: "Kaufland Romania",
    minAmount: 50,
    maxAmount: 300,
    currency: "lei",
    discount: -3.8,
    image: "/gift-cards/shopping_gift_card_v_28e854f4.jpg",
    color: "from-red-500 to-red-700"
  },
  {
    id: 6,
    name: "Sephora Romania",
    minAmount: 100,
    maxAmount: 500,
    currency: "lei",
    discount: -6.1,
    image: "/gift-cards/sephora_gift_card_6bc3d339.jpg",
    color: "from-purple-400 to-purple-600"
  },
  {
    id: 7,
    name: "Steam Gift Card",
    minAmount: 5,
    maxAmount: 100,
    currency: "USD",
    discount: -10.2,
    image: "/gift-cards/steam_gift_card_d972447b.jpg",
    color: "from-slate-600 to-slate-800"
  },
  {
    id: 8,
    name: "Netflix Gift Card",
    minAmount: 25,
    maxAmount: 200,
    currency: "USD",
    discount: -7.5,
    image: "/gift-cards/netflix_gift_card_4f2a996c.jpg",
    color: "from-red-600 to-red-800"
  },
  {
    id: 9,
    name: "Apple Gift Card",
    minAmount: 15,
    maxAmount: 500,
    currency: "USD",
    discount: -9.3,
    image: "/gift-cards/apple_gift_card_408da27f.jpg",
    color: "from-gray-400 to-gray-600"
  }
];

const p2pOffers = [
  {
    id: 1,
    vendor: {
      name: "PluckyGarpike374",
      rating: 100,
      status: "Active now",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PluckyGarpike374"
    },
    card: "PlayStation Network Gift Card",
    amount: 40,
    currency: "RON",
    receive: 22.41,
    receiveCurrency: "BTC",
    totalAmount: "930,412.27 RON",
    limits: "45 - 1,000 RON"
  },
  {
    id: 2,
    vendor: {
      name: "yoyo2fox",
      rating: 100,
      status: "Active now",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=yoyo2fox"
    },
    card: "PlayStation Network Gift Card",
    amount: 40,
    currency: "RON",
    receive: 22.35,
    receiveCurrency: "BTC",
    totalAmount: "933,078.20 RON",
    limits: "50 - 586 RON"
  },
  {
    id: 3,
    vendor: {
      name: "Cards_Hup",
      rating: 100,
      status: "Seen 2h ago",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cards_Hup"
    },
    card: "Amazon Gift Card",
    amount: 50,
    currency: "USD",
    receive: 0.00042,
    receiveCurrency: "BTC",
    totalAmount: "5,250.00 USD",
    limits: "25 - 500 USD"
  }
];

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
  const [selectedTab, setSelectedTab] = useState<"all" | "buy" | "sell">("all");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <CheckCircle2 className="h-4 w-4" />
              Trusted by 14M+ users worldwide
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Buy, sell, and trade{" "}
              <span className="text-primary">discounted gift cards</span>{" "}
              with crypto on Pexly
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Buy discounted gift cards with crypto – just pick your card, pay, and get it delivered straight to your email
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold">200+</div>
                <div className="text-muted-foreground mt-2">Card brands</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold">1,500+</div>
                <div className="text-muted-foreground mt-2">Daily purchases</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/p2p">
                <Button size="lg" className="gap-2 text-lg px-8">
                  <ShoppingBag className="h-5 w-5" />
                  Buy Gift Cards
                </Button>
              </Link>
              <Link href="/p2p">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8">
                  <Send className="h-5 w-5" />
                  Sell Gift Cards
                </Button>
              </Link>
            </div>
          </div>

          {/* Gift Card Images Preview */}
          <div className="relative h-48 mt-12">
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <div className="transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <div className="w-32 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-xl flex items-center justify-center text-white font-bold">
                  Walmart
                </div>
              </div>
              <div className="transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="w-32 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-xl flex items-center justify-center text-white font-bold">
                  SEPHORA
                </div>
              </div>
              <div className="transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <div className="w-32 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-xl flex items-center justify-center text-white font-bold">
                  amazon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* P2P Gift Card Marketplace */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">P2P gift card marketplace</h2>
            <p className="text-muted-foreground">
              Got an unused gift card? <span className="font-semibold text-foreground">Sell it for crypto</span> — keep it for yourself or use it to send money across borders with ease.
            </p>
          </div>

          <div className="space-y-4">
            {p2pOffers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Vendor Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={offer.vendor.avatar} />
                        <AvatarFallback>{offer.vendor.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {offer.vendor.name}
                          <Badge variant="secondary" className="text-xs">
                            {offer.vendor.rating}%
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            {offer.vendor.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Offer Details */}
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Pay {offer.card}</div>
                      <div className="text-2xl font-bold">
                        {offer.amount} {offer.currency}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        💰 {offer.totalAmount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {offer.limits}
                      </div>
                    </div>

                    {/* Receive Amount */}
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Receive ({offer.receiveCurrency})</div>
                      <div className="text-2xl font-bold">
                        {offer.receive} {offer.receiveCurrency}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <Link href={`/p2p?offer=${offer.id}`}>
                        <Button className="gap-2">
                          Buy {offer.receiveCurrency}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/p2p">
              <Button variant="outline" size="lg">
                Explore more offers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gift Card Catalog */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Browse gift card brands</h2>
            <p className="text-muted-foreground mb-6">
              Choose from 200+ popular brands and get discounted rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftCardBrands.map((brand) => (
              <Link key={brand.id} href={`/p2p?card=${encodeURIComponent(brand.name)}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                  <div className={`h-40 bg-gradient-to-br ${brand.color} relative`}>
                    <img 
                      src={brand.image} 
                      alt={brand.name}
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="text-xl font-bold text-gray-900">{brand.name.split(' ')[0]}</div>
                      </div>
                    </div>
                    {brand.discount && (
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                        {brand.discount}%
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {brand.currency} {brand.minAmount} - {brand.currency} {brand.maxAmount}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/p2p">
              <Button size="lg" variant="outline" className="gap-2">
                View all cards
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Want to buy */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Want to buy a gift card?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every day, <span className="font-semibold text-foreground">100,000 people</span> buy their gift cards on{" "}
            <span className="font-semibold text-foreground">Pexly's P2P marketplace</span>. Join them and{" "}
            <span className="font-semibold text-foreground">start earning</span> today.
          </p>
          <Link href="/p2p">
            <Button size="lg" className="gap-2">
              Start buying
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          {/* Gift Card Illustration */}
          <div className="mt-12 relative h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-32 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl shadow-2xl transform -rotate-12">
                  <div className="flex items-center justify-center h-full">
                    <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-12 top-8 w-40 h-28 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl shadow-2xl transform rotate-6">
                  <div className="flex items-center justify-center h-full">
                    <span className="text-white text-2xl font-bold">amazon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Pay with crypto for instant transactions</h3>
                <p className="text-sm text-muted-foreground">
                  Fast, secure cryptocurrency payments processed in minutes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Stay private - no account is needed to purchase</h3>
                <p className="text-sm text-muted-foreground">
                  Buy gift cards without registration for maximum privacy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Receive your purchased card via email</h3>
                <p className="text-sm text-muted-foreground">
                  Instant delivery of gift card codes directly to your inbox
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pexly's Own Gift Card Promo */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">One more thing...</h2>
            <p className="text-lg text-muted-foreground">
              Did you know that <span className="font-semibold text-foreground">Pexly</span> has its own{" "}
              <span className="font-semibold text-foreground">gift card</span>?{" "}
              You can buy crypto in <span className="font-semibold text-foreground">any amount</span>{" "}
              and send it as a <span className="font-semibold text-foreground">gift to anyone</span>{" "}
              to redeem. Sounds awesome, right?
            </p>
          </div>

          <Card className="max-w-md mx-auto overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-primary/70 p-8 text-primary-foreground">
              <div className="text-sm mb-2">Gift Card</div>
              <div className="flex items-center justify-between mb-8">
                <div className="text-3xl font-bold">Pexly</div>
                <Badge className="bg-white/20 text-white border-white/40">50 USDT</Badge>
              </div>
              <div className="text-sm opacity-80">john.doe@example.com</div>
            </div>
            <CardContent className="p-6 text-center">
              <Button className="w-full" size="lg">
                Learn more
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
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

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start trading gift cards?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of users buying and selling gift cards with crypto on Pexly
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/p2p">
              <Button size="lg" variant="secondary" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Browse Gift Cards
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="gap-2 bg-transparent border-white text-white hover:bg-white/10">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
