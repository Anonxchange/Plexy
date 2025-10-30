import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Copy, 
  Share2, 
  DollarSign, 
  Gift, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Info,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTerms, setShowTerms] = useState(false);

  const referralCode = user?.id ? `PEX${user.id.slice(0, 8).toUpperCase()}` : "PEXUSER123";
  const referralLink = `https://pexly.com/signup?ref=${referralCode}`;
  const totalReferrals = 12;
  const totalEarnings = 847.50;
  const currentCommissionRate = 25;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Pexly',
        text: `Join Pexly using my referral code and earn rewards! Use code: ${referralCode}`,
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink, "Referral link");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Invite Friends to Earn Over 1,720 USDT and 30% Commission
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" />
          How to get rewards
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Your Referral Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Referrals</span>
              <span className="text-2xl font-bold">{totalReferrals}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Earnings</span>
              <span className="text-2xl font-bold text-primary">${totalEarnings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Commission Rate</span>
              <Badge variant="default" className="text-lg">{currentCommissionRate}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Referral Link</CardTitle>
            <CardDescription>Invite friends and start earning rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Code</label>
              <div className="flex gap-2">
                <Input value={referralCode} readOnly className="font-mono" />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(referralCode, "Referral code")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Link</label>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs" />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => copyToClipboard(referralLink, "Referral link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={shareReferral}>
              <Share2 className="h-4 w-4 mr-2" />
              Invite Friends
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Earn $1,032 each when your referee completes the tasks!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-2xl font-bold text-primary">$10</div>
              <div className="text-xs text-muted-foreground">Bonus for both of you</div>
              <Separator className="my-2" />
              <div className="text-sm font-medium">Referee deposits $100</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-2xl font-bold text-primary">$7</div>
              <div className="text-xs text-muted-foreground">Bonus for both of you</div>
              <Separator className="my-2" />
              <div className="text-sm font-medium">Referee makes a fiat deposit</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-2xl font-bold text-primary">$15</div>
              <div className="text-xs text-muted-foreground">Bonus for both of you</div>
              <Separator className="my-2" />
              <div className="text-sm font-medium">Referee trades $500</div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-2xl font-bold text-primary">Up to $1,000</div>
              <div className="text-xs text-muted-foreground">Max for both of you</div>
              <Separator className="my-2" />
              <div className="text-sm font-medium">Referee trades $10,000</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>The more friends you invite, the higher your commission rate, up to 30%!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-center font-bold text-lg">20%</div>
                <div className="h-32 bg-primary/80 rounded-t-lg"></div>
                <div className="text-center text-sm text-muted-foreground">0 Referees</div>
              </div>
              <div className="space-y-2">
                <div className="text-center font-bold text-lg">25%</div>
                <div className="h-40 bg-primary/90 rounded-t-lg"></div>
                <div className="text-center text-sm text-muted-foreground">5 Referees</div>
              </div>
              <div className="space-y-2">
                <div className="text-center font-bold text-lg">30%</div>
                <div className="h-48 bg-primary rounded-t-lg"></div>
                <div className="text-center text-sm text-muted-foreground">100 Referees</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Progress to 30%</span>
                <span className="font-medium">{totalReferrals}/100 referrals</span>
              </div>
              <Progress value={(totalReferrals / 100) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invite More, Earn More</CardTitle>
          <CardDescription>Multiple ways to earn rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-6 space-y-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-primary">Up to $3</div>
                <Gift className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">Invite a friend to Pexly Earn</div>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent">
                Learn more <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-primary">Up to $20</div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">Refer a friend to Pexly Card</div>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent">
                Learn more <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-primary">Up to $665</div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">Refer a friend to Copy Trading</div>
              <Button variant="ghost" className="p-0 h-auto text-primary hover:bg-transparent">
                Learn more <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">Share Your Code and Link</h3>
              <p className="text-sm text-muted-foreground">
                Copy your unique referral code or link and share it with friends
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">Connect with Your Friends</h3>
              <p className="text-sm text-muted-foreground">
                Your friends sign up using your referral code or link
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">Get Multiple Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Earn bonuses and commissions when your friends complete tasks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            TERMS & CONDITIONS
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTerms(!showTerms)}
            >
              {showTerms ? "Hide" : "Show"} <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showTerms ? "rotate-180" : ""}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        {showTerms && (
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">1</div>
                <div className="text-muted-foreground">
                  Pexly does not conduct referral programs in Germany, the United Kingdom, France, Belgium, 
                  Hong Kong and all regions where Pexly does not operate.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">2</div>
                <div className="text-muted-foreground">
                  Referrers will start earning commissions when a referee signs up with Pexly and whenever their 
                  referees complete a trade on the Pexly platform. Upon the registration of a referee, referrers will 
                  be able to receive commissions on the trades of their referees for 365 days.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">3</div>
                <div className="text-muted-foreground">
                  Referral commissions will be distributed at 4AM UTC daily. Referral commissions are derived from 
                  the referee's Net Trading Fee (Net Trading Fee = Trading fee - bonus - coupons - other costs). 
                  Net Trading Fees will be calculated in USDT.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">4</div>
                <div className="text-muted-foreground">
                  Eligible deposits include One-Click Buy, P2P Trading, Crypto Deposits, and Fiat Deposits. 
                  Internal transfer of funds will not be considered for this event.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">5</div>
                <div className="text-muted-foreground">
                  Spot trading pairs with zero fees will not be counted toward calculation.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">6</div>
                <div className="text-muted-foreground">
                  Pexly reserves the right to disqualify any user who engages in fraudulent or abusive activities, 
                  including but not limited to self-referrals, fake accounts, or wash trading.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">7</div>
                <div className="text-muted-foreground">
                  All rewards are subject to KYC verification. Users must complete identity verification to receive rewards.
                </div>
              </div>

              <div className="flex gap-3">
                <div className="font-bold flex-shrink-0">8</div>
                <div className="text-muted-foreground">
                  Pexly reserves the right to modify or terminate this referral program at any time without prior notice.
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="mt-8 bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Join Pexly Affiliates Program to unlock Up to 50% Commission</h2>
            <p className="text-muted-foreground">
              Become an affiliate and earn even higher commissions on every referral
            </p>
            <Button size="lg" className="mt-4">
              Start Earning Now <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
