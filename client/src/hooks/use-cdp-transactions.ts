import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { nonCustodialWalletManager } from '@/lib/non-custodial-wallet';

export interface CdpTransaction {
  external_id: string;
  user_id: string | null;
  event_type: string;
  status: string;
  /** 'onramp' = buy, 'offramp' = sell */
  transaction_type: 'onramp' | 'offramp' | string;
  asset: string | null;
  network: string | null;
  amount: string | null;
  fiat_currency: string | null;
  fiat_amount: string | null;
  wallet_address: string | null;
  tx_hash: string | null;
  updated_at: string;
}

/**
 * Fetches CDP transaction history for the current user by matching
 * their non-custodial wallet addresses against `cdp_transactions.wallet_address`.
 * Returns the 50 most-recent rows ordered newest first.
 */
export function useCdpTransactions(userId: string | null | undefined) {
  return useQuery<CdpTransaction[]>({
    queryKey: ['cdp-transactions', userId],
    enabled: !!userId,
    staleTime: 30_000,   // 30 s — webhook updates are near-realtime
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!userId) return [];

      // Collect every wallet address this user owns.
      let addresses: string[] = [];
      try {
        const wallets = await nonCustodialWalletManager.getNonCustodialWallets(userId);
        addresses = wallets.map((w) => w.address).filter(Boolean);
      } catch {
        // If wallet fetch fails we still try without address filtering.
      }

      let query = supabase
        .from('cdp_transactions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (addresses.length > 0) {
        query = query.in('wallet_address', addresses);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as CdpTransaction[];
    },
  });
}
