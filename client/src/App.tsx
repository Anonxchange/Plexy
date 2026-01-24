import React, { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { base } from "viem/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";

import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { GlobalNotificationListener } from "@/components/global-notification-listener";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PageNavigation } from "@/components/page-navigation";
import { CookieConsent } from "@/components/cookie-consent";

/* -------------------- WAGMI -------------------- */

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: "Pexly",
      preference: "smartWalletOnly",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

/* -------------------- ENV GUARD -------------------- */

const hasOnchainConfig =
  !!import.meta.env.VITE_ONCHAINKIT_API_KEY &&
  !!import.meta.env.VITE_CDP_PROJECT_ID;

/* -------------------- LAZY LOAD PAGES (UNCHANGED) -------------------- */

const Home = lazy(() => import("@/pages/home"));
const Buy = lazy(() => import("@/pages/buy"));
const Wallet = lazy(() => import("@/pages/wallet"));
const SignUp = lazy(() => import("@/pages/signup").then(m => ({ default: m.SignUp })));
const SignIn = lazy(() => import("@/pages/signin").then(m => ({ default: m.SignIn })));
const Dashboard = lazy(() => import("@/pages/dashboard").then(m => ({ default: m.Dashboard })));
const P2P = lazy(() => import("@/pages/p2p").then(m => ({ default: m.P2P })));
const Swap = lazy(() => import("@/pages/swap").then(m => ({ default: m.Swap })));
const Profile = lazy(() => import("@/pages/profile").then(m => ({ default: m.Profile })));
const Shop = lazy(() => import("@/pages/shop").then(m => ({ default: m.Shop })));
const ShopPost = lazy(() => import("@/pages/shop-post").then(m => ({ default: m.ShopPost })));
const CreateOffer = lazy(() => import("@/pages/create-offer").then(m => ({ default: m.CreateOffer })));
const CreateOfferAdvanced = lazy(() => import("@/pages/create-offer-advanced").then(m => ({ default: m.CreateOfferAdvanced })));
const MyOffers = lazy(() => import("@/pages/my-offers").then(m => ({ default: m.MyOffers })));
const Spot = lazy(() => import("@/pages/spot").then(m => ({ default: m.Spot })));
const NotFound = lazy(() => import("@/pages/not-found"));
const GiftCards = lazy(() => import("@/pages/gift-cards").then(m => ({ default: m.GiftCards })));
const GiftCardDetail = lazy(() => import("@/pages/gift-card-detail").then(m => ({ default: m.GiftCardDetail })));
const TradeHistory = lazy(() => import("@/pages/trade-history").then(m => ({ default: m.TradeHistory })));
const AccountSettings = lazy(() => import("@/pages/account-settings"));
const DevicesPage = lazy(() => import("@/pages/devices"));
const VisaCard = lazy(() => import("@/pages/visa-card"));
const VisaCardDetails = lazy(() => import("@/pages/visa-card-details"));
const MobileTopup = lazy(() => import("@/pages/mobile-topup"));
const CryptoToBank = lazy(() => import("@/pages/crypto-to-bank"));
const Lightning = lazy(() => import("@/pages/lightning"));
const BuyCrypto = lazy(() => import("@/pages/buy-crypto"));
const ActiveTrade = lazy(() => import("@/pages/active-trade"));
const VerificationPage = lazy(() => import("@/pages/verification"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AdminVerificationsPage = lazy(() => import("@/pages/admin-verifications"));
const AdminBlog = lazy(() => import("@/pages/admin-blog"));
const AdminGiftCards = lazy(() => import("@/pages/admin-gift-cards"));
const AssetDetail = lazy(() => import("@/pages/asset-detail"));
const AssetHistory = lazy(() => import("@/pages/asset-history"));
const MedalsPage = lazy(() => import("@/pages/medals"));
const Fees = lazy(() => import("@/pages/fees").then(m => ({ default: m.Fees })));
const Affiliate = lazy(() => import("@/pages/affiliate"));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const MerchantApplicationPage = lazy(() => import("@/pages/merchant-application"));
const MerchantDowngradePage = lazy(() => import("@/pages/merchant-downgrade"));
const AdminMerchantsPage = lazy(() => import("@/pages/admin-merchants"));
const AdminTransferPage = lazy(() => import("@/pages/admin-transfer"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const BitcoinCalculator = lazy(() => import("@/pages/bitcoin-calculator").then(m => ({ default: m.BitcoinCalculator })));
const VerifyEmail = lazy(() => import("@/pages/verify-email").then(m => ({ default: m.VerifyEmail })));
const PexlyAcademy = lazy(() => import("@/pages/pexly-academy"));
const AcademyArticle = lazy(() => import("@/pages/academy-article").then(m => ({ default: m.AcademyArticle })));
const About = lazy(() => import("@/pages/about"));
const MarketsPage = lazy(() => import("@/pages/markets"));
const Careers = lazy(() => import("@/pages/careers"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));
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
const SubmitIdea = lazy(() => import("@/pages/submit-idea"));
const FavoriteOffers = lazy(() => import("@/pages/favorite-offers").then(m => ({ default: m.FavoriteOffers })));
const TrustedUsers = lazy(() => import("@/pages/trusted-users").then(m => ({ default: m.TrustedUsers })));
const BlockedUsers = lazy(() => import("@/pages/blocked-users").then(m => ({ default: m.BlockedUsers })));
const TradeStatistics = lazy(() => import("@/pages/trade-statistics").then(m => ({ default: m.TradeStatistics })));
const Analysis = lazy(() => import("@/pages/analysis"));
const OfferDetail = lazy(() => import("@/pages/offer-detail").then(m => ({ default: m.OfferDetail })));
const Explorer = lazy(() => import("@/pages/explorer"));
const Prices = lazy(() => import("@/pages/prices"));
const Blocks = lazy(() => import("@/pages/blocks"));
const Transactions = lazy(() => import("@/pages/transactions"));
const AddressDetail = lazy(() => import("@/pages/address-detail"));
const TransactionDetail = lazy(() => import("@/pages/transaction-detail"));
const BlockDetail = lazy(() => import("@/pages/block-detail"));
const ExplorerAsset = lazy(() => import("@/pages/explorer-asset"));

/* -------------------- ROUTER (FULLY RESTORED) -------------------- */

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/explorer" component={Explorer} />
      <Route path="/explorer/prices" component={Prices} />
      <Route path="/explorer/blocks" component={Blocks} />
      <Route path="/explorer/transactions" component={Transactions} />
      <Route path="/explorer/address/:address" component={AddressDetail} />
      <Route path="/explorer/transaction/:hash" component={TransactionDetail} />
      <Route path="/explorer/block/:hash" component={BlockDetail} />
      <Route path="/explorer/asset/:symbol" component={ExplorerAsset} />
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
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/gift-cards/:id" component={GiftCardDetail} />
      <Route path="/trade-history" component={TradeHistory} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/verification" component={VerificationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/verifications" component={AdminVerificationsPage} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/gift-cards" component={AdminGiftCards} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/:userId?" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/post" component={ShopPost} />
      <Route path="/create-offer" component={CreateOffer} />
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

/* -------------------- APP CONTENT (FOOTER LOGIC RESTORED) -------------------- */

function AppContent() {
  const [location] = useLocation();

  const hideAppFooter =
    [
      "/p2p",
      "/spot",
      "/swap",
      "/wallet",
      "/analysis",
      "/wallet/visa-card",
      "/wallet/visa-card/details",
      "/wallet/mobile-topup",
      "/wallet/crypto-to-bank",
      "/wallet/lightning",
      "/wallet/buy-crypto",
      "/gift-cards",
      "/dashboard",
      "/profile",
      "/shop",
      "/shop/post",
      "/create-offer",
      "/my-offers",
      "/favorite-offers",
      "/trusted-users",
      "/blocked-users",
      "/trade-statistics",
      "/trade-history",
      "/account-settings",
      "/verification",
      "/admin",
      "/admin/verifications",
      "/admin/blog",
      "/admin/gift-cards",
      "/notifications",
      "/signin",
      "/signup",
      "/verify-email",
      "/blog",
      "/careers",
      "/reviews",
      "/support",
      "/contact",
      "/affiliate",
      "/referral",
      "/rewards",
      "/terms",
      "/privacy",
      "/cookie-policy",
      "/aml-policy",
      "/restricted-countries",
      "/vip-terms",
      "/vendor-reminder",
      "/submit-idea",
      "/explorer",
    ].includes(location) ||
    location.startsWith("/explorer/") ||
    location.startsWith("/trade/") ||
    location.startsWith("/blog/") ||
    location.startsWith("/gift-cards/");

  const hideHeaderAndNav =
    ["/signin", "/signup", "/verify-email", "/support", "/contact", "/explorer"].includes(location) ||
    location.startsWith("/explorer/");

  const hidePageNav =
    ["/terms", "/explorer"].includes(location) ||
    location.startsWith("/explorer/");

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? "pt-16" : ""}`}>
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <Router />
        </Suspense>
      </main>

      {!hideAppFooter && <AppFooter />}
      <Toaster />
      <CookieConsent />
    </div>
  );
}

/* -------------------- APP ROOT -------------------- */

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {hasOnchainConfig ? (
          <OnchainKitProvider
            apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
            projectId={import.meta.env.VITE_CDP_PROJECT_ID}
            chain={base}
          >
            <ThemeProvider>
              <AuthProvider>
                <TooltipProvider>
                  <GlobalNotificationListener />
                  <AppContent />
                </TooltipProvider>
              </AuthProvider>
            </ThemeProvider>
          </OnchainKitProvider>
        ) : (
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <GlobalNotificationListener />
                <AppContent />
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        )}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
