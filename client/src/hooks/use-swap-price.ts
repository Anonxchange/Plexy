import { useState, useEffect } from 'react';
import { getCryptoPrices } from '@/lib/crypto-prices';
import { getRocketxRate } from '@/lib/rocketx-api';

interface SwapPriceData {
  marketRate: number;
  swapRate: number;
  percentageDiff: number;
  isLoading: boolean;
  error: string | null;
}

// Platform spread percentage (how much above/below market rate)
const SWAP_SPREAD_PERCENTAGE = 0.2; // 0.2% spread

// Cache for prices to avoid unnecessary re-fetching and provide instant UI
const priceCache: Record<string, { data: SwapPriceData; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache

export function useSwapPrice(fromCrypto: string, toCrypto: string, fromNetwork: string, toNetwork: string, amount: number = 1) {
  const cacheKey = `${fromCrypto}-${fromNetwork}-${toCrypto}-${toNetwork}-${amount}`;
  
  const [priceData, setPriceData] = useState<SwapPriceData>(() => {
    // Initialize from cache if available
    const cached = priceCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { ...cached.data, isLoading: false };
    }
    return {
      marketRate: 0,
      swapRate: 0,
      percentageDiff: 0,
      isLoading: true,
      error: null,
    };
  });

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchPrices = async (showLoading = false) => {
      if (showLoading && isMounted) {
        setPriceData(prev => ({ ...prev, isLoading: true }));
      }
      
      try {
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
          };
          if (isMounted) {
            setPriceData(data);
            priceCache[cacheKey] = { data, timestamp: Date.now() };
          }
          return;
        }

        // Try to fetch from Rocketx first for real exchange rates
        const rocketxRate = await getRocketxRate(fromCrypto, fromNetwork, toCrypto, toNetwork, amount);
        
        let marketRate = rocketxRate;
        
        // Fallback to CoinGecko if Rocketx fails
        if (rocketxRate === 0) {
          const prices = await getCryptoPrices([fromCrypto, toCrypto]);
          const fromPrice = prices[fromCrypto]?.current_price || 0;
          const toPrice = prices[toCrypto]?.current_price || 1;
          marketRate = fromPrice / toPrice;
        }

        if (!isMounted) return;

        // Calculate swap rate with spread
        // If we have a direct rocketxRate, it's already the quote from the exchange
        // including their best routing, so we use it directly as both market and swap rate
        const isSellingCrypto = toCrypto === 'USDT' || toCrypto === 'USDC';
        const spreadMultiplier = isSellingCrypto 
          ? (1 - SWAP_SPREAD_PERCENTAGE / 100)
          : (1 + SWAP_SPREAD_PERCENTAGE / 100);

        const swapRate = rocketxRate !== 0 ? rocketxRate : marketRate * spreadMultiplier;
        const percentageDiff = marketRate !== 0 ? Math.abs(((swapRate - marketRate) / marketRate) * 100) : 0;

        const data = {
          marketRate,
          swapRate,
          percentageDiff,
          isLoading: false,
          error: null,
        };

        setPriceData(data);
        priceCache[cacheKey] = { data, timestamp: Date.now() };
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
    } else {
      fetchPrices(true);
    }

    // Refresh every 18 seconds
    intervalId = setInterval(() => fetchPrices(false), 18000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fromCrypto, toCrypto, fromNetwork, toNetwork, amount, cacheKey]);

  return priceData;
}

export function calculateSwapAmount(
  fromAmount: number,
  swapRate: number
): number {
  return fromAmount * swapRate;
}
