export const cryptoIconUrls: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  TON: "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  XMR: "https://assets.coingecko.com/coins/images/69/small/monero_logo.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  TRX: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
};

export const getCryptoIconUrl = (symbol: string): string => {
  return cryptoIconUrls[symbol] || `https://ui-avatars.com/api/?name=${symbol}&background=random`;
};
