import { createCDPOfframpSession } from '@/lib/wallet-api';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from '@tanstack/react-query';

export function useCdpOfframp() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      address: string;
      sellCurrency: string;
      fiatCurrency: string;
      /** One of: BANK_ACCOUNT | ACH_BANK_ACCOUNT | PAYPAL | FIAT_WALLET */
      cashoutMethod?: string;
    }) => {
      const networkMap: Record<string, string> = {
        BTC: 'bitcoin',
        ETH: 'ethereum',
        SOL: 'solana',
        USDC: 'ethereum',
        USDT: 'ethereum',
        POL: 'polygon',
      };

      const network = networkMap[params.sellCurrency.toUpperCase()] ?? 'ethereum';

      // The edge fn does not accept a sell amount — the user sets that in the
      // Coinbase offramp UI. Pass undefined for the _sellAmount positional arg.
      const { offrampUrl } = await createCDPOfframpSession(
        params.address,
        [params.sellCurrency],
        undefined,
        params.fiatCurrency,
        { network, cashoutMethod: params.cashoutMethod },
      );

      return { success: true, offrampUrl };
    },
  });
}
