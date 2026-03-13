import { supabase } from "@/lib/supabase";

export interface StaderPool {
  pool: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  rewardTokens: string[] | null;
  underlyingTokens: string[] | null;
  poolMeta: string | null;
}

const STADER_STAKE_URLS: Record<string, string> = {
  Ethereum: 'https://www.staderlabs.com/eth/',
  Polygon: 'https://www.staderlabs.com/polygon/',
  BSC: 'https://www.staderlabs.com/bnb/',
  Fantom: 'https://www.staderlabs.com/fantom/',
  Hedera: 'https://www.staderlabs.com/hedera/',
};

export function getStakeUrl(chain: string): string {
  return STADER_STAKE_URLS[chain] || 'https://www.staderlabs.com/';
}

export async function getStaderPools(): Promise<StaderPool[]> {
  const { data, error } = await supabase.functions.invoke('bybit-earn', {
    body: {},
  });

  if (error) {
    console.error('Error fetching staking pools:', error);
    throw new Error(error.message || 'Failed to fetch staking pools');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Failed to fetch staking pools');
  }

  return data.data || [];
}
