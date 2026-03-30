import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import i18n from "@/lib/i18n";
import { detectLanguageFromIP, isValidLang } from "@/lib/detect-language";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CartProvider } from "@/hooks/use-shopify-cart";

// Deferred — invisible until triggered, no need to block initial paint
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const SonnerToaster = lazy(() => import("sonner").then(m => ({ default: m.Toaster })));
const GlobalNotificationListener = lazy(() =>
  import("@/components/global-notification-listener").then(m => ({ default: m.GlobalNotificationListener }))
);
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PageNavigation } from "@/components/page-navigation";
import { CookieConsent } from "@/components/cookie-consent";
const WalletSetupDialog = lazy(() => import("@/components/wallet/WalletSetupDialog").then(m => ({ default: m.WalletSetupDialog })));
import { PageSkeleton, ChartPageSkeleton } from "@/components/page-skeleton";

// Core pages - loaded eagerly (only what's needed for first-visit home page)
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { VerifyEmail } from "@/pages/verify-email";

// Auth/app pages - lazy loaded since home page is the universal first stop
const SignIn = lazy(() => import("@/pages/signin").then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import("@/pages/signup").then(m => ({ default: m.SignUp })));
const Dashboard = lazy(() => import("@/pages/dashboard").then(m => ({ default: m.Dashboard })));
const Wallet = lazy(() => import("@/pages/wallet"));

// Rarely first-visited pages - lazy loaded to reduce initial bundle
const Developer = lazy(() => import("./pages/developer").then(m => ({ default: m.Developer })));
const KYCCallback = lazy(() => import("@/pages/kyc-callback"));
const AddressDetail = lazy(() => import("@/pages/address-detail"));
const BlockDetail = lazy(() => import("@/pages/block-detail"));
const DevicesPage = lazy(() => import("@/pages/devices"));

// Lazy loaded pages
const Swap = lazy(() => import("@/pages/swap").then(m => ({ default: m.Swap })));
const Profile = lazy(() => import("@/pages/profile").then(m => ({ default: m.Profile })));
const Shop = lazy(() => import("@/pages/shop").then(m => ({ default: m.Shop })));
const ShopPost = lazy(() => import("@/pages/shop-post").then(m => ({ default: m.ShopPost })));
const ProductDetail = lazy(() => import("@/pages/product-detail").then(m => ({ default: m.ProductDetail })));
const GiftCards = lazy(() => import("@/pages/gift-cards").then(m => ({ default: m.GiftCards })));
const GiftCardDetail = lazy(() => import("@/pages/gift-card-detail").then(m => ({ default: m.GiftCardDetail })));
const Checkout = lazy(() => import("@/pages/checkout").then(m => ({ default: m.Checkout })));
const VisaCard = lazy(() => import("@/pages/visa-card"));
const VisaCardDetails = lazy(() => import("@/pages/visa-card-details"));
const MobileTopup = lazy(() => import("@/pages/mobile-topup"));
const UtilityBill = lazy(() => import("@/pages/utility-bill"));
const Stake = lazy(() => import("@/pages/stake"));
const Lightning = lazy(() => import("@/pages/lightning"));
const BuyCrypto = lazy(() => import("@/pages/buy-crypto"));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const NotificationSettings = lazy(() => import("@/pages/notification-settings"));
const About = lazy(() => import("@/pages/about"));
const Reviews = lazy(() => import("@/pages/reviews"));
const Support = lazy(() => import("@/pages/support"));
const Contact = lazy(() => import("@/pages/contact"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const RestrictedCountries = lazy(() => import("@/pages/restricted-countries"));
const VIPTerms = lazy(() => import("@/pages/vip-terms"));
const SubmitIdea = lazy(() => import("@/pages/submit-idea"));
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

// More pages to lazy load
const BlogPost = lazy(() => import("@/pages/blog-post"));
const careers = lazy(() => import("@/pages/careers"));
const spot = lazy(() => import("@/pages/spot").then(m => ({ default: m.Spot })));
const marketsPage = lazy(() => import("@/pages/markets"));
const coinDetailPage = lazy(() => import("@/pages/coin-detail"));
const adminPage = lazy(() => import("@/pages/admin"));
const adminVerificationsPage = lazy(() => import("@/pages/admin-verifications"));
const adminGiftCards = lazy(() => import("@/pages/admin-gift-cards"));
const AdminBlogLazy = lazy(() => import("@/pages/admin-blog"));
const Blog = lazy(() => import("@/pages/blog"));

const Prediction = lazy(() => import("@/pages/prediction"));
const Perpetual = lazy(() => import("@/pages/perpetual"));
const PredictionDetail = lazy(() => import("@/pages/prediction-detail"));

import { GiftCardCartProvider } from "@/hooks/use-gift-card-cart";

// ─── Route guard helpers ──────────────────────────────────────────────────────

type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;

/** Renders a lazy component with a skeleton fallback — no auth check. */
function LazyRoute({
  component: Component,
  skeleton = <PageSkeleton />,
}: {
  component: LazyComponent;
  skeleton?: React.ReactNode;
}) {
  return (
    <Suspense fallback={skeleton}>
      <Component />
    </Suspense>
  );
}

/**
 * Requires an authenticated session.
 * - While auth is resolving → shows skeleton.
 * - Unauthenticated → redirects to /signin preserving the return URL.
 * - Authenticated → renders the page.
 */
function ProtectedRoute({
  component: Component,
  skeleton = <PageSkeleton />,
}: {
  component: LazyComponent;
  skeleton?: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <>{skeleton}</>;

  if (!user) {
    const returnTo = encodeURIComponent(location);
    return <Redirect to={`/signin?redirect=${returnTo}`} />;
  }

  return (
    <Suspense fallback={skeleton}>
      <Component />
    </Suspense>
  );
}

/**
 * Redirects already-authenticated users away from auth pages (signin / signup).
 * - While loading → shows skeleton so there's no flash of the auth form.
 * - Authenticated → redirects to /dashboard (or the ?redirect param).
 * - Unauthenticated → renders the auth page.
 */
function AuthRoute({
  component: Component,
  skeleton = <PageSkeleton />,
}: {
  component: LazyComponent;
  skeleton?: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) return <>{skeleton}</>;

  if (user) {
    const params = new URLSearchParams(location.split("?")[1] ?? "");
    const raw = params.get("redirect") ?? "/dashboard";
    const redirect = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    return <Redirect to={redirect} />;
  }

  return (
    <Suspense fallback={skeleton}>
      <Component />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Switch>
      {/* ── Public pages ── */}
      <Route path="/" component={Home} />
      <Route path="/perpetual">{() => <LazyRoute component={Perpetual} />}</Route>
      <Route path="/swap">{() => <LazyRoute component={Swap} />}</Route>
      <Route path="/prediction">{() => <LazyRoute component={Prediction} />}</Route>
      <Route path="/prediction/:id">{() => <LazyRoute component={PredictionDetail} />}</Route>
      <Route path="/about">{() => <LazyRoute component={About} />}</Route>
      <Route path="/explorer">{() => <LazyRoute component={Explorer} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/prices">{() => <LazyRoute component={Prices} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/blocks">{() => <LazyRoute component={Blocks} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/transactions">{() => <LazyRoute component={Transactions} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/explorer/address/:address">{() => <LazyRoute component={AddressDetail} />}</Route>
      <Route path="/explorer/transaction/:hash">{() => <LazyRoute component={TransactionDetail} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/explorer/block/:hash">{() => <LazyRoute component={BlockDetail} />}</Route>
      <Route path="/explorer/asset/:symbol">{() => <LazyRoute component={ExplorerAsset} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/markets/:symbol">{() => <LazyRoute component={coinDetailPage} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/markets">{() => <LazyRoute component={marketsPage} />}</Route>
      <Route path="/submit-idea">{() => <LazyRoute component={SubmitIdea} />}</Route>
      <Route path="/spot">{() => <LazyRoute component={spot} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/buy-crypto">{() => <LazyRoute component={BuyCrypto} />}</Route>
      <Route path="/gift-cards">{() => <LazyRoute component={GiftCards} />}</Route>
      <Route path="/gift-cards/:id">{() => <LazyRoute component={GiftCardDetail} />}</Route>
      <Route path="/shop">{() => <LazyRoute component={Shop} />}</Route>
      <Route path="/shop/product/:id">{() => <LazyRoute component={ProductDetail} />}</Route>
      <Route path="/shop/post">{() => <LazyRoute component={ShopPost} />}</Route>
      <Route path="/bitcoin-calculator">{() => <LazyRoute component={BitcoinCalculator} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/careers">{() => <LazyRoute component={careers} />}</Route>
      <Route path="/blog">{() => <LazyRoute component={Blog} />}</Route>
      <Route path="/blog/:postId">{() => <LazyRoute component={BlogPost} />}</Route>
      <Route path="/reviews">{() => <LazyRoute component={Reviews} />}</Route>
      <Route path="/support">{() => <LazyRoute component={Support} />}</Route>
      <Route path="/contact">{() => <LazyRoute component={Contact} />}</Route>
      <Route path="/terms">{() => <LazyRoute component={Terms} />}</Route>
      <Route path="/privacy">{() => <LazyRoute component={Privacy} />}</Route>
      <Route path="/cookie-policy">{() => <LazyRoute component={CookiePolicy} />}</Route>
      <Route path="/restricted-countries">{() => <LazyRoute component={RestrictedCountries} />}</Route>
      <Route path="/vip-terms">{() => <LazyRoute component={VIPTerms} />}</Route>
      <Route path="/profile/:userId?">{() => <LazyRoute component={Profile} />}</Route>
      <Route path="/verify-email" component={VerifyEmail} />

      {/* ── Auth pages (redirect away if already signed in) ── */}
      <Route path="/signin">{() => <AuthRoute component={SignIn} />}</Route>
      <Route path="/signup">{() => <AuthRoute component={SignUp} />}</Route>

      {/* ── Protected pages (require a valid session) ── */}
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/wallet">{() => <ProtectedRoute component={Wallet} />}</Route>
      <Route path="/wallet/visa-card">{() => <ProtectedRoute component={VisaCard} />}</Route>
      <Route path="/wallet/visa-card/details">{() => <ProtectedRoute component={VisaCardDetails} />}</Route>
      <Route path="/wallet/mobile-topup">{() => <ProtectedRoute component={MobileTopup} />}</Route>
      <Route path="/utility">{() => <ProtectedRoute component={UtilityBill} />}</Route>
      <Route path="/wallet/utility-bill">{() => <ProtectedRoute component={UtilityBill} />}</Route>
      <Route path="/wallet/stake">{() => <ProtectedRoute component={Stake} />}</Route>
      <Route path="/wallet/lightning">{() => <ProtectedRoute component={Lightning} />}</Route>
      <Route path="/account-settings">{() => <ProtectedRoute component={AccountSettings} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/devices">{() => <ProtectedRoute component={DevicesPage} />}</Route>
      <Route path="/notification-settings">{() => <ProtectedRoute component={NotificationSettings} />}</Route>
      <Route path="/notifications">{() => <ProtectedRoute component={NotificationsPage} />}</Route>
      <Route path="/verification">{() => <ProtectedRoute component={VerificationPage} />}</Route>
      <Route path="/kyc/callback">{() => <ProtectedRoute component={KYCCallback} />}</Route>
      <Route path="/referral">{() => <LazyRoute component={ReferralPage} />}</Route>
      <Route path="/rewards">{() => <LazyRoute component={RewardsPage} />}</Route>
      <Route path="/medals">{() => <ProtectedRoute component={MedalsPage} />}</Route>
      <Route path="/analysis">{() => <ProtectedRoute component={Analysis} skeleton={<ChartPageSkeleton />} />}</Route>
      <Route path="/checkout">{() => <ProtectedRoute component={Checkout} />}</Route>

      {/* ── Admin pages (require session; pages enforce is_admin internally) ── */}
      <Route path="/admin">{() => <ProtectedRoute component={adminPage} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/verifications">{() => <ProtectedRoute component={adminVerificationsPage} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/blog">{() => <ProtectedRoute component={AdminBlogLazy} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/admin/gift-cards">{() => <ProtectedRoute component={adminGiftCards} skeleton={<PageSkeleton />} />}</Route>
      <Route path="/developer">{() => <ProtectedRoute component={Developer} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, walletImportState, setWalletImportState } = useAuth();
  const [location] = useLocation();
  const hideAppFooter = ["/", "/about", "/spot", "/perpetual", "/swap", "/prediction", "/wallet", "/analysis", "/wallet/visa-card", "/wallet/visa-card/details", "/wallet/mobile-topup", "/wallet/utility-bill", "/utility", "/wallet/stake", "/wallet/lightning", "/wallet/buy-crypto", "/gift-cards", "/dashboard", "/profile", "/shop", "/shop/post", "/account-settings", "/verification", "/admin", "/admin/verifications", "/admin/blog", "/admin/gift-cards", "/notifications", "/signin", "/signup", "/verify-email", "/blog", "/careers", "/reviews", "/support", "/contact", "/referral", "/rewards", "/terms", "/privacy", "/cookie-policy", "/restricted-countries", "/vip-terms", "/submit-idea", "/explorer", "/shop/product", "/buy-crypto", "/bitcoin-calculator"].some(path => location === path || location.startsWith(path + "/")) || location.startsWith("/explorer/") || location.startsWith("/blog/") || location.startsWith("/gift-cards/");
  const hideHeaderAndNav = ["/signin", "/signup", "/verify-email", "/support", "/contact", "/explorer"].includes(location) || location.startsWith("/explorer/");
  const hidePageNav = ["/terms", "/explorer"].includes(location) || location.startsWith("/explorer/");

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeaderAndNav ? 'pt-16' : ''}`}>
      {!hideHeaderAndNav && <AppHeader />}
      {!hideHeaderAndNav && !hidePageNav && <PageNavigation />}
      <main className="flex-1 flex flex-col">
        <AppRoutes />
      </main>
      {!hideAppFooter && <AppFooter />}

      {user && (
        <Suspense fallback={null}>
          <WalletSetupDialog
            open={walletImportState.required}
            onOpenChange={(open) => setWalletImportState({ ...walletImportState, required: open })}
            userId={user.id}
            onSuccess={() => setWalletImportState({ required: false, expectedAddress: null })}
            expectedAddress={walletImportState.expectedAddress}
          />
        </Suspense>
      )}

      <Suspense fallback={null}><Toaster /></Suspense>
      <Suspense fallback={null}><SonnerToaster position="top-center" richColors /></Suspense>
      <CookieConsent />
    </div>
  );
}

function getInitialLangBase(): string | null {
  const seg = window.location.pathname.split("/").filter(Boolean)[0];
  return isValidLang(seg) ? `/${seg}` : null;
}

function App() {
  const [langBase, setLangBase] = useState<string | null>(getInitialLangBase);

  useEffect(() => {
    if (langBase) {
      i18n.changeLanguage(langBase.slice(1));
    } else {
      detectLanguageFromIP().then((lang) => {
        const rest = window.location.pathname;
        window.history.replaceState(null, "", `/${lang}${rest === "/" ? "" : rest}`);
        i18n.changeLanguage(lang);
        setLangBase(`/${lang}`);
      });
    }
  }, []);

  if (!langBase) return null;

  const isHelp = window.location.hostname === "help.pexly.app";

  return (
    <WouterRouter base={langBase}>
      <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <GiftCardCartProvider>
                <CartProvider>
                  <TooltipProvider>
                    {isHelp ? (
                      <Suspense fallback={<PageSkeleton />}>
                        <Support />
                      </Suspense>
                    ) : (
                      <>
                        <Suspense fallback={null}><GlobalNotificationListener /></Suspense>
                        <AppContent />
                      </>
                    )}
                  </TooltipProvider>
                </CartProvider>
              </GiftCardCartProvider>
            </AuthProvider>
          </ThemeProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
