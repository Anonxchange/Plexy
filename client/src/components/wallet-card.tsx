import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from "lucide-react";

export interface WalletCardProps {
  crypto: string;
  fullName: string;
  balance: number;
  usdValue: number;
  change24h: number;
  icon?: React.ReactNode;
}

export function WalletCard({ crypto, fullName, balance, usdValue, change24h }: WalletCardProps) {
  const isPositive = change24h >= 0;

  const handleSend = () => {
    console.log(`Send ${crypto} clicked`);
  };

  const handleReceive = () => {
    console.log(`Receive ${crypto} clicked`);
  };

  return (
    <Card className="hover-elevate" data-testid={`card-wallet-${crypto.toLowerCase()}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{crypto}</div>
            <div className="text-sm text-muted-foreground">{fullName}</div>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(change24h)}%
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold tabular-nums text-foreground">
            {balance.toFixed(8)}
          </div>
          <div className="text-muted-foreground">
            ≈ ${usdValue.toLocaleString()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleSend}
            data-testid={`button-send-${crypto.toLowerCase()}`}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Send
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleReceive}
            data-testid={`button-receive-${crypto.toLowerCase()}`}
          >
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Receive
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
