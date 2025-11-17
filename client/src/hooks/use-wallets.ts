import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserWallets, getWalletBalance } from '@/lib/wallet-api';
import { useAuth } from '@/lib/auth-context';

export function useWallets() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserWallets(user.id);
    },
    enabled: !!user?.id,
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useWalletBalance(cryptoSymbol: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['wallet', user?.id, cryptoSymbol],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getWalletBalance(user.id, cryptoSymbol);
    },
    enabled: !!user?.id && !!cryptoSymbol,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}
