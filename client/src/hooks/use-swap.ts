import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executeSwap, getSwapHistory } from '@/lib/swap-api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from './use-toast';

export function useExecuteSwap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: executeSwap,
    onSuccess: () => {
      // Invalidate wallet balances to refresh
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['swapHistory'] });
      
      toast({
        title: "Swap Successful!",
        description: "Your cryptocurrency has been swapped successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Swap Failed",
        description: error.message || "Failed to execute swap. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSwapHistory(limit: number = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['swapHistory', user?.id, limit],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getSwapHistory(user.id, limit);
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}
