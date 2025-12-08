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
  ChevronRight,
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
import { Input } from "@/components/ui/input";

interface TrustedUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  last_seen?: string;
  is_online: boolean;
}

export function TrustedUsers() {
  const [trustedUsers, setTrustedUsers] = useState<TrustedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user) {
      fetchTrustedUsers();
    }
  }, [user]);

  const fetchTrustedUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("trusted_users")
        .select(`
          id,
          trusted_user_id,
          profiles:trusted_user_id (
            id,
            username,
            avatar_url,
            is_online,
            last_seen
          )
        `)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error fetching trusted users:", error);
        setTrustedUsers([]);
        return;
      }

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.trusted_user_id,
        username: item.profiles?.username || "Unknown",
        avatar_url: item.profiles?.avatar_url,
        is_online: item.profiles?.is_online || false,
        last_seen: item.profiles?.last_seen,
      }));

      setTrustedUsers(mapped);
    } catch (error) {
      console.error("Error fetching trusted users:", error);
      setTrustedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getLastSeenText = (isOnline: boolean, lastSeen?: string) => {
    if (isOnline) return "Active now";
    if (!lastSeen) return "Offline";
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / 60000);
    if (diffMinutes < 60) return `Seen ${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `Seen ${Math.floor(diffMinutes / 60)} hour${Math.floor(diffMinutes / 60) > 1 ? 's' : ''} ago`;
    if (diffMinutes < 10080) return `Seen ${Math.floor(diffMinutes / 1440)} day${Math.floor(diffMinutes / 1440) > 1 ? 's' : ''} ago`;
    if (diffMinutes < 43200) return `Seen ${Math.floor(diffMinutes / 10080)} month${Math.floor(diffMinutes / 10080) > 1 ? 's' : ''} ago`;
    return `Seen ${Math.floor(diffMinutes / 525600)} year${Math.floor(diffMinutes / 525600) > 1 ? 's' : ''} ago`;
  };

  const filteredUsers = trustedUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveTrust = async (trustedUserId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from("trusted_users")
        .delete()
        .eq("id", trustedUserId);
      
      setTrustedUsers((prev) => prev.filter((u) => u.id !== trustedUserId));
    } catch (error) {
      console.error("Error removing trusted user:", error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Trusted Users</h1>
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
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')} className="bg-primary/10">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
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
                      <MoreVertical className="h-5 w-5" />
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
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')} className="bg-primary/10">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
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
                <p className="text-muted-foreground">Loading trusted users...</p>
              </div>
            ) : trustedUsers.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <ThumbsUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No trusted users yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Add users you trust for easier trading
                  </p>
                  <Link href="/p2p">
                    <Button>Find Traders</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((trustedUser) => (
                  <Card
                    key={trustedUser.id}
                    className="bg-card border-border"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => navigate(`/profile/${trustedUser.user_id}`)}
                        >
                          <Avatar className="w-12 h-12 border-2 border-primary">
                            <AvatarImage src={trustedUser.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {trustedUser.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-primary truncate">
                              {trustedUser.username}
                            </h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <span className={`w-2 h-2 rounded-full ${trustedUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {getLastSeenText(trustedUser.is_online, trustedUser.last_seen)}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ChevronDown className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/profile/${trustedUser.user_id}`)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemoveTrust(trustedUser.id)}
                            >
                              Remove from Trusted
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
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/trusted-users')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
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
                <h1 className="text-3xl font-bold">Trusted Users</h1>
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
                    <DropdownMenuItem onClick={() => navigate('/trusted-users')} className="bg-primary/10">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
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
                    <p className="text-muted-foreground">Loading trusted users...</p>
                  </CardContent>
                </Card>
              ) : trustedUsers.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <ThumbsUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No trusted users yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Add users you trust for easier trading
                    </p>
                    <Link href="/p2p">
                      <Button>Find Traders</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((trustedUser) => (
                    <Card
                      key={trustedUser.id}
                      className="bg-card border-border"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center gap-4 flex-1 cursor-pointer"
                            onClick={() => navigate(`/profile/${trustedUser.user_id}`)}
                          >
                            <Avatar className="w-14 h-14 border-2 border-primary">
                              <AvatarImage src={trustedUser.avatar_url} />
                              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                                {trustedUser.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg text-primary truncate">
                                {trustedUser.username}
                              </h3>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <span className={`w-2 h-2 rounded-full ${trustedUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {getLastSeenText(trustedUser.is_online, trustedUser.last_seen)}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/profile/${trustedUser.user_id}`)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveTrust(trustedUser.id)}
                              >
                                Remove from Trusted
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

export default TrustedUsers;
