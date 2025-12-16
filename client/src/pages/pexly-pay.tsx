import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  ArrowLeftRight,
  Send,
  Download,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  Settings,
  History,
  Smartphone,
  Globe,
  Gift,
  MoreHorizontal,
  CreditCard,
  Copy,
  Clock,
  Shield,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PexlyFooter } from "@/components/pexly-footer";
import { SendPexlyDialog } from "@/components/send-pexly-dialog";
import { ReceivePexlyDialog } from "@/components/receive-pexly-dialog";
import { ReferralDialog } from "@/components/referral-dialog";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";
import { createClient } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useWallets } from "@/hooks/use-wallets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getCryptoPrices } from "@/lib/crypto-prices";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useVerificationGuard } from "@/hooks/use-verification-guard";
import { getVerificationLevel } from "@shared/verification-levels";

export default function PexlyPay() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<string>("USD");
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, any>>({});

  const { toast } = useToast();
  const supabase = createClient();
  const { data: wallets, isLoading: walletsLoading } = useWallets();
  
  // Verification level guard for Pexly Pay restrictions
  const { 
    verificationLevel, 
    levelConfig, 
    isLevel0, 
    isLevel1,
    lifetimeSendVolume,
    isLoading: verificationLoading 
  } = useVerificationGuard();
  
  // Check if user can use Pexly Pay features (Level 1+ required)
  const canUsePexlyPay = verificationLevel >= 1;
  
  // Get daily and lifetime send limits based on level
  const dailyLimit = levelConfig?.dailyLimit || 0;
  const lifetimeSendLimit = levelConfig?.lifetimeSendLimit || 0;
  const remainingSendLimit = lifetimeSendLimit ? Math.max(0, lifetimeSendLimit - lifetimeSendVolume) : null;
  
  // Handler for restricted actions (shows upgrade prompt for Level 0)
  const handleRestrictedAction = (action: () => void, actionName: string) => {
    if (isLevel0) {
      toast({
        title: "Verification Required",
        description: `Complete Level 1 verification to ${actionName}. Tap to upgrade.`,
        variant: "destructive",
      });
      return;
    }
    action();
  };

  // Calculate total balance across all wallets in USD
  const calculateTotalBalance = () => {
    if (!wallets || wallets.length === 0) return 0;
    
    let total = 0;
    wallets.forEach(wallet => {
      const balance = parseFloat(wallet.balance?.toString() || '0');
      const lockedBalance = parseFloat(wallet.locked_balance?.toString() || '0');
      const totalWalletBalance = balance + lockedBalance;
      const priceData = cryptoPrices[wallet.crypto_symbol];
      const currentPrice = priceData?.current_price || 0;
      total += totalWalletBalance * currentPrice;
    });
    return total;
  };

  const totalBalance = calculateTotalBalance();
  
  // Fetch user's Pexly Pay metadata (cashback, auto-earn)
  const [pexlyMetadata, setPexlyMetadata] = useState<any>(null);

  // Load crypto prices
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const symbols = ['BTC', 'ETH', 'BNB', 'TRX', 'SOL', 'LTC', 'USDT', 'USDC', 'TON', 'XMR'];
        const prices = await getCryptoPrices(symbols);
        setCryptoPrices(prices);
      } catch (error) {
        console.error('Error loading crypto prices:', error);
      }
    };
    loadPrices();
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load user's preferred currency
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferred_currency')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.preferred_currency) {
          setPreferredCurrency(data.preferred_currency.toUpperCase());
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };
    loadUserPreferences();
  }, [user?.id]);

  useEffect(() => {
    const fetchPexlyMetadata = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('pexly_balances')
          .select('cashback_earned, auto_earn_balance')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // Create metadata if doesn't exist
          const { data: newMetadata, error: insertError } = await supabase
            .from('pexly_balances')
            .insert({
              user_id: user.id,
              balance: 0,
              locked_balance: 0,
              total_received: 0,
              total_sent: 0,
              cashback_earned: 0,
              auto_earn_balance: 0,
            })
            .select('cashback_earned, auto_earn_balance')
            .single();

          if (!insertError && newMetadata) {
            setPexlyMetadata(newMetadata);
          }
        } else if (!error && data) {
          setPexlyMetadata(data);
        }
      } catch (error) {
        console.error('Error fetching Pexly metadata:', error);
      }
    };

    fetchPexlyMetadata();
  }, [user?.id]);

  const cashback = pexlyMetadata ? parseFloat(pexlyMetadata.cashback_earned || 0) : 0;
  const autoEarnBalance = pexlyMetadata ? parseFloat(pexlyMetadata.auto_earn_balance || 0) : 0;
  const cashbackRate = 2;

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/signin");
    } else if (user?.id) {
      fetchProfileData();
    }
  }, [user, loading, setLocation]);

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data for user:', user?.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('pexly_pay_id')
        .eq('id', user?.id)
        .single();

      if (!error && data) {
        console.log('Profile data fetched:', data);
        setProfileData(data);
      } else if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new one');
        // Profile doesn't exist yet, generate pexly_pay_id
        const pexlyPayId = `PX${user?.id?.substring(0, 8).toUpperCase()}`;
        const { data: newProfile, error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user?.id,
            pexly_pay_id: pexlyPayId,
            username: `user_${user?.id?.substring(0, 8)}`,
            country: 'Global',
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error creating profile:', upsertError);
        } else if (newProfile) {
          console.log('New profile created:', newProfile);
          setProfileData(newProfile);
        }
      } else {
        console.error('Error fetching profile:', error);
      }
    } catch (error) {
      console.error('Error in fetchProfileData:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const copyPexlyPayId = () => {
    if (profileData?.pexly_pay_id) {
      navigator.clipboard.writeText(profileData.pexly_pay_id);
      toast({
        title: "Copied!",
        description: "UIID copied to clipboard"
      });
    }
  };

  const quickActions = [
    { 
      icon: QrCode, 
      label: "QR Pay", 
      onClick: () => handleRestrictedAction(() => setScannerDialogOpen(true), "scan QR codes"),
      restricted: isLevel0 
    },
    { 
      icon: ArrowLeftRight, 
      label: "Transfer", 
      onClick: () => handleRestrictedAction(() => setSendDialogOpen(true), "transfer funds"),
      restricted: isLevel0 
    },
    { 
      icon: Send, 
      label: "Send", 
      onClick: () => handleRestrictedAction(() => setSendDialogOpen(true), "send payments"),
      restricted: isLevel0 
    },
    { 
      icon: Download, 
      label: "Receive", 
      onClick: () => handleRestrictedAction(() => setReceiveDialogOpen(true), "receive payments"),
      restricted: isLevel0 
    },
    { icon: Users, label: "Referral", onClick: () => setReferralDialogOpen(true), restricted: false },
  ];

  const paymentApps = [
    {
      icon: CreditCard,
      label: "Bank Transfer",
      description: "Send to bank accounts",
      href: "/wallet/crypto-to-bank"
    },
    {
      icon: Smartphone,
      label: "Mobile Money",
      description: "M-Pesa, MTN, Airtel",
      href: "/wallet/mobile-topup"
    },
    {
      icon: Globe,
      label: "International",
      description: "Global transfers",
      href: "/wallet"
    },
    {
      icon: Gift,
      label: "Giveaway",
      description: "Rewards & gifts",
      href: "/wallet"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/wallet">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Pexly Pay</h1>
          <div className="flex gap-2">
            <Link href="/wallet/pexly-pay/history">
              <Button variant="ghost" size="icon">
                <History className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/wallet/pexly-pay/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {profileData?.pexly_pay_id && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Your UIID</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-3 py-1.5 rounded font-mono text-sm font-bold">
                      {profileData.pexly_pay_id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={copyPexlyPayId}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this ID to receive instant payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Available Balance</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                  >
                    {balanceVisible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {balanceVisible ? totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••"}
                  </span>
                  <span className="text-lg text-muted-foreground">{preferredCurrency}</span>
                </div>
              </div>
              <Link href="/wallet">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
              </Link>
            </div>

            <Link href="/wallet/pexly-pay/payment-settings">
              <div className="flex items-center justify-between pt-4 border-t cursor-pointer hover:bg-accent/50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                <span className="text-sm text-muted-foreground">Payment Settings</span>
                <div className="flex gap-1 items-center">
                  {wallets?.slice(0, 3).map((wallet, idx) => (
                    <div key={idx} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={cryptoIconUrls[wallet.crypto_symbol] || `https://ui-avatars.com/api/?name=${wallet.crypto_symbol}&background=random`}
                        alt={wallet.crypto_symbol}
                        className="h-5 w-5"
                      />
                    </div>
                  ))}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Verification Level Banner */}
        {isLevel0 && (
          <Card className="border-orange-500/50 bg-orange-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Verification Required
                  </h3>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                    Complete Level 1 verification to send, receive, and transfer funds through Pexly Pay.
                  </p>
                  <Link href="/verification">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Now
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Level 1 Limits Info */}
        {isLevel1 && (
          <Card className="border-blue-500/50 bg-blue-500/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    Level 1
                  </Badge>
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    Daily: ${dailyLimit?.toLocaleString()} | Remaining Send: ${remainingSendLimit !== null ? remainingSendLimit.toLocaleString() : 'Unlimited'}
                  </span>
                </div>
                <Link href="/verification">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs h-7">
                    Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-2 group ${action.restricted ? 'opacity-60' : ''}`}
            >
              <div className={`h-14 w-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors relative ${action.restricted ? 'bg-muted/50' : ''}`}>
                <action.icon className="h-6 w-6" />
                {action.restricted && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs text-center">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payment Applications</h2>
          <div className="grid grid-cols-2 gap-3">
            {paymentApps.map((app, index) => (
              <Link key={index} href={app.href}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <app.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{app.label}</p>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <MoreHorizontal className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-sm">More</p>
                  <p className="text-xs text-muted-foreground">View all</p>
                </div>
              </CardContent>
            </Card>
            <Link href="/wallet/pexly-pay/history">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">History</p>
                    <p className="text-xs text-muted-foreground">View transfers</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary/20 to-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">
                Partner with Pexly Pay: Connecting
              </p>
              <p className="text-xs text-muted-foreground">
                Your Business to a Borderless Future
              </p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Cashback</p>
              <p className="text-2xl font-bold text-green-600">
                +{cashback.toFixed(2)} {preferredCurrency}
              </p>
              <Badge variant="secondary" className="mt-2 bg-pink-100 text-pink-700 border-0">
                Base: {cashbackRate}%
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Auto-Earn</p>
              <p className="text-2xl font-bold text-orange-600">
                {autoEarnBalance.toFixed(2)} {preferredCurrency}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 text-xs">
                  ON
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <QRScannerDialog
        open={scannerDialogOpen}
        onOpenChange={setScannerDialogOpen}
        onScan={(data) => {
          console.log('QR Code scanned:', data);
          setScannerDialogOpen(false);
          setSendDialogOpen(true);
        }}
      />
      <SendPexlyDialog 
        open={sendDialogOpen} 
        onOpenChange={setSendDialogOpen} 
        availableWallets={wallets || []}
      />
      <ReceivePexlyDialog 
        open={receiveDialogOpen} 
        onOpenChange={setReceiveDialogOpen} 
        pexlyPayId={profileData?.pexly_pay_id}
      />
      <ReferralDialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen} />

      <PexlyFooter />
    </div>
  );
}