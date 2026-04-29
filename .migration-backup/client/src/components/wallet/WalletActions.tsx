import { Button } from "@/components/ui/button";
import { Send, Download, RefreshCw, Smartphone } from "lucide-react";

interface WalletActionsProps {
  onSend?: () => void;
  onReceive?: () => void;
  onSwap?: () => void;
  onTopup?: () => void;
}

export function WalletActions({ onSend, onReceive, onSwap, onTopup }: WalletActionsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <Button className="gap-2 h-11 sm:h-10 text-sm sm:text-base font-semibold" onClick={onSend}>
        <Send className="h-4 w-4" /> Send
      </Button>
      <Button variant="outline" className="gap-2 h-11 sm:h-10 text-sm sm:text-base font-semibold" onClick={onReceive}>
        <Download className="h-4 w-4" /> Receive
      </Button>
      <Button variant="outline" className="gap-2 h-11 sm:h-10 text-sm sm:text-base font-semibold" onClick={onSwap}>
        <RefreshCw className="h-4 w-4" /> Swap
      </Button>
      <Button variant="outline" className="gap-2 h-11 sm:h-10 text-sm sm:text-base font-semibold" onClick={onTopup}>
        <Smartphone className="h-4 w-4" /> Top-up
      </Button>
    </div>
  );
}
