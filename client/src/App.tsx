import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import Home from "@/pages/home";
import Buy from "@/pages/buy";
import Wallet from "@/pages/wallet";
import { SignUp } from "@/pages/signup";
import { SignIn } from "@/pages/signin";
import { Dashboard } from "@/pages/dashboard";
import { P2P } from "@/pages/p2p";
import { Profile } from "@/pages/profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/buy" component={Buy} />
      <Route path="/p2p" component={P2P} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen w-full flex-col">
              <AppHeader />
              <main className="flex-1">
                <Router />
              </main>
              <AppFooter />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;