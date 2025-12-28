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

export function useSwapPrice(fromCrypto: string, toCrypto: string) {
  const [priceData, setPriceData] = useState<SwapPriceData>({
    marketRate: 0,
    swapRate: 0,
    percentageDiff: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchPrices = async () => {
      try {
        // For stablecoins to stablecoins, rate is 1:1
        if (
          (fromCrypto === 'USDT' || fromCrypto === 'USDC') &&
          (toCrypto === 'USDT' || toCrypto === 'USDC')
        ) {
          if (isMounted) {
            setPriceData({
              marketRate: 1,
              swapRate: 1,
              percentageDiff: 0,
              isLoading: false,
              error: null,
            });
          }
          return;
        }

        // Try to fetch from Rocketx first for real exchange rates
        const rocketxRate = await getRocketxRate(fromCrypto, toCrypto);
        
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
        const isSellingCrypto = toCrypto === 'USDT' || toCrypto === 'USDC';
        const spreadMultiplier = isSellingCrypto 
          ? (1 - SWAP_SPREAD_PERCENTAGE / 100)  // Give less when selling crypto
          : (1 + SWAP_SPREAD_PERCENTAGE / 100); // Charge more when buying crypto
        
        const swapRate = marketRate * spreadMultiplier;

        // Calculate actual percentage difference
        const percentageDiff = Math.abs(((swapRate - marketRate) / marketRate) * 100);

        setPriceData({
          marketRate,
          swapRate,
          percentageDiff,
          isLoading: false,
          error: null,
        });
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

    // Initial fetch
    fetchPrices();

    // Refresh every 10 seconds
    intervalId = setInterval(fetchPrices, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fromCrypto, toCrypto]);

  return priceData;
}

export function calculateSwapAmount(
  fromAmount: number,
  swapRate: number
): number {
  return fromAmount * swapRate;
}
