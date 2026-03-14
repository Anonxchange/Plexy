
import { useState } from "react";
import { ListFilter, ChevronDown, ClipboardList } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import PerpetualOrderBook from "./PerpetualOrderBook";
import FuturesTradePanel from "./FuturesTradePanel";
import PerpetualPairInfo from "./PerpetualPairInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [sheetTab, setSheetTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

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
   <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_140px] h-full min-h-0 overflow-hidden border-t border-border"> {/* Pair Info */}
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

      {/* Tabs row — fixed height so it never pushes the chart upward */}
      <div className="col-start-1 col-end-4 row-start-3 relative h-5">
        <div className="absolute top-0 left-0 right-0 h-px bg-border" />
        <div className="flex items-center px-4 h-10">
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
      <div className="col-start-3 row-start-4 border-l border-border overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
          {user ? (
            <>
              {/* Deposit / Withdraw / Transfer tabs */}
              <div className="flex items-center gap-1 mb-4">
                {(["Deposit", "Withdraw", "Transfer"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => openSheet(label.toLowerCase() as "deposit" | "withdraw")}
                    className="flex-1 py-1.5 rounded text-xs font-medium text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Account Equity */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-foreground mb-2">Account Equity</div>
                <div className="space-y-1.5">
                  {[
                    { label: "Spot total value", value: "--" },
                    { label: "Perp total value", value: "--" },
                    { label: "Perpetuals unrealized Pnl", value: "--" },
                    { label: "Shield unrealized Pnl", value: "--" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-mono-num">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Margin */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-foreground mb-2">Margin</div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Margin Ratio</span>
                    <span className="text-trading-green font-mono-num">
                      {balanceLoading ? "..." : "0.00%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Maintenance Margin</span>
                    <span className="text-foreground font-mono-num">--</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      Account Equity
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground/50 text-[9px] leading-none">?</span>
                    </span>
                    <span className="text-foreground font-mono-num">--</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 rounded text-xs font-medium border border-border text-foreground hover:bg-accent transition-colors">
                Multi-Asset Mode
              </button>
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

      {/* Perpetual account modal */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="bg-card border border-border rounded-2xl px-5 pb-6 pt-5 max-w-md w-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Account</DialogTitle>
          </DialogHeader>

          {/* Title + tabs row */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground">Account</h2>
          </div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 text-sm">
              {(["deposit", "withdraw", "transfer"] as const).map((tab, i) => (
                <div key={tab} className="flex items-center">
                  {i > 0 && <span className="text-muted-foreground/30 mx-2">|</span>}
                  <button
                    onClick={() => setSheetTab(tab)}
                    className={`font-medium capitalize ${sheetTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                </div>
              ))}
            </div>
            <ClipboardList className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>

          {sheetTab === "transfer" ? (
            <div className="flex flex-col items-center py-10">
              <span className="text-sm text-muted-foreground">No transfer history</span>
            </div>
          ) : (
            <>
              {/* Account type dropdown */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <span className="text-sm text-foreground">Perpetual account</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Chain selector */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-black">B</div>
                  <span className="text-sm text-foreground">BNB Chain</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Amount + asset */}
              <div className="border border-border rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                <input
                  type="text"
                  placeholder="Amount"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-[#26A17B] flex items-center justify-center text-[9px] font-bold text-white">₮</div>
                  <span className="text-sm text-foreground font-medium">USDT</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between mb-5 px-1">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="text-xs text-foreground font-mono-num">--</span>
              </div>

              {/* Connect wallet CTA */}
              <button
                onClick={() => navigate("/signin")}
                className="w-full py-3 rounded-lg text-sm font-semibold bg-trading-amber text-background hover:bg-trading-amber/90 transition-colors mb-3"
              >
                Connect wallet
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button className="w-full py-3 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[9px] font-bold text-black">B</div>
                Buy/Deposit with Binance Pay
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopPerpetualLayout;
