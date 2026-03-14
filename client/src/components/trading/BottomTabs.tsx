import { useState } from "react";
import { LayoutList, SlidersVertical, ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];
const chartTabs = ["Chart", "Order book", "Trades", "Depth", "Info"];

interface BottomTabsProps {
  chartVisible: boolean;
  pair: string;
}

const BottomTabs = ({ chartVisible, pair }: BottomTabsProps) => {
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [activeOrderTab, setActiveOrderTab] = useState("Open orders");
  const [activeChartTab, setActiveChartTab] = useState("Chart");

  const tabs = viewMode === "list" ? orderTabs : chartTabs;
  const activeTab = viewMode === "list" ? activeOrderTab : activeChartTab;
  const setActiveTab = viewMode === "list" ? setActiveOrderTab : setActiveChartTab;

  return (
    <div className="flex flex-col border-t border-border bg-background flex-1">
      {/* List view: chart + order book + trade panel */}
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
              <TradePanel symbol={pair} />
            </div>
          </div>
        </>
      )}

      {/* Chart view: price stats + chart */}
      {viewMode === "chart" && (
        <>
          {/* Price stats bar */}
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
                <span className="text-muted-foreground">24h High</span>
                <div className="font-mono-num text-foreground">0.69546</div>
              </div>
              <div>
                <span className="text-muted-foreground">24h Vol (ASTER)</span>
                <div className="font-mono-num text-foreground">8.32M</div>
              </div>
              <div>
                <span className="text-muted-foreground">24h Low</span>
                <div className="font-mono-num text-foreground">0.67759</div>
              </div>
              <div>
                <span className="text-muted-foreground">24h Vol (USDT)</span>
                <div className="font-mono-num text-foreground">5.71M</div>
              </div>
            </div>
          </div>

          <div className="h-[400px] flex-shrink-0">
            <CandlestickChart pair={pair} />
          </div>
          <div className="flex items-center justify-center gap-3 px-4 py-2 text-xs text-muted-foreground border-t border-border">
            <span className="font-mono-num">17:14:08 (UTC+1)</span>
            <span className="text-border">|</span>
            <span>%</span>
            <span>log</span>
            <span>auto</span>
          </div>
        </>
      )}

      {/* Tab headers */}
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

      {/* Placeholder content */}
      <div className="flex flex-col items-center py-10 gap-6">
        <span className="text-sm text-muted-foreground">Please connect a wallet first</span>
      </div>

      {/* View mode toggle pill */}
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

export default BottomTabs;
