import { useState, lazy, Suspense, memo, useCallback, useTransition } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import {
  Zap, Menu, ChevronDown, Globe, Search,
  Bitcoin, ArrowDownToLine, CreditCard, Smartphone, Settings,
  HelpCircle, MessageSquare, Users, TrendingUp, Gift, Plus, List,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

import { AppSidebar } from "./app-sidebar";
const SymbolSelector = lazy(() => import("./trading/SymbolSelector"));
const LazyUserSection = lazy(() =>
  import("./app-header-user-section").then(m => ({ default: m.AppHeaderUserSection }))
);

const AppHeaderCore = memo(function AppHeaderCore({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [symbolSelectorOpen, setSymbolSelectorOpen] = useState(false);

  const { t, i18n } = useTranslation();

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
          <DropdownMenu open={activeDropdown === "trade"} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown("trade")}
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
                onPointerEnter={() => setActiveDropdown("trade")}
              >
                <DropdownMenuItem onClick={() => { navigate("/buy-crypto"); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <span>{t("trade.buy_crypto")}</span>
                    <Badge variant="secondary" className="text-xs">LOW FEES</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/spot"); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.spot_trading")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/perpetual"); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.perpetual")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/swap"); setActiveDropdown(null); }} className="cursor-pointer">
                  {t("trade.swap")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/prediction"); setActiveDropdown(null); }} className="cursor-pointer">
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

          <DropdownMenu open={activeDropdown === "wallet"} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown("wallet")}
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
                onPointerEnter={() => setActiveDropdown("wallet")}
              >
                <DropdownMenuItem onClick={() => { navigate("/wallet"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Bitcoin className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.assets")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.assets_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/wallet/receive"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <ArrowDownToLine className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.receive")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.receive_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/wallet/visa-card"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <CreditCard className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.visa_card")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.visa_card_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/wallet/lightning"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.lightning")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.lightning_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/wallet/mobile-topup"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Smartphone className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.mobile_topup")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.mobile_topup_desc")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/utility"); setActiveDropdown(null); }} className="cursor-pointer h-auto py-3">
                  <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{t("wallet.utility")}</span>
                    <span className="text-xs text-muted-foreground">{t("wallet.utility_desc")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <Link href="/markets" className="hidden xl:block">
            <Button
              variant={location.startsWith("/markets") ? "secondary" : "ghost"}
              size="sm"
              className="text-sm font-medium px-2 xl:px-3"
            >
              {t("nav.market")}
            </Button>
          </Link>

          <DropdownMenu open={activeDropdown === "shop"} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown("shop")}
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
                onPointerEnter={() => setActiveDropdown("shop")}
              >
                <DropdownMenuItem onClick={() => { navigate("/shop"); setActiveDropdown(null); }} className="cursor-pointer">
                  <List className="h-4 w-4 mr-2" />
                  {t("shop.listings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/shop/post"); setActiveDropdown(null); }} className="cursor-pointer">
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

          <DropdownMenu open={activeDropdown === "earn"} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown("earn")}
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
                onPointerEnter={() => setActiveDropdown("earn")}
              >
                <DropdownMenuItem onClick={() => { navigate("/wallet/stake"); setActiveDropdown(null); }} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      <span>{t("earn.stake")}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-red-500 text-white hover:bg-red-600 border-none animate-pulse">HOT</Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/referral"); setActiveDropdown(null); }} className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  {t("earn.referral_program")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/rewards"); setActiveDropdown(null); }} className="cursor-pointer">
                  <Gift className="h-4 w-4 mr-2" />
                  {t("earn.rewards")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>

          <DropdownMenu open={activeDropdown === "support"} onOpenChange={(open) => !open && setActiveDropdown(null)}>
            <div
              className="relative flex items-center h-full"
              onPointerEnter={() => setActiveDropdown("support")}
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
                onPointerEnter={() => setActiveDropdown("support")}
              >
                <DropdownMenuItem onClick={() => { navigate("/contact"); setActiveDropdown(null); }} className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("support.contact_support")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { window.open("https://help.pexly.app", "_blank"); setActiveDropdown(null); }}
                  className="cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {t("support.help_center")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </div>
          </DropdownMenu>
        </nav>

        {/* Search pill — xl desktops only */}
        <div className="hidden xl:flex items-center gap-2 mx-4 flex-shrink-0">
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

        {/* Right side: user section (lazy) + language + theme */}
        <div className="flex items-center gap-2 ml-auto">
          <Suspense fallback={
            // Mirrors the unauthenticated render at every breakpoint so no layout
            // shift occurs when the lazy chunk loads:
            //   mobile (<sm)  → hamburger button only  (h-9 w-9, lg:hidden)
            //   sm–lg         → hamburger + Sign In + Get Started
            //   lg+           → Sign In + Get Started  (hamburger is lg:hidden)
            <div className="flex items-center gap-2 pointer-events-none select-none" aria-hidden>
              <div className="h-9 w-9 rounded-md border border-border lg:hidden flex-shrink-0" />
              <div className="hidden sm:block h-8 w-16 rounded-md bg-muted/40" />
              <div className="hidden sm:block h-8 w-[6.5rem] rounded-md bg-primary/20" />
            </div>
          }>
            <LazyUserSection onOpenSidebar={onOpenSidebar} />
          </Suspense>

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
                { code: "en", label: "English",            flag: "🇬🇧" },
                { code: "es", label: "Español",            flag: "🇪🇸" },
                { code: "fr", label: "Français",           flag: "🇫🇷" },
                { code: "pt", label: "Português",          flag: "🇧🇷" },
                { code: "ar", label: "العربية",            flag: "🇸🇦" },
                { code: "zh", label: "中文",               flag: "🇨🇳" },
                { code: "ru", label: "Русский",            flag: "🇷🇺" },
                { code: "de", label: "Deutsch",            flag: "🇩🇪" },
                { code: "tr", label: "Türkçe",             flag: "🇹🇷" },
                { code: "hi", label: "हिन्दी",             flag: "🇮🇳" },
                { code: "id", label: "Bahasa Indonesia",   flag: "🇮🇩" },
                { code: "vi", label: "Tiếng Việt",         flag: "🇻🇳" },
              ].map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => switchLanguage(lang.code)}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
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
          <AppSidebar onNavigate={closeSidebar} />
        </SheetContent>
      </Sheet>
    </>
  );
}
