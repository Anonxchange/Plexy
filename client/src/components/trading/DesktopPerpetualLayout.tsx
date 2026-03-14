import { useState } from "react";
import { ListFilter, X, ChevronDown, ClipboardList } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import PerpetualOrderBook from "./PerpetualOrderBook";
import FuturesTradePanel from "./FuturesTradePanel";
import PerpetualPairInfo from "./PerpetualPairInfo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";

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
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"deposit" | "withdraw" | "history">("deposit");

  const openSheet = (tab: "deposit" | "withdraw") => {
    if (!user) { navigate("/signin"); return; }
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const { data: futuresBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const futuresUsdt = Array.isArray(futuresBalance)
    ? futuresBalance.find((b: any) => b.asset === "USDT")
    : null;
  const marginBalance   = futuresUsdt?.balance ?? "0.00";
  const availableMargin = futuresUsdt?.availableBalance ?? "0.00";

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
        <PerpetualOrderBook symbol={pair} />
      </div>

      {/* FuturesTradePanel — spans rows 1-2 */}
      <div className="col-start-3 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <FuturesTradePanel symbol={pair} />
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
          {user ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => openSheet("deposit")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openSheet("withdraw")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Withdraw
                </button>
              </div>
              <div className="text-xs text-muted-foreground mb-2 font-medium">Perpetual overview</div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Margin Balance</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : `${parseFloat(marginBalance).toFixed(2)} USDT`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Available Margin</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : `${parseFloat(availableMargin).toFixed(2)} USDT`}
                </span>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              className="w-full py-2.5 rounded-lg text-xs font-medium bg-trading-amber text-background hover:bg-trading-amber/90"
            >
              Sign In to Trade
            </button>
          )}
        </div>
      </div>

      {/* Perpetual account sheet modal */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-card border-t border-border rounded-t-2xl px-5 pb-8 pt-5 max-h-[85vh]">
          <SheetHeader className="sr-only">
            <SheetTitle>Perpetual Account</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Perpetual Account</h2>
            <button onClick={() => setSheetOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "history"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/40 mx-2">|</span>}
                  <button
                    onClick={() => setSheetTab(tab)}
                    className={`capitalize font-medium ${sheetTab === tab ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>

          {sheetTab === "history" ? (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">No transfer history</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{sheetTab === "deposit" ? "From" : "To"}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Spot account</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 border border-border rounded-lg px-4 py-3">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{sheetTab === "deposit" ? "To" : "From"}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Perpetual account</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Asset</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-[10px] font-bold text-foreground">₮</span>
                  </div>
                  <span className="text-sm text-foreground">USDT</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-2">
                <input type="text" placeholder="Amount" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                <button className="text-xs text-trading-amber font-semibold ml-2 shrink-0">MAX</button>
              </div>
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs text-muted-foreground">Available ({sheetTab === "deposit" ? "Spot" : "Perpetual"})</span>
                <span className="text-xs text-foreground font-mono-num">0.00 USDT</span>
              </div>
              <div className="bg-secondary rounded-lg p-3 mb-5">
                <div className="text-xs text-muted-foreground font-medium mb-2">Perpetual overview</div>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                  <span className="text-muted-foreground">Margin Balance</span>
                  <span className="text-foreground font-mono-num text-right">{balanceLoading ? "..." : `${parseFloat(marginBalance).toFixed(2)} USDT`}</span>
                  <span className="text-muted-foreground">Available Margin</span>
                  <span className="text-foreground font-mono-num text-right">{balanceLoading ? "..." : `${parseFloat(availableMargin).toFixed(2)} USDT`}</span>
                </div>
              </div>
              <button className="w-full py-3.5 rounded-lg text-sm font-medium bg-trading-amber text-background hover:bg-trading-amber/90">
                Confirm
              </button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DesktopPerpetualLayout;
