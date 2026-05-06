import { useState } from "react";
import { ListFilter, Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import TradePanel from "./TradePanel";
import PairInfo from "./PairInfo";
import AccountBar from "./AccountBar";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP", "Position History", "Trade history", "Transaction history"];

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
  const [historyOpen, setHistoryOpen] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const apiSymbol = pair.replace("/", "");

  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["spot-open-orders", apiSymbol],
    queryFn: () => asterTrading.spotOpenOrders(apiSymbol),
    enabled: !!user && activeTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: allOrders, isLoading: allOrdersLoading } = useQuery({
    queryKey: ["spot-all-orders", apiSymbol],
    queryFn: () => asterTrading.spotAllOrders(apiSymbol),
    enabled: !!user && activeTab === "Order history",
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ symbol, orderId }: { symbol: string; orderId: string }) =>
      asterTrading.spotCancelOrder(symbol, orderId),
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      queryClient.invalidateQueries({ queryKey: ["spot-open-orders"] });
    },
    onError: (err: Error) => {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    /*
     * Grid mirrors the perpetual page exactly:
     *
     *  col 1 (1.8fr)         col 2 (0.6fr)    col 3 (0.6fr)
     *  ┌──────────────────────┐                 ┌─────────────┐
     *  │  PairInfo  [row 1]   │  OrderBook      │ TradePanel  │
     *  ├──────────────────────┤  (row 1–2,      │ (row 1–2,   │
     *  │  Chart     [row 2]   │  full height)   │ full height)│
     *  ├──────────────────────┴─────────────────┴─────────────┤
     *  │  Tab bar  [row 3, col 1–3]                           │
     *  ├──────────────────────────────────────┬───────────────┤
     *  │  Tab content [row 4, col 1–2]        │ Account panel │
     *  └──────────────────────────────────────┴───────────────┘
     */
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_140px] flex-1 min-h-0 overflow-hidden border-t-[3px] border-panel-border">

      {/* ── PairInfo — col 1, row 1 only ── */}
      <div className="col-start-1 row-start-1 border-b-[3px] border-panel-border min-w-0">
        <PairInfo
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
        <DesktopOrderBook symbol={pair} />
      </div>

      {/* ── Trade Panel — col 3, spans rows 1–2 ── */}
      <div className="col-start-3 row-start-1 row-end-3 border-l-[3px] border-panel-border overflow-y-auto min-h-0">
        <TradePanel symbol={pair} />
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
          <button
            onClick={() => setHistoryOpen(true)}
            title="Order history"
            className="p-1 text-muted-foreground ml-2 flex-shrink-0 hover:text-foreground transition-colors"
          >
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
                  <th className="text-right px-4 py-2 font-normal">Amount</th>
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
        ) : activeTab === "Assets" ? (
          balanceLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left px-4 py-2 font-normal">Asset</th>
                  <th className="text-right px-4 py-2 font-normal">Available</th>
                  <th className="text-right px-4 py-2 font-normal">In Order</th>
                </tr>
              </thead>
              <tbody>
                {(spotAccount?.balances ?? []).filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0).map((b: any) => (
                  <tr key={b.asset} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2 font-medium text-foreground">{b.asset}</td>
                    <td className="px-4 py-2 text-right font-mono-num">{parseFloat(b.free).toFixed(6)}</td>
                    <td className="px-4 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(b.locked).toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">No data yet</div>
        )}
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-sm font-semibold">Order History</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {!user ? (
              <div className="flex justify-center py-8 text-sm text-muted-foreground">Sign in to view order history</div>
            ) : allOrdersLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left px-4 py-2 font-normal">Symbol</th>
                    <th className="text-left px-4 py-2 font-normal">Side</th>
                    <th className="text-left px-4 py-2 font-normal">Type</th>
                    <th className="text-right px-4 py-2 font-normal">Price</th>
                    <th className="text-right px-4 py-2 font-normal">Amount</th>
                    <th className="text-right px-4 py-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(allOrders) && allOrders.length > 0 ? allOrders.slice(0, 50).map((o: any) => (
                    <tr key={o.orderId} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="px-4 py-2 text-foreground">{o.symbol}</td>
                      <td className={`px-4 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                      <td className="px-4 py-2 text-muted-foreground">{o.type}</td>
                      <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.price).toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-mono-num">{parseFloat(o.origQty).toFixed(4)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{o.status}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No order history</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Account panel — rows 3–4, col 3 (below trade panel, separated by top border) ── */}
      <div className="col-start-3 row-start-3 row-end-5 border-l-[3px] border-t-[3px] border-panel-border flex flex-col">
        <AccountBar variant="panel" pair={pair} />
      </div>

    </div>
  );
};

export default DesktopTradingLayout;
