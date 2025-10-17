
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { medals, getMedalProgress, isMedalEarned } from "@/lib/medals";
import { useAuth } from "@/lib/auth-context";
import { Lock, Trophy, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserMedalStats, UserMedalStats } from "@/lib/medals-api";

export default function MedalsPage() {
  const { user } = useAuth();
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

  const getMedalIcon = (iconEmoji: string, earned: boolean) => {
    return (
      <div className={`text-4xl ${!earned ? 'grayscale opacity-50' : ''}`}>
        {iconEmoji}
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6">
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
  );
}
