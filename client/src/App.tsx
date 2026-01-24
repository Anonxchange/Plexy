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

/* -------------------- LAZY ROUTES -------------------- */
/* (UNCHANGED FROM YOUR ORIGINAL FILE) */

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
const MyOffers = lazy(() => import("@/pages/my-offers").then(m => ({ default: m.MyOffers })));
const NotFound = lazy(() => import("@/pages/not-found"));
const Support = lazy(() => import("@/pages/support"));
const Analysis = lazy(() => import("@/pages/analysis"));

/* -------------------- ROUTER (RESTORED) -------------------- */

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/buy" component={Buy} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/p2p" component={P2P} />
      <Route path="/swap" component={Swap} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/:userId?" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/post" component={ShopPost} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/my-offers" component={MyOffers} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

/* -------------------- APP CONTENT -------------------- */

function AppContent() {
  const [location] = useLocation();

  const hideHeader = ["/signin", "/signup"].includes(location);

  return (
    <div className={`flex min-h-screen w-full flex-col ${!hideHeader ? "pt-16" : ""}`}>
      {!hideHeader && <AppHeader />}
      {!hideHeader && <PageNavigation />}

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

      <AppFooter />
      <Toaster />
      <CookieConsent />
    </div>
  );
}

/* -------------------- PROVIDERS -------------------- */

function AppProviders({ children }: { children: React.ReactNode }) {
  const inner = (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <GlobalNotificationListener />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  return hasOnchainConfig ? (
    <OnchainKitProvider
      apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
      projectId={import.meta.env.VITE_CDP_PROJECT_ID}
      chain={base}
    >
      {inner}
    </OnchainKitProvider>
  ) : (
    inner
  );
}

/* -------------------- APP ROOT -------------------- */

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
