import React from "react";
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
import { CookieConsent } from "@/components/cookie-consent";
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
import { ShopPost } from "@/pages/shop-post";
import { CreateOffer } from "@/pages/create-offer";
import { CreateOfferAdvanced } from "@/pages/create-offer-advanced";
import { MyOffers } from "@/pages/my-offers";
import Spot from "@/pages/spot";
import NotFound from "@/pages/not-found";
import { GiftCards } from "@/pages/gift-cards";
import { GiftCardDetail } from "@/pages/gift-card-detail";
import { TradeHistory } from "@/pages/trade-history";
import AccountSettings from "@/pages/account-settings";
import DevicesPage from "@/pages/devices";
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
import AdminBlog from "@/pages/admin-blog";
import AdminGiftCards from "@/pages/admin-gift-cards";
import AssetDetail from "@/pages/asset-detail";
import AssetHistory from "@/pages/asset-history";
import MedalsPage from "@/pages/medals";
import { Fees } from "@/pages/fees";
import Affiliate from "@/pages/affiliate";
import RewardsPage from "@/pages/rewards";
import ReferralPage from "@/pages/referral";
import MerchantApplicationPage from "@/pages/merchant-application";
import MerchantDowngradePage from "@/pages/merchant-downgrade";
import AdminMerchantsPage from "@/pages/admin-merchants";
import PexlyPay from "@/pages/pexly-pay";
import PexlyPayHistory from "@/pages/pexly-pay-history";
import PexlyPaySettings from "@/pages/pexly-pay-settings";
import PexlyPayPaymentLimits from "@/pages/pexly-pay-payment-limits";
import PexlyPayPasswordFree from "@/pages/pexly-pay-password-free";
import PexlyPayHelp from "@/pages/pexly-pay-help";
import NotificationsPage from "@/pages/notifications";
import NotificationSettings from "@/pages/notification-settings";
import { BitcoinCalculator } from "@/pages/bitcoin-calculator";
import { VerifyEmail } from "@/pages/verify-email";
import PexlyAcademy from "@/pages/pexly-academy";
import { AcademyArticle } from "@/pages/academy-article";
import About from "@/pages/about";
import MarketsPage from "@/pages/markets";
import Careers from "@/pages/careers";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Reviews from "@/pages/reviews";
import Support from "@/pages/support";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import CookiePolicy from "@/pages/cookie-policy";
import AMLPolicy from "@/pages/aml-policy";
import RestrictedCountries from "@/pages/restricted-countries";
import VIPTerms from "@/pages/vip-terms";
import VendorReminder from "@/pages/vendor-reminder";
import SubmitIdea from "@/pages/submit-idea";
import { FavoriteOffers } from "@/pages/favorite-offers";
import { TrustedUsers } from "@/pages/trusted-users";
import { BlockedUsers } from "@/pages/blocked-users";
import { TradeStatistics } from "@/pages/trade-statistics";
import { Developer } from "./pages/developer";
import KYCCallback from "@/pages/kyc-callback";
import Analysis from "@/pages/analysis";
import { OfferDetail } from "@/pages/offer-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/markets" component={MarketsPage} />
      <Route path="/submit-idea" component={SubmitIdea} />
      <Route path="/buy" component={Buy} />
      <Route path="/p2p" component={P2P} />
      <Route path="/spot" component={Spot} />
      <Route path="/swap" component={Swap} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/analysis" component={Analysis} />
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
      <Route path="/gift-cards/:id" component={GiftCardDetail} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/developer" component={Developer} />
      <Route path="/verification" component={VerificationPage} />
      <Route path="/kyc/callback" component={KYCCallback} />
      <Route path="/merchant-application" component={MerchantApplicationPage} />
      <Route path="/merchant-downgrade" component={MerchantDowngradePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/verifications" component={AdminVerificationsPage} />
      <Route path="/admin/merchants" component={AdminMerchantsPage} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/gift-cards" component={AdminGiftCards} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/:userId?" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop-post" component={ShopPost} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/edit-offer/:offerId" component={CreateOffer} />
      <Route path="/create-offer-advanced" component={CreateOfferAdvanced} />
      <Route path="/my-offers" component={MyOffers} />
      <Route path="/favorite-offers" component={FavoriteOffers} />
      <Route path="/trusted-users" component={TrustedUsers} />
      <Route path="/blocked-users" component={BlockedUsers} />
      <Route path="/trade-statistics" component={TradeStatistics} />
      <Route path="/trade/:tradeId" component={ActiveTrade} />

              <Route path="/offers/:offerId" component={OfferDetail} />
      <Route path="/medals" component={MedalsPage} />
      <Route path="/fees" component={Fees} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/bitcoin-calculator" component={BitcoinCalculator} />
      <Route path="/academy" component={PexlyAcademy} />
      <Route path="/academy/:articleId" component={AcademyArticle} />
      <Route path="/careers" component={Careers} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:postId" component={BlogPost} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/support" component={Support} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/aml-policy" component={AMLPolicy} />
      <Route path="/restricted-countries" component={RestrictedCountries} />
      <Route path="/vip-terms" component={VIPTerms} />
      <Route path="/vendor-reminder" component={VendorReminder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/analysis", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/crypto-to-bank", "/wallet/lightning", "/wallet/buy-crypto", "/wallet/pexly-pay", "/gift-cards", "/dashboard", "/profile", "/shop", "/shop-post", "/create-offer", "/my-offers", "/favorite-offers", "/trusted-users", "/blocked-users", "/trade-statistics", "/trade-history", "/account-settings", "/verification", "/admin", "/admin/verifications", "/admin/blog", "/admin/gift-cards", "/notifications", "/signin", "/signup", "/verify-email", "/blog", "/careers", "/reviews", "/support", "/affiliate", "/referral", "/rewards", "/terms", "/privacy", "/cookie-policy", "/aml-policy", "/restricted-countries", "/vip-terms", "/vendor-reminder", "/submit-idea"].includes(location) || location.startsWith("/trade/") || location.startsWith("/blog/") || location.startsWith("/gift-cards/");
  const hideHeaderAndNav = ["/signin", "/signup", "/verify-email", "/support"].includes(location);
  const hidePageNav = ["/terms"].includes(location);

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? 'pt-16' : ''}`}>
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}
      <main className="flex-1">
        <Router />
      </main>
      {!hideAppFooter && <AppFooter />}
      <Toaster />
      <CookieConsent />
    </div>
  );
}

function App() {
  // Check if on help subdomain - show only support page
  const isHelpSubdomain = typeof window !== 'undefined' && window.location.hostname === 'help.pexly.app';
  
  if (isHelpSubdomain) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Support />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <GlobalNotificationListener />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
