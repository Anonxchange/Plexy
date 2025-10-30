import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Banknote, 
  Shield, 
  Lock, 
  Users, 
  Smartphone,
  ChevronDown
} from "lucide-react";

export default function VisaCard() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Go Virtual & Spend Instantly",
      description: "Create your virtual card in seconds and start spending immediately"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Earn Up to 8% APR on Your Idle Funds",
      description: "Your unused balance earns you passive income automatically"
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Free Card Issuance, No Annual Fees",
      description: "Get started at no cost with zero annual maintenance fees"
    },
    {
      icon: <Banknote className="h-8 w-8" />,
      title: "Enjoy 100 USD in Free ATM Withdrawals Every Month",
      description: "Cash out whenever you need with generous free ATM withdrawals"
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Free Worldwide Delivery of Your Pexly Card",
      description: "VIP members get their physical card shipped anywhere, free of charge",
      badge: "VIP Only"
    }
  ];

  const partners = [
    { name: "NETFLIX", color: "#E50914" },
    { name: "Spotify", color: "#1DB954" },
    { name: "Amazon Prime", color: "#00A8E1" },
    { name: "ChatGPT", color: "#10A37F" },
    { name: "TradingView", color: "#2962FF" }
  ];

  const faqs = [
    {
      question: "Who can apply for the Pexly Card?",
      answer: "Anyone 18 years or older with a verified Pexly account can apply for the Pexly Card. Complete your KYC verification to get started."
    },
    {
      question: "What are the fees associated with using the Pexly Card?",
      answer: "Card issuance is free with no annual fees. Card top-up has a small fee of 2 USDT or 1.5%. ATM withdrawals up to $100/month are free, then standard fees apply."
    },
    {
      question: "How do I add funds to my Pexly Card?",
      answer: "You can top up your card instantly with any crypto from your Pexly wallet. Supported currencies include BTC, ETH, USDT, USDC, and more."
    },
    {
      question: "Can I set the spending limit for my Pexly Card?",
      answer: "Yes, you can set daily and monthly spending limits directly from your card settings for added security and budget control."
    },
    {
      question: "What card types can I get?",
      answer: "We offer both virtual and physical cards. Virtual cards are available instantly. Physical cards can be ordered and shipped worldwide for VIP members."
    },
    {
      question: "How much cashback will I get?",
      answer: "Earn 2-10% cashback on everyday spending. Selected users get up to 10% cashback on partner merchants. Check your account for your personalized rates."
    },
    {
      question: "Can I withdraw money from an ATM?",
      answer: "Yes, you can withdraw cash at any ATM worldwide. The first $100 per month is free, then standard ATM fees apply."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-16 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Region Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold text-primary">Rest of the World 🌍</span>
            </div>
          </div>

          {/* Card Visual */}
          <div className="flex justify-center mb-12">
            <div className="relative w-80 h-52">
              {/* Card stack effect */}
              <div className="absolute top-4 -left-8 w-72 h-48 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl rotate-[-8deg] shadow-2xl"></div>
              <div className="absolute top-2 -right-6 w-72 h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl rotate-[6deg] shadow-xl"></div>
              
              {/* Main card */}
              <Card className="relative w-80 h-52 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl p-6 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                
                <div className="relative h-full flex flex-col justify-between text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CreditCard className="h-8 w-8 mb-1" />
                      <div className="text-xs font-bold">PEXLY</div>
                    </div>
                    <Zap className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <div className="text-xs mb-2 opacity-90">Balance</div>
                    <div className="text-2xl font-bold mb-4">3,080 USD</div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xs">Paying With</div>
                      <div className="flex gap-1">
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xs">₮</div>
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xs">Ξ</div>
                        <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xs">$</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="block text-foreground">Live the Crypto Life</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                With Pexly Card
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Start exploring your exclusive benefits with the Pexly Card today!
            </p>
            <Button size="lg" className="h-16 px-12 text-lg font-bold shadow-xl hover:shadow-2xl">
              Get Your Card
              <Smartphone className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Cashback Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Selected Users Only: <span className="text-primary">10% Cashback</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Spend with your Pexly Card to earn 10% cashback, up to 150 USD.
                </p>
                <Button variant="outline" className="group">
                  Learn More 
                  <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Cashback Earned</div>
                    <div className="text-3xl font-bold text-primary">+11.22 USDT</div>
                    <div className="text-xs text-muted-foreground mt-1">Today, 2:51PM UTC</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Payment Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pay Anytime, Anywhere<br />
            <span className="text-primary">With Your Crypto or Fiat</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose to pay using your crypto or fiat balance.
          </p>
          <div className="text-left max-w-2xl mx-auto space-y-3 mb-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Supported fiat currencies: USD</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Supported crypto: BTC, ETH, XRP, TON, USDT, USDC, MNT, and BNB, with more options on the way!</span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative w-64 h-96 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/80 rounded-[3rem] shadow-2xl p-3">
              <div className="bg-background rounded-[2.5rem] h-full p-6 flex flex-col">
                <div className="text-center mb-6">
                  <div className="text-sm font-bold mb-2">My Pexly Card</div>
                  <Card className="w-full h-32 bg-gradient-to-br from-primary to-primary/80 rounded-xl p-4 flex flex-col justify-between">
                    <div className="text-xs text-white font-bold">PEXLY</div>
                    <div className="text-white text-xs opacity-80">•••• •••• •••• 1234</div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 100% Rebates Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            100% Rebates on<br />
            <span className="text-primary">Selected Partners</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Enjoy 100% rebates on selected partners to supercharge your card rewards!
          </p>

          {/* Partner Logos */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {partners.map((partner) => (
              <div key={partner.name} className="flex items-center justify-center p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all">
                <span 
                  className="text-xl md:text-2xl font-bold" 
                  style={{ color: partner.color }}
                >
                  {partner.name}
                </span>
              </div>
            ))}
          </div>

          <Button variant="outline" className="group">
            Learn More About Card Rewards
            <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Earn Cashback Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 md:p-16">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Earn 2% – 10%<br />
                <span className="text-primary">Cashback Rewards on Your Everyday Spending</span>
              </h2>
              <Button className="mt-8" size="lg">
                Learn More About Cashback Rates
                <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
              </Button>
              
              {/* Cashback Examples */}
              <div className="mt-12 grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Cashback</div>
                      <div className="text-sm text-muted-foreground">Today, 2:51PM UTC</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">+1.89 USDT</div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Cashback</div>
                      <div className="text-sm text-muted-foreground">Today, 2:51PM UTC</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">+11.22 USDT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Unlock More <span className="text-primary">Exciting Features</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:border-primary/50 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 flex items-center gap-3">
                  {feature.title}
                  {feature.badge && (
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold">
                      {feature.badge}
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-6">
            Your Asset, <span className="text-primary">Our Protection</span>
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            With Pexly's cutting-edge protections, you can personalize your settings to maintain total control over your account.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dedicated Security Team</h3>
              <p className="text-muted-foreground">
                Our dedicated fraud and security team works around the clock to keep your assets safe.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Two Factor Authentication</h3>
              <p className="text-muted-foreground">
                Two factor authentication adds an extra layer of security to your account.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Card Freeze Control</h3>
              <p className="text-muted-foreground">
                Card freezing or unfreezing is possible anytime with just one tap on the Pexly App.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-primary font-bold mb-4 text-lg">STEP 1</div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Click "Apply now" button<br />
                  Choose the country of residency
                </h2>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-card p-8 flex items-center justify-center shadow-xl">
                  <Smartphone className="h-32 w-32 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            <span className="text-primary">FAQ</span>
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      expandedFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Read More
              <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-12 px-4 text-center border-t">
        <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
          Note: This is only available for users in certain countries at this time. This product is not meant for European Economic Area customers. All European Economic Area customer participation is strictly prohibited.
        </p>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t lg:hidden z-50">
        <Button size="lg" className="w-full h-14 text-lg font-bold shadow-xl">
          Get Your Card
          <Smartphone className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Bottom spacing for mobile sticky button */}
      <div className="h-20 lg:hidden"></div>
    </div>
  );
}
