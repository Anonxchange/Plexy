import { useMemo } from "react";

const partners = [
  { name: "Binance", logo: "/logos/binance-coin-bnb-logo.svg" },
  { name: "Coinbase", logo: "/logos/usd-coin-usdc-logo.svg" },
  { name: "Ethereum", logo: "/logos/ethereum-eth-logo.svg" },
  { name: "Bitcoin", logo: "/logos/bitcoin-btc-logo.svg" },
  { name: "Polygon", logo: "/logos/polygon-matic-logo.svg" },
  { name: "Avalanche", logo: "/logos/avalanche-avax-logo.svg" },
  { name: "Chainlink", logo: "/logos/chainlink-link-logo.svg" },
  { name: "Solana", logo: "/logos/solana-sol-logo.svg" },
  { name: "Tether", logo: "/logos/tether-usdt-logo.svg" },
  { name: "Arbitrum", logo: "/logos/arbitrum-arb-logo.svg" },
  { name: "Optimism", logo: "/logos/optimism-ethereum-op-logo.svg" },
  { name: "Uniswap", logo: "/logos/uniswap-uni-logo.svg" },
];

export function PartnerCarousel() {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/50 py-4 overflow-hidden border-y border-zinc-200 dark:border-zinc-800 backdrop-blur-sm" style={{ contain: "content" }}>
      {/*
        will-change:transform promotes this element to its own compositor layer.
        The translateX animation then runs entirely on the GPU thread and cannot
        trigger a layout recalculation on the main thread.
      */}
      <div
        className="flex gap-16 items-center animate-scroll [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] [will-change:transform]"
      >
        {[...partners, ...partners].map((partner, index) => (
          <div 
            key={`${partner.name}-${index}`} 
            className="flex items-center gap-3 min-w-fit whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
          >
            {partner.logo && (
              <img 
                src={partner.logo} 
                alt=""
                role="presentation"
                className="w-8 h-8 object-contain dark:brightness-0 dark:invert"
                loading="lazy"
              />
            )}
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base tracking-tight">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
