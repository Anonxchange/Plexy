import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface WalletBalance {
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
  const query = useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      
      if (!user) return [];

      const accessToken = sessionData?.session?.access_token;

      const response = await supabase.functions.invoke<BalanceResponse>('monitor-deposits', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch balances');
      }

      if (response.data?.success) {
        // Cache the successful response for offline/fallback use
        localStorage.setItem(`pexly_balances_${user.id}`, JSON.stringify(response.data.balances));
        return response.data.balances;
      } else {
        throw new Error(response.data?.error || 'Unknown error');
      }
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute automatically
    retry: 1,
  });

  return {
    balances: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    fetchBalances: query.refetch,
    refetch: query.refetch,
  };
}
