
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
  ChevronDown,
  HelpCircle,
  Award
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTerms, setShowTerms] = useState(false);
  const [, navigate] = useLocation();

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

  // Guest view (not logged in)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-8 flex justify-center">
              <div className="relative w-64 h-64">
                <img 
                  src="/assets/IMG_1961.jpeg" 
                  alt="Referral illustration" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Refer Your Friends and Earn<br />
              <span className="text-primary">40% Commission</span>
            </h1>
            
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Invite your friends to create an account and start trading. You can earn up to{" "}
              <span className="text-primary font-semibold">40% Commission</span> from their trading fees!
            </p>

            <Button 
              size="lg" 
              className="w-full max-w-md h-14 text-lg"
              onClick={() => navigate("/signup")}
            >
              Register / Login to invite friends
            </Button>
          </div>

          {/* How to Join Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">How to join</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">1</span>
                  </div>
                  <div className="w-0.5 h-16 bg-primary/20 ml-5 mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Choose commission split</h3>
                  <p className="text-muted-foreground">
                    Determine commissions split between you and your friends
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">2</span>
                  </div>
                  <div className="w-0.5 h-16 bg-primary/20 ml-5 mt-2"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Invite friends</h3>
                  <p className="text-muted-foreground">
                    Send your friends referral links and guide them to sign up, start trading!
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">3</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Earn commission</h3>
                  <p className="text-muted-foreground">
                    You can earn up to 40% commission of tier-1 referrals' trading fees and 10% of tier-2's trading feeds
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <span className="text-left font-medium">
                    What trading products does this program commission apply to?
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                  The referral commission applies to all trading products on Pexly including P2P Trading, Spot Trading, and Swap. You'll earn commission from all trading fees generated by your referrals.
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <span className="text-left font-medium">
                    Why does my friend referral code is from someone else, not mine?
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                  The referral code is assigned to the first person who referred your friend. If they signed up using someone else's referral link first, that code will be associated with their account permanently.
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <span className="text-left font-medium">
                    What are terms and conditions of the program?
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                  Please refer to our Terms & Conditions section at the bottom of this page for detailed information about the referral program rules, commission structure, and eligibility requirements.
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <span className="text-left font-medium">
                    When will this program end?
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                  The Pexly referral program is ongoing. However, we reserve the right to modify or terminate the program at any time. Any changes will be communicated in advance to all participants.
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <span className="text-left font-medium">
                    What pairs are considered for $3000 trading volume?
                  </span>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-muted-foreground">
                  All trading pairs on Pexly count towards the trading volume calculation, including all cryptocurrency pairs available on our Spot Trading platform. The volume is calculated in USDT equivalent.
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        <PexlyFooter />
      </div>
    );
  }

  // Logged in user view
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <div className="relative w-48 h-48">
                <img 
                  src="/assets/IMG_1961.jpeg" 
                  alt="Refer & Win" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Refer & Win: Easy Rewards for<br />You and Friends!
            </h1>
            
            <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-8">
              Share the joy with friends and earn exciting rewards. Enjoy vouchers, spins, and coins with every invite. The more you share, the more you win!
            </p>
          </div>

          {/* Referral Code & Link */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between px-4 py-3 border border-border rounded-xl bg-card">
              <span className="text-muted-foreground text-sm">Referral code</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{referralCode}</span>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8 text-primary hover:text-primary/80"
                  onClick={() => copyToClipboard(referralCode, "Referral code")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border border-border rounded-xl bg-card">
              <span className="text-muted-foreground text-sm">Referral link</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground truncate max-w-[180px]">{referralLink}</span>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8 text-primary hover:text-primary/80"
                  onClick={() => copyToClipboard(referralLink, "Referral link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-semibold rounded-xl" size="lg" onClick={shareReferral}>
              Invite and Earn
            </Button>
          </div>

          {/* Rewards Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Rewards</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                    <Gift className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">You have no reward!</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Invite your friends to get more rewards
                  </p>
                  <Button variant="outline" onClick={shareReferral}>
                    Invite and Earn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referrals Tracking */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Referrals</h2>
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Invited Friends</div>
                    <div className="text-3xl font-bold">{totalReferrals}</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open referral link</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Register & KYC LV2</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Complete first trade</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reach $1500 coin-to-fiat volume</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for referral status */}
            <div className="mb-4">
              <div className="overflow-x-auto scrollbar-hide border-b">
                <div className="flex gap-4 min-w-max">
                  <button className="pb-2 px-4 text-sm font-medium border-b-2 border-primary whitespace-nowrap">All</button>
                  <button className="pb-2 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Completed</button>
                  <button className="pb-2 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">In progress</button>
                  <button className="pb-2 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Expired</button>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">No data</div>
                  <Button variant="default" onClick={shareReferral}>
                    Invite and Earn
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Earn More Deals Section */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Earn more deals</h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4">Lucky spins</h3>
              <Button variant="outline" className="w-full">
                Hunt for rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4">Loyalty badges</h3>
              <Button variant="outline" className="w-full">
                Hunt for rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4">Cashback vouchers</h3>
              <Button variant="outline" className="w-full">
                Hunt for rewards
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold mb-4">Crypto Deposit Rewards</h3>
              <Button variant="outline" className="w-full">
                Hunt for rewards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="px-4 py-12">

      <h2 className="text-2xl font-bold mb-6">FAQs</h2>
        <Card>
          <CardContent className="p-0">
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  What are terms and conditions of the program?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                Please refer to our Terms & Conditions. The referral program applies to all trading on Pexly. Commissions are distributed daily at 4AM UTC based on your referees' net trading fees.
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  What trading products does this program commission apply to?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                The referral commission applies to all trading products on Pexly including P2P Trading, Spot Trading, and Swap. You'll earn commission from all trading fees generated by your referrals.
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  Why does my friend referral code is from someone else, not mine?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                The referral code is assigned to the first person who referred your friend. If they signed up using someone else's referral link first, that code will be associated with their account permanently.
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  How to earn referral bonus?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                Share your referral code or link with friends. When they sign up and complete trades, you earn commissions. The more active your referrals, the more you earn.
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  When will this program end?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                The Pexly referral program is ongoing. However, we reserve the right to modify or terminate the program at any time. Any changes will be communicated in advance to all participants.
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                <span className="text-left font-medium">
                  What pairs are considered for $3000 trading volume?
                </span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                All trading pairs on Pexly count towards the trading volume calculation, including all cryptocurrency pairs available on our Spot Trading platform. The volume is calculated in USDT equivalent.
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      <PexlyFooter />
    </div>
  );
}
