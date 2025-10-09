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
import { MyOffers } from "@/pages/my-offers";
import Spot from "@/pages/spot";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/buy" component={Buy} />
      <Route path="/p2p" component={P2P} />
      <Route path="/spot" component={Spot} />
      <Route path="/swap" component={Swap} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/shop" component={Shop} />
      <Route path="/create-offer" component={CreateOffer} />
      <Route path="/my-offers" component={MyOffers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const hideAppFooter = ["/p2p", "/spot", "/swap", "/wallet", "/dashboard", "/profile", "/shop", "/create-offer", "/my-offers"].includes(location);

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