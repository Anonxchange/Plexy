import { useState } from "react";

const ICON_BASE = "https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color";

interface CoinIconProps {
  symbol: string;
  className?: string;
}

export function CoinIcon({ symbol, className = "w-8 h-8" }: CoinIconProps) {
  const [errored, setErrored] = useState(false);
  const src = `${ICON_BASE}/${symbol.toLowerCase()}.svg`;

  if (errored) {
    return (
      <div className={`rounded-full bg-secondary flex items-center justify-center flex-shrink-0 ${className}`}>
        <span className="text-xs font-bold text-muted-foreground">{symbol.slice(0, 2)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={symbol}
      className={`rounded-full flex-shrink-0 bg-secondary ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
