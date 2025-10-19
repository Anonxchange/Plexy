
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { PaymentLimits } from "@/components/payment-limits";

export default function PexlyPayPaymentLimits() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/wallet/pexly-pay/settings">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Payment Limits</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6">
        <PaymentLimits />
      </div>

      <PexlyFooter />
    </div>
  );
}
