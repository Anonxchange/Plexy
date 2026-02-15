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
        // Fetch specific chain for each wallet from user_wallets
        const { data: wallets } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id);

        if (wallets && wallets.length > 0) {
          const chainToSymbol: Record<string, string> = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'solana': 'SOL',
            'tron': 'TRX',
            'bsc': 'BNB'
          };

          const balancePromises = wallets.map(async (wallet) => {
            try {
              // Standardize chain ID to lowercase and handle common aliases
              const chainMap: Record<string, string> = {
                'bitcoin': 'BTC',
                'ethereum': 'ETH',
                'solana': 'SOL',
                'tron': 'TRX',
                'bsc': 'BNB',
                'binance-smart-chain': 'BNB'
              };
              
              const normalizedChain = wallet.chain_id.toLowerCase();
              const requestChain = chainMap[normalizedChain] || normalizedChain.toUpperCase();

              console.log(`Invoking monitor-deposits for ${requestChain} at ${wallet.address}`);

              const response = await supabase.functions.invoke<any>(
                'monitor-deposits',
                {
                  body: { address: wallet.address, chain: requestChain },
                  headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                }
              );

              if (response.error) {
                console.error(`Edge function error for ${requestChain}:`, response.error);
                return {
                  wallet_id: wallet.id,
                  user_id: user.id,
                  address: wallet.address,
                  chain_id: wallet.chain_id,
                  symbol: chainToSymbol[normalizedChain] || requestChain,
                  balance: '0',
                  balanceFormatted: '0',
                  decimals: 18, 
                  timestamp: new Date().toISOString(),
                } as WalletBalance;
              }

              if (response.data && typeof response.data.balance !== 'undefined') {
                const symbol = chainToSymbol[normalizedChain] || requestChain;
                return {
                  wallet_id: wallet.id,
                  user_id: user.id,
                  address: wallet.address,
                  chain_id: wallet.chain_id,
                  symbol: symbol,
                  balance: response.data.balance.toString(),
                  balanceFormatted: response.data.balance.toString(),
                  decimals: 18, 
                  timestamp: new Date().toISOString(),
                } as WalletBalance;
              }
            } catch (invokeErr) {
              console.error(`Failed to invoke monitor-deposits for ${wallet.chain_id}:`, invokeErr);
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
