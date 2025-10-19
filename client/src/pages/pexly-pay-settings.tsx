import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

export default function PexlyPaySettings() {
  const settingsItems = [
    { label: "Payment Settings", href: "/wallet/pexly-pay/payment-settings" },
    { label: "Payment Limits", href: "/wallet/pexly-pay/payment-limits" },
    { label: "Payment History", href: "/wallet/pexly-pay/history" },
    { label: "Password-Free Settings", href: "/wallet/pexly-pay/password-free" },
    { label: "Help & Support", href: "/wallet/pexly-pay/help" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/wallet/pexly-pay">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Pexly Pay Settings</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between py-4 px-4">
                    <span className="text-base">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}