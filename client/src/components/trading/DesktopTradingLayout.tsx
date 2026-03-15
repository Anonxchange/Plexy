import { useState } from "react";
import { ListFilter, Loader2, XCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import DesktopOrderBook from "./DesktopOrderBook";
import TradePanel from "./TradePanel";
import PairInfo from "./PairInfo";
import { AccountModal } from "./AccountModal";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP", "Order history", "Position History", "Trade history", "Transaction history"];

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
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");

  const openModal = (tab: "deposit" | "withdraw" | "transfer") => {
    if (!user) { navigate("/signin"); return; }
    setDefaultTab(tab);
    setModalOpen(true);
  };

  const { data: spotAccount, isLoading: balanceLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtFree = spotAccount?.balances?.find((b: any) => b.asset === "USDT")?.free ?? "0.00";
  const asterFree = spotAccount?.balances?.find((b: any) => b.asset === "ASTER")?.free ?? "0.00000000";

  const queryClient = useQueryClient();
  const apiSymbol = pair.replace("/", "");

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
    <div className="grid grid-cols-[1.8fr_0.6fr_0.6fr] grid-rows-[auto_1fr_auto_minmax(120px,auto)] h-full min-h-0 overflow-hidden border-t border-border">
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
        <div className="col-start-1 row-start-2 min-h-0 min-w-0 h-full">
          <CandlestickChart pair={pair} className="h-full w-full" />
        </div>
      )}

      {/* OrderBook — spans rows 1-2 */}
      <div className="col-start-2 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <DesktopOrderBook symbol={pair} />
      </div>

      {/* TradePanel — spans rows 1-2 */}
      <div className="col-start-3 row-start-1 row-end-3 border-l border-border overflow-y-auto min-h-0">
        <TradePanel symbol={pair} />
      </div>

      {/* Full-width border line */}
      <div className="col-start-1 col-end-4 row-start-3 border-t border-border" />

      {/* Tabs header + Account — spans all 3 columns */}
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

      {/* Tab content + Account row */}
      <div className="col-start-1 col-end-3 row-start-4 overflow-auto">
        {!user ? (
          <div className="flex items-center justify-center py-4">
            <button onClick={() => navigate("/signin")} className="text-sm text-trading-amber hover:underline">
              Sign in to view orders
            </button>
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
        ) : activeTab === "Order history" ? (
          allOrdersLoading ? (
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
                  <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No order history</td></tr>
                )}
              </tbody>
            </table>
          )
        ) : (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">Coming soon</div>
        )}
      </div>

      {/* Account section — bottom right */}
      <div className="col-start-3 row-start-4 border-l border-border">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
          {user ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => openModal("deposit")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openModal("withdraw")}
                  className="flex-1 px-3 py-1.5 rounded text-xs text-trading-amber border border-trading-amber/40 bg-trading-amber/10 hover:bg-trading-amber/15"
                >
                  Withdraw
                </button>
              </div>
              <div className="text-xs text-muted-foreground mb-2 font-medium">Spot overview</div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">ASTER Available</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : parseFloat(asterFree).toFixed(8)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">USDT Available</span>
                <span className="text-foreground font-mono-num">
                  {balanceLoading ? "..." : parseFloat(usdtFree).toFixed(2)}
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

      <AccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultTab={defaultTab}
        defaultAccountType="Spot account"
        variant="dialog"
      />
    </div>
  );
};

export default DesktopTradingLayout;
