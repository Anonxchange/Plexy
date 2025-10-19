
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { useToast } from "@/hooks/use-toast";

export default function PexlyPayPasswordFree() {
  const { toast } = useToast();
  const [passwordFreeEnabled, setPasswordFreeEnabled] = useState(false);
  const [limit, setLimit] = useState("100");

  const handleConfirm = () => {
    toast({
      title: "Settings Updated",
      description: `Password-free payments ${passwordFreeEnabled ? 'enabled' : 'disabled'} with limit of ${limit} USD`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/wallet/pexly-pay/settings">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Password-Free Settings</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Password-free payment toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="password-free" className="text-base font-medium cursor-pointer">
                  Password-free payment
                </Label>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <Switch
                id="password-free"
                checked={passwordFreeEnabled}
                onCheckedChange={setPasswordFreeEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Set limit */}
        <div className="space-y-3">
          <Label htmlFor="limit" className="text-base font-medium">
            Set limit
          </Label>
          <div className="relative">
            <Input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="h-14 pr-16 text-lg bg-muted border-0"
              min="0"
              step="1"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
              USD
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Password-free limit: {limit} USD. Payments within this amount need no password.
          </p>
        </div>
      </div>

      {/* Fixed bottom confirm button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold text-base rounded-full"
        >
          Confirm
        </Button>
      </div>

      <PexlyFooter />
    </div>
  );
}
