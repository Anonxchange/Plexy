import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Package,
  History,
  Users,
  Star,
  ThumbsUp,
  Lock,
  BarChart3,
  Award,
  QrCode,
  Medal,
  Settings,
  Code,
  MoreVertical,
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlockedUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  blocked_at: string;
}

export function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("blocked_users")
        .select(`
          id,
          blocked_user_id,
          created_at,
          profiles:blocked_user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching blocked users:", error);
        setBlockedUsers([]);
        return;
      }

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.blocked_user_id,
        username: item.profiles?.username || "Unknown",
        avatar_url: item.profiles?.avatar_url,
        blocked_at: item.created_at,
      }));

      setBlockedUsers(mapped);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from("blocked_users")
        .delete()
        .eq("id", blockedId);
      
      setBlockedUsers((prev) => prev.filter((u) => u.id !== blockedId));
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Blocked Users</h1>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Account
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')} className="bg-primary/10">
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/p2p')}>
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')} className="bg-primary/10">
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/merchant-application')}>
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/medals')}>
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open('https://docs.replit.com', '_blank')}>
                      <Code className="h-4 w-4 mr-2" />
                      Developer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading blocked users...</p>
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Search className="h-4 w-4" />
                <span>No blocked users found</span>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((blockedUser) => (
                  <Card
                    key={blockedUser.id}
                    className="bg-card border-border"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-12 h-12 border-2 border-muted">
                            <AvatarImage src={blockedUser.avatar_url} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                              {blockedUser.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {blockedUser.username}
                            </h3>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleUnblock(blockedUser.id)}
                            >
                              Unblock User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Desktop 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Sidebar - Navigation Menu */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border sticky top-6">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold mb-4">Menu</h2>
                  <nav className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/favorite-offers')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trusted-users')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/blocked-users')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/merchant-application')}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/profile')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/medals')}
                    >
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/account-settings')}
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

            {/* Right Content Area */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Blocked Users</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Account
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')} className="bg-primary/10">
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Users List */}
              {loading ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading blocked users...</p>
                  </CardContent>
                </Card>
              ) : blockedUsers.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Search className="h-4 w-4" />
                  <span>No blocked users found</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((blockedUser) => (
                    <Card
                      key={blockedUser.id}
                      className="bg-card border-border"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="w-14 h-14 border-2 border-muted">
                              <AvatarImage src={blockedUser.avatar_url} />
                              <AvatarFallback className="bg-muted text-muted-foreground font-bold text-lg">
                                {blockedUser.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">
                                {blockedUser.username}
                              </h3>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleUnblock(blockedUser.id)}
                              >
                                Unblock User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <PexlyFooter />
      </div>
    </>
  );
}

export default BlockedUsers;
