export interface CryptoPrice {
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
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

export function convertToNGN(usdAmount: number, usdToNgnRate: number = 1470): number {
  return usdAmount * usdToNgnRate;
}
