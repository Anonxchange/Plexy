import {
  Home,
  ShoppingCart,
  Store,
  List,
  Plus,
  Gift,
  Wallet,
  TrendingUp,
  HeadphonesIcon,
  ChevronDown,
  Smartphone,
  Zap,
  Bitcoin,
  ArrowDownToLine,
  CreditCard,
  ShoppingBag,
  Banknote,
  Trophy,
  Users
} from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">{" "}
      <div className="border-b border-border px-4 py-6">
        <Link href="/" className="flex items-center gap-3" onClick={handleLinkClick}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Pexly</span>
        </Link>

        <div className="mt-6 flex gap-2">
          <Button className="flex-1 justify-center gap-2" size="sm" variant="outline" data-testid="button-download-android">
            <SiGoogleplay className="h-4 w-4" />
            Android
          </Button>
          <Button className="flex-1 justify-center gap-2" size="sm" variant="outline" data-testid="button-download-ios">
            <SiApple className="h-4 w-4" />
            iOS
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{" "}
        <div className="p-2">
          <nav className="flex flex-col gap-1">
            <Link href="/" onClick={handleLinkClick}>
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                data-testid="nav-home"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Button>
            </Link>

            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-trade-toggle">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Trade</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/p2p" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/p2p" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    data-testid="nav-p2p"
                  >
                    P2P Trading
                    <Badge variant="secondary" className="ml-auto text-xs">LOW FEES</Badge>
                  </Button>
                </Link>
                <Link href="/spot" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/spot" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    data-testid="nav-spot"
                  >
                    Spot Trading
                  </Button>
                </Link>
                <Link href="/swap" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/swap" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    data-testid="nav-swap"
                  >
                    Swap
                  </Button>
                </Link>
                <Link href="/my-offers" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/my-offers" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    size="sm"
                    data-testid="nav-my-offers"
                  >
                    <List className="h-4 w-4" />
                    My Offers
                  </Button>
                </Link>
                <Link href="/create-offer" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/create-offer" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    size="sm"
                    data-testid="nav-create-offer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Offer</span>
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-shop-toggle">
                  <Store className="h-5 w-5" />
                  <span>Shop</span>
                  <Badge variant="secondary" className="ml-auto">BETA</Badge>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/shop" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start gap-2" size="sm" data-testid="nav-listings">
                    <List className="h-4 w-4" />
                    Listings
                  </Button>
                </Link>
                <Link href="/shop-post" onClick={handleLinkClick}>
                  <Button className="w-full justify-start gap-2" size="sm" data-testid="nav-post-ad">
                    <Plus className="h-4 w-4" />
                    <span className="font-semibold">Post Ad</span>
                    <Badge variant="secondary" className="ml-auto bg-background text-foreground">FREE</Badge>
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link href="/gift-cards" onClick={handleLinkClick}>
              <Button
                variant={location === "/gift-cards" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                data-testid="nav-gift-cards"
              >
                <Gift className="h-5 w-5" />
                <span>Gift Cards</span>
              </Button>
            </Link>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-wallet-toggle">
                  <Wallet className="h-5 w-5" />
                  <span>Wallet</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/wallet" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-assets"
                  >
                    <Bitcoin className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Assets</span>
                      <span className="text-xs text-muted-foreground leading-tight">My assets in the Pexly wallet</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/receive" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/receive" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-receive"
                  >
                    <ArrowDownToLine className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Receive</span>
                      <span className="text-xs text-muted-foreground leading-tight">Receive crypto or deposit using fiat</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/visa-card" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/visa-card" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-visa-card"
                  >
                    <CreditCard className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Visa card</span>
                      <span className="text-xs text-muted-foreground leading-tight">Spend your crypto</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/buy-crypto" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/buy-crypto" ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-buy-crypto"
                  >
                    <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Buy crypto</span>
                      <span className="text-xs text-muted-foreground leading-tight">Pay using card, bank, or mobile money</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/crypto-to-bank" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/crypto-to-bank" ? "default" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-crypto-to-bank"
                  >
                    <Banknote className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Crypto to Bank</span>
                      <span className="text-xs text-muted-foreground leading-tight">Cash out your crypto to a bank or MoMo wallet</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/lightning" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/lightning" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-lightning"
                  >
                    <Zap className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Lightning</span>
                      <span className="text-xs text-muted-foreground leading-tight">Send Bitcoin ultra fast</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/wallet/mobile-topup" onClick={handleLinkClick}>
                  <Button
                    variant={location === "/wallet/mobile-topup" ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3"
                    size="sm"
                    data-testid="nav-wallet-mobile-topup"
                  >
                    <Smartphone className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Mobile top-up</span>
                      <span className="text-xs text-muted-foreground leading-tight">Recharge your phone using crypto</span>
                    </div>
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-earn-toggle">
                  <TrendingUp className="h-5 w-5" />
                  <span>Earn with us</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/referral" onClick={handleLinkClick}>
                  <Button 
                    variant={location === "/referral" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    size="sm" 
                    data-testid="nav-referral"
                  >
                    <Users className="h-4 w-4" />
                    Referral Program
                  </Button>
                </Link>
                <Link href="/affiliate" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-affiliate">
                    Affiliate Program
                  </Button>
                </Link>
                <Link href="/rewards" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-rewards">
                    Rewards
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-support-toggle">
                  <HeadphonesIcon className="h-5 w-5" />
                  <span>Support</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/help" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-help-center">
                    Help Center
                  </Button>
                </Link>
                <Link href="/contact" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-contact">
                    Contact Us
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>
            
            <Link href="/medals" onClick={handleLinkClick}>
              <Button
                variant={location === "/medals" ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                data-testid="nav-medals"
              >
                <Trophy className="h-5 w-5" />
                <span>Medals</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
        {!user && (
          <>
            <Button 
              variant="outline" 
              className="w-full" 
              data-testid="button-sign-in"
              onClick={() => {
                navigate("/signin");
                handleLinkClick();
              }}
            >
              Sign In
            </Button>
            <Button 
              className="w-full" 
              data-testid="button-sign-up"
              onClick={() => {
                navigate("/signup");
                handleLinkClick();
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
