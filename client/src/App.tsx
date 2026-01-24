import React, { Suspense, lazy } from "react";
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

// Lazy load pages
const Home = loadPage(() => import("@/pages/home"));
const Buy = loadPage(() => import("@/pages/buy"));
const Wallet = loadPage(() => import("@/pages/wallet"));
const SignUp = loadPage(() => import("@/pages/signup"));
const SignIn = loadPage(() => import("@/pages/signin"));
const Dashboard = loadPage(() => import("@/pages/dashboard"));
const P2P = loadPage(() => import("@/pages/p2p"));
const Swap = loadPage(() => import("@/pages/swap"));
const Profile = loadPage(() => import("@/pages/profile"));
const Shop = loadPage(() => import("@/pages/shop"));
const ShopPost = loadPage(() => import("@/pages/shop-post"));
const CreateOffer = loadPage(() => import("@/pages/create-offer"));
const CreateOfferAdvanced = loadPage(() => import("@/pages/create-offer-advanced"));
const MyOffers = loadPage(() => import("@/pages/my-offers"));
const Spot = loadPage(() => import("@/pages/spot"));
const NotFound = loadPage(() => import("@/pages/not-found"));
const GiftCards = loadPage(() => import("@/pages/gift-cards"));
const GiftCardDetail = loadPage(() => import("@/pages/gift-card-detail"));
const TradeHistory = loadPage(() => import("@/pages/trade-history"));
const AccountSettings = loadPage(() => import("@/pages/account-settings"));
const DevicesPage = loadPage(() => import("@/pages/devices"));
const VisaCard = loadPage(() => import("@/pages/visa-card"));
const VisaCardDetails = loadPage(() => import("@/pages/visa-card-details"));
const MobileTopup = loadPage(() => import("@/pages/mobile-topup"));
const CryptoToBank = loadPage(() => import("@/pages/crypto-to-bank"));
const Lightning = loadPage(() => import("@/pages/lightning"));
const BuyCrypto = loadPage(() => import("@/pages/buy-crypto"));
const ActiveTrade = loadPage(() => import("@/pages/active-trade"));
const VerificationPage = loadPage(() => import("@/pages/verification"));
const AdminPage = loadPage(() => import("@/pages/admin"));
const AdminVerificationsPage = loadPage(() => import("@/pages/admin-verifications"));
const AdminBlog = loadPage(() => import("@/pages/admin-blog"));
const AdminGiftCards = loadPage(() => import("@/pages/admin-gift-cards"));
const AssetDetail = loadPage(() => import("@/pages/asset-detail"));
const AssetHistory = loadPage(() => import("@/pages/asset-history"));
const MedalsPage = loadPage(() => import("@/pages/medals"));
const Fees = loadPage(() => import("@/pages/fees"));
const Affiliate = loadPage(() => import("@/pages/affiliate"));
const RewardsPage = loadPage(() => import("@/pages/rewards"));
const ReferralPage = loadPage(() => import("@/pages/referral"));
const MerchantApplicationPage = loadPage(() => import("@/pages/merchant-application"));
const MerchantDowngradePage = loadPage(() => import("@/pages/merchant-downgrade"));
const AdminMerchantsPage = loadPage(() => import("@/pages/admin-merchants"));
const AdminTransferPage = loadPage(() => import("@/pages/admin-transfer"));
const PexlyPay = loadPage(() => import("@/pages/pexly-pay"));
const PexlyPayHistory = loadPage(() => import("@/pages/pexly-pay-history"));
const PexlyPaySettings = loadPage(() => import("@/pages/pexly-pay-settings"));
const PexlyPayPaymentLimits = loadPage(() => import("@/pages/pexly-pay-payment-limits"));
const PexlyPayPasswordFree = loadPage(() => import("@/pages/pexly-pay-password-free"));
const PexlyPayHelp = loadPage(() => import("@/pages/pexly-pay-help"));
const NotificationsPage = loadPage(() => import("@/pages/notifications"));
const NotificationSettings = loadPage(() => import("@/pages/notification-settings"));
const BitcoinCalculator = loadPage(() => import("@/pages/bitcoin-calculator"));
const VerifyEmail = loadPage(() => import("@/pages/verify-email"));
const PexlyAcademy = loadPage(() => import("@/pages/pexly-academy"));
const AcademyArticle = loadPage(() => import("@/pages/academy-article"));
const About = loadPage(() => import("@/pages/about"));
const MarketsPage = loadPage(() => import("@/pages/markets"));
const Careers = loadPage(() => import("@/pages/careers"));
const Blog = loadPage(() => import("@/pages/blog"));
const BlogPost = loadPage(() => import("@/pages/blog-post"));
const Reviews = loadPage(() => import("@/pages/reviews"));
const Support = loadPage(() => import("@/pages/support"));
const Contact = loadPage(() => import("@/pages/contact"));
const Terms = loadPage(() => import("@/pages/terms"));
const Privacy = loadPage(() => import("@/pages/privacy"));
const CookiePolicy = loadPage(() => import("@/pages/cookie-policy"));
const AMLPolicy = loadPage(() => import("@/pages/aml-policy"));
const RestrictedCountries = loadPage(() => import("@/pages/restricted-countries"));
const VIPTerms = loadPage(() => import("@/pages/vip-terms"));
const VendorReminder = loadPage(() => import("@/pages/vendor-reminder"));
const SubmitIdea = loadPage(() => import("@/pages/submit-idea"));
const FavoriteOffers = loadPage(() => import("@/pages/favorite-offers"));
const TrustedUsers = loadPage(() => import("@/pages/trusted-users"));
const BlockedUsers = loadPage(() => import("@/pages/blocked-users"));
const TradeStatistics = loadPage(() => import("@/pages/trade-statistics"));
const Developer = loadPage(() => import("@/pages/developer"));
const FundStaging = loadPage(() => import("@/components/fund-staging"));
const KYCCallback = loadPage(() => import("@/pages/kyc-callback"));
const Analysis = loadPage(() => import("@/pages/analysis"));
const OfferDetail = loadPage(() => import("@/pages/offer-detail"));
const Explorer = loadPage(() => import("@/pages/explorer"));
const Prices = loadPage(() => import("@/pages/prices"));
const Blocks = loadPage(() => import("@/pages/blocks"));
const Transactions = loadPage(() => import("@/pages/transactions"));
const AddressDetail = loadPage(() => import("@/pages/address-detail"));
const TransactionDetail = loadPage(() => import("@/pages/transaction-detail"));
const BlockDetail = loadPage(() => import("@/pages/block-detail"));
const ExplorerAsset = loadPage(() => import("@/pages/explorer-asset"));


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
      <Route path="/fund-staging" component={FundStaging} />
      <Route path="/verification" component={VerificationPage} />
      <Route path="/kyc/callback" component={KYCCallback} />
      <Route path="/merchant-application" component={MerchantApplicationPage} />
      <Route path="/merchant-downgrade" component={MerchantDowngradePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/verifications" component={AdminVerificationsPage} />
      <Route path="/admin/merchants" component={AdminMerchantsPage} />
      <Route path="/admin/transfer" component={AdminTransferPage} />
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
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/analysis", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/crypto-to-bank", "/wallet/lightning", "/wallet/buy-crypto", "/wallet/pexly-pay", "/gift-cards", "/dashboard", "/profile", "/shop", "/shop/post", "/create-offer", "/my-offers", "/favorite-offers", "/trusted-users", "/blocked-users", "/trade-statistics", "/trade-history", "/account-settings", "/verification", "/admin", "/admin/verifications", "/admin/blog", "/admin/gift-cards", "/notifications", "/signin", "/signup", "/verify-email", "/blog", "/careers", "/reviews", "/support", "/contact", "/affiliate", "/referral", "/rewards", "/terms", "/privacy", "/cookie-policy", "/aml-policy", "/restricted-countries", "/vip-terms", "/vendor-reminder", "/submit-idea", "/explorer"].includes(location) || location.startsWith("/explorer/") || location.startsWith("/trade/") || location.startsWith("/blog/") || location.startsWith("/gift-cards/");
  const hideHeaderAndNav = ["/signin", "/signup", "/verify-email", "/support", "/contact", "/explorer"].includes(location) || location.startsWith("/explorer/");
  const hidePageNav = ["/terms", "/explorer"].includes(location) || location.startsWith("/explorer/");

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? 'pt-16' : ''}`}>
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Router />
        </Suspense>
      </main>
      {!hideAppFooter && <AppFooter />}
      <Toaster />
      <CookieConsent />
    </div>
  );
}

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { coinbaseWallet } from 'wagmi/connectors';

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Pexly',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

function App() {
  // Check if on help subdomain - show only support page
  const isHelpSubdomain = typeof window !== 'undefined' && window.location.hostname === 'help.pexly.app';
  
  if (isHelpSubdomain) {
    return (
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={(import.meta as any).env.VITE_ONCHAINKIT_API_KEY}
            projectId={(import.meta as any).env.VITE_CDP_PROJECT_ID}
            chain={base}
          >
            <ThemeProvider>
              <AuthProvider>
                <TooltipProvider>
                  <Support />
                </TooltipProvider>
              </AuthProvider>
            </ThemeProvider>
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={(import.meta as any).env.VITE_ONCHAINKIT_API_KEY}
          projectId={(import.meta as any).env.VITE_CDP_PROJECT_ID}
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
