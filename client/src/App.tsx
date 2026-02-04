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
const Swap = lazy(() => import("@/pages/swap").then(m => ({ default: m.default || m })));
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

// More pages to lazy load - FIXED: PascalCase names
const AcademyArticle = lazy(() => import("@/pages/academy-article").then(m => ({ default: m.AcademyArticle })));
const BlogPost = lazy(() => import("@/pages/blog-post"));
const Careers = lazy(() => import("@/pages/careers"));
const Spot = lazy(() => import("@/pages/spot").then(m => ({ default: m.Spot })));
const MarketsPage = lazy(() => import("@/pages/markets"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AdminVerificationsPage = lazy(() => import("@/pages/admin-verifications"));
const AdminMerchantsPage = lazy(() => import("@/pages/admin-merchants"));
const AdminGiftCards = lazy(() => import("@/pages/admin-gift-cards"));
const CreateOfferAdvanced = lazy(() => import("@/pages/create-offer-advanced").then(m => ({ default: m.CreateOfferAdvanced })));
const AdminTransferPage = lazy(() => import("@/pages/admin-transfer"));
const AdminBlog = lazy(() => import("@/pages/admin-blog"));

const Blog = lazy(() => import("@/pages/blog"));
const About = lazy(() => import("@/pages/about"));
const SubmitIdea = lazy(() => import("@/pages/submit-idea"));
const VerifyEmail = lazy(() => import("@/pages/verify-email").then(m => ({ default: m.default || m })));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const Reviews = lazy(() => import("@/pages/reviews"));
const Support = lazy(() => import("@/pages/support"));
const Contact = lazy(() => import("@/pages/contact"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const AMLPolicy = lazy(() => import("@/pages/aml-policy"));
const RestrictedCountries = lazy(() => import("@/pages/restricted-countries"));
const VIPTerms = lazy(() => import("@/pages/vip-terms"));
const VendorReminder = lazy(() => import("@/pages/vendor-reminder"));
const NotFound = lazy(() => import("@/pages/not-found").then(m => ({ default: m.default || m })));

function LazyRoute({ component: Component, skeleton = <PageSkeleton /> }: { component: React.LazyExoticComponent<React.ComponentType>, skeleton?: React.ReactNode }) {
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
      {() => <Dashboard />}
      {() => <LazyRoute component={P2P} />}
      {() => <LazyRoute component={Spot} />}
      {() => <LazyRoute component={Swap} />}
      {() => <LazyRoute component={MarketsPage} />}
      <Route path="/wallet">{() => <Wallet />}</Route>
      {() => <LazyRoute component={VisaCard} />}
      <Route path="/wallet/visa-card/details">{() => <LazyRoute component={VisaCardDetails} />}</Route>
      {() => <LazyRoute component={MobileTopup} />}
      {() => <LazyRoute component={CryptoToBank} />}
      {() => <LazyRoute component={Lightning} />}
      {() => <LazyRoute component={BuyCrypto} />}
      {() => <LazyRoute component={Analysis} skeleton={<ChartPageSkeleton />} />}
      {() => <LazyRoute component={Explorer} />}
      {() => <LazyRoute component={ExplorerAsset} />}
      {() => <LazyRoute component={AddressDetail} />}
      {() => <LazyRoute component={BlockDetail} />}
      {() => <LazyRoute component={TransactionDetail} />}
      {() => <LazyRoute component={Prices} skeleton={<ChartPageSkeleton />} />}
      {() => <LazyRoute component={Blocks} />}
      {() => <LazyRoute component={Transactions} />}
      {() => <LazyRoute component={BitcoinCalculator} />}
      {() => <LazyRoute component={Profile} />}
      {() => <LazyRoute component={Shop} />}
      {() => <LazyRoute component={ShopPost} />}
      {() => <LazyRoute component={CreateOffer} />}
      {() => <LazyRoute component={CreateOfferAdvanced} />}
      {() => <LazyRoute component={MyOffers} />}
      {() => <LazyRoute component={FavoriteOffers} />}
      {() => <LazyRoute component={TrustedUsers} />}
      {() => <LazyRoute component={BlockedUsers} />}
      {() => <LazyRoute component={TradeStatistics} />}
      {() => <LazyRoute component={TradeHistory} />}
      {() => <LazyRoute component={OfferDetail} />}
      {() => <LazyRoute component={ActiveTrade} />}
      {() => <LazyRoute component={GiftCards} />}
      {() => <LazyRoute component={GiftCardDetail} />}
      {() => <LazyRoute component={AccountSettings} />}
      {() => <LazyRoute component={VerificationPage} />}
      {() => <LazyRoute component={DevicesPage} />}
      {() => <LazyRoute component={MedalsPage} />}
      <Route path="/signup">{() => <SignUp />}</Route>
      <Route path="/signin">{() => <SignIn />}</Route>
      <Route path="/kyc-callback">{() => <LazyRoute component={KYCCallback} />}</Route>
      <Route path="/verify-email">{() => <LazyRoute component={VerifyEmail} />}</Route>
      {() => <LazyRoute component={PexlyAcademy} />}
      {() => <LazyRoute component={AcademyArticle} />}
      {() => <LazyRoute component={Blog} />}
      {() => <LazyRoute component={BlogPost} />}
      {() => <LazyRoute component={Careers} />}
      {() => <LazyRoute component={About} />}
      {() => <LazyRoute component={Reviews} />}
      {() => <LazyRoute component={Support} />}
      {() => <LazyRoute component={Contact} />}
      {() => <LazyRoute component={Affiliate} />}
      {() => <LazyRoute component={ReferralPage} />}
      {() => <LazyRoute component={RewardsPage} />}
      {() => <LazyRoute component={MerchantApplicationPage} />}
      {() => <LazyRoute component={MerchantDowngradePage} />}
      {() => <LazyRoute component={NotificationsPage} />}
      {() => <LazyRoute component={NotificationSettings} />}
      {() => <LazyRoute component={Terms} />}
      {() => <LazyRoute component={Privacy} />}
      {() => <LazyRoute component={CookiePolicy} />}
      {() => <LazyRoute component={AMLPolicy} />}
      {() => <LazyRoute component={RestrictedCountries} />}
      {() => <LazyRoute component={VIPTerms} />}
      {() => <LazyRoute component={VendorReminder} />}
      {() => <LazyRoute component={SubmitIdea} />}
      {() => <LazyRoute component={Developer} />}
      {() => <LazyRoute component={AdminPage} />}
      {() => <LazyRoute component={AdminVerificationsPage} />}
      {() => <LazyRoute component={AdminMerchantsPage} />}
      {() => <LazyRoute component={AdminGiftCards} />}
      {() => <LazyRoute component={AdminTransferPage} />}
      {() => <LazyRoute component={AdminBlog} />}
      <Route>{() => <LazyRoute component={NotFound} />}</Route>
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
    <div className="flex flex-col min-h-screen">
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}
      <main className="flex-grow">
        <Router />
      </main>
      {!hideAppFooter && <AppFooter />}
      <GlobalNotificationListener />
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
      <ThemeProvider defaultTheme="dark" storageKey="pexly-theme">
        <TooltipProvider>
          <AuthProvider>
            {isHelp ? (
              <Suspense fallback={<PageSkeleton />}>
                <Support />
              </Suspense>
            ) : (
              <>
                <AppContent />
                <Toaster />
              </>
            )}
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
