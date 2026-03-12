import { useState } from "react";
import { LayoutList, SlidersVertical, ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
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
              <OrderBook />
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
          {chartVisible && (
            <div className="h-[350px] flex-shrink-0">
              <CandlestickChart pair={pair} />
            </div>
          )}
        </>
      )}

      {/* Tab bar */}
      <div className="flex items-center border-t border-border h-10 flex-shrink-0">
        <div className="flex items-center flex-1 h-full overflow-x-auto px-2 gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-full text-xs whitespace-nowrap border-b-2 px-1 transition-colors ${
                activeTab === tab
                  ? "text-foreground font-semibold border-primary"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-2 border-l border-border h-full">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 transition-colors ${viewMode === "list" ? "text-foreground" : "text-muted-foreground"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-1 transition-colors ${viewMode === "chart" ? "text-foreground" : "text-muted-foreground"}`}
          >
            <SlidersVertical className="w-4 h-4" />
          </button>
          <button className="p-1 text-muted-foreground">
            <ListFilter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab content placeholder */}
      <div className="flex flex-col items-center py-6 flex-1">
        <span className="text-sm text-muted-foreground">Please connect a wallet first</span>
      </div>
    </div>
  );
};

export default MobilePerpetualTabs;
