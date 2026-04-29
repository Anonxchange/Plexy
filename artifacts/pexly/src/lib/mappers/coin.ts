import { safeCryptoSymbol, sanitizeUrl, sanitizeText } from "@/lib/sanitize";
import { isValidNumber } from "@/lib/validators";
import type { CryptoPrice } from "@/hooks/use-crypto-prices";

export function mapCryptoPrice(raw: unknown): CryptoPrice {
  const r = raw as Record<string, unknown>;
  return {
    symbol: safeCryptoSymbol(typeof r.symbol === "string" ? r.symbol : ""),
    price: isValidNumber(r.price) ? r.price : 0,
    change24h: isValidNumber(r.change24h) ? r.change24h : 0,
  };
}

export interface RawCoin {
  symbol?: unknown;
  name?: unknown;
  logo?: unknown;
  image?: unknown;
}

export interface SafeCoin {
  symbol: string;
  name: string;
  logo: string;
}

export function mapCoin(raw: RawCoin): SafeCoin {
  const logoRaw = raw.logo ?? raw.image;
  return {
    symbol: safeCryptoSymbol(typeof raw.symbol === "string" ? raw.symbol : ""),
    name: sanitizeText(typeof raw.name === "string" ? raw.name : ""),
    logo: sanitizeUrl(typeof logoRaw === "string" ? logoRaw : ""),
  };
}
