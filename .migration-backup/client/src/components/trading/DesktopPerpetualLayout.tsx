
import { useState } from "react";
import { ListFilter, Loader2, XCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import FuturesTradePanel from "./FuturesTradePanel";
import PerpetualPairInfo from "./PerpetualPairInfo";
import { AccountModal } from "./AccountModal";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

  const openModal = (tab: "deposit" | "withdraw" | "transfer") => {
    if (!user) { navigate("/signin"); return; }
    setDefaultTab(tab);
    setModalOpen(true);
  };

  const apiSymbol = pair.replace("/", "");

  const { data: futuresBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["futures-open-orders", apiSymbol],
    queryFn: () => asterTrading.futuresOpenOrders(apiSymbol),
    enabled: !!user && activeTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["futures-positions"],
    queryFn: () => asterTrading.futuresPositions(),
    enabled: !!user && (activeTab === "Positions" || activeTab === "Position History"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ symbol, orderId }: { symbol: string; orderId: string }) =>
      asterTrading.futuresCancelOrder(symbol, orderId),
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      queryClient.invalidateQueries({ queryKey: ["futures-open-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    /*
     * Grid mirrors the spot page exactly:
     *
     *  col 1 (1.8fr)         col 2 (0.6fr)    col 3 (0.6fr)
     *  ┌──────────────────────┐                 ┌─────────────┐
     *  │  PairInfo  [row 1]   │  OrderBook      │ TradePanel  │
     *  ├──────────────────────┤  (row 1–2,      │ (row 1–2,   │
     *  │  Chart     [row 2]   │  full height)   │ full height)│
     *  ├──────────────────────┴─────────────────┤             │
     *  │  Tab bar  [row 3, col 1–2 only]        │ Account     │
     *  ├──────────────────────────────────────  │ panel       │
     *  │  Tab content [row 4, col 1–2]          │ (rows 3–4)  │
     *  └──────────────────────────────────────  ┴─────────────┘
     */
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_140px] flex-1 min-h-0 overflow-hidden border-t-[3px] border-panel-border">

      {/* ── PairInfo — col 1, row 1 only ── */}
      <div className="col-start-1 row-start-1 border-b-[3px] border-panel-border min-w-0">
        <PerpetualPairInfo
          pair={pair}
          onPairChange={onPairChange}
          chartVisible={chartVisible}
          onToggleChart={onToggleChart}
        />
      </div>

      {/* ── Chart — col 1, row 2 ── */}
      {chartVisible && (
        <div className="col-start-1 row-start-2 min-h-0 min-w-0 h-full">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* ── Order Book — col 2, spans rows 1–2 ── */}
      <div className="col-start-2 row-start-1 row-end-3 border-l-[3px] border-panel-border overflow-y-auto min-h-0">
        <DesktopOrderBook symbol={pair} mode="futures" />
      </div>

      {/* ── Trade Panel — col 3, spans rows 1–2 ── */}
      <div className="col-start-3 row-start-1 row-end-3 border-l-[3px] border-panel-border overflow-y-auto min-h-0">
        <FuturesTradePanel symbol={pair} />
      </div>

      {/* ── Tab bar — row 3, cols 1–2 only (does not cross into trade panel) ── */}
      <div className="col-start-1 col-end-3 row-start-3 relative h-10">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-panel-border" />
        <div className="flex items-center px-4 h-10">
          <div className="flex items-center gap-4 flex-1 h-full overflow-x-auto scrollbar-none">
            {orderTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full text-xs transition-colors border-b-2 px-1 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-foreground font-semibold border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="p-1 text-muted-foreground ml-2 flex-shrink-0">
            <ListFilter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab content — row 4, cols 1–2 ── */}
      <div className="col-start-1 col-end-3 row-start-4 overflow-auto">
        {!user ? (
          <div className="flex items-center gap-2 justify-center py-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/signin")} className="text-primary hover:underline font-medium">Log In</button>
            <span>or</span>
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">Register</button>
            <span>to view your orders</span>
          </div>
        ) : activeTab === "Open orders" ? (
          ordersLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Symbol</th>
                  <th className="text-left px-4 py-2 font-normal">Side</th>
                  <th className="text-left px-4 py-2 font-normal">Type</th>
                  <th className="text-right px-4 py-2 font-normal">Price</th>
                  <th className="text-right px-4 py-2 font-normal">Size</th>
                  <th className="text-right px-4 py-2 font-normal">Filled</th>
                  <th className="text-right px-4 py-2 font-normal">Cancel</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(openOrders) && openOrders.length > 0 ? openOrders.map((o: any) => (
                  <tr key={o.orderId} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 text-foreground">{o.symbol}</td>
                    <td className={`px-4 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                    <td className="px-4 py-2 text-muted-foreground">{o.type}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.price).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.origQty).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(o.executedQty).toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => cancelMutation.mutate({ symbol: o.symbol, orderId: String(o.orderId) })} disabled={cancelMutation.isPending} className="text-trading-red hover:opacity-70">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No open orders</td></tr>
                )}
              </tbody>
            </table>
          )
        ) : activeTab === "Positions" || activeTab === "Position History" ? (
          positionsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Symbol</th>
                  <th className="text-left px-4 py-2 font-normal">Side</th>
                  <th className="text-right px-4 py-2 font-normal">Size</th>
                  <th className="text-right px-4 py-2 font-normal">Entry Price</th>
                  <th className="text-right px-4 py-2 font-normal">Mark Price</th>
                  <th className="text-right px-4 py-2 font-normal">Liq. Price</th>
                  <th className="text-right px-4 py-2 font-normal">Unrealized PnL</th>
                  <th className="text-right px-4 py-2 font-normal">Leverage</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(positions) && positions.filter((p: any) => parseFloat(p.positionAmt) !== 0).length > 0
                  ? positions.filter((p: any) => parseFloat(p.positionAmt) !== 0).map((p: any) => {
                    const pnl = parseFloat(p.unRealizedProfit);
                    return (
                      <tr key={p.symbol + p.positionSide} className="border-b border-border/50 hover:bg-accent/30">
                        <td className="px-4 py-2 text-foreground">{p.symbol}</td>
                        <td className={`px-4 py-2 font-medium ${parseFloat(p.positionAmt) > 0 ? "text-trading-green" : "text-trading-red"}`}>
                          {parseFloat(p.positionAmt) > 0 ? "Long" : "Short"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono-num">{Math.abs(parseFloat(p.positionAmt)).toFixed(4)}</td>
                        <td className="px-4 py-2 text-right font-mono-num">{parseFloat(p.entryPrice).toFixed(4)}</td>
                        <td className="px-4 py-2 text-right font-mono-num">{parseFloat(p.markPrice).toFixed(4)}</td>
                        <td className="px-4 py-2 text-right font-mono-num text-trading-red">{parseFloat(p.liquidationPrice).toFixed(4)}</td>
                        <td className={`px-4 py-2 text-right font-mono-num ${pnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                          {pnl >= 0 ? "+" : ""}{pnl.toFixed(4)}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{p.leverage}x</td>
                      </tr>
                    );
                  })
                  : <tr><td colSpan={8} className="text-center py-4 text-muted-foreground">No open positions</td></tr>
                }
              </tbody>
            </table>
          )
        ) : activeTab === "Assets" ? (
          balanceLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Asset</th>
                  <th className="text-right px-4 py-2 font-normal">Balance</th>
                  <th className="text-right px-4 py-2 font-normal">Available</th>
                  <th className="text-right px-4 py-2 font-normal">Unrealized PnL</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(futuresBalance) && futuresBalance.filter((b: any) => parseFloat(b.balance) > 0).length > 0
                  ? futuresBalance.filter((b: any) => parseFloat(b.balance) > 0).map((b: any) => (
                    <tr key={b.asset} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="px-4 py-2 font-medium text-foreground">{b.asset}</td>
                      <td className="px-4 py-2 text-right font-mono-num">{parseFloat(b.balance).toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-mono-num">{parseFloat(b.availableBalance).toFixed(4)}</td>
                      <td className={`px-4 py-2 text-right font-mono-num ${parseFloat(b.crossUnPnl) >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                        {parseFloat(b.crossUnPnl) >= 0 ? "+" : ""}{parseFloat(b.crossUnPnl).toFixed(4)}
                      </td>
                    </tr>
                  ))
                  : <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">No assets</td></tr>
                }
              </tbody>
            </table>
          )
        ) : (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">No data yet</div>
        )}
      </div>

      {/* ── Account panel — col 3, rows 3–4 (mirrors spot's AccountBar panel position) ── */}
      <div className="col-start-3 row-start-3 row-end-5 border-l-[3px] border-t-[3px] border-panel-border flex flex-col overflow-y-auto">
        <div className="p-3">
          {user ? (
            <>
              <div className="flex items-center gap-1 mb-3">
                {(["Deposit", "Withdraw", "Transfer"] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => openModal(label.toLowerCase() as "deposit" | "withdraw" | "transfer")}
                    className="flex-1 py-1.5 rounded text-xs font-medium text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mb-2.5">
                <div className="text-xs font-semibold text-foreground mb-1.5">Account Equity</div>
                <div className="space-y-1">
                  {[
                    { label: "Spot total value", value: "--" },
                    { label: "Perp total value", value: "--" },
                    { label: "Perp unrealized PnL", value: "--" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-mono-num">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-2.5">
                <div className="text-xs font-semibold text-foreground mb-1.5">Margin</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Margin Ratio</span>
                    <span className="text-trading-green font-mono-num">
                      {balanceLoading ? "..." : "0.00%"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Maintenance Margin</span>
                    <span className="text-foreground font-mono-num">--</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Account Equity</span>
                    <span className="text-foreground font-mono-num">--</span>
                  </div>
                </div>
              </div>

              <button className="w-full py-1.5 rounded text-xs font-medium border border-panel-border text-foreground hover:bg-accent transition-colors">
                Multi-Asset Mode
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="text-xs text-muted-foreground text-center mb-1">Connect to view your account</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <button onClick={() => navigate("/signin")} className="text-primary hover:underline font-medium">Log In</button>
                <span>or</span>
                <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">Register</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultTab={defaultTab}
        defaultAccountType="Perpetual account"
        variant="dialog"
      />
    </div>
  );
};

export default DesktopPerpetualLayout;
