// Helpers shared by the "See all" page (gift-cards-all.tsx).
import type { ReloadlyProduct } from "@/hooks/use-reloadly";
import type { AirtimeOperator } from "@/hooks/use-airtime-operators";

export const PRODUCT_PATH = (id: number) => "/gift-cards/" + id; // change to your product route
export const TOPUP_PATH = "/mobile-top-up"; // change to your top-up route

export type CardTile = {
  id: number;
  name: string;
  img: string;
  range: string;
  href: string;
  country?: string;
  usd?: number | null;
  discount?: number;
  isRange?: boolean;
};

function fmtNum(n: number) {
  return n >= 1000 ? Math.round(n).toLocaleString("en-US") : String(Math.round(n * 100) / 100);
}

export function rangeText(min: number | null | undefined, max: number | null | undefined, cur?: string) {
  const a = min ?? max;
  const b = max ?? min;
  if (a == null || b == null) return "";
  return (a === b ? fmtNum(a) : fmtNum(a) + " – " + fmtNum(b)) + (cur ? " " + cur : "");
}

export function giftTile(p: ReloadlyProduct): CardTile {
  const fixed = (p.fixedRecipientDenominations || []).filter((n) => Number.isFinite(n));
  const min = fixed.length ? Math.min(...fixed) : p.minRecipientDenomination;
  const max = fixed.length ? Math.max(...fixed) : p.maxRecipientDenomination;
  return {
    id: p.productId,
    name: p.productName,
    img: p.logoUrls?.[0] || "",
    range: rangeText(min, max, p.recipientCurrencyCode),
    href: PRODUCT_PATH(p.productId),
    country: p.country?.name,
    usd: p.minSenderDenomination ?? p.fixedSenderDenominations?.[0] ?? null,
    discount: p.discountPercentage || 0,
    isRange: p.denominationType === "RANGE",
  };
}

export function airTile(o: AirtimeOperator): CardTile {
  const useLocal = !!o.supportsLocalAmounts && (o.localMinAmount != null || (o.localFixedAmounts || []).length > 0);
  const fixed = (useLocal ? o.localFixedAmounts : o.fixedAmounts) || [];
  let min: number | null | undefined;
  let max: number | null | undefined;
  if (o.denominationType === "FIXED" && fixed.length) {
    min = Math.min(...fixed);
    max = Math.max(...fixed);
  } else {
    min = useLocal ? o.localMinAmount : o.minAmount;
    max = useLocal ? o.localMaxAmount : o.maxAmount;
  }
  const logos = o.logoUrls || [];
  return {
    id: o.operatorId ?? o.id ?? 0,
    name: o.name,
    img: logos[logos.length - 1] || "",
    range: rangeText(min, max, useLocal ? o.destinationCurrencyCode : o.senderCurrencyCode),
    href: TOPUP_PATH,
  };
}

export function uniqueByName(list: ReloadlyProduct[]) {
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = p.productName.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const PREFERRED = ["amazon", "apple", "google play", "steam", "netflix", "spotify", "xbox", "playstation", "uber", "airbnb", "starbucks", "roblox", "razer", "target", "walmart"];
export function preferredRank(name: string) {
  const hay = name.toLowerCase();
  const i = PREFERRED.findIndex((b) => hay.includes(b));
  return i < 0 ? 99 : i;
}

// Same country choice as the gift cards page (same localStorage key)
export const COUNTRY_KEY = "px-country";
export function savedCountry(): string | null {
  try {
    const saved = window.localStorage.getItem(COUNTRY_KEY);
    return saved && /^[A-Za-z]{2}$/.test(saved) ? saved.toUpperCase() : null;
  } catch {
    return null;
  }
}
export function rememberCountry(c: string) {
  try {
    window.localStorage.setItem(COUNTRY_KEY, c.toUpperCase());
  } catch {
    /* ignore */
  }
}

const TZ_COUNTRY: Record<string, string> = {
  "Africa/Lagos": "NG", "Africa/Accra": "GH", "Africa/Nairobi": "KE", "Africa/Johannesburg": "ZA", "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA", "Africa/Algiers": "DZ", "Africa/Tunis": "TN", "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ",
  "Africa/Kampala": "UG", "Africa/Abidjan": "CI", "Africa/Dakar": "SN", "Africa/Kinshasa": "CD", "Africa/Luanda": "AO",
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES", "Europe/Rome": "IT",
  "Europe/Lisbon": "PT", "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Vienna": "AT", "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI", "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ", "Europe/Athens": "GR", "Europe/Istanbul": "TR", "Europe/Kyiv": "UA", "Europe/Kiev": "UA", "Europe/Moscow": "RU",
  "Asia/Dubai": "AE", "Asia/Riyadh": "SA", "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK", "Asia/Dhaka": "BD",
  "Asia/Jakarta": "ID", "Asia/Manila": "PH", "Asia/Bangkok": "TH", "Asia/Ho_Chi_Minh": "VN", "Asia/Saigon": "VN", "Asia/Kuala_Lumpur": "MY",
  "Asia/Singapore": "SG", "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK", "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Tehran": "IR",
  "Asia/Jerusalem": "IL", "Asia/Qatar": "QA", "Asia/Kuwait": "KW", "Asia/Colombo": "LK", "Asia/Kathmandu": "NP",
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US", "America/Phoenix": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Mexico_City": "MX", "America/Bogota": "CO", "America/Lima": "PE",
  "America/Santiago": "CL", "America/Argentina/Buenos_Aires": "AR", "America/Sao_Paulo": "BR", "America/Caracas": "VE",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Perth": "AU", "Pacific/Auckland": "NZ",
};
export function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  } catch {
    /* ignore */
  }
  const m = (navigator.language || "").match(/-([A-Za-z]{2})$/);
  return m ? m[1].toUpperCase() : "US";
}
