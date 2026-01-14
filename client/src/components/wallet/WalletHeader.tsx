import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletData } from "@/hooks/use-wallet-data";
import { Eye, EyeOff, Smartphone, RefreshCw, Send, ArrowDownToLine, Landmark, Zap } from "lucide-react";
import { useState } from "react";

interface WalletHeaderProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onTopup: () => void;
}

export function WalletHeader({ onSend, onReceive, onSwap, onTopup }: WalletHeaderProps) {
  const { data: wallet } = useWalletData();
  const [showBalance, setShowBalance] = useState(true);
  const preferredCurrency = localStorage.getItem(`pexly_currency_${wallet?.userId || ""}`) || "USD";
  
  return (
    <div className="bg-[#EBF7F2]/40 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">Wallet balance</span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-foreground transition-colors"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            
            <div className="space-y-1">
              <div className="text-4xl font-bold tracking-tight">
                {showBalance ? `0 ${preferredCurrency}` : "****"}
              </div>
              <div className="text-sm text-muted-foreground">
                There are no assets in your account <button onClick={onReceive} className="text-primary font-medium hover:underline">Deposit</button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-background rounded-lg border p-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-2rem)] sm:max-w-none whitespace-nowrap">
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 flex-shrink-0" onClick={onTopup}>
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">Mobile top-up</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 flex-shrink-0" onClick={onSwap}>
                <RefreshCw className="h-4 w-4" />
                <span className="text-xs">Swap</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 flex-shrink-0" onClick={onSend}>
                <Send className="h-4 w-4" />
                <span className="text-xs">Send</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-primary flex-shrink-0" onClick={onReceive}>
                <ArrowDownToLine className="h-4 w-4" />
                <span className="text-xs">Deposit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
