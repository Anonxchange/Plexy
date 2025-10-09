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
  Zap
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [location] = useLocation();

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
        
        <div className="mt-6 space-y-2">
          <Button className="w-full justify-start gap-2" size="sm" variant="outline" data-testid="button-download-android">
            <Smartphone className="h-4 w-4" />
            Android
          </Button>
          <Button className="w-full justify-start gap-2" size="sm" variant="outline" data-testid="button-download-ios">
            <Smartphone className="h-4 w-4" />
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
                    <Badge variant="secondary" className="ml-auto text-xs">BEST RATE</Badge>
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
                    Create Offer
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
                <Link href="/shop/post" onClick={handleLinkClick}>
                  <Button className="w-full justify-start gap-2" size="sm" data-testid="nav-post-ad">
                    <Plus className="h-4 w-4" />
                    <span className="font-semibold">Post Ad</span>
                    <Badge variant="secondary" className="ml-auto bg-background text-foreground">FREE</Badge>
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2" data-testid="nav-giftcards-toggle">
                  <Gift className="h-5 w-5" />
                  <span>Gift cards</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 mt-1 space-y-1">
                <Link href="/giftcards/buy" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-buy-giftcards">
                    Buy Gift Cards
                  </Button>
                </Link>
                <Link href="/giftcards/sell" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-sell-giftcards">
                    Sell Gift Cards
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

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
                    className="w-full justify-start" 
                    size="sm" 
                    data-testid="nav-my-wallet"
                  >
                    My Wallet
                  </Button>
                </Link>
                <Link href="/wallet/transactions" onClick={handleLinkClick}>
                  <Button variant="ghost" className="w-full justify-start" size="sm" data-testid="nav-transactions">
                    Transactions
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
          </nav>
        </div>
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <Button variant="outline" className="w-full" data-testid="button-sign-in">
          Sign In
        </Button>
        <Button className="w-full" data-testid="button-sign-up">
          Sign Up
        </Button>
      </div>
    </div>
  );
}
