import * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PageNavigation } from "@/components/page-navigation";
import Home from "@/pages/home";
import Buy from "@/pages/buy";
import Wallet from "@/pages/wallet";
import { SignUp } from "@/pages/signup";
import { SignIn } from "@/pages/signin";
import { Dashboard } from "@/pages/dashboard";
import { P2P } from "@/pages/p2p";
import { Swap } from "@/pages/swap";
import { Profile } from "@/pages/profile";
import { Shop } from "@/pages/shop";
import { CreateOffer } from "@/pages/create-offer";
import { CreateOfferAdvanced } from "@/pages/create-offer-advanced";
import { MyOffers } from "@/pages/my-offers";
import Spot from "@/pages/spot";
import NotFound from "@/pages/not-found";
import { GiftCards } from "@/pages/gift-cards";
import { TradeHistory } from "@/pages/trade-history";
import { AccountSettings } from "@/pages/account-settings";
import VisaCard from "@/pages/visa-card";
import VisaCardDetails from "@/pages/visa-card-details";
import MobileTopup from "@/pages/mobile-topup";
import CryptoToBank from "@/pages/crypto-to-bank";
import Lightning from "@/pages/lightning";
import BuyCrypto from "@/pages/buy-crypto";
import ActiveTrade from "@/pages/active-trade";
import VerificationPage from "@/pages/verification";
import AdminPage from "@/pages/admin";
import AdminVerificationsPage from "@/pages/admin-verifications";
import AssetDetail from "@/pages/asset-detail";
import { Profile as ProfilePage } from "@/pages/profile";
import { AccountSettings as AccountSettingsPage } from "@/pages/account-settings";
import MedalsPage from "@/pages/medals";
import { Fees } from "@/pages/fees";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/buy" component={Buy} />
      <Route path="/p2p" component={P2P} />
      <Route path="/spot" component={Spot} />
      <Route path="/swap" component={Swap} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/wallet/visa-card" component={VisaCard} />
      <Route path="/wallet/visa-card/details" component={VisaCardDetails} />
      <Route path="/wallet/asset/:symbol" component={AssetDetail} />
      <Route path="/wallet/mobile-topup" component={MobileTopup} />
      <Route path="/wallet/crypto-to-bank" component={CryptoToBank} />
      <Route path="/wallet/lightning" component={Lightning} />
      <Route path="/wallet/buy-crypto" component={BuyCrypto} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/verification" component={VerificationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/verifications" component={AdminVerificationsPage} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/create-offer-advanced" component={CreateOfferAdvanced} />
      <Route path="/my-offers" component={MyOffers} />
      <Route path="/trade/:tradeId" component={ActiveTrade} />
      <Route path="/profile/:userId" component={ProfilePage} />
      <Route path="/account-settings" component={AccountSettingsPage} />
      <Route path="/medals" component={MedalsPage} />
      <Route path="/fees" component={Fees} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/crypto-to-bank", "/wallet/lightning", "/wallet/buy-crypto", "/dashboard", "/profile", "/shop", "/create-offer", "/my-offers", "/trade-history", "/account-settings", "/verification", "/admin", "/admin/verifications"].includes(location) || location.startsWith("/trade/");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen w-full flex-col pt-16">
              <AppHeader />
              <PageNavigation />
              <main className="flex-1">
                <Router />
              </main>
              {!hideAppFooter && <AppFooter />}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;