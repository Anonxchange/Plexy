import { useState } from "react";
import { getCryptoIconUrl } from "@/lib/crypto-icons";
import { CHAIN_ICONS, CHAIN_MAP, EXTRA_COIN_ICONS } from "./AccountModalConfig";

export function getCoinIcon(symbol: string): string {
  return EXTRA_COIN_ICONS[symbol] ?? getCryptoIconUrl(symbol);
}

// ── Chain icon (real image with fallback) ─────────────────
export function ChainIcon({ chainKey, size = 22 }: { chainKey: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = CHAIN_ICONS[chainKey];
  const c = CHAIN_MAP[chainKey];
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={chainKey}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-black"
      style={{ width: size, height: size, background: c?.color ?? "#888", fontSize: size * 0.38 }}
    >
      {c?.name.slice(0, 1) ?? "?"}
    </span>
  );
}

// ── Coin icon (real image with fallback) ──────────────────
export function CoinIcon({ symbol, size = 22 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = getCoinIcon(symbol);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 font-bold text-primary bg-primary/20"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}
