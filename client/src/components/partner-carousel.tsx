import { useMemo } from "react";

const partners = [
  { name: "Binance", logo: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg" },
  { name: "Coinbase", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg" },
  { name: "Ethereum", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg" },
  { name: "Bitcoin", logo: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg" },
  { name: "Polygon", logo: "https://cryptologos.cc/logos/polygon-matic-logo.svg" },
  { name: "Avalanche", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.svg" },
  { name: "Chainlink", logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg" },
  { name: "Solana", logo: "https://cryptologos.cc/logos/solana-sol-logo.svg" },
  { name: "Tether", logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg" },
  { name: "Arbitrum", logo: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg" },
  { name: "Optimism", logo: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg" },
  { name: "Uniswap", logo: "https://cryptologos.cc/logos/uniswap-uni-logo.svg" },
];

export function PartnerCarousel() {
  const duplicatedPartners = useMemo(() => [...partners, ...partners, ...partners], []);

  return (
    <div className="bg-zinc-100 py-4 overflow-hidden border-y border-zinc-200">
      <div className="relative">
        <div className="flex gap-16 items-center animate-scroll">
          {duplicatedPartners.map((partner, index) => (
            <div 
              key={`${partner.name}-${index}`} 
              className="flex items-center gap-3 min-w-fit whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
            >
              {partner.logo && (
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="font-bold text-zinc-800 text-base tracking-tight">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
