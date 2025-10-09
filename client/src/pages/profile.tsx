import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PexlyFooter } from "@/components/pexly-footer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Copy,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [offerFilter, setOfferFilter] = useState("buying");
  const [feedbackFilter, setFeedbackFilter] = useState("buyers");

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const username = user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-primary">
          {username} 🇳🇬 Profile
        </h1>

        <Card className="mb-6 bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-elevate-1 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">1🏆</div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
                <span className="text-primary font-medium">Active now</span>
              </div>

              <div className="flex items-start gap-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center" 
                       style={{
                         clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                       }}>
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">@{username} 🇳🇬</h2>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:text-primary/80"
                      onClick={() => navigator.clipboard.writeText(`@${username}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-4">Nigeria</p>
                  <Button 
                    variant="ghost" 
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm pt-6 border-t border-border">
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Feedback:</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-primary">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="font-bold text-lg">345</span>
                    </div>
                    <div className="flex items-center gap-1 text-destructive">
                      <ThumbsDown className="h-4 w-4" />
                      <span className="font-bold text-lg">0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Languages:</p>
                  <p className="font-medium">English (English)</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-xs mb-2">Joined:</p>
                  <p className="font-medium">2 years ago</p>
                  <p className="text-muted-foreground text-xs">Apr 04, 2023</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 mb-6">
          Share Profile
        </Button>

        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-elevate-1 rounded-lg p-4 text-center">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Released</p>
                <p className="text-3xl font-bold">780</p>
              </div>
              <div className="bg-elevate-1 rounded-lg p-4 text-center">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trade Partners</p>
                <p className="text-3xl font-bold">121</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground uppercase text-xs mb-3">Verifications</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">🇳🇬</span>
                  <span className="font-medium">ID verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">🇳🇬</span>
                  <span className="font-medium">Phone verified</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-muted-foreground uppercase text-xs mb-3">Trade Volumes</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">₿</span>
                  <span>&lt; 10 BTC</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">◎</span>
                  <span>&lt; 10K SOL</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">₮</span>
                  <span>&lt; 10K USDT</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">$</span>
                  <span>&lt; 10K USDC</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">◆</span>
                  <span>&lt; 10K TON</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-primary">Ɱ</span>
                  <span>&lt; 10K XMR</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground uppercase text-xs mb-2">Trusted By</p>
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="font-bold text-lg">6 USERS</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Blocked By</p>
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">5 USERS</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Has Blocked</p>
                <div className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">0 USERS</span>
                </div>
              </div>
            </div>

            <div className="bg-muted text-foreground text-center py-3 rounded mb-4">
              For 30 days range
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Success</p>
                <p className="text-xl">—</p>
              </div>
              <div>
                <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Payment</p>
                <p className="text-xl">—</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground uppercase text-xs mb-2">Avg. Time to Release</p>
                <p className="text-xl">—</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground uppercase text-xs mb-2">Trades Volume</p>
                <p className="text-xl">&lt; 100USD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary">Active Offers</h2>
            <Select value={offerFilter} onValueChange={setOfferFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buying">Buying Crypto</SelectItem>
                <SelectItem value="selling">Selling Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="mb-4 bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-lg">No offers from active users.</p>
            </CardContent>
          </Card>

          <Button 
            variant="ghost" 
            className="w-full text-primary hover:text-primary/80 font-medium"
          >
            Load More Offers
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Feedback</h2>
            <Select value={feedbackFilter} onValueChange={setFeedbackFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyers">From Buyers</SelectItem>
                <SelectItem value="sellers">From Sellers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="mb-4 bg-elevate-1 border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">BODE_OBA 🇳🇬</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    <span className="text-primary font-bold">Positive</span>
                    <span className="text-muted-foreground ml-4">October 09, 2023</span>
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    Bank Transfer NGN
                  </Badge>
                  <p className="text-lg mb-2">"HONEST"</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Trades:</span>
                    <Badge className="bg-primary/20 text-primary">6</Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
              >
                View offer details →
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-4 bg-elevate-1 border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">2minmax_pro 🇳🇬</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                    <span className="text-primary font-bold">Positive</span>
                    <span className="text-muted-foreground ml-4">September 28, 2023</span>
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    Bank Transfer NGN
                  </Badge>
                  <p className="text-lg mb-2">"Fast and reliable"</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Trades:</span>
                    <Badge className="bg-primary/20 text-primary">12</Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
              >
                View offer details →
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <PexlyFooter />
    </div>
  );
}
