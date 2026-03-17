import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard, CheckCircle2, UserPlus, Shield, Video, BookOpen, Headphones, ChevronRight } from "lucide-react";

export default function VisaCardDetails() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Add crypto and spend anywhere
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Top up with crypto, mobile money, or banks, and spend anywhere with the highest limits possible
          </p>
          <div className="flex items-center justify-center gap-2 text-primary mb-6">
            <div className="w-1 h-6 bg-primary rounded"></div>
            <span className="text-lg font-semibold">Nigeria supported</span>
          </div>
          <Button className="h-14 px-8 text-lg font-semibold">
            Get your card (±1 min)
          </Button>
        </div>

        {/* Card Visual */}
        <Card className="mb-12 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <CreditCard className="h-12 w-12 text-primary" />
              <div>
                <div className="text-lg font-semibold">Pay with crypto</div>
                <div className="text-sm text-muted-foreground">Up to $50k per transaction</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compare Card */}
        <Card className="mb-12 bg-card border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">VISA</span>
                </div>
                <div>
                  <div className="text-lg font-semibold">Enjoy the lowest fees</div>
                </div>
              </div>
              <Button variant="outline" className="font-semibold border-2 border-primary text-primary">
                Compare
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Logos */}
        <div className="mb-12">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold text-[#FF0000]">YouTube</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold text-[#FF9900]">amazon</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold text-[#FF6A00]">AliExpress</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Available with your favorite services and companies
          </h2>
          <Link href="/wallet/visa-card/supported-services">
            <Button variant="ghost" className="text-primary font-semibold text-base p-0 h-auto hover:bg-transparent">
              View the supported services →
            </Button>
          </Link>
          <p className="text-base text-muted-foreground mt-4 leading-relaxed">
            Use the NoOnes crypto card at your favorite stores and services, including flights (Arajet), 
            shopping (Amazon, Temu, Shein), and advertising (Facebook, Instagram, Google Ads)
          </p>
        </div>

        {/* Card Image with Watch Video */}
        <Card className="mb-12 bg-gradient-to-br from-green-900 to-green-700 border-0 overflow-hidden">
          <CardContent className="p-0 relative h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <Button className="gap-2 h-14 px-6 text-lg font-semibold bg-black/60 hover:bg-black/80">
                <Video className="h-5 w-5" />
                Watch video
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="text-4xl font-bold mb-2">2.29M+</div>
            <div className="text-lg text-muted-foreground">Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">10,000+</div>
            <div className="text-lg text-muted-foreground">Cards issued</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">$10M+</div>
            <div className="text-lg text-muted-foreground">Total amount spent</div>
          </div>
        </div>

        {/* Pay and spend globally */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">Pay and spend globally</h2>
          <Card className="bg-card border-2 mb-6">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">🎮</div>
                <div>
                  <div className="text-xl font-bold">Spend globally</div>
                  <div className="text-muted-foreground">Shop, subscribe, and pay anywhere VISA is accepted, with ease and security</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Card */}
          <Card className="bg-card border-2 mb-6">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">✈️</div>
                <div>
                  <div className="text-xl font-bold">Travel the world</div>
                  <div className="text-muted-foreground">Make payments seamlessly worldwide, from flights to hotels and beyond</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promote Card */}
          <Card className="bg-card border-2">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">📊</div>
                <div>
                  <div className="text-xl font-bold">Promote your business</div>
                  <div className="text-muted-foreground">Run successful ad campaigns and manage online expenses with ease</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safe and Secure */}
        <Card className="mb-12 bg-card border-2">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
                <div className="relative w-full h-full">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" opacity="0.2" />
                    <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary" strokeDasharray="351.86" strokeDashoffset="42.22" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">98%</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Fraud averted</div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Safe and secure</h3>
            <p className="text-muted-foreground">
              Enjoy peace of mind with advanced encryption and fraud detection on every payment
            </p>
          </CardContent>
        </Card>

        {/* Supported Countries */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Our crypto Visa card works in <span className="text-primary">Nigeria</span> and worldwide
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 my-8">
            {[
              { name: "Nigeria", flag: "🇳🇬" },
              { name: "Ethiopia", flag: "🇪🇹" },
              { name: "Algeria", flag: "🇩🇿" },
              { name: "Ghana", flag: "🇬🇭" },
              { name: "Egypt", flag: "🇪🇬" },
              { name: "Dominican Republic", flag: "🇩🇴" },
              { name: "France", flag: "🇫🇷" },
              { name: "Thailand", flag: "🇹🇭" },
            ].map((country) => (
              <div key={country.name} className="text-center">
                <div className="text-6xl mb-3">{country.flag}</div>
                <div className="text-lg font-semibold">{country.name}</div>
              </div>
            ))}
          </div>

          <Button className="w-full md:w-auto h-14 px-8 text-lg font-semibold">
            Explore more countries
          </Button>
        </div>

        {/* Get your card in under 5 minutes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Get your card in under 5 minutes
          </h2>
          
          <div className="space-y-6">
            <Card className="bg-card border-2">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-2">1. Create a NoOnes Account</div>
                    <div className="text-muted-foreground">Create a NoOnes account in a few simple steps</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-2">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-2">2. Verify your account</div>
                    <div className="text-muted-foreground">Verify your NoOnes account by submitting your ID</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-2">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xl font-bold mb-2">3. Deposit to Visa card</div>
                    <div className="text-muted-foreground">Fund your Visa card with crypto from your NoOnes wallet and start spending on the go</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Virtual Visa card fees */}
        <Card className="mb-12 bg-card border-2">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-primary">Virtual Visa card fees</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Card activation</span>
                <span className="text-xl font-bold">1 USDT</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Deposit</span>
                <span className="text-xl font-bold">2 USDT or 1.5%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Withdrawal</span>
                <span className="text-xl font-bold text-primary">0%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Outside the U.S. payment</span>
                <span className="text-xl font-bold">3%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-semibold">Max limit</span>
                <span className="text-xl font-bold">$50,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spend smarter comparison */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Spend smarter with the NoOnes crypto card
          </h2>
          
          <div className="space-y-4">
            <Card className="bg-muted/30 border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold mb-2">BYBIT</div>
                    <div className="text-sm text-muted-foreground mb-1">Open card: <span className="font-semibold">Free</span></div>
                    <div className="text-sm text-muted-foreground">Per transaction limit: <span className="font-semibold">5,000 USD</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary border-2 border-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold mb-2 text-primary-foreground">noOnes</div>
                    <div className="text-sm text-primary-foreground/90 mb-1">Open card: <span className="font-semibold">1 USD</span></div>
                    <div className="text-sm text-primary-foreground/90">Per transaction limit: <span className="font-semibold">50,000 USD</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold mb-2">BINANCE</div>
                    <div className="text-sm text-muted-foreground mb-1">Open card: <span className="font-semibold">Free</span></div>
                    <div className="text-sm text-muted-foreground">Per transaction limit: <span className="font-semibold">9,000 USD</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-8">Explore the answers to the most popular questions asked by our users</p>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What countries are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our crypto Visa card works in Nigeria and is accepted worldwide wherever Visa is accepted.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What are the fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Card activation: 1 USDT, Deposit: 2 USDT or 1.5%, Withdrawal: 0%, Outside U.S. payment: 3%
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What are the limits?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Maximum transaction limit is $50,000 USD per transaction.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                Where can I see the transaction history?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can view your transaction history in your NoOnes account dashboard.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-2 rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                What happens with my balance if I need to close the card?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your balance will be returned to your NoOnes wallet when you close the card.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Additional Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-8">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">NoOnes academy</h3>
              <p className="text-muted-foreground mb-4">Join millions of traders and learn by trading P2P</p>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-8">
              <Headphones className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">24/7 support</h3>
              <p className="text-muted-foreground mb-4">Reach out to us for answers to your specific questions</p>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Create your first card now</h2>
            <Link href="/wallet/visa-card">
              <Button className="h-16 px-10 text-lg font-bold">
                <CreditCard className="mr-2 h-5 w-5" />
                Get your card (±1 min)
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
