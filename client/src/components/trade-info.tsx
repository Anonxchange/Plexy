import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TradeInfoProps {
  trade: {
    id: string;
    price: number;
    fiat_currency: string;
    crypto_symbol: string;
    created_at: string;
    offer_terms?: string;
  };
  counterpartyUsername?: string;
}

export function TradeInfo({ trade, counterpartyUsername }: TradeInfoProps) {
  return (
    <div className="mt-4 sm:mt-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Trade Information</h3>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">RATE</div>
          <div className="text-xs sm:text-sm font-medium break-all">
            {trade.price.toLocaleString()} {trade.fiat_currency}/{trade.crypto_symbol}
          </div>
        </div>
        <div>
          <div className="text-xs sm:text-sm text-muted-foreground mb-1 flex items-center gap-1">
            TRADE ID <Info className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="text-xs sm:text-sm flex items-center gap-2">
            <span className="truncate">{trade.id.substring(0, 11)}</span>
            <button className="text-muted-foreground hover:text-foreground flex-shrink-0">📋</button>
          </div>
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm text-muted-foreground mb-1">STARTED</div>
        <div className="text-xs sm:text-sm font-medium">{new Date(trade.created_at).toLocaleString()}</div>
      </div>

      <Button variant="outline" className="w-full mb-2 sm:mb-3 text-xs sm:text-sm h-9 sm:h-10">
        View Offer
      </Button>

      <Button variant="outline" className="w-full mb-3 sm:mb-4 flex items-center justify-center gap-2 text-xs sm:text-sm h-9 sm:h-10 border shadow-xs hover-elevate active-elevate-2 transition-all">
        <Info className="w-4 h-4 sm:w-5 sm:h-5" />
        Tutor
      </Button>

      {trade.offer_terms && (
        <div className="mt-4 bg-card border p-3 sm:p-4 rounded-lg">
          <div className="text-center text-muted-foreground text-base sm:text-lg mb-2">
            Please follow {counterpartyUsername}'s terms
          </div>
          <div className="flex items-center gap-2 text-primary mb-3 text-xs sm:text-sm">
            <span>Translate into</span>
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">receipt required</span>
            <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">photo id required</span>
            <span className="bg-secondary px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">no third parties</span>
          </div>
          <div className="bg-card border p-3 sm:p-4 rounded-lg text-xs sm:text-sm whitespace-pre-wrap">
            {trade.offer_terms}
          </div>
        </div>
      )}
    </div>
  );
}
