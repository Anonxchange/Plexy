"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
import { useGiftCardCategories, useGiftCardCountries, useGiftCardProducts, type ReloadlyCategory, type ReloadlyProduct } from "@/hooks/use-reloadly";
import { useAirtimeOperators, type AirtimeOperator } from "@/hooks/use-airtime-operators";

const HERO_CARDS = [
  { n: "Steam", f: "$20", usd: 20, img: "/marketing-media/gift-cards/steam.jpeg" },
  { n: "Netflix", f: "$30", usd: 30, img: "/marketing-media/gift-cards/netflix.jpg" },
  { n: "Xbox", f: "$100", usd: 100, img: "/marketing-media/gift-cards/xbox.jpeg" },
  { n: "Razer Gold", f: "$100", usd: 100, img: "/marketing-media/gift-cards/razer.avif" },
  { n: "Starbucks", f: "$25", usd: 25, img: "/marketing-media/gift-cards/starbucks.jpeg" },
];
const WIDE_CARDS = [
  { n: "Razer Gold $100", img: "/marketing-media/gift-cards/razer.avif", r: -9, y: 44, z: 1 },
  { n: "Starbucks $25", img: "/marketing-media/gift-cards/starbucks.jpeg", r: -5, y: 16, z: 2, cls: " sbux" },
  { n: "Steam $20", img: "/marketing-media/gift-cards/steam.jpeg", r: -2, y: -4, z: 4 },
  { n: "Apple $50", img: "/marketing-media/gift-cards/apple-card.jpg", r: 1.5, y: 2, z: 5 },
  { n: "Netflix $30", img: "/marketing-media/gift-cards/netflix.jpg", r: 4.5, y: 20, z: 3 },
  { n: "Xbox $100", img: "/marketing-media/gift-cards/xbox.jpeg", r: 8, y: 46, z: 1 },
];
// Sample rates for the preview only. Replace with your live price feed.
const HERO_COINS = [
  { s: "USDT", r: 1, d: 2 },
  { s: "USDC", r: 1, d: 2 },
  { s: "BTC", r: 98000, d: 6 },
  { s: "ETH", r: 3400, d: 4 },
  { s: "SOL", r: 165, d: 3 },
];

const HERO_CSS = `
.pxg .ph-hero{--ph-bg:#fff;--ph-ink:#091e1c;--ph-mute:#52625f;--ph-line:#e3ebe9;--ph-lime:#d9f99d;--ph-chip:#f3f7f6;background:var(--ph-bg);color:var(--ph-ink);padding:40px 20px 36px;text-align:center;overflow:hidden}
.pxg .ph-hero .ph-wrap{max-width:1100px;margin:0 auto}
.export-page .pxg .ph-hero h1{font-size:clamp(42px,8.4vw,92px);line-height:.98;letter-spacing:-.045em;font-weight:800;margin:0;color:var(--ph-ink)}
.pxg .ph-hero .ph-sub{max-width:520px;margin:14px auto 0;color:var(--ph-mute);font-size:clamp(16px,2vw,19px);line-height:1.5}
.pxg .ph-hero .ph-cta:focus-visible,.pxg .ph-hero .ph-stage:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .ph-hero .ph-search{display:flex;align-items:center;gap:8px;width:min(520px,100%);height:58px;margin:20px auto 0;padding:0 6px 0 22px;background:#f3f7f6;border:1.5px solid #dbe5e3;border-radius:999px;text-align:left}
.pxg .ph-hero .ph-search:focus-within{border-color:#091e1c}
.pxg .ph-hero .ph-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font-family:inherit;font-weight:500;font-size:17px;line-height:1;color:#091e1c;padding:0;margin:0;box-shadow:none;-webkit-appearance:none;appearance:none}
.pxg .ph-hero .ph-search input::placeholder{color:#7b8a87;opacity:1}
.pxg .ph-hero .ph-search input::-webkit-search-cancel-button{display:none}
.pxg .ph-hero .ph-search button{flex:0 0 auto;display:grid;place-items:center;width:48px;height:48px;min-width:0;padding:0;margin:0;border:0;border-radius:50%;background:#bef264;cursor:pointer;transition:transform .15s;-webkit-appearance:none;appearance:none}
.pxg .ph-hero .ph-search button:active{transform:scale(.94)}
.pxg .ph-hero .ph-search button:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .ph-hero .ph-search svg{width:22px;height:22px;fill:none;stroke:#091e1c;stroke-width:2.4;stroke-linecap:round}
.pxg .ph-hero .ph-stage{--w:min(250px,58vw);--step:calc(var(--w)*.64);position:relative;height:calc(var(--w)*1.5 + 14px);margin:12px auto 0;perspective:1100px;touch-action:pan-y;user-select:none}
.pxg .ph-hero .ph-card{position:absolute;left:50%;top:10px;width:var(--w);aspect-ratio:2/3;margin-left:calc(var(--w)/-2);border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 18px 40px rgba(9,30,28,.22);cursor:pointer;transform:translateX(calc(var(--d)*var(--step))) rotateY(calc(var(--d)*-14deg)) scale(calc(1 - var(--a)*.12));opacity:calc(1 - var(--a)*.22);z-index:calc(10 - var(--a));transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .55s}
.pxg .ph-hero .ph-card img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;max-width:none}
.pxg .ph-hero .ph-card.sbux img{transform:scale(1.08)}
.pxg .ph-hero .ph-quote{margin:4px auto 0;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 20px;background:var(--ph-lime);color:#091e1c;border-radius:999px;font-weight:600;width:min(340px,88vw)}
.pxg .ph-hero .ph-quote b{font-size:19px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.pxg .ph-hero .ph-quote em{font-style:normal;font-size:15px}
.pxg .ph-hero .ph-btns{display:flex;gap:12px;justify-content:center;margin-top:18px}
.pxg .ph-hero .ph-cta{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 28px;border-radius:999px;font-weight:700;font-size:16px;text-decoration:none;border:1.5px solid var(--ph-ink);white-space:nowrap}
.pxg .ph-hero .ph-cta.solid{background:var(--ph-ink);color:#fff}
.pxg .ph-hero .ph-cta.ghost{background:transparent;color:var(--ph-ink)}
@media(max-width:560px){.pxg .ph-hero{padding:28px 16px 28px}.pxg .ph-hero .ph-btns{padding:0 4px}.pxg .ph-hero .ph-cta{flex:1;padding:0 10px;font-size:15px}}

.pxg .ph-wide{display:none}
@media(min-width:768px){
.pxg .ph-mob{display:none}
.pxg .ph-wide{display:block;padding:64px 20px 0;--ph-glow:rgba(190,242,100,.38)}
.export-page .pxg .ph-wide h1{font-size:clamp(56px,8.2vw,104px);line-height:.97}
.pxg .ph-wide .ph-sub{max-width:620px;font-size:clamp(17px,2vw,21px)}
.pxg .ph-wide .ph-btns{margin-top:30px}
.pxg .ph-wide .ph-cta{height:54px;padding:0 30px}
.pxg .ph-wide .pw-wrap{position:relative;max-width:1240px;margin:0 auto}
.pxg .ph-wide .pw-fan{--w:clamp(150px,17.5vw,236px);position:relative;display:flex;justify-content:center;align-items:flex-start;margin:64px auto 0;padding-top:46px;height:calc(var(--w)*1.12 + 46px);overflow:hidden}
.pxg .ph-wide .pw-fan:before{content:"";position:absolute;left:50%;bottom:-160px;width:min(1000px,130vw);height:360px;transform:translateX(-50%);background:radial-gradient(closest-side,var(--ph-glow),transparent);pointer-events:none}
.pxg .ph-wide .pw-item{position:relative;flex:0 0 auto;width:var(--w);margin-left:calc(var(--w)*-.1);transform:translateY(var(--y)) rotate(var(--r));transition:transform .35s cubic-bezier(.2,.8,.2,1);z-index:var(--z);cursor:pointer}
.pxg .ph-wide .pw-item:first-child{margin-left:0}
.pxg .ph-wide .pw-item:hover{transform:translateY(calc(var(--y) - 24px)) rotate(0) scale(1.05);z-index:30}
.pxg .ph-wide .pw-face{aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 16px 36px rgba(9,30,28,.22)}
.pxg .ph-wide .pw-face img{width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.pxg .ph-wide .pw-item.sbux img{transform:scale(1.08)}
.pxg .ph-wide .pw-tag{position:absolute;z-index:40;padding:9px 16px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 8px 20px rgba(9,30,28,.16)}
.pxg .ph-wide .pw-tag:after{content:"";position:absolute;bottom:-6px;width:12px;height:12px;background:inherit;transform:rotate(45deg);border-radius:2px}
.pxg .ph-wide .pw-tag.a{top:0;left:6%;background:#d9f99d;color:#091e1c}
.pxg .ph-wide .pw-tag.a:after{left:24px}
.pxg .ph-wide .pw-tag.b{top:10px;right:6%;background:#091e1c;color:#fff}
.pxg .ph-wide .pw-tag.b:after{right:24px}
}
@media(prefers-reduced-motion:reduce){.pxg .ph-hero .ph-card,.pxg .ph-wide .pw-item{transition:none}}
`;

// ---------------------------------------------------------------------------
// Gift card shelves, fed by the existing Reloadly edge functions
// ---------------------------------------------------------------------------
const PRODUCT_PATH = (id: number) => "/gift-cards/" + id; // change to your product route
const TOPUP_PATH = "/mobile-top-up"; // change to your top-up route
const SEE_ALL_PATH = "/gift-cards/all"; // route of the See all page (gift-cards-all.tsx)

type ShelfTile = { id: number; name: string; img: string; range: string; href: string; country?: string; usd?: number | null };
type ShelfBanner = { bg: string; text: string; img?: string };

let searchQuery = "";
const searchSubs = new Set<() => void>();
function setSearchQuery(q: string) {
  searchQuery = q;
  searchSubs.forEach((f) => f());
}
function useSearchQuery() {
  return useSyncExternalStore(
    (cb) => {
      searchSubs.add(cb);
      return () => {
        searchSubs.delete(cb);
      };
    },
    () => searchQuery,
    () => "",
  );
}

// Country the shelves show cards for: the visitor's choice, else a guess from
// the device time zone, else the browser language region.
const COUNTRY_KEY = "px-country";
let countryValue: string | null | undefined = undefined;
const countrySubs = new Set<() => void>();
function readSavedCountry(): string | null {
  try {
    const saved = window.localStorage.getItem(COUNTRY_KEY);
    return saved && /^[A-Za-z]{2}$/.test(saved) ? saved.toUpperCase() : null;
  } catch {
    return null;
  }
}
function setCountry(c: string, remember: boolean) {
  countryValue = c.toUpperCase();
  if (remember) {
    try {
      window.localStorage.setItem(COUNTRY_KEY, countryValue);
    } catch {
      /* ignore */
    }
  }
  countrySubs.forEach((f) => f());
}
function useCountry(): string | null {
  return useSyncExternalStore(
    (cb) => {
      countrySubs.add(cb);
      return () => {
        countrySubs.delete(cb);
      };
    },
    () => {
      if (countryValue === undefined) countryValue = readSavedCountry();
      return countryValue;
    },
    () => null,
  );
}
// Time zone -> country for the main markets. Used only to pick a starting country;
// visitors can change it with the "Cards for" picker.
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
function guessCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
  } catch {
    /* ignore */
  }
  const m = (navigator.language || "").match(/-([A-Za-z]{2})$/);
  return m ? m[1].toUpperCase() : "US";
}

function fmtNum(n: number) {
  return n >= 1000 ? Math.round(n).toLocaleString("en-US") : String(Math.round(n * 100) / 100);
}
function rangeText(min: number | null | undefined, max: number | null | undefined, cur?: string) {
  const a = min ?? max;
  const b = max ?? min;
  if (a == null || b == null) return "";
  return (a === b ? fmtNum(a) : fmtNum(a) + " – " + fmtNum(b)) + (cur ? " " + cur : "");
}

function giftTile(p: ReloadlyProduct): ShelfTile {
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
  };
}

function airTile(o: AirtimeOperator): ShelfTile {
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

const PREFERRED = ["amazon", "apple", "google play", "steam", "netflix", "spotify", "xbox", "playstation", "uber", "airbnb", "starbucks", "roblox", "razer", "target", "walmart"];
function preferredRank(p: ReloadlyProduct) {
  const hay = (p.brand?.brandName || p.productName || "").toLowerCase();
  const i = PREFERRED.findIndex((b) => hay.includes(b));
  return i < 0 ? 99 : i;
}

function uniqueByName(list: ReloadlyProduct[]) {
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = p.productName.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function uniqueByBrand(list: ReloadlyProduct[]) {
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = String(p.brand?.brandId ?? p.productName);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Popular and Top Up are fixed sections. Every other section is a real Reloadly
// category (loaded with categoryId), so titles and contents come from Reloadly.
// Put your own banner photos in /public and set `img` to use them.
type ShelfMeta = { title: string; tab: string; banner?: ShelfBanner; one?: boolean };
const POPULAR_META: ShelfMeta = { title: "2,000+ products in 180+ countries", tab: "Popular" };
const AIRTIME_META: ShelfMeta = { title: "Mobile top up", tab: "Top Up", one: true, banner: { bg: "#0b6e4f", text: "Airtime in seconds" } };
const BANNER_COLORS = ["#1b2a6b", "#0e6f8a", "#8a2f4d", "#3b1f5c", "#2d5a4a", "#8a5a3c", "#3b4a8f", "#0b6e4f"];
const MAX_CATEGORIES = 8;

// How many cards each section has, so tabs only show for sections that have cards.
const sectionCounts: Record<string, number> = {};
let countsVersion = 0;
const countSubs = new Set<() => void>();
function reportCount(id: string, n: number) {
  if (sectionCounts[id] === n) return;
  sectionCounts[id] = n;
  countsVersion++;
  countSubs.forEach((f) => f());
}
function useSectionCounts() {
  useSyncExternalStore(
    (cb) => {
      countSubs.add(cb);
      return () => {
        countSubs.delete(cb);
      };
    },
    () => countsVersion,
    () => 0,
  );
  return sectionCounts;
}

const SHELF_CSS = `
.pxg .gs{--gs-ink:#091e1c;--gs-mute:#52625f;--gs-line:#e3ebe9;--gs-field:#f3f7f6;color:var(--gs-ink)}
.pxg .gs .gs-w{max-width:1320px;margin:0 auto;padding:0 16px}
.pxg .gs .gs-cty{display:flex;align-items:center;gap:10px;padding:14px 0 6px;font-size:14px;font-weight:600;color:var(--gs-mute)}
.pxg .gs .gs-cty select{font-family:inherit;font-weight:700;font-size:14px;color:var(--gs-ink);background:var(--gs-field);border:1.5px solid var(--gs-line);border-radius:999px;padding:8px 14px;max-width:70vw;cursor:pointer}
.pxg .gs .gs-cty select:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .gs .gs-tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--gs-line);padding:0}
.pxg .gs .gs-tabs::-webkit-scrollbar{display:none}
.pxg .gs .gs-tab{flex:0 0 auto;border:0;background:transparent;font-family:inherit;font-weight:600;font-size:14px;line-height:1;color:var(--gs-mute);padding:12px 14px;cursor:pointer;border-bottom:3px solid transparent;margin:0;border-radius:0}
.pxg .gs .gs-tab[aria-pressed="true"]{color:var(--gs-ink);border-bottom-color:var(--gs-ink)}
.pxg .gs .gs-sec{padding-top:34px;scroll-margin-top:16px}
.pxg .gs .gs-sh{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.pxg .gs .gs-sh h2{margin:0;font-size:clamp(22px,3.4vw,30px);letter-spacing:-.03em;font-weight:800;color:var(--gs-ink)}
.pxg .gs .gs-sh a,.pxg .gs .gs-sh button{font-family:inherit;font-size:14px;font-weight:600;color:var(--gs-mute);background:none;border:0;padding:0;cursor:pointer;text-decoration:none}
.pxg .gs .gs-shd{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:14px;align-items:start}
.pxg .gs .gs-shd .gs-sh{flex-direction:column;align-items:flex-start;gap:6px;padding-top:6px}
.pxg .gs .gs-shd .gs-sh h2{font-size:clamp(20px,5.4vw,28px)}
.pxg .gs .gs-ban{height:104px;border-radius:14px;display:flex;flex-direction:column;justify-content:flex-end;padding:14px 16px;color:#fff;font-weight:800;font-size:clamp(20px,5vw,26px);line-height:1.05;letter-spacing:-.03em;overflow:hidden;position:relative;background-size:cover;background-position:center}
.pxg .gs .gs-ban svg{position:absolute;left:0;top:0;width:100%;height:60%;opacity:.3}
.pxg .gs .gs-ban span{position:relative}
.pxg .gs .gs-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:min(49vw,218px);gap:20px 14px;margin:14px -16px 0;padding:0 16px 6px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:16px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pxg .gs .gs-grid::-webkit-scrollbar{display:none}
.pxg .gs .gs-grid.one{grid-template-rows:auto}

.pxg .gs .gs-tile{display:block;text-decoration:none;color:inherit;scroll-snap-align:start}
.pxg .gs .gs-art{position:relative;aspect-ratio:1.586;border-radius:14px;overflow:hidden;display:grid;place-items:center;border:1px solid var(--gs-line);background:#fff;transition:transform .2s}
.pxg .gs .gs-tile:hover .gs-art{transform:translateY(-4px)}
.pxg .gs .gs-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;max-width:none}
.pxg .gs .gs-fb{padding:10px;text-align:center;font-weight:800;font-size:15px;color:#45524f}
.pxg .gs .gs-tn{margin-top:9px;font-weight:700;font-size:14px;line-height:1.25;color:var(--gs-ink)}
.pxg .gs .gs-ts{margin-top:2px;font-size:12.5px;color:var(--gs-mute);font-variant-numeric:tabular-nums}
.pxg .gs .gs-sk{aspect-ratio:1.586;border-radius:14px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:gs-pulse 1.2s linear infinite}
@keyframes gs-pulse{to{background-position:-200% 0}}
.pxg .gs .gs-sa-top{display:flex;align-items:center;gap:12px;padding-top:22px}
.pxg .gs .gs-back{display:grid;place-items:center;width:40px;height:40px;flex:0 0 auto;border:1.5px solid var(--gs-line);border-radius:50%;background:#fff;color:var(--gs-ink);font-size:18px;cursor:pointer;padding:0}
.pxg .gs .gs-sa-top h2{margin:0;font-size:clamp(26px,5vw,36px);letter-spacing:-.03em;font-weight:800}
.pxg .gs .gs-sa-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:16px 0 4px}
.pxg .gs .gs-pill{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--gs-mute)}
.pxg .gs .gs-pill select{font-family:inherit;font-weight:700;font-size:14px;color:var(--gs-ink);background:var(--gs-field);border:1.5px solid var(--gs-line);border-radius:999px;padding:9px 14px;max-width:62vw;cursor:pointer}
.pxg .gs .gs-pill select:focus-visible,.pxg .gs .gs-back:focus-visible{outline:3px solid #5b8cff;outline-offset:2px}
.pxg .gs .gs-count{font-size:13px;color:var(--gs-mute);padding:6px 0 0}
.pxg .gs .gs-more{display:block;margin:22px auto 0;height:46px;padding:0 24px;border:1.5px solid var(--gs-ink);border-radius:999px;background:transparent;color:var(--gs-ink);font-family:inherit;font-weight:700;font-size:15px;cursor:pointer}
.pxg .gs .gs-msg{margin:24px 0;color:var(--gs-mute);font-size:15px}
.pxg .gs .gs-msg button{font-family:inherit;font-weight:700;color:var(--gs-ink);background:none;border:0;text-decoration:underline;cursor:pointer;padding:0}
@media(min-width:700px){.pxg .gs .gs-grid{grid-auto-columns:226px;gap:20px 14px;margin:14px 0 0;padding:0 0 6px}.pxg .gs .gs-ban{height:190px}.pxg .gs .gs-shd{grid-template-columns:minmax(0,1fr) minmax(0,3fr)}}
@media(min-width:1000px){.pxg .gs .gs-grid{grid-auto-columns:calc((100% - 56px)/5.4)}.pxg .gs .gs-shd{grid-template-columns:calc((100% - 56px)/5.4) minmax(0,1fr)}.pxg .gs .gs-ban{height:240px}}
@media(max-width:699px){
.pxg .gs .gs-shd{display:block;position:relative}
.pxg .gs .gs-shd .gs-ban{height:158px;border-radius:16px;padding:0;margin:0 -10px}
.pxg .gs .gs-shd .gs-ban svg{height:100%}
.pxg .gs .gs-shd .gs-ban span{display:none}
.pxg .gs .gs-shd .gs-ban:after{content:"";position:absolute;left:0;right:0;bottom:0;height:60%;background:linear-gradient(to top,rgba(0,0,0,.45),transparent)}
.pxg .gs .gs-shd .gs-sh{position:absolute;z-index:3;left:6px;right:4px;bottom:14px;padding:0;flex-direction:row;justify-content:space-between;align-items:flex-end;gap:10px}
.pxg .gs .gs-shd .gs-sh h2{color:#fff;font-size:26px;line-height:1}
.pxg .gs .gs-shd .gs-sh a,.pxg .gs .gs-shd .gs-sh button{background:#fff;color:#091e1c;padding:8px 13px;border-radius:99px;font-size:13px;font-weight:700;flex:0 0 auto}
}
.pxg .gs .gs-grid.wrap{grid-auto-flow:row;grid-template-rows:none;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-columns:auto;overflow:visible;margin:14px 0 0;padding:0}
@media(min-width:700px){.pxg .gs .gs-grid.wrap{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1000px){.pxg .gs .gs-grid.wrap{grid-template-columns:repeat(5,minmax(0,1fr))}}
`;

function ShelfTileView({ t, showCountry }: { t: ShelfTile; showCountry?: boolean }) {
  return (
    <a className={"gs-tile"} href={t.href}>
      <div className={"gs-art"}>
        <span className={"gs-fb"}>{t.name}</span>
        {t.img ? (
          <img
            src={t.img}
            alt={""}
            loading={"lazy"}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <div className={"gs-tn"}>{t.name}</div>
      {t.range || (showCountry && t.country) ? <div className={"gs-ts"}>{[showCountry ? t.country : "", t.range].filter(Boolean).join(" · ")}</div> : null}
    </a>
  );
}

function ShelfSectionView({ id, meta, tiles, loading, seeAllHref }: { id: string; meta: ShelfMeta; tiles: ShelfTile[]; loading?: boolean; seeAllHref?: string }) {
  const head = (
    <div className={"gs-sh"}>
      <h2>{meta.title}</h2>
      {seeAllHref ? <a href={seeAllHref}>{"See all"}</a> : null}
    </div>
  );
  return (
    <section className={"gs-sec"} id={"gs-s-" + id}>
      {meta.banner ? (
        <div className={"gs-shd"}>
          {head}
          <div
            className={"gs-ban"}
            style={meta.banner.img ? { backgroundImage: "url(" + meta.banner.img + ")" } : { background: meta.banner.bg }}
          >
            {meta.banner.img ? null : (
              <svg viewBox={"0 0 120 70"} preserveAspectRatio={"xMidYMid slice"} aria-hidden={"true"}>
                <circle cx={"40"} cy={"30"} r={"34"} fill={"#fff"}></circle>
                <circle cx={"92"} cy={"22"} r={"22"} fill={"#fff"}></circle>
              </svg>
            )}
            <span>{meta.banner.text}</span>
          </div>
        </div>
      ) : (
        head
      )}
      <div className={"gs-grid" + (meta.one ? " one" : "")}>
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className={"gs-sk"}></div>)
          : tiles.map((t) => <ShelfTileView key={id + "-" + t.id} t={t} />)}
      </div>
    </section>
  );
}

function CategorySection({ cat, index, country, plain }: { cat: ReloadlyCategory; index: number; country: string; plain?: boolean }) {
  const res = useGiftCardProducts({ countryCode: country, categoryId: cat.id, size: 100, page: 1, staleTime: 1000 * 60 * 10 });
  const tiles = useMemo(
    () => uniqueByName((res.data?.content ?? []).filter((p) => p.status !== "INACTIVE")).slice(0, 20).map(giftTile),
    [res.data],
  );
  const id = "cat-" + cat.id;
  useEffect(() => {
    reportCount(id, res.isLoading ? -1 : tiles.length);
  }, [id, res.isLoading, tiles.length]);
  if (!res.isLoading && tiles.length === 0) return null;
  const meta: ShelfMeta = {
    title: cat.name,
    tab: cat.name,
    banner: plain ? undefined : { bg: BANNER_COLORS[index % BANNER_COLORS.length], text: cat.name },
  };
  return <ShelfSectionView id={id} meta={meta} tiles={tiles} loading={res.isLoading} seeAllHref={SEE_ALL_PATH + "?category=" + cat.id + "&name=" + encodeURIComponent(cat.name)} />;
}

function GiftShelf({ part }: { part: "top" | "bottom" }) {
  const country = useCountry();
  const q = useSearchQuery();
  const [activeTab, setActiveTab] = useState("popular");
  const counts = useSectionCounts();
  const countries = useGiftCardCountries({ enabled: part === "top" });
  const categories = useGiftCardCategories();

  useEffect(() => {
    if (part === "top" && !country && countryValue == null) setCountry(guessCountry(), false);
  }, [part, country]);

  // Popular: one batch for the country, ordered by the PREFERRED brand list
  const list = useGiftCardProducts({ countryCode: country ?? undefined, size: 200, page: 1, staleTime: 1000 * 60 * 10, enabled: !!country && part === "top" });
  // Search is not limited to the picked country: it looks through every card Reloadly has
  const found = useGiftCardProducts({ productName: q, size: 60, page: 1, enabled: !!q, staleTime: 1000 * 60 * 10 });
  const air = useAirtimeOperators(country ?? undefined, part === "top");

  const popular = useMemo(() => {
    const all = (list.data?.content ?? []).filter((p) => p.status !== "INACTIVE" && p.logoUrls?.length);
    return uniqueByBrand(all)
      .sort((a, b) => preferredRank(a) - preferredRank(b))
      .slice(0, 20)
      .map(giftTile);
  }, [list.data]);
  const airtime = useMemo(() => (air.data ?? []).slice(0, 12).map(airTile), [air.data]);

  // "Payment" category goes below "What happens after you pay"; the rest are shelves up here
  const cats = categories.data ?? [];
  const payCat = cats.find((c) => /payment|prepaid/i.test(c.name));
  const topCats = cats.filter((c) => c !== payCat).slice(0, MAX_CATEGORIES);

  if (part === "bottom") {
    if (q || !country || !payCat) return null;
    return (
      <div className={"gs"}>
        <style>{SHELF_CSS}</style>
        <div className={"gs-w"}>
          <CategorySection cat={payCat} index={0} country={country} plain />
        </div>
      </div>
    );
  }

  const goTab = (id: string) => {
    setActiveTab(id);
    document.getElementById("gs-s-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const tabs: { id: string; label: string }[] = [];
  if (popular.length || list.isLoading) tabs.push({ id: "popular", label: POPULAR_META.tab });
  if (airtime.length) tabs.push({ id: "airtime", label: AIRTIME_META.tab });
  if (payCat && (counts["cat-" + payCat.id] ?? 0) > 0) tabs.push({ id: "cat-" + payCat.id, label: payCat.name });
  topCats.forEach((c) => {
    if ((counts["cat-" + c.id] ?? 0) > 0) tabs.push({ id: "cat-" + c.id, label: c.name });
  });
  const resultTiles = uniqueByName((found.data?.content ?? []).filter((p) => p.status !== "INACTIVE")).map(giftTile);

  return (
    <div className={"gs"} id={"gs-top"}>
      <style>{SHELF_CSS}</style>
      <div className={"gs-w"}>
        <label className={"gs-cty"}>
          <span>{"Cards for"}</span>
          <select value={country ?? ""} onChange={(e) => setCountry(e.target.value, true)} aria-label={"Country"}>
            {country && !(countries.data ?? []).some((c) => c.isoName === country) ? <option value={country}>{country}</option> : null}
            {(countries.data ?? []).map((c) => (
              <option key={c.isoName} value={c.isoName}>
                {c.flag + " " + c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {q ? null : (
        <div className={"gs-w"}>
          <div className={"gs-tabs"} role={"tablist"}>
            {tabs.map((t) => (
              <button key={t.id} type={"button"} className={"gs-tab"} aria-pressed={activeTab === t.id} onClick={() => goTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={"gs-w"}>
        {q ? (
          <section className={"gs-sec"}>
            <div className={"gs-sh"}>
              <h2>{"Results for “" + q + "” in all countries"}</h2>
              <button type={"button"} onClick={() => setSearchQuery("")}>
                {"Clear search"}
              </button>
            </div>
            {found.isLoading ? (
              <div className={"gs-grid wrap"}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={"gs-sk"}></div>
                ))}
              </div>
            ) : resultTiles.length ? (
              <div className={"gs-grid wrap"}>
                {resultTiles.map((t) => (
                  <ShelfTileView key={"r-" + t.id} t={t} showCountry />
                ))}
              </div>
            ) : (
              <p className={"gs-msg"}>{"No gift cards found. Try another name."}</p>
            )}
          </section>
        ) : list.isError ? (
          <p className={"gs-msg"}>
            {"Cards couldn’t be loaded right now. "}
            <button type={"button"} onClick={() => list.refetch()}>
              {"Try again"}
            </button>
          </p>
        ) : (
          <>
            {popular.length || list.isLoading ? <ShelfSectionView id={"popular"} meta={POPULAR_META} tiles={popular} loading={list.isLoading} seeAllHref={SEE_ALL_PATH} /> : null}
            {airtime.length ? <ShelfSectionView id={"airtime"} meta={AIRTIME_META} tiles={airtime} seeAllHref={SEE_ALL_PATH + "?type=airtime"} /> : null}
            {country ? topCats.map((c, i) => <CategorySection key={c.id} cat={c} index={i} country={country} />) : null}
          </>
        )}
      </div>
    </div>
  );
}

function heroSearchGo() {
  const el = document.getElementById("gs-q") as HTMLInputElement | null;
  setSearchQuery((el?.value || "").trim());
  setTimeout(() => document.getElementById("gs-top")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function HeroCarousel() {
  const [cur, setCur] = useState(0);
  const [auto, setAuto] = useState(true);
  const startX = useRef<number | null>(null);
  const N = HERO_CARDS.length;

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setCur((c) => (c + 1) % N), 3200);
    return () => clearInterval(t);
  }, [auto, N]);

  const go = (i: number) => {
    setAuto(false);
    setCur(((i % N) + N) % N);
  };
  const c = HERO_CARDS[cur];
  const k = HERO_COINS[0];

  return (
    <>
    <section className={"ph-hero ph-mob"}>
      <style>{HERO_CSS}</style>
      <div className={"ph-wrap"}>
        <h1>
          {"Gift cards,"}
          <br />
          {"paid in crypto."}
        </h1>
        <p className={"ph-sub"}>
          {"Steam, Netflix, Xbox, Apple and more. Pay with the coin you hold and your code arrives by email."}
        </p>
        <div className={"ph-search"}>
          <input
            id={"gs-q"}
            type={"search"}
            placeholder={"2000+ gift cards worldwide"}
            aria-label={"Search gift cards"}
            autoComplete={"off"}
            enterKeyHint={"search"}
            onKeyDown={(e) => {
              if (e.key === "Enter") heroSearchGo();
            }}
          />
          <button id={"gs-go"} type={"button"} aria-label={"Search"} onClick={() => heroSearchGo()}>
            <svg viewBox={"0 0 24 24"} aria-hidden={"true"}>
              <circle cx={"11"} cy={"11"} r={"7"}></circle>
              <path d={"M20 20l-4-4"}></path>
            </svg>
          </button>
        </div>
        <div
          className={"ph-stage"}
          tabIndex={0}
          aria-roledescription={"carousel"}
          aria-label={"Gift cards"}
          onPointerDown={(e) => {
            startX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(cur + 1);
            if (e.key === "ArrowLeft") go(cur - 1);
          }}
        >
          {HERO_CARDS.map((x, i) => {
            let d = i - cur;
            if (d > N / 2) d -= N;
            if (d < -N / 2) d += N;
            const a = Math.abs(d);
            return (
              <div
                key={x.n}
                className={"ph-card" + (x.n === "Starbucks" ? " sbux" : "")}
                role={"group"}
                aria-label={x.n + " " + x.f + " gift card"}
                style={{ "--d": d, "--a": a, display: a > 2 ? "none" : undefined } as React.CSSProperties}
                onClick={() => go(i)}
              >
                <img src={x.img} alt={""} draggable={false} />
              </div>
            );
          })}
        </div>
        <div className={"ph-quote"} aria-live={"polite"}>
          <em>{c.n + " " + c.f}</em>
          <b>{(c.usd / k.r).toFixed(k.d) + " " + k.s}</b>
        </div>
        <div className={"ph-btns"}>
          <a className={"ph-cta solid"} href={"#gs-top"}>
            {"Browse cards"}
          </a>
          <a className={"ph-cta ghost"} href={"#g-after"}>
            {"How it works"}
          </a>
        </div>
      </div>
    </section>
    <section className={"ph-hero ph-wide"}>
      <div className={"ph-wrap"}>
        <h1>
          {"Gift cards,"}
          <br />
          {"paid in crypto."}
        </h1>
        <p className={"ph-sub"}>
          {"Steam, Netflix, Xbox, Apple and more. Pay with the coin you hold and your code arrives by email."}
        </p>
        <div className={"ph-btns"}>
          <a className={"ph-cta solid"} href={"#gs-top"}>
            {"Browse cards"}
          </a>
          <a className={"ph-cta ghost"} href={"#g-after"}>
            {"How it works"}
          </a>
        </div>
      </div>
      <div className={"pw-wrap"}>
        <span className={"pw-tag a"}>{"Paid in USDT"}</span>
        <span className={"pw-tag b"}>{"Code in minutes"}</span>
        <div className={"pw-fan"}>
          {WIDE_CARDS.map((x) => (
            <div key={x.n} className={"pw-item" + (x.cls || "")} style={{ "--r": x.r + "deg", "--y": x.y + "px", "--z": x.z } as React.CSSProperties}>
              <div className={"pw-face"}>
                <img src={x.img} alt={x.n + " gift card"} draggable={false} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

export function GiftCardsExport() {
  return (
    <CurrentMarketingPage page="gift-cards">
    <div className={"page-wrapper"}>
      <header className={"px-nav"} id={"pxnav"}>
        <div className={"px-nav-in"}>
          <a className={"px-logo"} href={"#"} data-px-link={"home"}>
            <span className={"px-logo-mark"}>
              {"p"}
            </span>
            <span>
              {"pexly"}
            </span>
          </a>
          <nav className={"px-menu"} id={"pxmenu"} aria-label={"Main"}>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Marketplace "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"giftcards"}>
                  <b>
                    {"Gift Cards"}
                  </b>
                  <small>
                    {"Shopping, gaming, streaming"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"topup"}>
                  <b>
                    {"Mobile Top Up"}
                  </b>
                  <small>
                    {"Airtime and data, anywhere"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"shop"}>
                  <b>
                    {"Physical Products"}
                  </b>
                  <small>
                    {"Electronics, fashion, home"}
                  </small>
                </a>
              </div>
            </div>
            <a className={"px-l"} href={"#"} data-px-link={"giftcards"}>
              {"Gift Cards"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"shop"}>
              {"Physical Products"}
            </a>
            <a className={"px-l"} href={"#"} data-px-link={"blog"}>
              {"Blog"}
            </a>
            <div className={"px-dd"}>
              <button className={"px-dd-t"} type={"button"} aria-expanded={"false"}>
                {"Company "}
                <i></i>
              </button>
              <div className={"px-dd-l"}>
                <a href={"#"} data-px-link={"about"}>
                  <b>
                    {"About Pexly"}
                  </b>
                  <small>
                    {"Our mission and story"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"team"}>
                  <b>
                    {"Our Team"}
                  </b>
                  <small>
                    {"The people behind Pexly"}
                  </small>
                </a>
                <a href={"#"} data-px-link={"careers"}>
                  <b>
                    {"Careers"}
                  </b>
                  <small>
                    {"Open roles"}
                  </small>
                </a>
              </div>
            </div>
            <div className={"px-mob-btns"}>
              <a className={"px-btn ghost"} href={"#"}>
                {"Connect Wallet"}
              </a>
              <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
                {"Start Shopping"}
              </a>
            </div>
          </nav>
          <div className={"px-right"}>
            <a className={"px-btn ghost"} href={"#"}>
              {"Connect Wallet"}
            </a>
            <a className={"px-btn solid"} href={"#"} data-px-link={"giftcards"}>
              {"Start Shopping"}
            </a>
          </div>
          <button className={"px-burger"} id={"pxburger"} aria-label={"Menu"} aria-expanded={"false"}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <main id={"top"}>
        <div className={"pxg"}>
          <HeroCarousel />
          <GiftShelf part={"top"} />
          <div id={"g-bar"} hidden>
            <div className={"g-coins"}></div>
          </div>
          <div className={"g-main"}>
            <div className={"g-w"}>
              <div id={"g-shelf"} hidden></div>
              <div className={"g-after"} id={"g-after"}>
                <div>
                  <h2>
                    {"What happens after you pay"}
                  </h2>
                  <p>
                    {"No account, no card details. You pay from your wallet and the code comes to your inbox."}
                  </p>
                </div>
                <div className={"g-rc"}>
                  <h3>
                    {"Typical timing"}
                  </h3>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"0:00"}
                    </div>
                    <div>
                      <b>
                        {"You send the coin"}
                      </b>
                      <span>
                        {"From your own wallet to the address we show."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~0:30"}
                    </div>
                    <div>
                      <b>
                        {"The network confirms"}
                      </b>
                      <span>
                        {"Speed depends on the coin you picked."}
                      </span>
                    </div>
                  </div>
                  <div className={"r"}>
                    <div className={"tt"}>
                      {"~2:00"}
                    </div>
                    <div>
                      <b>
                        {"The code is in your inbox"}
                      </b>
                      <span>
                        {"Check spam if you don’t see it."}
                      </span>
                    </div>
                  </div>
                  <small>
                    {"Typical timings. Busy networks can take longer."}
                  </small>
                </div>
              </div>
              <div id={"g-more"} hidden></div>
            </div>
          </div>
          <GiftShelf part={"bottom"} />
          <section className={"sp-sec"}>
            <div className={"padding-global"}>
              <div className={"container-large"}>
                <h2 className={"sp-h center"}>
                  {"Explore the rest of the marketplace"}
                </h2>
                <div className={"sp-looks"}>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-f9de0167e3e0ed2c.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"topup"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Shop Top Ups"}
                    </a>
                  </figure>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-1ee388ec36d8c9a7.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"shop"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Shop Physical Products"}
                    </a>
                  </figure>
                  <figure className={"sp-look"}>
                    <img src={"/marketing-media/media-d9e7636fc944d27d.avif"} alt={""} loading={"lazy"} />
                    <a className={"sp-pill"} href={"#"} data-px-link={"shop"}>
                      <svg viewBox={"0 0 24 24"} width={"20"} height={"20"} fill={"none"} stroke={"#091e1c"} strokeWidth={"1.8"}>
                        <path d={"M3 12l9-9h8v8l-9 9z"}></path>
                        <circle cx={"16"} cy={"8"} r={"1.2"}></circle>
                      </svg>
                      {"Start Selling"}
                    </a>
                  </figure>
                </div>
              </div>
            </div>
          </section>
          <section className={"sp-reviews"}>
            <div className={"padding-global"}>
              <div className={"container-large"}>
                <div className={"sp-stars"}>
                  {"★★★★★"}
                </div>
                <h2 className={"sp-h center"}>
                  {"What people are saying"}
                </h2>
                <div className={"sp-row"}>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Bought a Steam card with USDT and the code landed in my inbox in two minutes."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Tunde A."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Easy way to gift my sister an Amazon card abroad. No bank transfer needed."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Chloe R."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Clear total in my coin before paying. No surprises."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Ibrahim S."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                  <article className={"sp-rev"}>
                    <div className={"st"}>
                      {"★★★★★"}
                    </div>
                    <p>
                      {"Finally a simple place to spend crypto on Netflix and Spotify."}
                    </p>
                    <div className={"by"}>
                      <b>
                        {"Grace M."}
                      </b>
                      <span>
                        <i>
                          {"✓"}
                        </i>
                        {"Verified buyer"}
                      </span>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
          <div className={"g-main"}>
            <div className={"g-w"}>
              <div className={"g-faq"}>
                <div>
                  <h2>
                    {"Questions people ask"}
                  </h2>
                  <p className={"s"}>
                    {"Can’t find yours? Contact support from the footer."}
                  </p>
                </div>
                <div>
                  <details>
                    <summary>
                      {"Which coins can I pay with?"}
                    </summary>
                    <p>
                      {"USDT, USDC, Bitcoin, Ethereum, Solana and Litecoin. Pick one in the bar and all prices switch to it."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Do I need an account?"}
                    </summary>
                    <p>
                      {"No. Choose a card, pay, and the code is sent to the email you enter."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"How fast does the code arrive?"}
                    </summary>
                    <p>
                      {"Usually within a few minutes of your payment confirming."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Can I get a refund?"}
                    </summary>
                    <p>
                      {"Codes can’t be refunded once revealed. If a code doesn’t work, contact support within 24 hours."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Why do I only see some cards?"}
                    </summary>
                    <p>
                      {"Many cards only work in one country. Pick your country and you will only see cards that work for you."}
                    </p>
                  </details>
                  <details>
                    <summary>
                      {"Are there extra fees?"}
                    </summary>
                    <p>
                      {"The price shown is the card price in your coin. Your wallet’s network fee is separate and shown before you confirm."}
                    </p>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
        <section id={"start"} className={"sp-signup"}>
          <svg className={"wave"} viewBox={"0 0 1440 120"} preserveAspectRatio={"none"}>
            <path d={"M0 120V60C120 20 240 0 380 30s260 70 420 40 260-60 400-30 180 50 240 30v80z"} fill={"#091e1c"}></path>
          </svg>
          <div className={"padding-global"}>
            <div className={"container-large"}>
              <div className={"in"}>
                <h2>
                  {"Get 5% back on your first order when you sign up for email!"}
                </h2>
                <div className={"f"}>
                  <input type={"email"} placeholder={"Email address"} aria-label={"Email"} />
                  <button aria-label={"Subscribe"}>
                    {"→"}
                  </button>
                </div>
                <small>
                  {"By submitting this form you agree to receive marketing emails from Pexly. Unsubscribe at any time."}
                </small>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className={"footer"}>
        <div className={"padding-global"}>
          <div className={"container-large"}>
            <div className={"footer-content-box"}>
              <div className={"footer-content-upper"}>
                <div className={"footer-upper-left-content"}>
                  <div className={"footer-upper-logo-block"}>
                    <span className={"px-flogo"}>
                      <span className={"px-logo-mark"}>
                        {"p"}
                      </span>
                      {"pexly"}
                    </span>
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular text-lightgrey"}>
                      {"Pexly is one decentralized marketplace for shopping with crypto."}
                      <br />
                      {"‍"}
                      <br />
                      {" Buy gift cards, top up mobile phones and order physical products, all from your own wallet."}
                    </p>
                  </div>
                  <div className={"footer-upper-coin-icon-block"}>
                    <img src={"/marketing-media/media-e04327e51cd5c862.avif"} loading={"lazy"} alt={""} className={"footer-upper-coin"} />
                  </div>
                  <div className={"footer-upper-text-block"}>
                    <p className={"p-regular light-gray"}>
                      {"Decentralized. Non-custodial. Borderless."}
                    </p>
                  </div>
                  <div className={"footer-social-link-wrap"}>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 14 12"} fill={"none"} className={"footer-social-link-icon"}>
                        <path d={"M10.4416 0H12.3925L8.1304 4.87129L13.1444 11.5H9.21849L6.1436 7.4797L2.62515 11.5H0.673105L5.23183 6.2896L0.421875 0H4.44747L7.22689 3.6747L10.4416 0ZM9.7569 10.3323H10.8379L3.86009 1.10636H2.70006L9.7569 10.3323Z"} fill={"currentColor"}></path>
                      </svg>
                    </a>
                    <a href={"#"} className={"footer-social-link-block w-inline-block"}>
                      <svg xmlns={"http://www.w3.org/2000/svg"} width={"100%"} viewBox={"0 0 20 20"} fill={"none"} className={"footer-social-link-icon"}>
                        <mask id={"mask0_3988_4230"} style={{"maskType": "luminance"} as any} maskUnits={"userSpaceOnUse"} x={"3"} y={"2"} width={"14"} height={"16"}>
                          <path d={"M17 2.75H3V17.522H17V2.75Z"} fill={"white"}></path>
                        </mask>
                        <g mask={"url(#mask0_3988_4230)"}>
                          <path d={"M10.7972 7.88289C11.0942 7.10744 11.7173 6.8054 12.4559 6.69064C13.1348 6.58479 13.8207 6.57277 14.4984 6.71196C15.479 6.91319 16.1533 7.49168 16.5297 8.41485C16.8008 9.0798 16.9423 9.77771 16.9508 10.4919C16.978 12.7589 16.9834 15.0259 17.0043 17.293C17.0059 17.481 16.9322 17.5186 16.7651 17.5175C15.8799 17.5116 14.9947 17.5093 14.1096 17.519C13.9095 17.5213 13.8599 17.4546 13.8606 17.2635C13.8665 15.3253 13.8657 13.387 13.8626 11.4488C13.8618 11.0987 13.8273 10.7489 13.6544 10.4345C13.369 9.91496 12.8708 9.775 12.3373 9.77383C11.7894 9.77267 11.2509 9.89984 11.0031 10.4566C10.8686 10.7586 10.8088 11.1173 10.8057 11.4511C10.7879 13.37 10.7972 15.2888 10.7968 17.2077C10.7968 17.4121 10.695 17.5145 10.4913 17.5147C9.6321 17.5147 8.77251 17.5101 7.91331 17.5182C7.72488 17.5202 7.65586 17.474 7.65625 17.2713C7.66207 13.8019 7.66168 10.3321 7.65703 6.86279C7.65703 6.67707 7.7117 6.61852 7.89858 6.62046C8.78376 6.6286 9.66894 6.63015 10.5541 6.61968C10.7581 6.61736 10.8073 6.69025 10.8003 6.87791C10.7879 7.21252 10.7972 7.5479 10.7972 7.88289Z"} fill={"currentColor"}></path>
                          <path d={"M6.14019 12.0889C6.14019 13.8073 6.14019 15.5261 6.14019 17.2445C6.14019 17.5186 6.13902 17.5198 5.86102 17.5198C4.98864 17.5201 4.11665 17.5155 3.24465 17.5232C3.06126 17.5248 3.00038 17.4721 3.00038 17.2832C3.00542 13.8139 3.00542 10.3445 3 6.87513C3 6.677 3.06126 6.62311 3.25396 6.62505C4.12595 6.63396 4.99833 6.62854 5.87033 6.62892C6.13864 6.62892 6.1398 6.63009 6.1398 6.89413C6.14019 8.62571 6.14019 10.3573 6.14019 12.0889Z"} fill={"currentColor"}></path>
                          <path d={"M6.13554 4.32223C6.13477 5.21361 5.45818 5.88631 4.56331 5.88554C3.67232 5.88476 2.99961 5.2078 3 4.31292C3.00078 3.42193 3.67736 2.74923 4.57223 2.75C5.46439 2.75078 6.13593 3.4262 6.13554 4.32223Z"} fill={"currentColor"}></path>
                        </g>
                      </svg>
                    </a>
                  </div>
                </div>
                <div className={"footer-upper-right-content"}>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Marketplace"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Gift Cards"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Mobile Top Up"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Physical Products"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Open a Store"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Order History"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Price Alerts"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Wallet"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Connect Wallet"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with BTC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with ETH"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDT"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Pay with USDC"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Fees"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Support"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Help Center"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Dispute Resolution"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Contact Us"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"FAQ"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Report a Seller"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Status"}
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className={"footer-links-wrapper"}>
                    <div className={"footer-link-title-block"}>
                      <div className={"footer-link-title"}>
                        {"Company"}
                      </div>
                    </div>
                    <div className={"footer-links-block"}>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"About Pexly"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Blog"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Careers"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Press"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Terms"}
                        </div>
                      </a>
                      <a href={"#"} className={"footer-link-item w-inline-block"}>
                        <div className={"p-regular light-gray"}>
                          {"Privacy"}
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className={"footer-bottom-content-wrap"}>
                <div className={"footer-big-logo-wrap"}>
                  <div className={"px-big"}>
                    {"PEXLY"}
                  </div>
                  <div className={"footer-logo-line"}></div>
                </div>
                <div className={"footer-bottom-text-wrapper"}>
                  <div className={"footer-bottom-text-left"}>
                    <p className={"p-xs light-gray"}>
                      {"2026 — All rights reserved. Pexly is a decentralized, non-custodial marketplace. Crypto assets are volatile, so only spend what you can afford to. Availability of gift cards, top ups and products varies by region."}
                    </p>
                  </div>
                  <div className={"footer-bottom-link-wrap"}>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Terms & policies"}
                      </div>
                    </a>
                    <a href={"#"} className={"footer-link-item w-inline-block"}>
                      <div className={"p-xs light-gray"}>
                        {"Privacy Policy"}
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </CurrentMarketingPage>
  );
}
