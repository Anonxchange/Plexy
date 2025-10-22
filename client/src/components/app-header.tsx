import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  subscribeToNotifications,
  type Notification 
} from "@/lib/notifications-api";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { user, signOut } = useAuth();
  const [location, navigate] = useLocation();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const supabase = createClient();
  const { verificationLevel, levelConfig } = useVerificationGuard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    getNotifications().then(setNotifications);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);

      // Show toast for new notification
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user, toast]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // Navigate based on notification type
    if (notification.metadata?.url) {
      navigate(notification.metadata.url);
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const avatarTypes = [
    { id: 'default', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
    { id: 'trader', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=trader' },
    { id: 'crypto', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crypto' },
    { id: 'robot', image: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot' },
    { id: 'ninja', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ninja' },
    { id: 'astronaut', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut' },
    { id: 'developer', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer' },
    { id: 'artist', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist' },
  ];

  useEffect(() => {
    if (user) {
      fetchProfileAvatar();
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile for username
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (!profileError && profileData?.username) {
        setUserName(profileData.username);
      } else {
        // Fallback to email username
        setUserName(user?.email?.split('@')[0] || 'User');
      }

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user?.id)
        .eq('currency', 'USD')
        .single();

      if (!walletError && walletData) {
        setBalance(walletData.balance);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProfileAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url, avatar_type')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile avatar:', error);
        return;
      }

      if (data?.avatar_url) {
        setProfileAvatar(data.avatar_url);
      } else if (data?.avatar_type) {
        const selectedAvatar = avatarTypes.find(a => a.id === data.avatar_type);
        if (selectedAvatar) {
          setProfileAvatar(selectedAvatar.image);
        }
      }
    } catch (error) {
      console.error('Error fetching profile avatar:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Menu button (when signed in) */}
        <div className="flex items-center gap-2 flex-1">
          {user && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-sidebar-toggle"
              className="border-border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1" data-testid="link-home-header">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold">Pexly</span>
          </Link>
        </div>

        <div className="flex-1 hidden md:block"></div>

        {/* Right side - Profile info and menu button (when not signed in) */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
          {user ? (
            <>
              <div className="text-center relative max-w-[120px] sm:max-w-[150px]">
                <div className="text-sm font-semibold text-foreground truncate">
                  {userName || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <span className="truncate">
                    {balanceVisible ? `${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : "****"}
                  </span>
                  <button 
                    className="inline-flex items-center justify-center h-4 w-4 hover:opacity-70 transition-opacity flex-shrink-0"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                  >
                    {balanceVisible ? (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0"
                    data-testid="button-profile"
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                      <AvatarImage src={profileAvatar || user?.user_metadata?.avatar_url} alt="User avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ?? 
                         user?.email?.substring(0, 2)?.toUpperCase() ?? 
                         "JD"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-0">
                <div className="p-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Dashboard</div>
                  <div className="text-xs text-muted-foreground">Your main dashboard</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Profile</div>
                  <div className="text-xs text-muted-foreground">Your public profile</div>
                </div>
              </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/trade-history")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Trade statistics</span>
                      <span className="text-xs text-muted-foreground">Trade history, partners, statistics</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Account settings</span>
                      <span className="text-xs text-muted-foreground">Verification, notifications, security</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/submit-idea")}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Submit an idea</span>
                      <span className="text-xs text-muted-foreground">Improve Pexly with us</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Wallet className="h-4 w-4" />
                      <span>Your limits: Level {verificationLevel}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => navigate("/verification")}
                    >
                      {verificationLevel === 0 ? "Verify Now" : "Upgrade"}
                    </Button>
                  </div>
                  {levelConfig && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily</span>
                        <span className="font-medium">
                          {levelConfig.dailyLimit 
                            ? `$${levelConfig.dailyLimit.toLocaleString()}` 
                            : "Unlimited"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Trade</span>
                        <span className="font-medium">
                          {levelConfig.perTradeLimit 
                            ? `$${levelConfig.perTradeLimit.toLocaleString()}` 
                            : "Unlimited"}
                        </span>
                      </div>
                      {levelConfig.lifetimeTradeLimit && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lifetime</span>
                          <span className="font-medium">
                            ${levelConfig.lifetimeTradeLimit.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-sidebar-toggle"
              className="border-border"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}