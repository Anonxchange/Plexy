
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, TrendingUp, DollarSign, Globe, Clock, UserPlus, Share2, Wallet, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Affiliate() {
  const [email, setEmail] = useState("");

  const commissionTiers = [
    {
      icon: <Users className="h-6 w-6" />,
      users: "5+ Users",
      commission: "30%",
      description: "P2P Trading & Spot"
    },
    {
      icon: <Users className="h-6 w-6" />,
      users: "3+ Users",
      commission: "3%",
      description: "Earn Products & Staking"
    },
    {
      icon: <Users className="h-6 w-6" />,
      users: "2+ Users",
      commission: "5%",
      description: "Sub-Affiliates"
    }
  ];

  const benefits = [
    {
      title: "We Help You Grow Your Audience",
      description: "Pexly's affiliate portal not only provides the latest insights to your earnings, it is an information hub for the latest campaigns, video & design assets on Pexly's latest products and more!",
      image: "/assets/IMG_1939.jpeg"
    },
    {
      title: "Timely Compensation",
      description: "Payments are calculated and processed on a daily basis. We seek to complete payments to our affiliates as fast as possible.",
      image: "/assets/IMG_1955.jpeg"
    },
    {
      title: "Worldwide Networking Events",
      description: "Meet like-minded and passionate professionals in the Crypto space to grow your influence!",
      image: "/assets/IMG_1821.jpeg"
    }
  ];

  const steps = [
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Apply",
      description: "It takes less than 5mins to apply! All applications will be reviewed within 24h."
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "Share",
      description: "Customize and share your affiliate exclusive invitation link to friends and users."
    },
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Earn",
      description: "Earn up to 30% in commissions. Extra 5% if your user becomes an Affiliate, and more!"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-20 px-4">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Illustration */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-full max-w-md">
              <img 
                src="/assets/IMG_1935.jpeg" 
                alt="Affiliate Program Illustration" 
                className="w-full h-auto"
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="block text-foreground">Boost your Earnings</span>
            <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              through Pexly's Affiliate Program
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Monetize your influence. Grow through robust analytics. Join a tight-knit community.
          </p>

          <Button size="lg" className="h-16 px-12 text-lg font-bold shadow-xl hover:shadow-2xl">
            Join Our Affiliate Program
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            <span className="text-primary">Pexly</span> Affiliate Commission
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Receive monthly revenue for every user you bring into Pexly's trading platform.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {commissionTiers.map((tier, index) => (
              <Card key={index} className="p-8 text-center hover:border-primary/50 transition-all">
                <div className="flex justify-center mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: parseInt(tier.users) }).map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">up to </span>
                  <span className="text-5xl font-bold text-primary">{tier.commission}</span>
                  <span className="text-sm text-muted-foreground"> Commission</span>
                </div>
                <p className="text-muted-foreground">{tier.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            Pexly Affiliate Benefits
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Pexly stands out from other affiliate programs through the innovation of our affiliate exclusive portal to view earnings and new products, coupled with world class account services and a strong community. We aim to provide the first in class affiliate program in the industry.
          </p>

          <div className="space-y-12">
            {benefits.slice(0, 2).map((benefit, index) => (
              <Card key={index} className="p-8 md:p-12">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                  {benefit.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {benefit.description}
                </p>
                {benefit.image && (
                  <div className="rounded-xl overflow-hidden">
                    <img 
                      src={benefit.image} 
                      alt={benefit.title}
                      className="w-full h-auto"
                    />
                  </div>
                )}
                {benefit.icon && (
                  <div className="flex justify-center">
                    {benefit.icon}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Worldwide Networking Events Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: '#FFB800' }}>
            Worldwide Networking Events
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Meet like-minded and passionate professionals in the Crypto space to grow your influence!
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-video overflow-hidden">
                <img 
                  src="/assets/IMG_1957.jpeg" 
                  alt="Global Crypto Conferences"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Global Crypto Conferences</h3>
                <p className="text-sm text-muted-foreground">
                  Network with industry leaders and enthusiasts at major crypto events worldwide
                </p>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-video overflow-hidden">
                <img 
                  src="/assets/IMG_1958.jpeg" 
                  alt="F1 Redbull Racing VIP Passes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">F1 Redbull Racing VIP Passes</h3>
                <p className="text-sm text-muted-foreground">
                  Experience exclusive VIP access to Formula 1 racing events with fellow affiliates
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pexly Parties */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#FFB800' }}>
            Pexly Parties for Affiliates, Institutions and VIP Traders
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Join exclusive networking events and celebrations with fellow affiliates and VIP traders from around the world
          </p>

          <div className="mb-8 rounded-xl overflow-hidden max-w-4xl mx-auto">
            <img 
              src="/assets/IMG_1956.jpeg" 
              alt="Pexly Parties Event"
              className="w-full h-auto"
            />
          </div>

          <p className="text-sm text-muted-foreground italic">
            Bybit Parties for Affiliates, Institutions and VIP Traders
          </p>
        </div>
      </section>

      {/* 1:1 Account Services */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              1:1 Account Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our experienced team members are here to provide a comprehensive guide to the program and update you with timely promotions once you've joined! You will also be served by a dedicated 1-to-1 Account Manager
            </p>
          </div>

          {/* Horizontally Scrollable Account Managers */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { name: "Sarah", image: "/assets/IMG_1820.jpeg" },
                { name: "Melanie", image: "/assets/IMG_1821.jpeg" },
                { name: "David", image: "/assets/IMG_1824.jpeg" }
              ].map((manager, index) => (
                <div key={index} className="flex-shrink-0 w-64 snap-center">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={manager.image}
                        alt={manager.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg mb-1">{manager.name}</h3>
                      <p className="text-sm text-muted-foreground">Account Manager</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
            Becoming an Affiliate is Easy
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block mt-8">
                    <div className="border-t-2 border-dashed border-muted-foreground/30"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            Join A Growing Community<br />
            of Over <span className="text-primary">100,000</span> Affiliates
          </h2>

          <div className="flex justify-center mb-12">
            <div className="relative w-64 h-32">
              {/* Network visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  P
                </div>
              </div>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-8 h-8 rounded-full bg-muted-foreground/20 border-2 border-background"
                  style={{
                    top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                    left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Users className="h-4 w-4 text-muted-foreground m-auto mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            Join Our Affiliate Program Today!
          </h2>

          <Button size="lg" className="h-16 px-12 text-lg font-bold shadow-xl hover:shadow-2xl mb-12">
            Join Now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Copyright © 2024 Pexly. All Rights Reserved.</p>
            <div className="flex justify-center gap-6">
              <Link href="/terms" className="hover:text-primary">Affiliate Agreement</Link>
              <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              {["facebook", "twitter", "youtube", "linkedin"].map((social) => (
                <div key={social} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
