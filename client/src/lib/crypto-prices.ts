export interface CryptoPrice {
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface ExchangeRates {
  [key: string]: number;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  SOL: 'solana',
  TON: 'the-open-network',
  XMR: 'monero',
  BNB: 'binancecoin',
  TRX: 'tron',
  LTC: 'litecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  DOT: 'polkadot',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  NEAR: 'near',
  FTM: 'fantom',
  ALGO: 'algorand',
  VET: 'vechain'
};

export async function getCryptoPrices(symbols: string[]): Promise<Record<string, CryptoPrice>> {
  const ids = symbols.map(s => COINGECKO_IDS[s]).filter(Boolean).join(',');
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    
    const pricesMap: Record<string, CryptoPrice> = {};
    
    data.forEach((coin: any) => {
      const symbol = Object.keys(COINGECKO_IDS).find(
        key => COINGECKO_IDS[key] === coin.id
      );
      
      if (symbol) {
        pricesMap[symbol] = {
          symbol,
          name: coin.name,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
          total_volume: coin.total_volume
        };
      }
    });
    
    return pricesMap;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {};
  }
}

export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toFixed(4);
  }
}

// Cache for exchange rates
let exchangeRatesCache: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (exchangeRatesCache && (now - lastFetchTime) < CACHE_DURATION) {
    return exchangeRatesCache;
  }
  
  try {
    // Using exchangerate-api.com free tier (no API key needed)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    exchangeRatesCache = data.rates;
    lastFetchTime = now;
    
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates if API fails
    return {
      USD: 1,
      NGN: 1470,
      EUR: 0.92,
      GBP: 0.79,
      GHS: 15.50,
      KES: 129.50,
      ZAR: 18.50,
    };
  }
}

export async function convertCurrency(usdAmount: number, toCurrency: string): Promise<number> {
  const rates = await getExchangeRates();
  const rate = rates[toCurrency] || 1;
  return usdAmount * rate;
}

// Legacy function for backward compatibility
export function convertToNGN(usdAmount: number, usdToNgnRate: number = 1470): number {
  return usdAmount * usdToNgnRate;
}
