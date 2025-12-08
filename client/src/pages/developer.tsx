
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Code,
  Copy,
  Eye,
  EyeOff,
  Key,
  Package,
  History,
  Users,
  Star,
  ThumbsUp,
  Lock,
  BarChart3,
  Award,
  QrCode,
  Medal,
  Settings,
  MoreVertical,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function Developer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("pk_live_1234567890abcdefghijklmnopqrstuvwxyz");
  const [showApiKey, setShowApiKey] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const generateNewKey = () => {
    const newKey = "pk_live_" + Math.random().toString(36).substring(2, 40);
    setApiKey(newKey);
    toast({
      title: "New API Key Generated",
      description: "Your old API key has been revoked",
    });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Developer</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/trade-history')}>
                    <History className="h-4 w-4 mr-2" />
                    Trade History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/p2p')}>
                    <Users className="h-4 w-4 mr-2" />
                    Recent Trade Partners
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-offers')}>
                    <Package className="h-4 w-4 mr-2" />
                    My Offers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorite-offers')}>
                    <Star className="h-4 w-4 mr-2" />
                    Favorite Offers
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/trusted-users')}>
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Trusted Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/blocked-users')}>
                    <Lock className="h-4 w-4 mr-2" />
                    Blocked Users
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/trade-statistics')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Trade Statistics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/merchant-application')}>
                    <Award className="h-4 w-4 mr-2" />
                    Become a Merchant
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Share Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/medals')}>
                    <Medal className="h-4 w-4 mr-2" />
                    Medals
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/developer')} className="bg-primary/10">
                    <Code className="h-4 w-4 mr-2" />
                    Developer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <p className="text-muted-foreground mb-8">
              Manage your API keys and access developer resources
            </p>
          </div>

          {/* Desktop 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            {/* Left Sidebar - Navigation Menu */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border sticky top-6">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold mb-4">Menu</h2>
                  <nav className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      My Offers
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-history')}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Trade History
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/p2p')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Recent Trade Partners
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/favorite-offers')}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Favorite Offers
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trusted-users')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Trusted Users
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/blocked-users')}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Blocked Users
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/trade-statistics')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Trade Statistics
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/merchant-application')}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Become a Merchant
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/profile')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/medals')}
                    >
                      <Medal className="h-4 w-4 mr-2" />
                      Medals
                    </Button>
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate('/account-settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start bg-primary/10"
                      onClick={() => navigate('/developer')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Developer
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-9">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Developer</h1>
              </div>

              <p className="text-muted-foreground mb-8">
                Manage your API keys and access developer resources
              </p>

              {/* Content Cards */}
              <div className="space-y-6">
                {/* API Key Card */}
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Key className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">API Key</h2>
                    </div>

                    {!twoFactorEnabled ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          To generate an API key, you must first set up two-factor authentication
                          for logging into your account. You can use email or Google Authenticator
                          for authenticating your account.
                        </p>
                        <Button
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => navigate('/account-settings')}
                        >
                          Enable 2FA login
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-sm">
                            {showApiKey ? apiKey : "••••••••••••••••••••••••••••••••••••••"}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="icon" onClick={copyApiKey}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" onClick={generateNewKey}>
                          Generate New Key
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* OAuth 2.0 Support Card */}
                <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">OAuth 2.0 Support</h2>
                        <Badge variant="secondary" className="mt-1">NEW</Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Managing your API just got more flexible with our newly added OAuth 2.0
                      support. Check it out for yourself in the developer's portal
                    </p>

                    <Button
                      className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                      onClick={() => window.open('https://docs.replit.com', '_blank')}
                    >
                      View more
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Documentation Links */}
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Resources</h2>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('https://docs.replit.com', '_blank')}
                      >
                        <span>Developer Introduction</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('https://docs.replit.com', '_blank')}
                      >
                        <span>API Documentation</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('https://docs.replit.com', '_blank')}
                      >
                        <span>OAuth 2.0 Guide</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => window.open('https://docs.replit.com', '_blank')}
                      >
                        <span>Code Examples</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile Content - Only show on mobile */}
          <div className="lg:hidden space-y-6">
            {/* API Key Card */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">API Key</h2>
                </div>

                {!twoFactorEnabled ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To generate an API key, you must first set up two-factor authentication for
                      logging into your account. You can use email or Google Authenticator for
                      authenticating your account.
                    </p>
                    <Button
                      className="bg-primary hover:bg-primary/90 w-full"
                      onClick={() => navigate('/account-settings')}
                    >
                      Enable 2FA login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted p-3 rounded-lg font-mono text-sm break-all">
                        {showApiKey ? apiKey : "••••••••••••••••••••••••••••••••••••••"}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={copyApiKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full" onClick={generateNewKey}>
                      Generate New Key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OAuth 2.0 Support Card */}
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">OAuth 2.0 Support</h2>
                    <Badge variant="secondary" className="mt-1">NEW</Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Managing your API just got more flexible with our newly added OAuth 2.0 support.
                  Check it out for yourself in the developer's portal
                </p>

                <Button
                  className="bg-primary hover:bg-primary/90 w-full"
                  onClick={() => window.open('https://docs.replit.com', '_blank')}
                >
                  View more
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Documentation Links */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Resources</h2>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://docs.replit.com', '_blank')}
                  >
                    <span>Developer Introduction</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://docs.replit.com', '_blank')}
                  >
                    <span>API Documentation</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://docs.replit.com', '_blank')}
                  >
                    <span>OAuth 2.0 Guide</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open('https://docs.replit.com', '_blank')}
                  >
                    <span>Code Examples</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <PexlyFooter />
      </div>
    </>
  );
}
