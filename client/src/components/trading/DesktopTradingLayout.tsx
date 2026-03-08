import { useState } from "react";
import { ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];

interface DesktopTradingLayoutProps {
  chartVisible: boolean;
  pair: string;
}

const DesktopTradingLayout = ({ chartVisible, pair }: DesktopTradingLayoutProps) => {
  const [activeTab, setActiveTab] = useState("Open orders");

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Main trading area */}
      <div className="flex flex-1 min-h-0 border-t border-border">
        {/* Left: Chart */}
        <div className="flex-1 min-w-0 flex flex-col">
          {chartVisible && (
            <div className="flex-1 min-h-[400px]">
              <CandlestickChart pair={pair} />
            </div>
          )}

          {/* Bottom tabs area */}
          <div className="border-t border-border">
            <div className="flex items-center px-4 pt-1">
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
            <div className="flex flex-col items-center py-8">
              <span className="text-sm text-muted-foreground">Please connect a wallet first</span>
            </div>
          </div>
        </div>

        {/* Right: Order Book + Trade Panel */}
        <div className="w-[320px] xl:w-[360px] flex-shrink-0 border-l border-border flex flex-col overflow-y-auto">
          <div className="border-b border-border">
            <OrderBook />
          </div>
          <div className="flex-1">
            <TradePanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopTradingLayout;
