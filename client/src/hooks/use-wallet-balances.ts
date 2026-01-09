import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { getUserWallets, type Wallet } from "@/lib/wallet-api";

export type { Wallet }x;

export function useWalletBalances(userId?: string) {
  return useQuery({
    queryKey: ["wallet-balances", userId],
    queryFn: async (): Promise<Wallet[]> => {
      const supabase = createClient();
      // Get current user if no userId provided
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      
      if (!uid) {
        return [];
      }

      return getUserWallets(uid);
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
