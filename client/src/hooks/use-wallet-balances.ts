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
      let balances: WalletBalance[] = [];
      try {
        const response = await supabase.functions.invoke<BalanceResponse>(
          'monitor-deposits',
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          }
        );

        // Check for Supabase invoke errors
        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch balances');
        }

        const data = response.data;

        // If success and balances are an array, use it
        if (data?.success && Array.isArray(data.balances)) {
          balances = data.balances;
          localStorage.setItem(`pexly_balances_${user.id}`, JSON.stringify(balances));
        } else if (data?.error) {
          throw new Error(data.error);
        } else {
          // fallback to cached snapshot if available
          const snapshot = localStorage.getItem(`pexly_balances_${user.id}`);
          if (snapshot) {
            balances = JSON.parse(snapshot);
          } else {
            throw new Error('No balances available');
          }
        }
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        // fallback to cached snapshot if available
        const snapshot = localStorage.getItem(`pexly_balances_${user.id}`);
        if (snapshot) {
          balances = JSON.parse(snapshot);
        }
      }

      return balances;
    },

    staleTime: 30_000,           // 30s cache
    refetchInterval: 60_000,     // refresh every 60s
    refetchOnWindowFocus: true,  // refetch on focus
    retry: 1,                     // retry once on failure
    keepPreviousData: true,      // avoid UI flicker
  });

  return {
    balances: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}