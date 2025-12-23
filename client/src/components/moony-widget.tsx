import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMoonPay } from '@/hooks/use-moonpay';
import { AlertCircle, Loader2 } from 'lucide-react';

interface MoonPayWidgetProps {
  amount?: number;
  currency?: string;
  email?: string;
  walletAddress?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const MoonPayWidget: React.FC<MoonPayWidgetProps> = ({
  amount,
  currency = 'usd',
  email,
  walletAddress,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openMoonPay } = useMoonPay();

  const handleOpenMoonPay = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await openMoonPay({
        baseCurrencyCode: currency.toLowerCase(),
        baseCurrencyAmount: amount,
        defaultCurrencyCode: 'usdt',
        email,
        walletAddress,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open MoonPay';
      setError(errorMessage);
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Payment Provider</p>
          <p className="text-base font-semibold text-foreground">MoonPay</p>
        </div>

        {amount && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Amount</p>
            <p className="text-base font-semibold text-foreground">
              {amount.toLocaleString()} {currency.toUpperCase()}
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-white/50 p-3 rounded border border-border">
          <p className="font-medium mb-2">Payment Methods Accepted:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Credit Card (Visa, Mastercard)</li>
            <li>Debit Card</li>
            <li>Bank Transfer (in select regions)</li>
            <li>Apple Pay</li>
            <li>Google Pay</li>
          </ul>
        </div>
      </div>

      <Button
        onClick={handleOpenMoonPay}
        disabled={isLoading || !amount}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? 'Opening MoonPay...' : 'Continue to MoonPay'}
      </Button>
    </div>
  );
};
