import { useState } from "react";
import { LayoutList, SlidersVertical, ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import PerpetualOrderBook from "./PerpetualOrderBook";
import FuturesTradePanel from "./FuturesTradePanel";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];
const chartTabs = ["Chart", "Order book", "Trades", "Depth", "Info"];

interface MobilePerpetualTabsProps {
  chartVisible: boolean;
  pair: string;
}

const MobilePerpetualTabs = ({ chartVisible, pair }: MobilePerpetualTabsProps) => {
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [activeOrderTab, setActiveOrderTab] = useState("Open orders");
  const [activeChartTab, setActiveChartTab] = useState("Chart");

  const tabs = viewMode === "list" ? orderTabs : chartTabs;
  const activeTab = viewMode === "list" ? activeOrderTab : activeChartTab;
  const setActiveTab = viewMode === "list" ? setActiveOrderTab : setActiveChartTab;

  return (
    <div className="flex flex-col border-t border-border bg-background flex-1">
      {/* List view: chart + order book + futures trade panel */}
      {viewMode === "list" && (
        <>
          {chartVisible && (
            <div className="h-[350px] flex-shrink-0">
              <CandlestickChart pair={pair} />
            </div>
          )}
          <div className="flex border-t border-border flex-shrink-0 w-full min-w-0">
            <div className="w-[40%] min-w-0 border-r border-border overflow-hidden">
              <PerpetualOrderBook />
            </div>
            <div className="w-[60%] min-w-0 overflow-hidden">
              <FuturesTradePanel />
            </div>
          </div>
        </>
      )}

      {/* Chart view: price stats + chart */}
      {viewMode === "chart" && (
        <>
          <div className="flex items-start justify-between px-4 py-3 border-b border-border">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Last price</span>
              <span className="font-mono-num text-2xl font-bold text-trading-green">0.68251</span>
              <div className="flex items-center gap-2">
                <span className="font-mono-num text-xs text-muted-foreground">≈$0.6825</span>
                <span className="font-mono-num text-xs text-trading-red">-1.57%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-right">
              <div>
                <span className="text-muted-foreground block">24h High</span>
                <span className="font-mono-num text-foreground">0.70200</span>
              </div>
              <div>
                <span className="text-muted-foreground block">24h Vol</span>
                <span className="font-mono-num text-foreground">1.23M</span>
              </div>
              <div>
                <span className="text-muted-foreground block">24h Low</span>
                <span className="font-mono-num text-foreground">0.67100</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Open Interest</span>
                <span className="font-mono-num text-foreground">4.56M</span>
              </div>
            </div>
          </div>
          <div className="h-[400px] flex-shrink-0">
            <CandlestickChart pair={pair} />
          </div>
        </>
      )}

      {/* Tab headers — icons removed, only tabs + filter */}
      <div className="flex items-center px-4 pt-1 border-t border-border">
        <div className="flex items-center gap-4 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-sm transition-colors ${
                activeTab === tab
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {viewMode === "list" && (
          <button className="p-1 text-muted-foreground">
            <ListFilter className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab content placeholder */}
      <div className="flex flex-col items-center py-10 gap-6">
        <span className="text-sm text-muted-foreground">Please connect a wallet first</span>
      </div>

      {/* View mode toggle pill — at the bottom, matching spot */}
      <div className="flex justify-center py-4">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-colors ${
              viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-2 rounded-full transition-colors ${
              viewMode === "chart" ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            <SlidersVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePerpetualTabs;
