import { useState } from "react";
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
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { PexlyFooter } from "@/components/pexly-footer";
import { SendPexlyDialog } from "@/components/send-pexly-dialog";
import { ReceivePexlyDialog } from "@/components/receive-pexly-dialog";
import { ReferralDialog } from "@/components/referral-dialog";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";

export default function PexlyPay() {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false);

  const balance = 0.00;
  const cashback = 1.23;
  const cashbackRate = 2;

  const quickActions = [
    { icon: QrCode, label: "QR Pay", onClick: () => setScannerDialogOpen(true) },
    { icon: ArrowLeftRight, label: "Transfer", onClick: () => setSendDialogOpen(true) },
    { icon: Send, label: "Send", onClick: () => setSendDialogOpen(true) },
    { icon: Download, label: "Receive", onClick: () => setReceiveDialogOpen(true) },
    { icon: Users, label: "Referral", onClick: () => setReferralDialogOpen(true) },
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
                    {balanceVisible ? balance.toFixed(2) : "••••"}
                  </span>
                  <span className="text-lg text-muted-foreground">USD</span>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="h-4 w-4 mr-2" />
                Top Up
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">Payment Settings</span>
              <div className="flex gap-1">
                <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <action.icon className="h-6 w-6" />
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
                +{cashback.toFixed(2)} USD
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
                0.02 USD
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
      <SendPexlyDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} />
      <ReceivePexlyDialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen} />
      <ReferralDialog open={referralDialogOpen} onOpenChange={setReferralDialogOpen} />

      <PexlyFooter />
    </div>
  );
}