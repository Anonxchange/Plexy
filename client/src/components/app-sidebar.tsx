import {
  ChevronDown,
  Globe,
} from "lucide-react";
import { PexlyIcon } from "@/components/pexly-icon";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
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
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "yo", label: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", label: "Hausa", flag: "🇳🇬" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

interface NavItemProps {
  label: string;
  href?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

function NavItem({ label, href, badge, onClick, active }: NavItemProps) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between px-6 py-5 text-left transition-colors",
        "text-[1.15rem] font-medium tracking-tight",
        active
          ? "text-primary"
          : "text-foreground hover:text-primary"
      )}
    >
      <span className="flex items-center gap-3">
        {label}
        {badge}
      </span>
    </button>
  );

  if (href) {
    return (
      <div className="border-t border-border/60">
        <Link href={href} onClick={onClick}>
          {content}
        </Link>
      </div>
    );
  }

  return <div className="border-t border-border/60">{content}</div>;
}

interface NavGroupProps {
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function NavGroup({ label, badge, children, defaultOpen = false }: NavGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border/60">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors text-[1.15rem] font-medium tracking-tight text-foreground hover:text-primary">
          <span className="flex items-center gap-3">
            {label}
            {badge}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-muted/40 px-6 pb-3 space-y-1">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface SubItemProps {
  label: string;
  href?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  external?: boolean;
}

function SubItem({ label, href, badge, onClick, active, external }: SubItemProps) {
  const cls = cn(
    "flex w-full items-center justify-between py-2.5 text-sm transition-colors",
    active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
  );

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
        {badge}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {label}
        {badge}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      {label}
      {badge}
    </button>
  );
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const switchLanguage = (code: string) => {
    const base = `/${i18n.language}`;
    const currentPath = window.location.pathname;
    const withoutBase = currentPath.startsWith(base)
      ? currentPath.slice(base.length) || "/"
      : currentPath;
    window.location.href = `/${code}${withoutBase}`;
  };

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="flex h-full flex-col bg-background">

      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <PexlyIcon className="h-5 w-5 text-primary-foreground" />
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pb-4">

        {user && (
          <NavItem
            label={t("nav.dashboard")}
            href="/dashboard"
            active={location === "/dashboard"}
            onClick={onNavigate}
          />
        )}

        <NavGroup
          label={t("nav.trade")}
          defaultOpen={
            ["/buy-crypto", "/spot", "/perpetual", "/swap", "/prediction"].includes(location)
          }
        >
          <SubItem label={t("trade.buy_crypto")} href="/buy-crypto" active={location === "/buy-crypto"} onClick={onNavigate}
            badge={<Badge variant="secondary" className="text-[10px] py-0">LOW FEES</Badge>} />
          <SubItem label={t("trade.spot_trading")} href="/spot" active={location === "/spot"} onClick={onNavigate} />
          <SubItem label={t("trade.perpetual")} href="/perpetual" active={location === "/perpetual"} onClick={onNavigate} />
          <SubItem label={t("trade.swap")} href="/swap" active={location === "/swap"} onClick={onNavigate} />
          <SubItem label={t("trade.prediction")} href="/prediction" active={location === "/prediction"} onClick={onNavigate} />
        </NavGroup>

        <NavItem
          label={t("nav.gift_cards")}
          href="/gift-cards"
          active={location.startsWith("/gift-cards")}
          onClick={onNavigate}
        />

        <NavGroup
          label={t("nav.wallet")}
          defaultOpen={location.startsWith("/wallet")}
        >
          <SubItem label={t("wallet.assets")} href="/wallet" active={location === "/wallet"} onClick={onNavigate} />
          <SubItem label={t("wallet.visa_card")} href="/wallet/visa-card" active={location === "/wallet/visa-card"} onClick={onNavigate} />
          <SubItem label={t("wallet.lightning")} href="/wallet/lightning" active={location === "/wallet/lightning"} onClick={onNavigate} />
          <SubItem label={t("wallet.mobile_topup")} href="/wallet/mobile-topup" active={location === "/wallet/mobile-topup"} onClick={onNavigate} />
          <SubItem label={t("wallet.utility")} href="/utility" active={location === "/utility"} onClick={onNavigate} />
        </NavGroup>

        <NavGroup
          label={t("nav.shop")}
          badge={<Badge variant="secondary" className="text-[10px] py-0">BETA</Badge>}
          defaultOpen={location.startsWith("/shop")}
        >
          <SubItem label={t("shop.listings")} href="/shop" active={location === "/shop"} onClick={onNavigate} />
          <SubItem label={t("shop.post_ad")} href="/shop/post" active={location === "/shop/post"} onClick={onNavigate}
            badge={<Badge variant="secondary" className="text-[10px] py-0">FREE</Badge>} />
        </NavGroup>

        <NavGroup
          label={t("nav.earn")}
          defaultOpen={["/wallet/stake", "/referral", "/rewards"].includes(location)}
        >
          <SubItem label={t("earn.stake")} href="/wallet/stake" active={location === "/wallet/stake"} onClick={onNavigate}
            badge={<Badge className="text-[10px] py-0 bg-red-500 hover:bg-red-500 border-none animate-pulse">HOT</Badge>} />
          <SubItem label={t("earn.referral_program")} href="/referral" active={location === "/referral"} onClick={onNavigate} />
          <SubItem label={t("earn.rewards")} href="/rewards" active={location === "/rewards"} onClick={onNavigate} />
        </NavGroup>

        <NavItem
          label={t("nav.explorer")}
          href="/explorer"
          active={location.startsWith("/explorer")}
          onClick={onNavigate}
        />

        <NavGroup
          label={t("nav.support")}
          defaultOpen={["/contact", "/support"].includes(location)}
        >
          <SubItem label={t("support.help_center")} href="https://help.pexly.app" external />
          <SubItem label={t("support.contact_support")} href="/contact" active={location === "/contact"} onClick={onNavigate} />
        </NavGroup>

      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 p-5 space-y-3">
        {!user && (
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              className="rounded-xl font-semibold"
              onClick={() => go("/signin")}
            >
              {t("auth.sign_in")}
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl font-semibold"
              onClick={() => go("/signup")}
            >
              {t("auth.register")}
            </Button>
          </div>
        )}

        {/* Language selector */}
        <Select value={i18n.language} onValueChange={switchLanguage}>
          <SelectTrigger className="w-full rounded-xl gap-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}
