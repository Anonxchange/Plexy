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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button className="gap-2" onClick={onSend}>
        <Send className="h-4 w-4" /> Send
      </Button>
      <Button variant="outline" className="gap-2" onClick={onReceive}>
        <Download className="h-4 w-4" /> Receive
      </Button>
      <Button variant="outline" className="gap-2" onClick={onSwap}>
        <RefreshCw className="h-4 w-4" /> Swap
      </Button>
      <Button variant="outline" className="gap-2" onClick={onTopup}>
        <Smartphone className="h-4 w-4" /> Topup
      </Button>
    </div>
  );
}
