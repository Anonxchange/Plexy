import { useState, useEffect, useMemo, lazy, Suspense, memo, useCallback, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard, Home, ShoppingCart, Store, Trophy, Gift, TrendingUp, ChevronDown, List, Plus, Bitcoin, ArrowDownToLine, CreditCard, ShoppingBag, Smartphone, HelpCircle, MessageSquare, Users, CheckCircle2, XCircle, AlertCircle, Globe, Search } from "lucide-react";
import { SecurityShieldIcon } from "@/components/ui/security-shield";
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
const AppSidebar = lazy(() => import("./app-sidebar").then(m => ({ default: m.AppSidebar })));
const SymbolSelector = lazy(() => import("./trading/SymbolSelector"));
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
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

const AppHeaderCore = memo(function AppHeaderCore({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { user, signOut } = useAuth();
  const [location, navigate] = useLocation();
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
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

    // Use the storage event instead of polling so currency changes from other
    // tabs are picked up without burning a timer every second on the main thread.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== `pexly_currency_${user.id}` || !e.newValue) return;
      const upper = e.newValue.toUpperCase();
      if (upper !== preferredCurrency) {
        setPreferredCurrency(upper);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
        const supabase = await getSupabase();
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
      const supabase = await getSupabase();
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

  const { t, i18n } = useTranslation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [symbolSelectorOpen, setSymbolSelectorOpen] = useState(false);

  const switchLanguage = (code: string) => {
    const currentPath = window.location.pathname;
    const segments = currentPath.split("/").filter(Boolean);
    const withoutBase = segments.slice(1).join("/");
    window.location.href = `/${code}${withoutBase ? `/${withoutBase}` : ""}`;
  };

  const handleSymbolSelect = (sym: string, category: string) => {
    const raw = sym.replace("/", "");
    if (category === "Futures") {
      navigate(`/perpetual?symbol=${raw}`);
    } else {
      navigate(`/spot?symbol=${raw}`);
    }
  };

  const securityInfo = useMemo(() => {
    if (!user) return { level: 'low' as const, score: 0, label: 'At Risk', color: 'red' };
    const has2FA = !!user.user_metadata?.two_factor_enabled;
    const hasPhone = !!user.phone;
    const hasEmailVerified = !!user.email_confirmed_at;
    const score = [has2FA, hasPhone, hasEmailVerified].filter(Boolean).length;
    if (score === 3) return { level: 'high' as const, score, label: 'Strong', color: 'green', checks: { has2FA, hasPhone, hasEmailVerified } };
    if (score === 2) return { level: 'medium' as const, score, label: 'Fair', color: 'yellow', checks: { has2FA, hasPhone, hasEmailVerified } };
    return { level: 'low' as const, score, label: 'At Risk', color: 'red', checks: { has2FA, hasPhone, hasEmailVerified } };
  }, [user]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full border-b ${location === "/spot" ? "border-panel-border" : "border-border"} bg-[#f2f2f2]/60 dark:bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-[#f2f2f2]/60 dark:supports-[backdrop-filter]:bg-background/60`}>
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {user && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onOpenSidebar}
              data-testid="button-sidebar-toggle"
              aria-label="Open navigation menu"
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

        <nav className="hidden lg:flex items-center gap-0 ml-4 xl:ml-6">
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
                  className="gap-1 group text-sm font-medium px-2 xl:px-3"
                >
                  {t("nav.trade")}
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('trade')}
              >
                <DropdownMenuItem onClick={() => { navigate('/buy-crypto'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>{t("trade.buy_crypto")}</span>
                    <Badge variant="secondary" className="text-xs">LOW FEES</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/spot'); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.spot_trading")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/perpetual'); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.perpetual")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/swap'); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.swap")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/prediction'); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.prediction")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <Link href="/gift-cards">
            <Button
              variant={location === "/gift-cards" ? "secondary" : "ghost"}
              size="sm"
              className="text-sm font-medium px-2 xl:px-3"
            >
              {t("nav.gift_cards")}
            </Button>
          </Link>

          <Link href="/explorer">
            <Button
              variant={location.startsWith("/explorer") ? "secondary" : "ghost"}
              size="sm"
              className="text-sm font-medium px-2 xl:px-3"
            >
              {t("nav.explorer")}
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
                  className="gap-1 group text-sm font-medium px-2 xl:px-3"
                >
                  {t("nav.wallet")}
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
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
                    <span className="font-semibold">{t("wallet.assets")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.assets_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/receive'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <ArrowDownToLine className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.receive")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.receive_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/visa-card'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <CreditCard className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.visa_card")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.visa_card_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/lightning'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.lightning")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.lightning_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/wallet/mobile-topup'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Smartphone className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.mobile_topup")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.mobile_topup_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/utility'); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.utility")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.utility_desc")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <Link href="/market" className="hidden xl:block">
            <Button
              variant={location.startsWith("/markets") ? "secondary" : "ghost"}
              size="sm"
              className="text-sm font-medium px-2 xl:px-3"
            >
              {t("nav.market")}
            </Button>
          </Link>

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
                  className="gap-1 group text-sm font-medium px-2 xl:px-3"
                >
                  {t("nav.shop")}
                  <Badge variant="secondary" className="text-[10px] px-1">BETA</Badge>
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('shop')}
              >
                <DropdownMenuItem onClick={() => { navigate('/shop'); setActiveDropdown(null); }} className="cursor-pointer">
                  <List className="h-4 w-4 mr-2" />
                  {t("shop.listings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/shop/post'); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="font-semibold">{t("shop.post_ad")}</span>
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
                  className="gap-1 group text-sm font-medium px-2 xl:px-3"
                >
                  {t("nav.earn")}
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
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
                      <span>{t("earn.stake")}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-red-500 text-white hover:bg-red-600 border-none animate-pulse">HOT</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/referral'); setActiveDropdown(null); }} className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  {t("earn.referral_program")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate('/rewards'); setActiveDropdown(null); }} className="cursor-pointer">
                  <Gift className="h-4 w-4 mr-2" />
                  {t("earn.rewards")}
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
                  className="gap-1 group text-sm font-medium px-2 xl:px-3"
                >
                  {t("nav.support")}
                  <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56"
                onPointerEnter={() => setActiveDropdown('support')}
              >
                <DropdownMenuItem onClick={() => { navigate('/contact'); setActiveDropdown(null); }} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("support.contact_support")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { window.open('https://help.pexly.app', '_blank'); setActiveDropdown(null); }} className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t("support.help_center")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </nav>

        {/* Bybit-style search — xl desktops only */}
        <div className="hidden xl:flex items-center gap-2 mx-4 flex-shrink-0">
          {/* Search pill with trending pair inside */}
          <button
            onClick={() => setSymbolSelectorOpen(true)}
            className="h-9 flex items-center gap-2 px-4 rounded-full border border-input bg-secondary/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus:outline-none min-w-[180px]"
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs font-semibold text-foreground">🔥 BTC/USDT</span>
          </button>
          <Suspense fallback={null}>
            <SymbolSelector
              open={symbolSelectorOpen}
              onClose={() => setSymbolSelectorOpen(false)}
              onSelect={handleSymbolSelect}
              variant="dialog"
              defaultCategory="Spot"
            />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 ml-auto">
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
                    aria-label={balanceVisible ? "Hide balance" : "Show balance"}
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
                    className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    data-testid="button-profile"
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-offset-2 ring-offset-background transition-all duration-200"
                      style={{
                        ringColor: securityInfo.color === 'green' ? '#22c55e' : securityInfo.color === 'yellow' ? '#eab308' : '#ef4444',
                        boxShadow: `0 0 0 2px ${securityInfo.color === 'green' ? '#22c55e' : securityInfo.color === 'yellow' ? '#eab308' : '#ef4444'}`
                      }}
                    >
                      <AvatarImage src={profileAvatar || user?.user_metadata?.avatar_url} alt="User avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ??
                          user?.email?.substring(0, 2)?.toUpperCase() ??
                          "JD"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Security status dot on avatar */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                      style={{ backgroundColor: securityInfo.color === 'green' ? '#22c55e' : securityInfo.color === 'yellow' ? '#eab308' : '#ef4444' }}
                    />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-[300px] p-0 overflow-hidden" sideOffset={10}>
                  {/* Profile Header */}
                  <div className="relative bg-gradient-to-br from-muted/80 to-muted/30 px-4 pt-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12"
                          style={{ boxShadow: `0 0 0 2px ${securityInfo.color === 'green' ? '#22c55e' : securityInfo.color === 'yellow' ? '#eab308' : '#ef4444'}, 0 0 12px ${securityInfo.color === 'green' ? '#22c55e40' : securityInfo.color === 'yellow' ? '#eab30840' : '#ef444440'}` }}
                        >
                          <AvatarImage src={profileAvatar || user?.user_metadata?.avatar_url} alt="User avatar" />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                            {user?.user_metadata?.full_name?.substring(0, 2)?.toUpperCase() ??
                              user?.email?.substring(0, 2)?.toUpperCase() ??
                              "JD"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {userName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: securityInfo.color === 'green' ? '#22c55e20' : securityInfo.color === 'yellow' ? '#eab30820' : '#ef444420',
                              color: securityInfo.color === 'green' ? '#16a34a' : securityInfo.color === 'yellow' ? '#ca8a04' : '#dc2626',
                            }}
                          >
                            <SecurityShieldIcon level={securityInfo.level} size={11} />
                            {securityInfo.level === 'high' ? t("security.strong") : securityInfo.level === 'medium' ? t("security.fair") : t("security.at_risk")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground">{t("nav.dashboard")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("user_menu.overview_activity")}</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <User className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground">{t("user_menu.profile")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("user_menu.public_profile")}</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/account-settings')} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground">{t("user_menu.account_settings")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("user_menu.preferences_security")}</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/submit-idea')} className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground">{t("user_menu.submit_idea")}</span>
                        <span className="text-[10px] text-muted-foreground">{t("user_menu.share_feedback")}</span>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  {/* Security Status Section */}
                  <div className="mx-1.5 mb-1.5 rounded-xl border border-border overflow-hidden">
                    <div
                      className="px-3 pt-3 pb-2.5"
                      style={{
                        background: securityInfo.color === 'green'
                          ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                          : securityInfo.color === 'yellow'
                          ? 'linear-gradient(135deg, #fefce8, #fef9c3)'
                          : 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                      }}
                    >
                      {/* Header row: label + status word */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-widest">{t("security.account_security")}</span>
                        <span
                          className="text-[11px] font-bold tracking-wide"
                          style={{ color: securityInfo.color === 'green' ? '#16a34a' : securityInfo.color === 'yellow' ? '#ca8a04' : '#dc2626' }}
                        >
                          {securityInfo.level === 'high' ? t("security.strong") : securityInfo.level === 'medium' ? t("security.fair") : t("security.at_risk")}
                        </span>
                      </div>

                      {/* Shield + bar chart row */}
                      <div className="flex items-end gap-3">
                        {/* Custom SVG shield — the star of the section */}
                        <div className="flex-shrink-0 drop-shadow-sm">
                          <SecurityShieldIcon level={securityInfo.level} size={46} />
                        </div>

                        {/* Bar chart */}
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="flex items-end gap-[2px] h-7">
                            {Array.from({ length: 20 }).map((_, i) => {
                              const filled = securityInfo.color === 'green'
                                ? true
                                : securityInfo.color === 'yellow'
                                ? i < 13
                                : i < 6;
                              const barColor = filled
                                ? securityInfo.color === 'green' ? '#22c55e' : securityInfo.color === 'yellow' ? '#eab308' : '#ef4444'
                                : 'rgba(0,0,0,0.09)';
                              const heights = [55,70,62,80,58,75,68,85,60,72,64,78,56,74,66,82,59,71,65,79];
                              return (
                                <div
                                  key={i}
                                  className="flex-1 rounded-[2px] transition-all duration-500"
                                  style={{
                                    height: `${heights[i % heights.length]}%`,
                                    backgroundColor: barColor,
                                    minHeight: '4px',
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Security checks — compact inline */}
                          <div className="flex flex-col gap-[3px]">
                            {[
                              { label: t("security.email_verified"), ok: !!user?.email_confirmed_at },
                              { label: t("security.phone_linked"),   ok: !!user?.phone },
                              { label: t("security.two_fa_enabled"), ok: !!user?.user_metadata?.two_factor_enabled },
                            ].map(({ label, ok }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[10px] text-foreground/65 leading-none">{label}</span>
                                {ok
                                  ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  : <XCircle     className="w-3 h-3 text-red-400  flex-shrink-0" />
                                }
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {securityInfo.level !== 'high' && (
                        <button
                          onClick={() => navigate('/account-settings')}
                          className="mt-2.5 w-full text-[10px] font-semibold py-1.5 rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] text-white"
                          style={{ backgroundColor: securityInfo.color === 'yellow' ? '#ca8a04' : '#dc2626' }}
                        >
                          {t("security.improve_security")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="p-1.5 pt-0">
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer rounded-lg px-3 py-2.5 gap-3 group text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                    >
                      <div className="w-7 h-7 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <LogOut className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">{t("auth.sign_out")}</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationIcon count={unreadCount} onClick={() => navigate('/notifications')} />
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onOpenSidebar}
                data-testid="button-sidebar-toggle"
                aria-label="Open navigation menu"
                className="border-border lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/signin")}
                className="hidden sm:inline-flex"
              >
                {t("auth.sign_in")}
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/signup")}
                className="hidden sm:inline-flex"
              >
                {t("auth.get_started")}
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-foreground"
                title={t("header.language")}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t("header.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { code: "en", label: "English", flag: "🇬🇧" },
                { code: "es", label: "Español", flag: "🇪🇸" },
                { code: "fr", label: "Français", flag: "🇫🇷" },
                { code: "pt", label: "Português", flag: "🇧🇷" },
                { code: "ar", label: "العربية", flag: "🇸🇦" },
                { code: "zh", label: "中文", flag: "🇨🇳" },
                { code: "ru", label: "Русский", flag: "🇷🇺" },
                { code: "de", label: "Deutsch", flag: "🇩🇪" },
                { code: "tr", label: "Türkçe", flag: "🇹🇷" },
                { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
                { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
                { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
              ].map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2"><span>{lang.flag}</span><span>{lang.label}</span></span>
                  {i18n.language === lang.code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

    </header>
  );
});

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const openSidebar = useCallback(() => {
    startTransition(() => setMobileMenuOpen(true));
  }, []);

  const closeSidebar = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      <AppHeaderCore onOpenSidebar={openSidebar} />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Suspense fallback={null}>
            <AppSidebar onNavigate={closeSidebar} />
          </Suspense>
        </SheetContent>
      </Sheet>
    </>
  );
}
