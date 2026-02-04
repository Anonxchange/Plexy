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
const P2P = lazy(() => import("@/pages/p2p").then(m => ({ default: m.P2P })));
const Swap = lazy(() => import("@/pages/swap"));
const Profile = lazy(() => import("@/pages/profile").then(m => ({ default: m.Profile })));
const Shop = lazy(() => import("@/pages/shop").then(m => ({ default: m.Shop })));
const ShopPost = lazy(() => import("@/pages/shop-post").then(m => ({ default: m.ShopPost })));
const CreateOffer = lazy(() => import("@/pages/create-offer").then(m => ({ default: m.CreateOffer })));
const GiftCards = lazy(() => import("@/pages/gift-cards").then(m => ({ default: m.GiftCards })));
const GiftCardDetail = lazy(() => import("@/pages/gift-card-detail").then(m => ({ default: m.GiftCardDetail })));
const TradeHistory = lazy(() => import("@/pages/trade-history").then(m => ({ default: m.TradeHistory })));
const DevicesPage = lazy(() => import("@/pages/devices"));
const VisaCard = lazy(() => import("@/pages/visa-card"));
const VisaCardDetails = lazy(() => import("@/pages/visa-card-details"));
const MobileTopup = lazy(() => import("@/pages/mobile-topup"));
const CryptoToBank = lazy(() => import("@/pages/crypto-to-bank"));
const Lightning = lazy(() => import("@/pages/lightning"));
const BuyCrypto = lazy(() => import("@/pages/buy-crypto"));
const ActiveTrade = lazy(() => import("@/pages/active-trade"));
const Affiliate = lazy(() => import("@/pages/affiliate"));
const MerchantApplicationPage = lazy(() => import("@/pages/merchant-application"));
const MerchantDowngradePage = lazy(() => import("@/pages/merchant-downgrade"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const NotificationSettings = lazy(() => import("@/pages/notification-settings"));
const PexlyAcademy = lazy(() => import("@/pages/pexly-academy"));
const FavoriteOffers = lazy(() => import("@/pages/favorite-offers").then(m => ({ default: m.FavoriteOffers })));
const TrustedUsers = lazy(() => import("@/pages/trusted-users").then(m => ({ default: m.TrustedUsers })));
const BlockedUsers = lazy(() => import("@/pages/blocked-users").then(m => ({ default: m.BlockedUsers })));
const TradeStatistics = lazy(() => import("@/pages/trade-statistics").then(m => ({ default: m.TradeStatistics })));
const Developer = lazy(() => import("./pages/developer").then(m => ({ default: m.Developer })));
const KYCCallback = lazy(() => import("@/pages/kyc-callback"));
const OfferDetail = lazy(() => import("@/pages/offer-detail").then(m => ({ default: m.OfferDetail })));
const AddressDetail = lazy(() => import("@/pages/address-detail"));
const BlockDetail = lazy(() => import("@/pages/block-detail"));
const MedalsPage = lazy(() => import("@/pages/medals"));

// Heavy pages - lazy loaded (charts: ~432KB, media: ~203KB)
const AccountSettings = lazy(() => import("@/pages/account-settings"));
const TransactionDetail = lazy(() => import("@/pages/transaction-detail"));
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
const AdminTransferPageLazy = lazy(() => import("@/pages/admin-transfer"));
const AdminBlogLazy = lazy(() => import("@/pages/admin-blog"));

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
      <Route path="/about">{() => <LazyRoute component={About} />}</Route>
      <Route path="/explorer">{() => <LazyRoute component={Explorer} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/prices">{() => <LazyRoute component={Prices} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/blocks">{() => <LazyRoute component={Blocks} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/transactions">{() => <LazyRoute component={Transactions} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/address/:address" component={AddressDetail} />
      <Route path="/explorer/transaction/:hash">{() => <LazyRoute component={TransactionDetail} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/explorer/block/:hash" component={BlockDetail} />
      <Route path="/explorer/asset/:symbol">{() => <LazyRoute component={ExplorerAsset} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/markets">{() => <LazyRoute component={marketsPage} />}</Route>
      <Route path="/submit-idea">{() => <LazyRoute component={SubmitIdea} />}</Route>
      <Route path="/p2p">{() => <LazyRoute component={P2P} />}</Route>
      <Route path="/spot">{() => <LazyRoute component={spot} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/swap">{() => <LazyRoute component={Swap} />}</Route>
      <Route path="/wallet">{() => <LazyRoute component={Wallet} />}</Route>
      <Route path="/analysis">{() => <LazyRoute component={Analysis} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/wallet/visa-card">{() => <LazyRoute component={VisaCard} />}</Route>
      <Route path="/wallet/visa-card/details">{() => <LazyRoute component={VisaCardDetails} />}</Route>
      <Route path="/wallet/mobile-topup">{() => <LazyRoute component={MobileTopup} />}</Route>
      <Route path="/wallet/crypto-to-bank">{() => <LazyRoute component={CryptoToBank} />}</Route>
      <Route path="/wallet/lightning">{() => <LazyRoute component={Lightning} />}</Route>
      <Route path="/wallet/buy-crypto">{() => <LazyRoute component={BuyCrypto} />}</Route>
      <Route path="/gift-cards">{() => <LazyRoute component={GiftCards} />}</Route>
      <Route path="/gift-cards/:id">{() => <LazyRoute component={GiftCardDetail} />}</Route>
      <Route path="/trade-history">{() => <LazyRoute component={TradeHistory} />}</Route>
      <Route path="/account-settings">{() => <LazyRoute component={AccountSettings} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/devices">{() => <LazyRoute component={DevicesPage} />}</Route>
      <Route path="/notification-settings">{() => <LazyRoute component={NotificationSettings} />}</Route>
      <Route path="/developer">{() => <LazyRoute component={Developer} />}</Route>
      <Route path="/fund-staging" component={FundStaging} />
      <Route path="/verification">{() => <LazyRoute component={VerificationPage} />}</Route>
      <Route path="/kyc/callback">{() => <LazyRoute component={KYCCallback} />}</Route>
      <Route path="/merchant-application">{() => <LazyRoute component={MerchantApplicationPage} />}</Route>
      <Route path="/merchant-downgrade">{() => <LazyRoute component={MerchantDowngradePage} />}</Route>
      <Route path="/admin">{() => <LazyRoute component={adminPage} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/verifications">{() => <LazyRoute component={adminVerificationsPage} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/merchants">{() => <LazyRoute component={adminMerchantsPage} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/transfer">{() => <LazyRoute component={AdminTransferPageLazy} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/blog">{() => <LazyRoute component={AdminBlogLazy} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/gift-cards">{() => <LazyRoute component={adminGiftCards} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/notifications">{() => <LazyRoute component={NotificationsPage} />}</Route>
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/:userId?">{() => <LazyRoute component={Profile} />}</Route>
      <Route path="/shop">{() => <LazyRoute component={Shop} />}</Route>
      <Route path="/shop/post">{() => <LazyRoute component={ShopPost} />}</Route>
      <Route path="/create-offer">{() => <LazyRoute component={CreateOffer} />}</Route>
      <Route path="/edit-offer/:offerId">{() => <LazyRoute component={CreateOffer} />}</Route>
      <Route path="/create-offer-advanced">{() => <LazyRoute component={createOfferAdvanced} />}</Route>
      <Route path="/my-offers">{() => <LazyRoute component={MyOffers} />}</Route>
      <Route path="/favorite-offers">{() => <LazyRoute component={FavoriteOffers} />}</Route>
      <Route path="/trusted-users">{() => <LazyRoute component={TrustedUsers} />}</Route>
      <Route path="/blocked-users">{() => <LazyRoute component={BlockedUsers} />}</Route>
      <Route path="/trade-statistics">{() => <LazyRoute component={TradeStatistics} />}</Route>
      <Route path="/trade/:tradeId">{() => <LazyRoute component={ActiveTrade} />}</Route>
      <Route path="/offers/:offerId">{() => <LazyRoute component={OfferDetail} />}</Route>
      <Route path="/medals">{() => <LazyRoute component={MedalsPage} />}</Route>
      <Route path="/affiliate">{() => <LazyRoute component={Affiliate} />}</Route>
      <Route path="/rewards">{() => <LazyRoute component={RewardsPage} />}</Route>
      <Route path="/referral">{() => <LazyRoute component={ReferralPage} />}</Route>
      <Route path="/bitcoin-calculator">{() => <LazyRoute component={BitcoinCalculator} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/academy" component={PexlyAcademy} />
      <Route path="/academy/:articleId">{() => <LazyRoute component={AcademyArticle} />}</Route>
      <Route path="/careers">{() => <LazyRoute component={careers} />}</Route>
      <Route path="/blog">{() => <LazyRoute component={Blog} />}</Route>
      <Route path="/blog/:postId">{() => <LazyRoute component={BlogPost} />}</Route>
      <Route path="/reviews">{() => <LazyRoute component={Reviews} />}</Route>
      <Route path="/support">{() => <LazyRoute component={Support} />}</Route>
      <Route path="/contact">{() => <LazyRoute component={Contact} />}</Route>
      <Route path="/terms">{() => <LazyRoute component={Terms} />}</Route>
      <Route path="/privacy">{() => <LazyRoute component={Privacy} />}</Route>
      <Route path="/cookie-policy">{() => <LazyRoute component={CookiePolicy} />}</Route>
      <Route path="/aml-policy">{() => <LazyRoute component={AMLPolicy} />}</Route>
      <Route path="/restricted-countries">{() => <LazyRoute component={RestrictedCountries} />}</Route>
      <Route path="/vip-terms">{() => <LazyRoute component={VIPTerms} />}</Route>
      <Route path="/vendor-reminder">{() => <LazyRoute component={VendorReminder} />}</Route>
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
  const isHelp = typeof window !== 'undefined' && window.location.hostname === 'help.pexly.app';
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            {isHelp ? (
              <Suspense fallback={<PageSkeleton />}>
                <Support />
              </Suspense>
            ) : (
              <>
                <GlobalNotificationListener />
                <AppContent />
              </>
            )}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

