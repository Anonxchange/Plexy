
import { Info } from "lucide-react";

interface TradeTermsProps {
  offerTerms?: string;
  counterpartyUsername?: string;
}

export function TradeTerms({ offerTerms, counterpartyUsername }: TradeTermsProps) {
  if (!offerTerms) return null;

  return (
    <div className="mt-4 sm:mt-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Trade Terms</h3>

      <div className="bg-card border p-3 sm:p-4 rounded-lg">
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
          {offerTerms}
        </div>
      </div>
    </div>
  );
}
