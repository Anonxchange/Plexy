import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Zap, Menu, User, UserCircle, BarChart3, Settings, Lightbulb, LogOut, Bell, Wallet, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/lib/auth-context";

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(true)}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-2 py-1" data-testid="link-home-header">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold hidden sm:inline">Pexly</span>
          </Link>
        </div>

        <div className="flex-1 hidden md:block"></div>

        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
          {user ? (
            <>
              <div className="text-center relative hidden sm:block">
                <div className="text-sm font-semibold text-foreground whitespace-nowrap">JohnDoe85</div>
                <div className="text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
                  <span className="whitespace-nowrap">{balanceVisible ? "28,787.79 USD" : "****"}</span>
                  <button 
                    className="inline-flex items-center justify-center h-4 w-4 hover:opacity-70 transition-opacity"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                  >
                    {balanceVisible ? (
                      <Eye className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-semibold">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2">
                    <h3 className="font-semibold mb-2">Notifications</h3>
                    <div className="space-y-2">
                      <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                        <p className="text-sm font-medium">Trade completed</p>
                        <p className="text-xs text-muted-foreground">Your BTC purchase was successful</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                      <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                        <p className="text-sm font-medium">Price alert</p>
                        <p className="text-xs text-muted-foreground">ETH reached your target price</p>
                        <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                      </div>
                      <div className="p-2 hover:bg-muted rounded-md cursor-pointer">
                        <p className="text-sm font-medium">New offer available</p>
                        <p className="text-xs text-muted-foreground">Better rates for USDT trading</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                    data-testid="button-profile"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] p-0">
                <div className="p-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/dashboard')} className="cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Dashboard</div>
                  <div className="text-xs text-muted-foreground">Your main dashboard</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Profile</div>
                  <div className="text-xs text-muted-foreground">Your public profile</div>
                </div>
              </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/trade-statistics")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Trade statistics</span>
                      <span className="text-xs text-muted-foreground">Trade history, partners, statistics</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/account-settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Account settings</span>
                      <span className="text-xs text-muted-foreground">Verification, notifications, security</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/submit-idea")}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Submit an idea</span>
                      <span className="text-xs text-muted-foreground">Improve Pexly with us</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => {
                    await signOut();
                    setLocation("/");
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <div className="p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
                    <Wallet className="h-4 w-4" />
                    <span>Your limits: Level 3</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy/Sell</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Send</span>
                      <span className="font-medium">Unlimited</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <div className="flex items-center gap-1 sm:gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => setLocation("/signin")}
                >
                  Sign In
                </Button>
                <Button 
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => setLocation("/signup")}
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}