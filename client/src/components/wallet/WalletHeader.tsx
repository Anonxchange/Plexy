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

          <div className="w-full">
            {/* Mobile View: 4-column grid as requested */}
            <div className="grid grid-cols-4 bg-background rounded-lg border p-1 w-full md:hidden">
              <Button variant="ghost" size="sm" className="h-9 flex-col gap-0 px-1 hover:bg-muted/50" onClick={onTopup}>
                <Smartphone className="h-4 w-4" />
                <span className="text-[10px] font-semibold leading-tight mt-0.5">Top-up</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 flex-col gap-0 px-1 hover:bg-muted/50" onClick={onSwap}>
                <RefreshCw className="h-4 w-4" />
                <span className="text-[10px] font-semibold leading-tight mt-0.5">Swap</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 flex-col gap-0 px-1 hover:bg-muted/50" onClick={onSend}>
                <Send className="h-4 w-4" />
                <span className="text-[10px] font-semibold leading-tight mt-0.5">Send</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 flex-col gap-0 px-1 text-primary hover:bg-muted/50" onClick={onReceive}>
                <ArrowDownToLine className="h-4 w-4" />
                <span className="text-[10px] font-semibold leading-tight mt-0.5">Deposit</span>
              </Button>
            </div>

            {/* Desktop View: Long white container (same as mobile) containing horizontal actions */}
            <div className="hidden md:flex flex-row items-center gap-2 bg-background rounded-lg border p-1 w-fit">
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-4 font-semibold hover:bg-muted/50" onClick={onTopup}>
                <Smartphone className="h-4 w-4" />
                <span>Mobile top up</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-4 font-semibold hover:bg-muted/50" onClick={onSend}>
                <Send className="h-4 w-4" />
                <span>Send</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-4 font-semibold text-primary hover:bg-muted/50" onClick={onReceive}>
                <ArrowDownToLine className="h-4 w-4" />
                <span>Deposit</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 gap-2 px-4 font-semibold hover:bg-muted/50" onClick={onSwap}>
                <RefreshCw className="h-4 w-4" />
                <span>Swap</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
