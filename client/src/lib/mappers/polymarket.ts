import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { isValidNumber } from "@/lib/validators";
import type { PolymarketMarket } from "@/hooks/use-polymarket";

export function mapPolymarketMarket(raw: unknown): PolymarketMarket {
  const r = raw as Record<string, unknown>;
  return {
    id: typeof r.id === "string" ? r.id : "",
    question: sanitizeText(typeof r.question === "string" ? r.question : ""),
    description: sanitizeText(typeof r.description === "string" ? r.description : ""),
    conditionId: typeof r.conditionId === "string" ? r.conditionId : "",
    slug: typeof r.slug === "string" ? r.slug : "",
    image: sanitizeUrl(typeof r.image === "string" ? r.image : ""),
    icon: sanitizeUrl(typeof r.icon === "string" ? r.icon : ""),
    active: Boolean(r.active),
    closed: Boolean(r.closed),
    archived: Boolean(r.archived),
    clobTokenIds: typeof r.clobTokenIds === "string" ? r.clobTokenIds : "",
    outcomePrices: typeof r.outcomePrices === "string" ? r.outcomePrices : "",
    outcomes: typeof r.outcomes === "string" ? r.outcomes : "",
    volume: typeof r.volume === "string" ? r.volume : "0",
    volumeNum: isValidNumber(r.volumeNum) ? r.volumeNum : 0,
    liquidity: typeof r.liquidity === "string" ? r.liquidity : "0",
    liquidityNum: isValidNumber(r.liquidityNum) ? r.liquidityNum : 0,
    endDate: typeof r.endDate === "string" ? r.endDate : "",
    startDate: typeof r.startDate === "string" ? r.startDate : "",
    tags: Array.isArray(r.tags) ? r.tags.map(t => sanitizeText(String(t))) : [],
    bestBid: isValidNumber(r.bestBid) ? r.bestBid : 0,
    bestAsk: isValidNumber(r.bestAsk) ? r.bestAsk : 0,
    lastTradePrice: isValidNumber(r.lastTradePrice) ? r.lastTradePrice : 0,
  };
}
