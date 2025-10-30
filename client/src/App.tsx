import * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { GlobalNotificationListener } from "@/components/global-notification-listener";
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
import AssetHistory from "@/pages/asset-history";
import { Profile as ProfilePage } from "@/pages/profile";
import { AccountSettings as AccountSettingsPage } from "@/pages/account-settings";
import MedalsPage from "@/pages/medals";
import { Fees } from "@/pages/fees";
import Affiliate from "@/pages/affiliate";
import RewardsPage from "@/pages/rewards";
import PexlyPay from "@/pages/pexly-pay";
import PexlyPayHistory from "@/pages/pexly-pay-history";
import PexlyPaySettings from "@/pages/pexly-pay-settings";
import PexlyPayPaymentLimits from "@/pages/pexly-pay-payment-limits";
import PexlyPayPasswordFree from "@/pages/pexly-pay-password-free";
import PexlyPayHelp from "@/pages/pexly-pay-help";
import NotificationsPage from "@/pages/notifications";
import { BitcoinCalculator } from "@/pages/bitcoin-calculator";
import { VerifyEmail } from "@/pages/verify-email";
import PexlyAcademy from "@/pages/pexly-academy";
import { AcademyArticle } from "@/pages/academy-article";
import About from "@/pages/about";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/buy" component={Buy} />
      <Route path="/p2p" component={P2P} />
      <Route path="/spot" component={Spot} />
      <Route path="/swap" component={Swap} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/wallet/visa-card" component={VisaCard} />
      <Route path="/wallet/visa-card/details" component={VisaCardDetails} />
      <Route path="/wallet/asset/:symbol" component={AssetDetail} />
      <Route path="/wallet/history/:symbol" component={AssetHistory} />
      <Route path="/wallet/mobile-topup" component={MobileTopup} />
      <Route path="/wallet/crypto-to-bank" component={CryptoToBank} />
      <Route path="/wallet/lightning" component={Lightning} />
      <Route path="/wallet/buy-crypto" component={BuyCrypto} />
      <Route path="/wallet/pexly-pay" component={PexlyPay} />
          <Route path="/wallet/pexly-pay/history" component={PexlyPayHistory} />
          <Route path="/wallet/pexly-pay/settings" component={PexlyPaySettings} />
          <Route path="/wallet/pexly-pay/payment-limits" component={PexlyPayPaymentLimits} />
          <Route path="/wallet/pexly-pay/password-free" component={PexlyPayPasswordFree} />
          <Route path="/wallet/pexly-pay/help" component={PexlyPayHelp} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/verification" component={VerificationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/verifications" component={AdminVerificationsPage} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/edit-offer/:offerId" component={CreateOffer} />
      <Route path="/create-offer-advanced" component={CreateOfferAdvanced} />
      <Route path="/my-offers" component={MyOffers} />
      <Route path="/trade/:tradeId" component={ActiveTrade} />
      <Route path="/profile/:userId" component={ProfilePage} />
      <Route path="/account-settings" component={AccountSettingsPage} />
      <Route path="/medals" component={MedalsPage} />
      <Route path="/fees" component={Fees} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/bitcoin-calculator" component={BitcoinCalculator} />
      <Route path="/academy" component={PexlyAcademy} />
      <Route path="/academy/:articleId" component={AcademyArticle} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/crypto-to-bank", "/wallet/lightning", "/wallet/buy-crypto", "/wallet/pexly-pay", "/dashboard", "/profile", "/shop", "/create-offer", "/my-offers", "/trade-history", "/account-settings", "/verification", "/admin", "/admin/verifications", "/notifications", "/signin", "/signup", "/verify-email"].includes(location) || location.startsWith("/trade/");
  const hideHeaderAndNav = ["/signin", "/signup", "/verify-email"].includes(location);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <GlobalNotificationListener />
            <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? 'pt-16' : ''}`}>
              {!hideHeaderAndNav && <AppHeader />}
              {!hideHeaderAndNav && <PageNavigation />}
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