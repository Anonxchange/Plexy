export const cryptoIconUrls: Record<string, string> = {
  BTC:   "/icons/crypto/btc.png",
  ETH:   "/icons/crypto/eth.png",
  SOL:   "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB:   "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  TRX:   "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  USDC:  "/icons/crypto/usdc.png",
  USDT:  "/icons/crypto/usdt.png",
  LTC:   "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  TON:   "https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png",
  MNT:   "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
  USDE:  "https://assets.coingecko.com/coins/images/33613/small/usde.png",
  PYUSD: "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  XRP:   "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  ARB:   "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OP:    "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  // Additional trading coins
  USDCE: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USD1:  "https://assets.coingecko.com/coins/images/31212/small/PYUSD_Logo_%282%29.png",
  ASTER: "https://assets.coingecko.com/coins/images/30980/small/token-logo.png",
  DAI:   "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  WETH:  "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  WBTC:  "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  LINK:  "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI:   "https://assets.coingecko.com/coins/images/12504/small/uni.jpg",
  AAVE:  "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
  DOGE:  "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  SHIB:  "https://assets.coingecko.com/coins/images/11939/small/shiba.png",
  AVAX:  "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  DOT:   "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
};

export const getCryptoIconUrl = (symbol: string): string => {
  return cryptoIconUrls[symbol.toUpperCase()] || `https://ui-avatars.com/api/?name=${symbol}&background=random&bold=true&length=2&format=png`;
};
