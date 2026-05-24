import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { isValidNumber } from "@/lib/validators";
import type { PolymarketMarket } from "@/hooks/use-polymarket";

export function mapPolymarketMarket(raw: unknown): PolymarketMarket {
  const r = raw as Record<string, unknown>;
  return {
    id:             typeof r.id === "string" ? r.id : "",
    question:       sanitizeText(typeof r.question === "string" ? r.question : ""),
    description:    sanitizeText(typeof r.description === "string" ? r.description : ""),
    conditionId:    typeof r.conditionId === "string" ? r.conditionId : "",
    slug:           typeof r.slug === "string" ? r.slug : "",
    image:          sanitizeUrl(typeof r.image === "string" ? r.image : ""),
    icon:           sanitizeUrl(typeof r.icon === "string" ? r.icon : ""),
    active:         Boolean(r.active),
    closed:         Boolean(r.closed),
    archived:       Boolean(r.archived),
    clobTokenIds:   typeof r.clobTokenIds === "string" ? r.clobTokenIds : "",
    outcomePrices:  typeof r.outcomePrices === "string" ? r.outcomePrices : "",
    outcomes:       typeof r.outcomes === "string" ? r.outcomes : "",
    volume:         typeof r.volume === "string" ? r.volume : "0",
    volumeNum:      isValidNumber(r.volumeNum)  ? r.volumeNum  : 0,
    volume24hr:     isValidNumber(r.volume24hr) ? r.volume24hr : 0,
    volume1wk:      isValidNumber(r.volume1wk)  ? r.volume1wk  : 0,
    volume1mo:      isValidNumber(r.volume1mo)  ? r.volume1mo  : 0,
    volume1yr:      isValidNumber(r.volume1yr)  ? r.volume1yr  : 0,
    liquidity:      typeof r.liquidity === "string" ? r.liquidity : "0",
    liquidityNum:   isValidNumber(r.liquidityNum) ? r.liquidityNum : 0,
    endDate:        typeof r.endDate   === "string" ? r.endDate   : "",
    startDate:      typeof r.startDate === "string" ? r.startDate : "",
    tags: Array.isArray(r.tags)
      ? r.tags.map((t: Record<string, unknown>) => ({
          id:         typeof t.id    === "string" ? t.id    : "",
          label:      typeof t.label === "string" ? sanitizeText(t.label) : "",
          slug:       typeof t.slug  === "string" ? t.slug  : "",
          forceShow:  Boolean(t.forceShow),
          forceHide:  Boolean(t.forceHide),
          isCarousel: Boolean(t.isCarousel),
        }))
      : [],
    bestBid:        isValidNumber(r.bestBid)        ? r.bestBid        : 0,
    bestAsk:        isValidNumber(r.bestAsk)        ? r.bestAsk        : 0,
    lastTradePrice: isValidNumber(r.lastTradePrice) ? r.lastTradePrice : 0,
    negRisk:        Boolean(r.negRisk),
    negRiskOther:   Boolean(r.negRiskOther),
    minimumTickSize: typeof r.minimumTickSize === "string" ? r.minimumTickSize : undefined,
    enableOrderBook: r.enableOrderBook != null ? Boolean(r.enableOrderBook) : undefined,
    acceptingOrders: Boolean(r.acceptingOrders),
    // price movement (percentage as decimal, e.g. 0.05 = +5%)
    oneDayPriceChange:   isValidNumber(r.oneDayPriceChange)   ? r.oneDayPriceChange   : 0,
    oneHourPriceChange:  isValidNumber(r.oneHourPriceChange)  ? r.oneHourPriceChange  : 0,
    oneWeekPriceChange:  isValidNumber(r.oneWeekPriceChange)  ? r.oneWeekPriceChange  : 0,
    oneMonthPriceChange: isValidNumber(r.oneMonthPriceChange) ? r.oneMonthPriceChange : 0,
    oneYearPriceChange:  isValidNumber(r.oneYearPriceChange)  ? r.oneYearPriceChange  : 0,
    // market quality
    spread:      isValidNumber(r.spread)      ? r.spread      : 0,
    competitive: isValidNumber(r.competitive) ? r.competitive : 0,
    curationOrder: typeof r.curationOrder === "number" ? r.curationOrder : 0,
    // display hints
    wideFormat: Boolean(r.wideFormat),
    // range / scalar markets
    lowerBound:     typeof r.lowerBound     === "string" ? r.lowerBound     : "",
    upperBound:     typeof r.upperBound     === "string" ? r.upperBound     : "",
    lowerBoundDate: typeof r.lowerBoundDate === "string" ? r.lowerBoundDate : "",
    upperBoundDate: typeof r.upperBoundDate === "string" ? r.upperBoundDate : "",
    // grouped / series markets
    groupItemTitle: typeof r.groupItemTitle === "string" ? r.groupItemTitle : "",
    groupItemRange: typeof r.groupItemRange === "string" ? r.groupItemRange : "",
    shortOutcomes:  typeof r.shortOutcomes  === "string" ? r.shortOutcomes  : "",
    // sports fields
    teamAID:          typeof r.teamAID          === "string" ? r.teamAID          : "",
    teamBID:          typeof r.teamBID          === "string" ? r.teamBID          : "",
    marketType:       typeof r.marketType       === "string" ? r.marketType       : "",
    formatType:       typeof r.formatType       === "string" ? r.formatType       : "",
    sportsMarketType: typeof r.sportsMarketType === "string" ? r.sportsMarketType : "",
    gameId:           typeof r.gameId           === "string" ? r.gameId           : "",
    gameStartTime:    typeof r.gameStartTime    === "string" ? r.gameStartTime    : "",
    eventStartTime:   typeof r.eventStartTime   === "string" ? r.eventStartTime   : "",
    line:             isValidNumber(r.line) ? r.line : 0,
    seriesColor:      typeof r.seriesColor === "string" ? r.seriesColor : "",
    chartColor:       typeof r.chartColor  === "string" ? r.chartColor  : "",
  };
}
