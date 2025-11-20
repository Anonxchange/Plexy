import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { monitorDeposits, monitorWithdrawals } from '@/lib/wallet-api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useDepositMonitoring(cryptoSymbol: string, enabled: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !enabled) return;

    const checkDeposits = async () => {
      try {
        const result = await monitorDeposits(user.id, cryptoSymbol);
        if (result.detected && result.transactions && result.transactions.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });

          toast({
            title: "Deposit Detected!",
            description: `${result.transactions.length} new deposit${result.transactions.length > 1 ? 's' : ''} detected for ${cryptoSymbol}`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Deposit monitoring error:', error);
      }
    };

    const intervalId = setInterval(checkDeposits, 30000);
    checkDeposits();

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cryptoSymbol, enabled]);
}

export function useWithdrawalMonitoring(enabled: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !enabled) return;

    const checkWithdrawals = async () => {
      try {
        const result = await monitorWithdrawals(user.id);
        if (result.updated && result.updated.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });

          result.updated.forEach((tx: any) => {
            if (tx.status === 'completed') {
              toast({
                title: "Withdrawal Completed",
                description: `Your ${tx.crypto_symbol} withdrawal has been confirmed on the blockchain`,
                variant: "default",
              });
            }
          });
        }
      } catch (error) {
        console.error('Withdrawal monitoring error:', error);
      }
    };

    const intervalId = setInterval(checkWithdrawals, 30000);
    checkWithdrawals();

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, enabled]);
}

export function useWalletMonitoring(cryptoSymbols: string[], enabled: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const symbolsKey = cryptoSymbols.join(',');

  useEffect(() => {
    if (!user?.id || !enabled) return;

    const symbols = symbolsKey.split(',').filter(Boolean);
    const stopFunctions: Array<() => void> = [];

    const checkDeposits = async (cryptoSymbol: string) => {
      try {
        const result = await monitorDeposits(user.id, cryptoSymbol);
        if (result.detected && result.transactions && result.transactions.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });

          toast({
            title: "Deposit Detected!",
            description: `${result.transactions.length} new deposit${result.transactions.length > 1 ? 's' : ''} detected for ${cryptoSymbol}`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error(`Deposit monitoring error for ${cryptoSymbol}:`, error);
      }
    };

    const checkWithdrawals = async () => {
      try {
        const result = await monitorWithdrawals(user.id);
        if (result.updated && result.updated.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['wallets'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });

          result.updated.forEach((tx: any) => {
            if (tx.status === 'completed') {
              toast({
                title: "Withdrawal Completed",
                description: `Your ${tx.crypto_symbol} withdrawal has been confirmed on the blockchain`,
                variant: "default",
              });
            }
          });
        }
      } catch (error) {
        console.error('Withdrawal monitoring error:', error);
      }
    };

    symbols.forEach((symbol) => {
      const intervalId = setInterval(() => checkDeposits(symbol), 30000);
      checkDeposits(symbol);
      stopFunctions.push(() => clearInterval(intervalId));
    });

    const withdrawalIntervalId = setInterval(checkWithdrawals, 30000);
    checkWithdrawals();
    stopFunctions.push(() => clearInterval(withdrawalIntervalId));

    return () => {
      stopFunctions.forEach((stop) => stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, symbolsKey, enabled]);
}
