import { useState } from "react";
import { ListFilter } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";
import AccountBar from "./AccountBar";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];

interface DesktopTradingLayoutProps {
  chartVisible: boolean;
  pair: string;
}

const DesktopTradingLayout = ({ chartVisible, pair }: DesktopTradingLayoutProps) => {
  const [activeTab, setActiveTab] = useState("Open orders");

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      <div className="flex flex-1 min-h-0 border-t border-border gap-0">

        {/* LEFT: Chart column (same width as pair info) */}
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
              <span className="text-sm text-muted-foreground">
                Please connect a wallet first
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Order Book */}
        <div className="w-[240px] flex-shrink-0 border-l border-border overflow-y-auto">
          <OrderBook />
        </div>

        {/* Right: Trade Panel + Account */}
        <div className="w-[280px] flex-shrink-0 border-l border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <TradePanel />
          </div>
          <div className="border-t border-border overflow-y-auto">
            <AccountBar />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopTradingLayout;
