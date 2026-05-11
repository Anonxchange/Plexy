import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  getPolymarketWalletInfo,
  approveUsdcToPolymarket,
  revokeUsdcFromPolymarket,
} from '@/lib/polymarket-clob';

async function polymarketRequest(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('polymarket', {
    body: { action, params },
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  conditionId: string;
  slug: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  clobTokenIds: string;
  outcomePrices: string;
  outcomes: string;
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  endDate: string;
  startDate: string;
  tags: string[];
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
}

export interface PricePoint {
  t: number;
  p: number;
}

export function useMarkets(params?: { limit?: number; offset?: number; tag?: string; closed?: string }) {
  return useQuery({
    queryKey: ['polymarket', 'markets', params],
    queryFn: () => polymarketRequest('getMarkets', params || {}),
    staleTime: 30000,
  });
}

export function useEvents(params?: { limit?: number; offset?: number; tag?: string }) {
  return useQuery({
    queryKey: ['polymarket', 'events', params],
    queryFn: () => polymarketRequest('getEvents', params || {}),
    staleTime: 30000,
  });
}

export function useMarketDetail(marketId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'market', marketId],
    queryFn: () => polymarketRequest('getMarket', { conditionId: marketId }),
    enabled: !!marketId,
    staleTime: 30000,
  });
}

const INTERVAL_API: Record<string, string> = {
  '1H': 'max', '6H': 'max', '1D': '1d', '1W': '1w', '1M': '1m',
};
const FIDELITY_API: Record<string, number> = {
  '1H': 1, '6H': 5, '1D': 60, '1W': 60, '1M': 1440,
};

export function usePriceHistory(tokenId: string | undefined, interval: string) {
  return useQuery({
    queryKey: ['polymarket', 'priceHistory', tokenId, interval],
    queryFn: () =>
      polymarketRequest('getPriceHistory', {
        tokenId,
        interval: INTERVAL_API[interval] ?? '1d',
        fidelity: FIDELITY_API[interval] ?? 60,
      }),
    enabled: !!tokenId,
    staleTime: 60000,
  });
}

export function useOrderbook(tokenId: string | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'orderbook', tokenId],
    queryFn: () => polymarketRequest('getOrderbook', { tokenId }),
    enabled: !!tokenId,
    refetchInterval: 10000,
  });
}

export function useOpenOrders() {
  return useQuery({
    queryKey: ['polymarket', 'openOrders'],
    queryFn: () => polymarketRequest('getOpenOrders'),
    refetchInterval: 15000,
    retry: false,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Record<string, unknown>) =>
      polymarketRequest('postOrder', { order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      polymarketRequest('cancelOrder', { orderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'openOrders'] });
    },
  });
}

export function usePolymarketWalletInfo(address: string | null | undefined) {
  return useQuery({
    queryKey: ['polymarket', 'walletInfo', address],
    queryFn: () => getPolymarketWalletInfo(address!),
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function usePolymarketApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mnemonic, amount }: { mnemonic: string; amount: string }) =>
      approveUsdcToPolymarket(mnemonic, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}

export function usePolymarketRevoke() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mnemonic }: { mnemonic: string }) =>
      revokeUsdcFromPolymarket(mnemonic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polymarket', 'walletInfo'] });
    },
  });
}
