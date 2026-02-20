import { useState, useEffect } from 'react';
import { getCryptoPrices } from '@/lib/crypto-prices';
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

// Platform spread percentage (how much above/below market rate)
const SWAP_SPREAD_PERCENTAGE = 0; // 0% spread - direct RocketX rates

// Cache for prices to avoid unnecessary re-fetching and provide instant UI
const priceCache: Record<string, { data: SwapPriceData; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache

export function useSwapPrice(fromCrypto: string, toCrypto: string, fromNetwork: string, toNetwork: string, amount: number = 1) {
  const { user } = useAuth();
  const cacheKey = `${fromCrypto}-${fromNetwork}-${toCrypto}-${toNetwork}-${amount}-${user?.id || 'anon'}`;
  
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
      bestQuote: null,
    };
  });

  // Add a separate state for debounced amount to avoid constant API calls while typing
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [amount]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchPrices = async (showLoading = false) => {
      const cached = priceCache[cacheKey];
      if (showLoading && isMounted && !cached) {
        setPriceData(prev => ({ ...prev, isLoading: true }));
      }
      
      try {
        // Prevent repeated tokens calls if we already have the tokens for these networks
        // Or if we just fetched them
        if (isMounted && cached && Date.now() - cached.timestamp < 10000) {
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

        // Try to fetch real wallet addresses for quotation if user is logged in
        let fromAddress: string | undefined = undefined;
        let toAddress: string | undefined = undefined;

        if (user?.id) {
          const wallets = await nonCustodialWalletManager.getNonCustodialWallets(user.id);
          
        const findWallet = (network: string, symbol: string) => {
          const targetNet = network.toLowerCase();
          const targetSym = symbol.toLowerCase();
          
          return wallets.find(w => {
            const wChainId = (w.chainId || "").toLowerCase();
            const wWalletType = (w.walletType || "").toLowerCase();
            
            // Direct matches
            if (wChainId === targetNet || wWalletType === targetNet) return true;
            
            // Network specific aliases
            if (targetNet === 'btc' || targetNet === 'bitcoin') {
              return wWalletType === 'bitcoin' || wChainId.includes('bitcoin');
            }
            if (targetNet === 'eth' || targetNet === 'ethereum') {
              return wWalletType === 'ethereum' || wChainId.includes('ethereum');
            }
            if (targetNet === 'bsc' || targetNet === 'binance') {
              return wWalletType === 'binance' || wChainId.includes('binance') || wChainId === 'bsc';
            }
            if (targetNet === 'trx' || targetNet === 'tron') {
              return wWalletType === 'tron' || wChainId.includes('tron');
            }
            if (targetNet === 'sol' || targetNet === 'solana') {
              return wWalletType === 'solana' || wChainId.includes('solana');
            }
            if (targetNet === 'polygon' || targetNet === 'matic') {
              return wWalletType === 'polygon' || wChainId.includes('polygon');
            }
            if (targetNet === 'arbitrum') {
              return wWalletType === 'arbitrum' || wChainId.includes('arbitrum');
            }
            if (targetNet === 'optimism') {
              return wWalletType === 'optimism' || wChainId.includes('optimism');
            }
            if (targetNet === 'base') {
              return wWalletType === 'base' || wChainId.includes('base');
            }
            
            return false;
          });
        };

          const fWallet = findWallet(fromNetwork, fromCrypto);
          if (fWallet) fromAddress = fWallet.address;

          const tWallet = findWallet(toNetwork, toCrypto);
          if (tWallet) toAddress = tWallet.address;
        }

        console.log('useSwapPrice addresses:', { fromCrypto, fromNetwork, fromAddress, toCrypto, toNetwork, toAddress });

        // RocketX requires real addresses for quotations. 
        // If the user isn't logged in or hasn't generated wallets, 
        // we use a generic address for quotation purposes only if needed,
        // but it's better to prompt the user.
        if (!fromAddress || !toAddress) {
          if (isMounted) {
            setPriceData(prev => ({ 
              ...prev, 
              isLoading: false, 
              error: `Please ensure you have both ${fromNetwork} and ${toNetwork} wallets created to get live swap rates` 
            }));
          }
          return;
        }

        console.log('useSwapPrice fetching quote for:', { fromCrypto, fromNetwork, toCrypto, toNetwork, amount: debouncedAmount });

        // Try to fetch from Rocketx first for real exchange rates
        const rocketxQuote = await getRocketxRate(fromCrypto, fromNetwork, toCrypto, toNetwork, debouncedAmount, { fromAddress, toAddress });
        
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
  }, [fromCrypto, toCrypto, fromNetwork, toNetwork, debouncedAmount, cacheKey]);

  return priceData;
}

export function calculateSwapAmount(
  fromAmount: number,
  swapRate: number
): number {
  return fromAmount * swapRate;
}
