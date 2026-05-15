import { useState, useEffect } from 'react';
import { getRocketxRate, type RocketXQuote } from '@/lib/rocketx-api';
import { nonCustodialWalletManager } from '@/lib/non-custodial-wallet';
import { useAuth } from '@/lib/auth-context';

interface SwapPriceData {
  marketRate: number;
  swapRate: number;
  percentageDiff: number;
  isLoading: boolean;
  error: string | null;
  bestQuote: RocketXQuote | null;
}

// Cache for prices to avoid unnecessary re-fetching and provide instant UI
const priceCache: Record<string, { data: SwapPriceData; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache

export function useSwapPrice(fromCrypto: string, toCrypto: string, fromNetwork: string, toNetwork: string, amount: number = 1) {
  const { user } = useAuth();
  // Use raw amount only for initial cache warm-up; all subsequent logic uses debouncedAmount
  const initialCacheKey = `${fromCrypto}-${fromNetwork}-${toCrypto}-${toNetwork}-${amount}-${user?.id || 'anon'}`;

  const [priceData, setPriceData] = useState<SwapPriceData>(() => {
    // Initialize from cache if available
    const cached = priceCache[initialCacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { ...cached.data, isLoading: false };
    }
    return {
      marketRate: 0,
      swapRate: 0,
      percentageDiff: 0,
      isLoading: true,
      error: null,
      bestQuote: null,
    };
  });

  // Debounce amount to avoid API calls on every keystroke
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500);

    return () => clearTimeout(timer);
  }, [amount]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    // cacheKey is derived from debounced amount so the effect only re-runs when
    // typing has settled, not on every individual keystroke
    const cacheKey = `${fromCrypto}-${fromNetwork}-${toCrypto}-${toNetwork}-${debouncedAmount}-${user?.id || 'anon'}`;

    const fetchPrices = async (showLoading = false) => {
      if (!isMounted) return;

      // Don't fetch if amount is 0 or invalid
      if (debouncedAmount <= 0 || isNaN(debouncedAmount)) {
        if (isMounted) {
          setPriceData({
            marketRate: 0,
            swapRate: 0,
            percentageDiff: 0,
            isLoading: false,
            error: null,
            bestQuote: null,
          });
        }
        return;
      }

      const cached = priceCache[cacheKey];
      if (showLoading && isMounted && !cached) {
        setPriceData(prev => ({ ...prev, isLoading: true }));
      }

      try {
        // Skip if cache is still very fresh (within 10s) — avoids redundant calls
        // from the background interval landing right after a manual fetch
        if (cached && Date.now() - cached.timestamp < 10000) {
          return;
        }

        // For stablecoins to stablecoins, rate is 1:1
        if (
          (fromCrypto === 'USDT' || fromCrypto === 'USDC') &&
          (toCrypto === 'USDT' || toCrypto === 'USDC')
        ) {
          const data = {
            marketRate: 1,
            swapRate: 1,
            percentageDiff: 0,
            isLoading: false,
            error: null,
            bestQuote: null,
          };
          if (isMounted) {
            setPriceData(data);
            priceCache[cacheKey] = { data, timestamp: Date.now() };
          }
          return;
        }

        // Resolve wallet addresses if logged in — passed to RocketX for more accurate
        // gas estimates, but quotes work without them (addresses only required at execution).
        let fromAddress: string | undefined = undefined;
        let toAddress: string | undefined = undefined;

        if (user?.id) {
          try {
            const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);

            const findWallet = (network: string) => {
              const net = network.toLowerCase();
              return wallets.find(w => {
                const wChain = (w.chainId || "").toLowerCase();
                const wType  = (w.walletType || "").toLowerCase();
                if (wChain === net || wType === net) return true;
                if (net === 'btc'      || net === 'bitcoin')   return wType === 'bitcoin'  || wChain.includes('bitcoin');
                if (net === 'eth'      || net === 'ethereum')  return wType === 'ethereum' || wChain.includes('ethereum');
                if (net === 'bsc'      || net === 'binance')   return wType === 'binance'  || wChain.includes('binance') || wChain === 'bsc';
                if (net === 'trx'      || net === 'tron')      return wType === 'tron'     || wChain.includes('tron');
                if (net === 'sol'      || net === 'solana')    return wType === 'solana'   || wChain.includes('solana');
                if (net === 'polygon'  || net === 'matic')     return wType === 'polygon'  || wChain.includes('polygon');
                if (net === 'arbitrum')                        return wType === 'arbitrum' || wChain.includes('arbitrum');
                if (net === 'optimism')                        return wType === 'optimism' || wChain.includes('optimism');
                if (net === 'base')                            return wType === 'base'     || wChain.includes('base');
                return false;
              });
            };

            const fWallet = findWallet(fromNetwork);
            if (fWallet) fromAddress = fWallet.address;

            const tWallet = findWallet(toNetwork);
            if (tWallet) toAddress = tWallet.address;
          } catch {
            // Non-fatal — proceed with walletless quote
          }
        }

        if (import.meta.env.DEV) {
          console.log('useSwapPrice fetching quote:', { fromCrypto, fromNetwork, fromAddress, toCrypto, toNetwork, toAddress, amount: debouncedAmount });
        }

        // Fetch quote — addresses are optional, included when available for accuracy
        const rocketxQuote = await getRocketxRate(
          fromCrypto, fromNetwork, toCrypto, toNetwork, debouncedAmount,
          { ...(fromAddress ? { fromAddress } : {}), ...(toAddress ? { toAddress } : {}) }
        );
        
        // Ensure we prioritize RocketX quote. If it's missing, we wait or show error instead of jumping to market rate
        if (!rocketxQuote) {
          if (isMounted) {
            setPriceData(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: 'Fetching best exchange rate...' 
            }));
          }
          return;
        }

        const marketRate = (rocketxQuote.toAmount || 0) / (debouncedAmount || 1);
        const swapRate = marketRate; // Use direct rocketx rate
        const percentageDiff = 0; // Since we use the direct quote as the rate

        const data = {
          marketRate,
          swapRate,
          percentageDiff,
          isLoading: false,
          error: null,
          bestQuote: rocketxQuote,
        };

        if (isMounted) {
          setPriceData(data);
          priceCache[cacheKey] = { data, timestamp: Date.now() };
        }
      } catch (error) {
        console.error('Error fetching swap prices:', error);
        if (isMounted) {
          setPriceData((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Failed to fetch live prices',
          }));
        }
      }
    };

    // Use cached data if fresh, otherwise fetch
    const cached = priceCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPriceData({ ...cached.data, isLoading: false });
      // Still fetch in background to keep it updated, but don't show loading
      fetchPrices(false);
    } else if (debouncedAmount > 0) {
      fetchPrices(true);
    } else {
      setPriceData(prev => ({ ...prev, isLoading: false }));
    }

    // Refresh every 15 seconds (Production Standard)
    intervalId = setInterval(() => {
      if (debouncedAmount > 0) {
        fetchPrices(false);
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fromCrypto, toCrypto, fromNetwork, toNetwork, debouncedAmount, user?.id]);

  return priceData;
}

export function calculateSwapAmount(
  fromAmount: number,
  swapRate: number
): number {
  return fromAmount * swapRate;
}
