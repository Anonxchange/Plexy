import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Users, Coins, Layers, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

export default function Affiliate() {
  const partnerTypes = [
    {
      icon: <Crown className="h-8 w-8 text-[#B4F22E]" />,
      title: "Strategic Partners",
      description: "These collaborative ventures expand services, enhance user experiences, and amplify Pexly's reach within the cryptocurrency and financial landscapes.",
      cta: "Become a strategic partner"
    },
    {
      icon: <Users className="h-8 w-8 text-[#B4F22E]" />,
      title: "Service Partners",
      description: "Pexly collaborates with a trustworthy network of service partners, fortifying ours commitment to delivering a secure and user-centric trading environment.",
      cta: "Become a service partner"
    },
    {
      icon: <Coins className="h-8 w-8 text-[#B4F22E]" />,
      title: "Referral Partners",
      description: "Pexly's referral partners foster a thriving cryptocurrency community through their network and earn rewards from Pexly.",
      cta: "Become a referral partner"
    },
    {
      icon: <Layers className="h-8 w-8 text-[#B4F22E]" />,
      title: "Fiat Partners",
      description: "Pexly's fiat partners support the facilitation of swift exchanges between cryptocurrencies and fiat currencies within ours platform.",
      cta: "Become a fiat partner"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#B4F22E]/10 to-white dark:from-[#B4F22E]/5 dark:to-background py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          {/* Partners Illustration */}
          <div className="mb-8 flex justify-center">
            <img 
              src="/assets/IMG_2645.png" 
              alt="Partners collaboration illustration" 
              className="w-full max-w-2xl h-auto mx-auto"
            />
          </div>
          
          {/* Old illustration - keeping as fallback */}
          <div className="mb-8 flex justify-center hidden">
            <div className="relative w-full max-w-md">
              <div className="grid grid-cols-2 gap-4 transform rotate-45 scale-90">
                <div className="w-28 h-28 md:w-36 md:h-36 bg-[#B4F22E]/30 dark:bg-[#B4F22E]/20 rounded-2xl flex items-center justify-center transform -rotate-45 shadow-lg">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-400 rounded-full"></div>
                </div>
                <div className="w-28 h-28 md:w-36 md:h-36 bg-[#B4F22E]/50 dark:bg-[#B4F22E]/30 rounded-2xl flex items-center justify-center transform -rotate-45 shadow-lg">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[#8BC34A] rounded-full"></div>
                </div>
                <div className="w-28 h-28 md:w-36 md:h-36 bg-[#B4F22E]/70 dark:bg-[#B4F22E]/40 rounded-2xl flex items-center justify-center transform -rotate-45 shadow-lg">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full"></div>
                </div>
                <div className="w-28 h-28 md:w-36 md:h-36 bg-[#B4F22E] dark:bg-[#B4F22E]/60 rounded-2xl flex items-center justify-center transform -rotate-45 shadow-lg">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Pexly Partners Space
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Build connection, unlock opportunities together!
          </p>

          <Button 
            size="lg" 
            className="h-14 px-12 text-lg font-semibold bg-[#B4F22E] hover:bg-[#9FD624] text-black shadow-xl"
          >
            Become our Partner
          </Button>
        </div>
      </section>

      {/* 4 Types of Partners */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
            Pexly 4 types of partners
          </h2>

          <div className="space-y-6">
            {partnerTypes.map((partner, index) => (
              <Card key={index} className="border-2 hover:border-[#B4F22E]/50 dark:hover:border-[#B4F22E]/30 transition-colors">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-4">
                    {partner.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                    {partner.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {partner.description}
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-[#B4F22E] text-[#8BC34A] hover:bg-[#B4F22E]/10 dark:hover:bg-[#B4F22E]/20"
                  >
                    {partner.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Partners Logos */}
      <section className="py-12 md:py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Our service partners
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-2xl font-bold text-muted-foreground">aws</span>
            </div>
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
                <span className="ml-1 text-muted-foreground">Cloud</span>
              </span>
            </div>
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-xl font-bold text-muted-foreground">INTERCOM</span>
            </div>
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-xl font-bold text-muted-foreground">h1ackerone</span>
            </div>
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-xl font-bold text-muted-foreground">circleci</span>
            </div>
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all">
              <span className="text-xl font-bold text-muted-foreground">sumsub</span>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Partners Section */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-b from-[#B4F22E]/20 to-[#B4F22E]/5 dark:from-[#B4F22E]/10 dark:to-[#B4F22E]/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-[#8BC34A] uppercase tracking-wider mb-2">
              REFERRAL PARTNERS
            </p>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">
              Invite your friends, earn Bitcoin together
            </h2>
            <p className="text-muted-foreground">
              You and your qualified referees can each earn rewards in Bitcoin.
            </p>
          </div>

          {/* Bitcoin Illustration */}
          <div className="flex justify-center mb-8">
            <div className="relative w-full max-w-md h-64 flex items-center justify-center">
              <div className="absolute w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-4xl font-bold text-white">₿</span>
              </div>
              <div className="absolute -left-4 top-8 w-12 h-12 bg-[#B4F22E] rounded-full opacity-70"></div>
              <div className="absolute -right-4 bottom-8 w-16 h-16 bg-teal-400 rounded-lg opacity-70"></div>
              <div className="absolute left-16 bottom-4 w-8 h-8 bg-[#9FD624] rounded-full opacity-60"></div>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center">
            <Card className="w-full max-w-sm mx-auto shadow-2xl">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Profile</p>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#B4F22E] rounded-full flex items-center justify-center text-black font-bold">
                    P
                  </div>
                  <div>
                    <p className="font-semibold">pexlyUser</p>
                    <p className="text-sm text-muted-foreground">Today's bonus points</p>
                    <p className="text-xl font-bold text-[#B4F22E]">23,5 points</p>
                  </div>
                  <Button size="sm" className="ml-auto bg-[#B4F22E] hover:bg-[#9FD624] text-black">
                    Analysis
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold">Today's achievements</p>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">Deposit supported</p>
                      <p className="text-xs text-muted-foreground">1,000,000 VNDR - 1 point</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">3,000,000 VNDR</p>
                      <p className="text-xs text-[#B4F22E]">+3 points</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">Withdraw supported</p>
                      <p className="text-xs text-muted-foreground">1,000,000 VNDR - 1 point x2</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">7,500,000 VNDR</p>
                      <p className="text-xs text-[#B4F22E]">+15 points</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fiat Partners Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-[#8BC34A] uppercase tracking-wider mb-2">
              FIAT PARTNERS
            </p>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-foreground">
              Earn more with your capital
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Maximize income potential through Pexly Fiat Partners Program
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6 max-w-md mx-auto mb-8">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#B4F22E] flex items-center justify-center">
                  <span className="text-[#B4F22E] font-bold">1</span>
                </div>
                <div className="w-0.5 h-16 bg-[#B4F22E]/30 dark:bg-[#B4F22E]/20 mt-2"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Get ready with your package</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pexly account</li>
                  <li>• Capital</li>
                  <li>• Phone/Laptop for transactions</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#B4F22E] flex items-center justify-center">
                  <span className="text-[#B4F22E] font-bold">2</span>
                </div>
                <div className="w-0.5 h-16 bg-[#B4F22E]/30 dark:bg-[#B4F22E]/20 mt-2"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Complete your first buying/selling ads</h3>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-2 border-[#B4F22E] flex items-center justify-center">
                  <span className="text-[#B4F22E] font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Follow earning commissions table</h3>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button className="bg-[#B4F22E] hover:bg-[#9FD624] text-black">
              Explore now
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-gradient-to-br from-[#B4F22E]/10 to-white dark:from-[#B4F22E]/10 dark:to-background border-2">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-6">
                Apply to become our partners today
              </h3>
              <Button 
                className="bg-[#B4F22E] hover:bg-[#9FD624] text-black px-8"
              >
                Become Pexly Partner
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pexly Footer */}
      <PexlyFooter />
    </div>
  );
}
