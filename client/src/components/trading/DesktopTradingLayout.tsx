import { useState } from "react";
import { ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";

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
    <div className="grid grid-cols-[1.7fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_auto] flex-1 min-h-0 overflow-hidden border-t-2 border-border">
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
        <div className="col-start-1 row-start-2 min-h-[300px] min-w-0">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* Full-width border line spanning all columns */}
      <div className="col-start-1 col-end-4 row-start-3 border-t border-border" />

      {/* Tabs header */}
      <div className="col-start-1 row-start-3">
        <div className="flex items-center px-4 h-9">
          <div className="flex items-center gap-4 flex-1 h-full">
            {orderTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full text-sm transition-colors border-b-2 px-1 ${
                  activeTab === tab
                    ? "text-foreground font-semibold border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
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

      {/* AccountBar — row 3-4 col 3 */}
      <div className="col-start-3 row-start-3 row-end-5 border-l border-border overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
          <div className="flex items-center gap-2 mb-4">
            <button className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
              Deposit
            </button>
            <button className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
              Withdraw
            </button>
          </div>
          <div className="text-xs text-muted-foreground mb-2 font-medium">Spot overview</div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">ASTER Available</span>
            <span className="text-foreground font-mono-num">0.00000000</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">USDT Available</span>
            <span className="text-foreground font-mono-num">0.00000000</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopTradingLayout; 
