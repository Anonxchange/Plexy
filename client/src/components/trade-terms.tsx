
import { Info, CheckCircle } from "lucide-react";

interface TradeTermsProps {
  offerTerms?: string;
  counterpartyUsername?: string;
  counterpartyRequirements?: {
    completedOrders?: number;
    completionRate?: number;
    requireMobile?: boolean;
    requireEmail?: boolean;
    requireVerification?: boolean;
    registeredDays?: number;
  };
}

export function TradeTerms({ offerTerms, counterpartyUsername, counterpartyRequirements }: TradeTermsProps) {
  if (!offerTerms && !counterpartyRequirements) return null;

  return (
    <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
      {/* Requirements for Counterparty */}
      {counterpartyRequirements && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Requirements for Counterparty</h3>
          <div className="bg-card border p-3 sm:p-4 rounded-lg space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {counterpartyUsername} requires the following from traders:
            </p>
            <div className="space-y-2">
              {counterpartyRequirements.completedOrders && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Completed orders in 30 days ≥ {counterpartyRequirements.completedOrders}</span>
                </div>
              )}
              {counterpartyRequirements.completionRate && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">30-day completion rate ≥ {counterpartyRequirements.completionRate}%</span>
                </div>
              )}
              {counterpartyRequirements.requireMobile && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Mobile number linked</span>
                </div>
              )}
              {counterpartyRequirements.requireEmail && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Email linked</span>
                </div>
              )}
              {counterpartyRequirements.requireVerification && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Identity verification required</span>
                </div>
              )}
              {counterpartyRequirements.registeredDays && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">Registered for ≥ {counterpartyRequirements.registeredDays} days</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trade Terms */}
      {offerTerms && (
        <div>
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
      )}
    </div>
  );
}
