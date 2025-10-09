
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppFooter } from "@/components/app-footer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  TrendingUp, 
  Clock,
  CheckCircle2
} from "lucide-react";

export function Profile() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Public Profile</h1>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">
                    {user.email?.split('@')[0] || 'User'}
                  </h2>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    🆕 NEWBIE
                  </Badge>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Nigeria
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Active now
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">Start trading to build reputation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">No completed trades yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">Build your trading history</p>
            </CardContent>
          </Card>
        </div>

        {/* Trading Limits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Your Limits: Level 3
            </CardTitle>
            <CardDescription>Your current trading limits and capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">Daily Limit</span>
                <span className="text-primary font-bold">Unlimited</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">Buy/Sell Limit</span>
                <span className="text-primary font-bold">Unlimited</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium">Send Limit</span>
                <span className="text-primary font-bold">Unlimited</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Verification Status</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  Verified
                </Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Account Level</span>
                <Badge variant="secondary">Level 3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm mt-2">Start trading to see your activity here</p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <AppFooter />
    </div>
  );
}
