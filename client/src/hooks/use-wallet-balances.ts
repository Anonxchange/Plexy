import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface WalletBalance {
  wallet_id: string;
  user_id: string;
  address: string;
  chain_id: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  timestamp: string;
}

interface BalanceResponse {
  success: boolean;
  message?: string;
  balances: WalletBalance[];
  error?: string;
  timestamp: string;
}

export function useWalletBalances() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke<BalanceResponse>('monitor-deposits', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch balances');
      }

      if (response.data?.success) {
        setBalances(response.data.balances);
        return response.data.balances;
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balances';
      setError(message);
      console.error('Balance fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balances,
    loading,
    error,
    fetchBalances,
    refetch: fetchBalances,
  };
}
