
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { medals, getMedalProgress, isMedalEarned } from "@/lib/medals";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Lock, 
  Trophy, 
  Loader2,
  Package,
  History,
  Users,
  Star,
  ThumbsUp,
  BarChart3,
  Award,
  QrCode,
  Medal,
  Settings,
  Code
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserMedalStats, UserMedalStats } from "@/lib/medals-api";
import { useLocation } from "wouter";

export default function MedalsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [userStats, setUserStats] = useState<UserMedalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.id) {
        setLoading(true);
        const stats = await getUserMedalStats(user.id);
        setUserStats(stats);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user?.id]);

  if (loading || !userStats) {
    return (
      <div className="container max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const earnedMedals = medals.filter(medal => isMedalEarned(medal, userStats));
  const lockedMedals = medals.filter(medal => !isMedalEarned(medal, userStats));

  const getMedalIcon = (iconPath: string, earned: boolean) => {
    return (
      <div className={`${!earned ? 'opacity-50 grayscale' : ''}`}>
        <img 
          src={iconPath} 
          alt="medal icon"
          className="h-16 w-16 object-contain"
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Desktop Left Sidebar - Navigation Menu (hidden on mobile) */}
        {!isMobile && (
          <div className="lg:col-span-3">
            <Card className="bg-card border-border sticky top-6">
              <CardContent className="p-4">
                <h2 className="text-lg font-bold mb-4">Menu</h2>
                <nav className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/my-offers')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    My Offers
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/trade-history')}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Trade History
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/p2p')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Recent Trade Partners
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/p2p')}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Favorite Offers
                  </Button>
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/p2p')}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Trusted Users
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/p2p')}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Blocked Users
                  </Button>
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/trade-history')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Trade Statistics
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/merchant-application')}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Become a Merchant
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/profile')}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Share Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-primary/10"
                    onClick={() => setLocation('/medals')}
                  >
                    <Medal className="h-4 w-4 mr-2" />
                    Medals
                  </Button>
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/account-settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => window.open('https://docs.replit.com', '_blank')}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Developer
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area (9/12 width on desktop, full on mobile) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Medals</h1>
            </div>
            <p className="text-muted-foreground">
              Earn recognition for your milestones with medals
            </p>
          </div>

      {/* Stats Overview */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{earnedMedals.length}</div>
                  <div className="text-sm text-muted-foreground">Medals Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.totalTrades}</div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${userStats.totalVolume.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Earned Medals */}
          {earnedMedals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Earned Medals ({earnedMedals.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {earnedMedals.map((medal) => (
                  <Card key={medal.id} className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="mb-3 flex justify-center">
                        {getMedalIcon(medal.icon, true)}
                      </div>
                      <h3 className="font-semibold mb-1">{medal.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {medal.description}
                      </p>
                      <Badge variant="default" className="text-xs">
                        {medal.requirement.value}{medal.requirement.unit || ''}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

      {/* Locked Medals */}
          {lockedMedals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Locked Medals ({lockedMedals.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lockedMedals.map((medal) => {
                  const progress = getMedalProgress(medal, userStats);
                  return (
                    <Card key={medal.id} className="border-muted">
                      <CardContent className="p-4 text-center">
                        <div className="mb-3 flex justify-center">
                          {getMedalIcon(medal.icon, false)}
                        </div>
                        <h3 className="font-semibold mb-1 text-muted-foreground">
                          {medal.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {medal.description}
                        </p>
                        <div className="space-y-2">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {Math.round(progress)}% Complete
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {medal.requirement.value}{medal.requirement.unit || ''}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
