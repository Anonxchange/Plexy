import { useState } from "react";
import { ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";
import AccountBar from "./AccountBar";
import PairInfo from "./PairInfo";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];

interface DesktopTradingLayoutProps {
  chartVisible: boolean;
  pair: string;
  onPairChange: (pair: string) => void;
  onToggleChart: () => void;
}

const DesktopTradingLayout = ({
  chartVisible,
  pair,
  onPairChange,
  onToggleChart,
}: DesktopTradingLayoutProps) => {
  const [activeTab, setActiveTab] = useState("Open orders");

  return (
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_auto] flex-1 min-h-0 overflow-hidden">
      {/* Pair Info */}
      <div className="col-start-1 row-start-1 border-b border-border min-w-0">
        <PairInfo
          pair={pair}
          onPairChange={onPairChange}
          chartVisible={chartVisible}
          onToggleChart={onToggleChart}
        />
      </div>

      {/* Chart */}
      {chartVisible && (
        <div className="col-start-1 row-start-2 h-[600px] min-w-0">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* Tabs header */}
      <div className="col-start-1 row-start-3 border-t border-border mt-[-1px]">
        <div className="flex items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            {orderTabs.map((tab) => (
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
          <button className="p-1 text-muted-foreground">
            <ListFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="col-start-1 row-start-4">
        <div className="flex flex-col items-center py-4">
          <span className="text-sm text-muted-foreground">
            Please connect a wallet first
          </span>
        </div>
      </div>

      {/* OrderBook — spans all 4 rows */}
      <div className="col-start-2 row-start-1 row-end-5 border-l border-border overflow-y-auto min-h-0">
        <OrderBook />
      </div>

      {/* TradePanel — spans rows 1-3 */}
      <div className="col-start-3 row-start-1 row-end-4 border-l border-border overflow-y-auto min-h-0">
        <TradePanel />
      </div>

      {/* AccountBar — row 4, aligned with tab content */}
      <div className="col-start-3 row-start-4 border-l border-t border-border">
        <AccountBar />
      </div>
    </div>
  );
};

export default DesktopTradingLayout;
