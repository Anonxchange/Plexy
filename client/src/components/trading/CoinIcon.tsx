import { useState } from "react";

const CDN_BASE = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color";
const TW_BASE  = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets";

type Source = "trustwallet" | "cdn" | "fallback";

interface CoinIconProps {
  symbol: string;
  address?: string;
  className?: string;
}

export function CoinIcon({ symbol, address, className = "w-8 h-8" }: CoinIconProps) {
  const initial: Source = address ? "trustwallet" : "cdn";
  const [source, setSource] = useState<Source>(initial);

  const advance = () => {
    setSource(prev => {
      if (prev === "trustwallet") return "cdn";
      return "fallback";
    });
  };

  if (source === "fallback") {
    return (
      <div className={`rounded-full bg-secondary flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className="text-xs font-bold text-muted-foreground">{symbol.slice(0, 2)}</span>
      </div>
    );
  }

  const src =
    source === "trustwallet" && address
      ? `${TW_BASE}/${address}/logo.png`
      : `${CDN_BASE}/${symbol.toLowerCase()}.svg`;

  return (
    <img
      key={src}
      src={src}
      alt={symbol}
      className={`rounded-full flex-shrink-0 bg-secondary ${className}`}
      onError={advance}
    />
  );
}
