import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard, Home, ShoppingCart, Store, Trophy, Gift, TrendingUp, ChevronDown, List, Plus, Bitcoin, ArrowDownToLine, CreditCard, ShoppingBag, Banknote, Smartphone, HelpCircle, MessageSquare, Users } from "lucide-react";
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
import { useWalletData } from "@/hooks/use-wallet-data";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  subscribeToNotifications,
  type Notification 
} from "@/lib/notifications-api";
import { useToast } from "@/hooks/use-toast";

interface NotificationIconProps {
  count?: number;
  onClick?: () => void;
}

const NotificationIcon = ({ count = 0, onClick }: NotificationIconProps) => {
  const displayCount = count > 99 ? "99+" : count;
  const showBadge = count > 0;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 bg-card rounded-xl shadow-notification hover:shadow-notification-hover transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
    >
      <Bell className="w-5 h-5 text-foreground" strokeWidth={2} />
      
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-badge-pop">
          {displayCount}
        </span>
      )}
    </button>
  );
};

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
  
  const { data: walletData, isLoading: walletsLoading } = useWalletData();
  const balance = walletData?.totalBalance || 0;
  const preferredCurrency = walletData?.preferredCurrency || 'USD';
  const isConverting = walletData?.isConverting || false;

  const setPreferredCurrency = (currency: string) => {
    if (user?.id) {
      localStorage.setItem(`pexly_currency_${user.id}`, currency);
    }
  };
  
  useEffect(() => {
    if (!user) return;

    const checkCurrency = () => {
      const stored = localStorage.getItem(`pexly_currency_${user.id}`);
      if (stored) {
        const upper = stored.toUpperCase();
        if (upper !== preferredCurrency) {
          setPreferredCurrency(upper);
        }
      }
    };

    const interval = setInterval(checkCurrency, 1000);
    return () => clearInterval(interval);
  }, [user, preferredCurrency]);

  useEffect(() => {
    if (!user) return;

    getNotifications().then(setNotifications);

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user, toast]);

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
      
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('username, preferred_currency')
          .eq('id', user?.id)
          .single();
        
        if (profile?.username) setUserName(profile.username);
        if (profile?.preferred_currency) setPreferredCurrency(profile.preferred_currency.toUpperCase());
      };
      
      fetchProfile();
    }
  }, [user]);

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

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}`;
  };

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isSecurityStrong = useMemo(() => {
    if (!user) return false;
    const has2FA = user.user_metadata?.two_factor_enabled;
    const hasPhone = !!user.phone;
    const hasEmailVerified = !!user.email_confirmed_at;
    return has2FA && hasPhone && hasEmailVerified;
  }, [user]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-[#f2f2f2]/60 dark:bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-[#f2f2f2]/60 dark:supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {user && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)}
              data-testid="button-sidebar-toggle"
              className="border-border lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1" data-testid="link-home-header">
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-foreground">Pexly</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-8">
          <DropdownMenu open={activeDropdown === 'trade'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('trade')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location === "/spot" || location === "/swap" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group text-sm font-medium"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Trade
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('trade')}
              >
                <DropdownMenuItem onClick={() => { navigate('/buy-crypto'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>Buy Crypto</span>
                    <Badge variant="secondary" className="text-xs">LOW FEES</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/spot'); setActiveDropdown(null); }} className="cursor-pointer">
                  Spot Trading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/swap'); setActiveDropdown(null); }} className="cursor-pointer">
                  Swap
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/prediction'); setActiveDropdown(null); }} className="cursor-pointer">
                  Prediction
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <Link href="/gift-cards">
            <Button
              variant={location === "/gift-cards" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 text-sm font-medium"
            >
              <Gift className="h-4 w-4" />
              Gift Cards
            </Button>
          </Link>

          <Link href="/explorer">
            <Button
              variant={location.startsWith("/explorer") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 text-sm font-medium"
            >
              <Lightbulb className="h-4 w-4" />
              Pexly Explorer
            </Button>
          </Link>

          <DropdownMenu open={activeDropdown === 'wallet'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('wallet')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location.startsWith("/wallet") ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group text-sm font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  Wallet
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-72"
                onPointerEnter={() => setActiveDropdown('wallet')}
              >
                <DropdownMenuItem onClick={() => { navigate('/wallet'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Bitcoin className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Assets</span>
                    <span className="text-xs text-muted-foreground">My assets in the Pexly wallet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/receive'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <ArrowDownToLine className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Receive</span>
                    <span className="text-xs text-muted-foreground">Receive crypto or deposit using fiat</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/visa-card'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <CreditCard className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Visa card</span>
                    <span className="text-xs text-muted-foreground">Spend your crypto</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/crypto-to-bank'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Banknote className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Crypto to Bank</span>
                    <span className="text-xs text-muted-foreground">Cash out to bank or MoMo wallet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/lightning'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Lightning</span>
                    <span className="text-xs text-muted-foreground">Send Bitcoin ultra fast</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/mobile-topup'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Smartphone className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Mobile top-up</span>
                    <span className="text-xs text-muted-foreground">Recharge your phone using crypto</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/utility'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Utility</span>
                    <span className="text-xs text-muted-foreground">Pay bills and other services</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <DropdownMenu open={activeDropdown === 'shop'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('shop')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location.startsWith("/shop") ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group text-sm font-medium"
                >
                  <Store className="h-4 w-4" />
                  Shop
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">BETA</Badge>
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('shop')}
              >
                <DropdownMenuItem onClick={() => { navigate('/shop'); setActiveDropdown(null); }} className="cursor-pointer">
                  <List className="h-4 w-4 mr-2" />
                  Listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/shop/post'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Post Ad</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">FREE</Badge>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <DropdownMenu open={activeDropdown === 'earn'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('earn')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location === "/wallet/stake" || location === "/referral" || location === "/rewards" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group text-sm font-medium"
                >
                  <TrendingUp className="h-4 w-4" />
                  Earn
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('earn')}
              >
                <DropdownMenuItem onClick={() => { navigate('/wallet/stake'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      <span>Stake</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-red-500 text-white hover:bg-red-600 border-none animate-pulse">HOT</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/referral'); setActiveDropdown(null); }} className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Referral Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/rewards'); setActiveDropdown(null); }} className="cursor-pointer">
                  <Gift className="h-4 w-4 mr-2" />
                  Rewards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <DropdownMenu open={activeDropdown === 'support'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('support')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location.startsWith("/support") || location === "/contact" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group text-sm font-medium"
                >
                  <HelpCircle className="h-4 w-4" />
                  Support
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('support')}
              >
                <DropdownMenuItem onClick={() => { navigate('/contact'); setActiveDropdown(null); }} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { window.open('https://help.pexly.app', '_blank'); setActiveDropdown(null); }} className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center / FAQ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2 justify-end">
          {user ? (
            <>
              <div className="text-center relative max-w-[120px] sm:max-w-[150px] hidden sm:block">
                <div className="text-sm font-semibold text-foreground truncate">
                  {userName || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <span className="truncate">
                    {walletsLoading || isConverting ? (
                      <Skeleton className="h-3 w-16" />
                    ) : (
                      balanceVisible ? `${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}` : "****"
                    )}
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
                <DropdownMenuContent align="end" className="w-[280px] p-0" sideOffset={8}>
                  <div className="p-2">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer py-2.5">
                      <LayoutDashboard className="h-4 w-4 mr-3" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer py-2.5">
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account-settings')} className="cursor-pointer py-2.5">
                      <Settings className="h-4 w-4 mr-3" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/submit-idea')} className="cursor-pointer py-2.5">
                      <Lightbulb className="h-4 w-4 mr-3" />
                      Submit Ideas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {/* Security Level Section */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Security Level:</span>
                        <span className={`text-[11px] font-bold ${!isSecurityStrong ? 'text-red-500' : 'text-green-500'}`}>
                          {!isSecurityStrong ? 'Low' : 'High'}
                        </span>
                      </div>
                      <div className={`relative overflow-hidden rounded-xl p-3 border ${!isSecurityStrong ? 'bg-red-500/5 border-red-200 dark:border-red-900/30' : 'bg-green-500/5 border-green-200 dark:border-green-900/30'}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-[11px] leading-tight text-foreground font-semibold">
                              {!isSecurityStrong 
                                ? "Your account security level is low. Please enable 2FA and verify your info." 
                                : "Your account security level is high. Please maintain a high level of security."}
                            </p>
                          </div>
                          <div className="relative flex-shrink-0 w-12 h-12">
                            <img 
                              src="/assets/security-shield.jpeg" 
                              alt="Security Shield"
                              className={`w-full h-full object-contain transition-all duration-500 ${!isSecurityStrong ? 'hue-rotate-[140deg] saturate-150 brightness-75' : 'hue-rotate-0'}`}
                            />
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${!isSecurityStrong ? 'bg-red-500' : 'bg-green-500'}`}>
                              {!isSecurityStrong ? '!' : '✓'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer py-2.5 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20">
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationIcon count={unreadCount} onClick={() => navigate('/notifications')} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/signin")}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
              >
                Get Started
              </Button>
            </div>
          )}
          <div className="hidden lg:block ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
