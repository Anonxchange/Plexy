import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard, Home, ShoppingCart, Store, Trophy, Gift, TrendingUp, ChevronDown, List, Plus, Bitcoin, ArrowDownToLine, CreditCard, ShoppingBag, Banknote, Smartphone, HelpCircle, MessageSquare } from "lucide-react";
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
import { useCryptoPrices, convertCurrency } from "@/lib/crypto-prices";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
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
  
  const { balances: userWallets, loading: walletsLoading } = useWalletBalances();
  
  // Get all unique symbols from wallets
  const allSymbols = useMemo(() => {
    if (!userWallets || userWallets.length === 0) return ["BTC", "ETH", "USDT", "USDC"];
    return Array.from(new Set(userWallets.map(w => w.symbol)));
  }, [userWallets]);

  const { data: prices, isLoading: pricesLoading } = useCryptoPrices(allSymbols);

  const [preferredCurrency, setPreferredCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`pexly_currency_${user?.id}`) || 'USD';
    }
    return 'USD';
  });
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);

  // Derived balance calculation
  const [balance, setBalance] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const calculateBalance = async () => {
      if (!userWallets || userWallets.length === 0 || !prices) {
        setBalance(0);
        return;
      }

      const totalUSD = userWallets.reduce((sum, wallet) => {
        const priceData = prices[wallet.symbol];
        const currentPrice = priceData?.current_price || 0;
        const bal = parseFloat(wallet.balanceFormatted) || 0;
        return sum + (bal * currentPrice);
      }, 0);

      if (preferredCurrency === 'USD') {
        setBalance(totalUSD);
      } else {
        setIsConverting(true);
        try {
          const finalBalance = await convertCurrency(totalUSD, preferredCurrency);
          setBalance(finalBalance);
        } catch (e) {
          setBalance(totalUSD);
        } finally {
          setIsConverting(false);
        }
      }
    };

    calculateBalance();
  }, [userWallets, prices, preferredCurrency]);

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

  // Helper function to format currency, assuming it's defined elsewhere or needs to be added.
  // For now, using a placeholder similar to the balance formatting.
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}`;
  };

  const walletBalance = balance; // Assuming walletBalance is the same as balance for this context

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Menu button (mobile only) and Logo */}
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
            <span className="text-xl font-extrabold">Pexly</span>
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-8">
          <DropdownMenu open={activeDropdown === 'trade'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('trade')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location.startsWith("/p2p") || location === "/spot" || location === "/swap" || location === "/my-offers" || location === "/create-offer" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group"
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
                <DropdownMenuItem onClick={() => { navigate('/p2p'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>P2P Trading</span>
                    <Badge variant="secondary" className="text-xs">LOW FEES</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/spot'); setActiveDropdown(null); }} className="cursor-pointer">
                  Spot Trading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/swap'); setActiveDropdown(null); }} className="cursor-pointer">
                  Swap
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { navigate('/my-offers'); setActiveDropdown(null); }} className="cursor-pointer">
                  <List className="h-4 w-4 mr-2" />
                  My Offers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/create-offer'); setActiveDropdown(null); }} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          {/* Gift Cards - No dropdown */}
          <Link href="/gift-cards">
            <Button
              variant={location === "/gift-cards" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Gift className="h-4 w-4" />
              Gift Cards
            </Button>
          </Link>

          {/* Pexly Explorer - No dropdown */}
          <Link href="/explorer">
            <Button
              variant={location.startsWith("/explorer") ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Pexly Explorer
            </Button>
          </Link>

          {/* Wallet Dropdown */}
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
                  className="gap-2 group"
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
                <DropdownMenuItem onClick={() => { navigate('/wallet/buy-crypto'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <ShoppingBag className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Buy crypto</span>
                    <span className="text-xs text-muted-foreground">Pay using card, bank, or mobile money</span>
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
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          {/* Shop Dropdown */}
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
                  className="gap-2 group"
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

          {/* Support Dropdown */}
          <DropdownMenu open={activeDropdown === 'support'} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div 
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown('support')}
              onPointerLeave={() => setActiveDropdown(null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={location.startsWith("/support") || location === "/faq" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2 group"
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

        {/* Right side - Profile info and menu button (when not signed in) */}
        <div className="flex items-center gap-2 justify-end">
          {user ? (
            <>
              <div className="text-center relative max-w-[120px] sm:max-w-[150px] hidden sm:block">
                <div className="text-sm font-semibold text-foreground truncate">
                  {userName || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <span className="truncate">
                    {balanceVisible ? `${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}` : "****"}
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
                <DropdownMenuContent 
                  align="end" 
                  className="w-[280px] p-0" 
                  sideOffset={8}
                >
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
                    <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <div className="font-medium">Notifications</div>
                          <div className="text-xs text-muted-foreground">Messages and updates</div>
                        </div>
                        {unreadCount > 0 && (
                          <Badge className="ml-2 h-5 px-2 bg-red-500 hover:bg-red-600 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/trade-history")}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Trade statistics</span>
                        <span className="text-xs text-muted-foreground">Trade history, partners, statistics</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Account settings</span>
                        <span className="text-xs text-muted-foreground">Verification, notifications, security</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/submit-idea")}>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Submit an idea</span>
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

              {/* Notification Icon - Real data */}
              <NotificationIcon 
                count={unreadCount} 
                onClick={() => navigate('/notifications')} 
              />
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setMobileMenuOpen(true)}
                data-testid="button-sidebar-toggle"
                className="border-border lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/signin")}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate("/signup")}
                  data-testid="button-sign-up"
                >
                  Sign Up
                </Button>
              </div>
            </>
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
