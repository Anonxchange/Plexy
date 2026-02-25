import { createCDPOfframpSession } from '@/lib/wallet-api';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from '@tanstack/react-query';

export function useCdpOfframp() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      address: string;
      sellCurrency: string;
      sellAmount: string;
      fiatCurrency: string;
    }) => {
      const networkMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'USDC': 'base',
        'USDT': 'ethereum',
        'POL': 'polygon',
      };

      const network = networkMap[params.sellCurrency.toUpperCase()] || 'ethereum';
      
      const result = await createCDPOfframpSession(
        params.address,
        [params.sellCurrency],
        params.sellAmount,
        params.fiatCurrency,
        { network }
      );
      
      const offrampUrl = typeof result === 'string' && result.startsWith('http') 
        ? result 
        : null;

      return { success: true, offrampUrl, sessionToken: !offrampUrl ? result : null };
    },
  });
}
