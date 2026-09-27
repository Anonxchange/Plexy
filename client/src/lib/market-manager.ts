import { getCountryCode } from "@/lib/geo";
import { getMarketCountry, setMarketCountry } from "@/lib/shopify-service";

export interface MarketCountry {
  code: string;
  region: string;
  // Unicode flag emoji — rendered as text, so it is never blocked by a
  // CSP img-src policy the way a remote flag-icon image/CDN would be.
  flag: string;
}

export const SUPPORTED_MARKETS: MarketCountry[] = [
  { code: "NG", region: "Nigeria", flag: "🇳🇬" },
  { code: "GB", region: "United Kingdom", flag: "🇬🇧" },
  { code: "US", region: "United States", flag: "🇺🇸" },
  { code: "CA", region: "Canada", flag: "🇨🇦" },
];

const SUPPORTED_CODES = new Set(SUPPORTED_MARKETS.map((m) => m.code));

export function isSupportedCountry(code: string | null | undefined): code is string {
  return !!code && SUPPORTED_CODES.has(code);
}

export function getMarketConfig(code: string): MarketCountry | undefined {
  return SUPPORTED_MARKETS.find((m) => m.code === code);
}

/** Country to use on first render, before any async geo lookup resolves. */
export function initializeMarketCountry(): string {
  const saved = getMarketCountry();
  if (isSupportedCountry(saved)) return saved;
  return "US";
}

/**
 * IP-based detection. Never overrides a country the user already picked
 * manually. Returns the resolved code only when it actually changed
 * something (so callers know whether a reload/refetch is needed).
 */
export async function detectAndSetMarketCountry(): Promise<string | null> {
  if (getMarketCountry()) return null;

  const detected = (await getCountryCode()).toUpperCase();
  const resolved = isSupportedCountry(detected) ? detected : "US";
  setMarketCountry(resolved);
  return resolved;
}

// Re-exported so components only ever need to import from one place.
export { getMarketCountry, setMarketCountry };
