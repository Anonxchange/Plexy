import { Switch, Route, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { GlobalNotificationListener } from "@/components/global-notification-listener";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PageNavigation } from "@/components/page-navigation";
import { CookieConsent } from "@/components/cookie-consent";
import { WalletSetupDialog } from "@/components/wallet/WalletSetupDialog";
import { PageSkeleton, ChartPageSkeleton } from "@/components/page-skeleton";

// Core pages - loaded eagerly
import Home from "@/pages/home";
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
import AdminBlog from "@/pages/admin-blog";
import Affiliate from "@/pages/affiliate";
import RewardsPage from "@/pages/rewards";
import ReferralPage from "@/pages/referral";
import MerchantApplicationPage from "@/pages/merchant-application";
import MerchantDowngradePage from "@/pages/merchant-downgrade";
import AdminTransferPage from "@/pages/admin-transfer";
import NotificationsPage from "@/pages/notifications";
import NotificationSettings from "@/pages/notification-settings";
import { VerifyEmail } from "@/pages/verify-email";
import PexlyAcademy from "@/pages/pexly-academy";
import About from "@/pages/about";
import Reviews from "@/pages/reviews";
import Support from "@/pages/support";
import Contact from "@/pages/contact";
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
import { FundStaging } from "@/components/fund-staging";
import KYCCallback from "@/pages/kyc-callback";
import { OfferDetail } from "@/pages/offer-detail";
import AddressDetail from "@/pages/address-detail";
import TransactionDetail from "@/pages/transaction-detail";
import BlockDetail from "@/pages/block-detail";
import MedalsPage from "@/pages/medals";

// Heavy pages - lazy loaded (charts: ~432KB, media: ~203KB)
const Analysis = lazy(() => import("@/pages/analysis"));
const Explorer = lazy(() => import("@/pages/explorer"));
const Prices = lazy(() => import("@/pages/prices"));
const Blocks = lazy(() => import("@/pages/blocks"));
const Transactions = lazy(() => import("@/pages/transactions"));
const ExplorerAsset = lazy(() => import("@/pages/explorer-asset"));
const BitcoinCalculator = lazy(() => import("@/pages/bitcoin-calculator").then(m => ({ default: m.BitcoinCalculator })));
const VerificationPage = lazy(() => import("@/pages/verification"));
const MyOffers = lazy(() => import("@/pages/my-offers").then(m => ({ default: m.MyOffers })));

// More pages to lazy load
const AcademyArticle = lazy(() => import("@/pages/academy-article").then(m => ({ default: m.AcademyArticle })));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const careers = lazy(() => import("@/pages/careers"));
const spot = lazy(() => import("@/pages/spot").then(m => ({ default: m.Spot })));
const marketsPage = lazy(() => import("@/pages/markets"));
const adminPage = lazy(() => import("@/pages/admin"));
const adminVerificationsPage = lazy(() => import("@/pages/admin-verifications"));
const adminMerchantsPage = lazy(() => import("@/pages/admin-merchants"));
const adminGiftCards = lazy(() => import("@/pages/admin-gift-cards"));
const createOfferAdvanced = lazy(() => import("@/pages/create-offer-advanced").then(m => ({ default: m.CreateOfferAdvanced })));

const Blog = lazy(() => import("@/pages/blog"));

function LazyRoute({ component: Component, skeleton = <PageSkeleton /> }: { component: React.LazyExoticComponent<React.ComponentType<any>>, skeleton?: React.ReactNode }) {
  return (
    <Suspense fallback={skeleton}>
      <Component />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/explorer">{() => <LazyRoute component={Explorer} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/prices">{() => <LazyRoute component={Prices} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/blocks">{() => <LazyRoute component={Blocks} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/transactions">{() => <LazyRoute component={Transactions} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/address/:address" component={AddressDetail} />
      <Route path="/explorer/transaction/:hash" component={TransactionDetail} />
      <Route path="/explorer/block/:hash" component={BlockDetail} />
      <Route path="/explorer/asset/:symbol">{() => <LazyRoute component={ExplorerAsset} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/markets">{() => <LazyRoute component={marketsPage} />}</Route>
      <Route path="/submit-idea" component={SubmitIdea} />
      <Route path="/p2p" component={P2P} />
      <Route path="/spot">{() => <LazyRoute component={spot} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/swap" component={Swap} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/analysis">{() => <LazyRoute component={Analysis} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/wallet/visa-card" component={VisaCard} />
      <Route path="/wallet/visa-card/details" component={VisaCardDetails} />
      <Route path="/wallet/mobile-topup" component={MobileTopup} />
      <Route path="/wallet/crypto-to-bank" component={CryptoToBank} />
      <Route path="/wallet/lightning" component={Lightning} />
      <Route path="/wallet/buy-crypto" component={BuyCrypto} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/gift-cards/:id" component={GiftCardDetail} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/developer" component={Developer} />
      <Route path="/fund-staging" component={FundStaging} />
      <Route path="/verification">{() => <LazyRoute component={VerificationPage} />}</Route>
      <Route path="/kyc/callback" component={KYCCallback} />
      <Route path="/merchant-application" component={MerchantApplicationPage} />
      <Route path="/merchant-downgrade" component={MerchantDowngradePage} />
      <Route path="/admin">{() => <LazyRoute component={adminPage} />}</Route>
      <Route path="/admin/verifications">{() => <LazyRoute component={adminVerificationsPage} />}</Route>
      <Route path="/admin/merchants">{() => <LazyRoute component={adminMerchantsPage} />}</Route>
      <Route path="/admin/transfer" component={AdminTransferPage} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/gift-cards">{() => <LazyRoute component={adminGiftCards} />}</Route>
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/:userId?" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/post" component={ShopPost} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/edit-offer/:offerId" component={CreateOffer} />
      <Route path="/create-offer-advanced">{() => <LazyRoute component={createOfferAdvanced} />}</Route>
      <Route path="/my-offers">{() => <LazyRoute component={MyOffers} />}</Route>
      <Route path="/favorite-offers" component={FavoriteOffers} />
      <Route path="/trusted-users" component={TrustedUsers} />
      <Route path="/blocked-users" component={BlockedUsers} />
      <Route path="/trade-statistics" component={TradeStatistics} />
      <Route path="/trade/:tradeId" component={ActiveTrade} />
      <Route path="/offers/:offerId" component={OfferDetail} />
      <Route path="/medals" component={MedalsPage} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/bitcoin-calculator">{() => <LazyRoute component={BitcoinCalculator} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/academy" component={PexlyAcademy} />
      <Route path="/academy/:articleId">{() => <LazyRoute component={AcademyArticle} />}</Route>
      <Route path="/careers">{() => <LazyRoute component={careers} />}</Route>
      <Route path="/blog">{() => <LazyRoute component={Blog} />}</Route>
      <Route path="/blog/:postId">{() => <LazyRoute component={BlogPost} />}</Route>
      <Route path="/reviews" component={Reviews} />
      <Route path="/support" component={Support} />
      <Route path="/contact" component={Contact} />
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
  const { user, walletImportState, setWalletImportState } = useAuth();
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/analysis", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/crypto-to-bank", "/wallet/lightning", "/wallet/buy-crypto", "/gift-cards", "/dashboard", "/profile", "/shop", "/shop/post", "/create-offer", "/my-offers", "/favorite-offers", "/trusted-users", "/blocked-users", "/trade-statistics", "/trade-history", "/account-settings", "/verification", "/admin", "/admin/verifications", "/admin/blog", "/admin/gift-cards", "/notifications", "/signin", "/signup", "/verify-email", "/blog", "/careers", "/reviews", "/support", "/contact", "/affiliate", "/referral", "/rewards", "/terms", "/privacy", "/cookie-policy", "/aml-policy", "/restricted-countries", "/vip-terms", "/vendor-reminder", "/submit-idea", "/explorer"].includes(location) || location.startsWith("/explorer/") || location.startsWith("/trade/") || location.startsWith("/blog/") || location.startsWith("/gift-cards/");
  const hideHeaderAndNav = ["/signin", "/signup", "/verify-email", "/support", "/contact", "/explorer"].includes(location) || location.startsWith("/explorer/");
  const hidePageNav = ["/terms", "/explorer"].includes(location) || location.startsWith("/explorer/");

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? 'pt-16' : ''}`}>
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}
      <main className="flex-1">
        <Router />
      </main>
      {!hideAppFooter && <AppFooter />}
      
      {user && (
        <WalletSetupDialog 
          open={walletImportState.required} 
          onOpenChange={(open) => setWalletImportState({ ...walletImportState, required: open })}
          userId={user.id}
          onSuccess={() => setWalletImportState({ required: false, expectedAddress: null })}
          expectedAddress={walletImportState.expectedAddress}
        />
      )}

      <Toaster />
      <CookieConsent />
    </div>
  );
}

function App() {
  // Check if on help subdomain - show only support page
  const isHelpSubdomain = typeof window !== 'undefined' && window.location.hostname === 'help.pexly.app';
  
  const content = isHelpSubdomain ? <Support /> : (
    <>
      <GlobalNotificationListener />
      <AppContent />
    </>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            {content}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
