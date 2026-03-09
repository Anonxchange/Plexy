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
    <div className="grid grid-cols-[1fr_240px_280px] grid-rows-[auto_1fr] flex-1 min-h-0 overflow-hidden">

      {/* CHART COLUMN */}
      <div className="flex flex-col min-w-0 border-t border-border row-start-2 col-start-1">
        {chartVisible && (
          <div className="flex-1 min-h-[400px]">
            <CandlestickChart pair={pair} />
          </div>
        )}

        {/* Bottom tabs */}
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

      {/* ORDER BOOK (spans both rows) */}
      <div className="border-l border-border overflow-y-auto col-start-2 row-span-2">
        <OrderBook />
      </div>

      {/* TRADE PANEL */}
      <div className="border-l border-border flex flex-col overflow-hidden col-start-3 row-span-2">
        <div className="flex-1 overflow-y-auto">
          <TradePanel />
        </div>

        <div className="border-t border-border overflow-y-auto">
          <AccountBar />
        </div>
      </div>

    </div>
  );
};

export default DesktopTradingLayout;
