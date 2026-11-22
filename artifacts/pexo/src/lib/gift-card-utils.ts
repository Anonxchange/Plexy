// Helpers shared by the "See all" page (gift-cards-all.tsx).
import type { ReloadlyProduct } from "@/hooks/use-reloadly";
import type { AirtimeOperator } from "@/hooks/use-airtime-operators";

export const PRODUCT_PATH = (id: number) =>
  Number.isSafeInteger(id) && id > 0 ? "/gift-cards/" + id : "/gift-cards/all";
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
