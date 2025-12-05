import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard, Home, ShoppingCart, Store, Trophy, Gift, TrendingUp, ChevronDown, List, Plus, Bitcoin, ArrowDownToLine, CreditCard, ShoppingBag, Banknote, Smartphone } from "lucide-react";
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
import { getCryptoPrices } from "@/lib/crypto-prices";
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
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);
  const [notificationOpen, setNotificationOpen] = useState(false); // State for notification dropdown

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
      // Only fetch on mount
      fetchUserData();

      // Subscribe to wallet changes for real-time balance updates
      const channel = supabase
        .channel('wallet-changes-header')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Wallet changed in header, updating balance...');
            setLastBalanceUpdate(Date.now());
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Separate effect to fetch balance only when wallet actually changes
  useEffect(() => {
    if (lastBalanceUpdate > 0) {
      fetchUserData();
    }
  }, [lastBalanceUpdate]);

  const fetchUserData = async () => {
    try {
      // Fetch profile and wallets in parallel
      const [profileResult, walletsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('username, preferred_currency')
          .eq('id', user?.id)
          .single(),
        supabase
          .from('wallets')
          .select('crypto_symbol, balance')
          .eq('user_id', user?.id)
      ]);

      // Set username
      if (!profileResult.error && profileResult.data?.username) {
        setUserName(profileResult.data.username);
      } else {
        setUserName(user?.email?.split('@')[0] || 'User');
      }

      // Set preferred currency
      const currency = profileResult.data?.preferred_currency?.toUpperCase() || 'USD';
      setPreferredCurrency(currency);

      // Calculate balance if wallets exist
      if (!walletsResult.error && walletsResult.data && walletsResult.data.length > 0) {
        const walletsData = walletsResult.data;

        // Filter wallets with balance > 0 to reduce API calls
        const walletsWithBalance = walletsData.filter(w => w.balance > 0);

        if (walletsWithBalance.length === 0) {
          setBalance(0);
          return;
        }

        // Get unique crypto symbols
        const allSymbols = walletsWithBalance.map(w => w.crypto_symbol);

        // Fetch prices (this is already parallel internally)
        const prices = await getCryptoPrices(allSymbols);

        // Calculate total in USD
        const totalUSD = walletsWithBalance.reduce((sum, wallet) => {
          const priceData = prices[wallet.crypto_symbol];
          const currentPrice = priceData?.current_price || 0;
          return sum + (wallet.balance * currentPrice);
        }, 0);

        // Convert to preferred currency if needed
        if (currency !== 'USD') {
          const { convertCurrency } = await import('@/lib/crypto-prices');
          const finalBalance = await convertCurrency(totalUSD, currency);
          setBalance(finalBalance);
        } else {
          setBalance(totalUSD);
        }
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setBalance(0);
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

  // Helper function to format currency, assuming it's defined elsewhere or needs to be added.
  // For now, using a placeholder similar to the balance formatting.
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${preferredCurrency}`;
  };

  const walletBalance = balance; // Assuming walletBalance is the same as balance for this context

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
              <img 
                src="/assets/IMG_2740.png" 
                alt="Christmas hat" 
                className="absolute -top-4 -right-3 w-8 h-8 object-contain"
                style={{ transform: 'rotate(-25deg)' }}
              />
            </div>
            <span className="text-xl font-extrabold">Pexly</span>
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-8">
          {/* Trade Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={location.startsWith("/p2p") || location === "/spot" || location === "/swap" || location === "/my-offers" || location === "/create-offer" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Trade
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/p2p')} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span>P2P Trading</span>
                  <Badge variant="secondary" className="text-xs">LOW FEES</Badge>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/spot')} className="cursor-pointer">
                Spot Trading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/swap')} className="cursor-pointer">
                Swap
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/my-offers')} className="cursor-pointer">
                <List className="h-4 w-4 mr-2" />
                My Offers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/create-offer')} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Create Offer
              </DropdownMenuItem>
            </DropdownMenuContent>
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

          {/* Pexly Academy - No dropdown */}
          <Link href="/pexly-academy">
            <Button
              variant={location === "/pexly-academy" ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Pexly Academy
            </Button>
          </Link>

          {/* Wallet Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={location.startsWith("/wallet") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Wallet
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              <DropdownMenuItem onClick={() => navigate('/wallet')} className="cursor-pointer h-auto py-3">
                <Bitcoin className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Assets</span>
                  <span className="text-xs text-muted-foreground">My assets in the Pexly wallet</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/receive')} className="cursor-pointer h-auto py-3">
                <ArrowDownToLine className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Receive</span>
                  <span className="text-xs text-muted-foreground">Receive crypto or deposit using fiat</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/visa-card')} className="cursor-pointer h-auto py-3">
                <CreditCard className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Visa card</span>
                  <span className="text-xs text-muted-foreground">Spend your crypto</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/buy-crypto')} className="cursor-pointer h-auto py-3">
                <ShoppingBag className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Buy crypto</span>
                  <span className="text-xs text-muted-foreground">Pay using card, bank, or mobile money</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/crypto-to-bank')} className="cursor-pointer h-auto py-3">
                <Banknote className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Crypto to Bank</span>
                  <span className="text-xs text-muted-foreground">Cash out to bank or MoMo wallet</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/lightning')} className="cursor-pointer h-auto py-3">
                <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Lightning</span>
                  <span className="text-xs text-muted-foreground">Send Bitcoin ultra fast</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/wallet/mobile-topup')} className="cursor-pointer h-auto py-3">
                <Smartphone className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold">Mobile top-up</span>
                  <span className="text-xs text-muted-foreground">Recharge your phone using crypto</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Shop Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={location.startsWith("/shop") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                Shop
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">BETA</Badge>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/shop')} className="cursor-pointer">
                <List className="h-4 w-4 mr-2" />
                Listings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/shop/post')} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-semibold">Post Ad</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Earn with Us Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={location === "/affiliate" || location === "/rewards" ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Earn with Us
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/affiliate')} className="cursor-pointer">
                Affiliate Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/rewards')} className="cursor-pointer">
                Rewards
              </DropdownMenuItem>
            </DropdownMenuContent>
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

              {/* Notification Icon - All screens */}
              <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 hover:bg-red-600 text-[10px] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[380px] p-0">
                  {/* Tabs: System, Notifications, Campaign */}
                  <div className="grid grid-cols-3 border-b bg-transparent">
                    <button className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-purple-500/50 transition-colors">
                      <span>System</span>
                      {notifications.filter(n => n.type === 'system' && !n.read).length > 0 && (
                        <Badge className="ml-1.5 h-5 min-w-5 px-1.5 bg-purple-500 hover:bg-purple-600 text-xs rounded-full">
                          {notifications.filter(n => n.type === 'system' && !n.read).length}
                        </Badge>
                      )}
                    </button>
                    <button className="py-3 text-sm font-medium text-primary border-b-2 border-purple-500 transition-colors">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="ml-1.5 h-5 min-w-5 px-1.5 bg-purple-500 hover:bg-purple-600 text-xs rounded-full">
                          {unreadCount}
                        </Badge>
                      )}
                    </button>
                    <button className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-purple-500/50 transition-colors">
                      <span>Campaign</span>
                    </button>
                  </div>

                  {/* Notification Items */}
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setNotificationOpen(false);
                          }}
                          className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${
                            !notification.read ? 'bg-purple-500/5' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                              <Bell className="h-5 w-5 text-purple-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-relaxed">
                              {notification.message || notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* View All Link */}
                  <div
                    onClick={() => {
                      navigate('/notifications');
                      setNotificationOpen(false);
                    }}
                    className="p-3 text-center text-sm font-medium text-primary hover:bg-accent/50 cursor-pointer border-t"
                  >
                    View all notifications
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

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