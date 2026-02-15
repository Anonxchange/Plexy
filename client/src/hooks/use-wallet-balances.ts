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
        // Fetch specific chain for each wallet
        const { data: wallets } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.id);

        if (wallets && wallets.length > 0) {
          const balancePromises = wallets.map(async (wallet) => {
            const response = await supabase.functions.invoke<any>(
              'monitor-deposits',
              {
                body: { address: wallet.address, chain: wallet.chain_id },
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
              }
            );

            if (!response.error && response.data?.success) {
              return {
                wallet_id: wallet.id,
                user_id: user.id,
                address: wallet.address,
                chain_id: wallet.chain_id,
                symbol: wallet.symbol,
                balance: response.data.balance.toString(),
                balanceFormatted: response.data.balance.toString(),
                decimals: 18, // Default or fetch from wallet
                timestamp: new Date().toISOString(),
              } as WalletBalance;
            }
            return null;
          });

          const results = await Promise.all(balancePromises);
          balances = results.filter((b): b is WalletBalance => b !== null);
          localStorage.setItem(`pexly_balances_${user.id}`, JSON.stringify(balances));
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
  });

  return {
    balances: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
