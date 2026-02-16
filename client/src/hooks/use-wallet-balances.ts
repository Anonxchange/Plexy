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
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return [];

      const accessToken = sessionData.session?.access_token;
      let balances: WalletBalance[] = [];

      try {
        const { data: wallets } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', 'true');

        if (!wallets || wallets.length === 0) {
          const snapshot = localStorage.getItem(`pexly_balances_${user.id}`);
          if (snapshot) return JSON.parse(snapshot);
          throw new Error('No wallets found for user');
        }

        const chainToSymbol: Record<string, string> = {
          bitcoin: 'BTC',
          ethereum: 'ETH',
          solana: 'SOL',
          tron: 'TRX',
          bsc: 'BNB',
          'binance-smart-chain': 'BNB',
        };

        const balancePromises = wallets.map(async (wallet) => {
          const normalizedChain = wallet.chain_id.toLowerCase();
          const requestChain = chainToSymbol[normalizedChain] || normalizedChain.toUpperCase();

          try {
            const response = await supabase.functions.invoke<any>('monitor-deposits', {
              body: { address: wallet.address, chain: requestChain },
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });

            if (response.error || !response.data?.success || !response.data?.native) {
              console.error(`monitor-deposits failed for ${requestChain}:`, response.error || response.data);
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

            const native = response.data.native;
            return {
              wallet_id: wallet.id,
              user_id: user.id,
              address: wallet.address,
              chain_id: wallet.chain_id,
              symbol: native.symbol,
              balance: native.balance,
              balanceFormatted: native.balance,
              decimals: native.decimals,
              timestamp: new Date().toISOString(),
            } as WalletBalance;
          } catch (err) {
            console.error(`Exception for ${wallet.chain_id}:`, err);
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
        });

        balances = await Promise.all(balancePromises);
        localStorage.setItem(`pexly_balances_${user.id}`, JSON.stringify(balances));
      } catch (err) {
        console.error('Failed to fetch wallet balances:', err);
        const snapshot = localStorage.getItem(`pexly_balances_${user.id}`);
        if (snapshot) balances = JSON.parse(snapshot);
      }

      return balances;
    },

    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    balances: query.data || [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
