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
  const query = useQuery<WalletBalance[]>({
    queryKey: ['wallet-balances'],
    queryFn: async () => {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return [];

      const accessToken = sessionData?.session?.access_token;

      // Call monitor-deposits edge function
      const response = await supabase.functions.invoke<BalanceResponse>('monitor-deposits', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch balances');
      }

      if (response.data?.success && Array.isArray(response.data.balances)) {
        // Save a snapshot locally for fallback
        localStorage.setItem(`pexly_balances_${user.id}`, JSON.stringify(response.data.balances));
        return response.data.balances;
      }

      throw new Error(response.data?.error || 'Unknown error fetching balances');
    },

    staleTime: 30_000,            // 30s cache
    refetchInterval: 60_000,      // refresh every 60s
    refetchOnWindowFocus: true,   // refetch on focus
    retry: 1,                      // retry once on failure
    keepPreviousData: true,       // avoid UI flicker
  });

  return {
    balances: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}