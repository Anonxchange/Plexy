interface TradeTimerProps {
  isUserBuyer: boolean;
  trade: {
    crypto_amount: number;
    crypto_symbol: string;
    fiat_amount: number;
    fiat_currency: string;
    payment_method: string;
  };
}

export function TradeTimer({ isUserBuyer, trade }: TradeTimerProps) {
  return (
    <div className="bg-primary/20 border-b p-2 sm:p-3 text-xs sm:text-sm">
      <div className="flex justify-between items-center gap-1 sm:gap-2 flex-wrap">
        <span className="font-semibold">{isUserBuyer ? 'Buying' : 'Selling'}</span>
        <span className="font-bold whitespace-nowrap">{trade.crypto_amount.toFixed(8)} {trade.crypto_symbol}</span>
        <span className="font-semibold hidden xs:inline">FOR</span>
        <span className="font-bold whitespace-nowrap">{trade.fiat_amount.toLocaleString()} {trade.fiat_currency}</span>
        <span className="text-xs truncate">{trade.payment_method}</span>
      </div>
    </div>
  );
}
