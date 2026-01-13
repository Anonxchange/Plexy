import { Button } from "@/components/ui/button";
import { Send, Download, RefreshCw } from "lucide-react";

export function WalletActions() {
  return (
    <div className="flex gap-4">
      <Button className="flex-1 gap-2">
        <Send className="h-4 w-4" /> Send
      </Button>
      <Button variant="outline" className="flex-1 gap-2">
        <Download className="h-4 w-4" /> Receive
      </Button>
      <Button variant="outline" className="flex-1 gap-2">
        <RefreshCw className="h-4 w-4" /> Swap
      </Button>
    </div>
  );
}
