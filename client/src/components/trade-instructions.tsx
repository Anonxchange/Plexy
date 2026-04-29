import { Info } from "lucide-react";

interface TradeInstructionsProps {
  isUserBuyer: boolean;
  counterpartyUsername?: string;
  trade: {
    crypto_amount: number;
    crypto_symbol: string;
    fiat_amount: number;
    fiat_currency: string;
    payment_method: string;
    offer_terms?: string;
  };
}

export function TradeInstructions({ isUserBuyer, counterpartyUsername, trade }: TradeInstructionsProps) {
  return (
    <>
      {!isUserBuyer ? (
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-4 rounded-lg shadow-sm">
          <div className="font-semibold mb-3 text-sm sm:text-base">
            {counterpartyUsername} is selling you <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span>
          </div>
          <ol className="space-y-2 text-xs sm:text-sm">
            <li>1. You must pay <span className="font-bold">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span> via {trade.payment_method}</li>
            <li>2. They will share their bank details below</li>
            <li>3. When you have sent the money, please mark the trade as "paid"</li>
            <li>4. (It really helps if you upload a screenshot or PDF as a receipt of payment too)</li>
            <li>5. Then wait for {counterpartyUsername} to confirm they have received payment</li>
            <li>6. When they do, they will release your {trade.crypto_symbol} and the trade will be complete</li>
          </ol>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 p-4 rounded-lg shadow-sm">
          <div className="font-semibold mb-3 text-sm sm:text-base">
            You are selling <span className="font-bold">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span> to {counterpartyUsername}
          </div>
          <ol className="space-y-2 text-xs sm:text-sm">
            <li>1. Share your payment details in the chat below for {trade.payment_method}</li>
            <li>2. Wait for {counterpartyUsername} to send you <span className="font-bold">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span></li>
            <li>3. They will mark the trade as "paid" once they have sent the money</li>
            <li>4. Verify that you have received the payment in your account</li>
            <li>5. Once confirmed, click "Release Crypto" to complete the trade</li>
            <li>6. The {trade.crypto_symbol} will then be transferred to {counterpartyUsername}'s wallet</li>
          </ol>
        </div>
      )}

      {trade.offer_terms && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 rounded-lg shadow-sm">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div className="font-semibold text-sm sm:text-base">Follow these instructions from your trade partner:</div>
          </div>
          <div className="text-xs sm:text-sm space-y-2 whitespace-pre-wrap">
            {trade.offer_terms}
          </div>
        </div>
      )}
    </>
  );
}
