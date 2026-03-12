import { useState } from "react";
import { ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import FuturesTradePanel from "./FuturesTradePanel";
import PerpetualPairInfo from "./PerpetualPairInfo";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP", "Order history", "Position History", "Trade history", "Transaction history"];

interface DesktopPerpetualLayoutProps {
  chartVisible: boolean;
  pair: string;
  onPairChange: (pair: string) => void;
  onToggleChart: () => void;
}

const DesktopPerpetualLayout = ({
  chartVisible,
  pair,
  onPairChange,
  onToggleChart,
}: DesktopPerpetualLayoutProps) => {
  const [activeTab, setActiveTab] = useState("Open orders");

  return (
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_minmax(120px,auto)] h-full min-h-0 overflow-hidden border-t border-border">
      {/* Pair Info */}
      <div className="col-start-1 row-start-1 border-b border-border min-w-0">
        <PerpetualPairInfo
          pair={pair}
          onPairChange={onPairChange}
          chartVisible={chartVisible}
          onToggleChart={onToggleChart}
        />
      </div>

      {/* Chart */}
      {chartVisible && (
        <div className="col-start-1 row-start-2 min-h-0 min-w-0 h-full">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* OrderBook — spans rows 1-2 */}
      <div className="col-start-2 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <DesktopOrderBook />
      </div>

      {/* FuturesTradePanel — spans rows 1-2 */}
      <div className="col-start-3 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <FuturesTradePanel />
      </div>

      {/* Full-width border line */}
      <div className="col-start-1 col-end-4 row-start-3 border-t border-border" />

      {/* Tabs header — spans all 3 columns */}
      <div className="col-start-1 col-end-4 row-start-3">
        <div className="flex items-center px-4 h-9">
          <div className="flex items-center gap-4 flex-1 h-full overflow-x-auto">
            {orderTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full text-sm transition-colors border-b-2 px-1 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-foreground font-semibold border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="p-1 text-muted-foreground ml-2">
            <ListFilter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="col-start-1 col-end-3 row-start-4">
        <div className="flex flex-col items-center py-4">
          <span className="text-sm text-muted-foreground">
            Please connect a wallet first
          </span>
        </div>
      </div>

      {/* Perpetual account section — bottom right */}
      <div className="col-start-3 row-start-4 border-l border-border">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Futures Account</h3>
          <div className="flex items-center gap-2 mb-4">
            <button className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
              Deposit
            </button>
            <button className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15">
              Withdraw
            </button>
          </div>
          <div className="text-xs text-muted-foreground mb-2 font-medium">Perpetual overview</div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Margin Balance</span>
            <span className="text-foreground font-mono-num">0.00 USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Unrealized PnL</span>
            <span className="text-foreground font-mono-num">0.00 USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Available Margin</span>
            <span className="text-foreground font-mono-num">0.00 USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Margin Ratio</span>
            <span className="text-foreground font-mono-num">--%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopPerpetualLayout;
