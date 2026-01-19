export const cryptoIconUrls: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  TRX: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  TON: "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png",
  MNT: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
  USDE: "https://assets.coingecko.com/coins/images/33613/small/usde.png",
  PYUSD: "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OP: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
};

export const getCryptoIconUrl = (symbol: string): string => {
  return cryptoIconUrls[symbol] || `https://ui-avatars.com/api/?name=${symbol}&background=random`;
};
