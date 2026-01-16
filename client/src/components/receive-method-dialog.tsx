import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ArrowDownToLine, Landmark, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReceiveMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: "crypto" | "fiat" | "p2p") => void;
}

export function ReceiveMethodDialog({ open, onOpenChange, onSelectMethod }: ReceiveMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 bg-background border-none gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold">
            Select a receive method
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground/70">Deposit using crypto</h4>
            <Button
              variant="outline"
              className="w-full h-auto p-4 justify-start gap-4 border-none bg-primary hover:opacity-90 text-black rounded-xl group transition-all"
              onClick={() => onSelectMethod("crypto")}
            >
              <div className="bg-black/10 p-2 rounded-lg group-hover:bg-black/20 transition-colors">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-bold">Deposit crypto</div>
                <div className="text-[11px] font-medium opacity-70">From another crypto wallet</div>
              </div>
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground/70">Deposit crypto using fiat</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start gap-4 border-none bg-muted/30 hover:bg-muted/50 text-foreground rounded-xl group transition-all"
                onClick={() => onSelectMethod("fiat")}
              >
                <div className="bg-background p-2 rounded-lg border border-border/50 group-hover:border-border transition-colors">
                  <Landmark className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Direct buy</div>
                  <div className="text-[11px] text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto p-4 justify-start gap-4 border-none bg-muted/30 hover:bg-muted/50 text-foreground rounded-xl group transition-all"
                onClick={() => onSelectMethod("p2p")}
              >
                <div className="bg-background p-2 rounded-lg border border-border/50 group-hover:border-border transition-colors">
                  <Users className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">P2P Trading</span>
                    <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-none text-[9px] font-bold px-1.5 h-4 uppercase">Low fees</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground">Buy crypto with Bank or Online wallet</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
