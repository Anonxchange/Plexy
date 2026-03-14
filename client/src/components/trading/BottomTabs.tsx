import { useState } from "react";
import { LayoutList, SlidersVertical, ListFilter, Loader2, XCircle } from "lucide-react";
import CandlestickChart from "./CandlestickChart";
import OrderBook from "./OrderBook";
import TradePanel from "./TradePanel";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTabs = ["Open orders", "Positions", "Assets", "TWAP"];
const chartTabs = ["Chart", "Order book", "Trades", "Depth", "Info"];

interface BottomTabsProps {
  chartVisible: boolean;
  pair: string;
}

const BottomTabs = ({ chartVisible, pair }: BottomTabsProps) => {
  const [viewMode, setViewMode] = useState<"list" | "chart">("list");
  const [activeOrderTab, setActiveOrderTab] = useState("Open orders");
  const [activeChartTab, setActiveChartTab] = useState("Chart");

  const tabs = viewMode === "list" ? orderTabs : chartTabs;
  const activeTab = viewMode === "list" ? activeOrderTab : activeChartTab;
  const setActiveTab = viewMode === "list" ? setActiveOrderTab : setActiveChartTab;

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const apiSymbol = pair.replace("/", "");

  const { data: openOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["spot-open-orders", apiSymbol],
    queryFn: () => asterTrading.spotOpenOrders(apiSymbol),
    enabled: !!user && activeOrderTab === "Open orders",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const { data: spotAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user && activeOrderTab === "Assets",
    staleTime: 15_000,
    refetchInterval: 30_000,
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

  const { data: ticker } = useQuery({
    queryKey: ["spot-ticker", apiSymbol],
    queryFn: () => asterTrading.spotTicker ? undefined : undefined,
    enabled: false,
  });

  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center py-10 gap-3">
          <span className="text-sm text-muted-foreground">Sign in to view your orders</span>
          <button
            onClick={() => navigate("/signin")}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-trading-amber text-background"
          >
            Sign In
          </button>
        </div>
      );
    }

    if (activeOrderTab === "Open orders") {
      if (ordersLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const orders = Array.isArray(openOrders) ? openOrders : [];
      if (!orders.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No open orders</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Symbol</th>
                <th className="text-left px-3 py-2 font-normal">Side</th>
                <th className="text-left px-3 py-2 font-normal">Type</th>
                <th className="text-right px-3 py-2 font-normal">Price</th>
                <th className="text-right px-3 py-2 font-normal">Amount</th>
                <th className="text-right px-3 py-2 font-normal">Filled</th>
                <th className="text-right px-3 py-2 font-normal">Cancel</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.orderId} className="border-b border-border/50">
                  <td className="px-3 py-2 text-foreground">{o.symbol}</td>
                  <td className={`px-3 py-2 font-medium ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>{o.side}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.type}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(o.price).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(o.origQty).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(o.executedQty).toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => cancelMutation.mutate({ symbol: o.symbol, orderId: String(o.orderId) })}
                      disabled={cancelMutation.isPending}
                      className="text-trading-red hover:opacity-70"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeOrderTab === "Positions") {
      return <div className="flex justify-center py-8 text-sm text-muted-foreground">Positions are available in Futures trading</div>;
    }

    if (activeOrderTab === "Assets") {
      if (accountLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
      const balances = (spotAccount?.balances ?? []).filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
      if (!balances.length) return <div className="flex justify-center py-8 text-sm text-muted-foreground">No assets</div>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left px-3 py-2 font-normal">Asset</th>
                <th className="text-right px-3 py-2 font-normal">Available</th>
                <th className="text-right px-3 py-2 font-normal">In Order</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b: any) => (
                <tr key={b.asset} className="border-b border-border/50">
                  <td className="px-3 py-2 font-medium text-foreground">{b.asset}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-foreground">{parseFloat(b.free).toFixed(6)}</td>
                  <td className="px-3 py-2 text-right font-mono-num text-muted-foreground">{parseFloat(b.locked).toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <div className="flex justify-center py-8 text-sm text-muted-foreground">Coming soon</div>;
  };

  return (
    <div className="flex flex-col border-t border-border bg-background flex-1">
      {viewMode === "list" && (
        <>
          {chartVisible && (
            <div className="h-[350px] flex-shrink-0">
              <CandlestickChart pair={pair} />
            </div>
          )}
          <div className="flex border-t border-border flex-shrink-0 w-full min-w-0">
            <div className="w-[40%] min-w-0 border-r border-border overflow-hidden">
              <OrderBook symbol={pair} />
            </div>
            <div className="w-[60%] min-w-0 overflow-hidden">
              <TradePanel symbol={pair} />
            </div>
          </div>
        </>
      )}

      {viewMode === "chart" && (
        <>
          <div className="h-[400px] flex-shrink-0">
            <CandlestickChart pair={pair} />
          </div>
        </>
      )}

      <div className="flex items-center px-4 pt-1 border-t border-border">
        <div className="flex items-center gap-4 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-sm transition-colors ${
                activeTab === tab ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {viewMode === "list" && (
          <button className="p-1 text-muted-foreground">
            <ListFilter className="w-5 h-5" />
          </button>
        )}
      </div>

      {viewMode === "list" ? renderTabContent() : (
        <div className="flex justify-center py-8 text-sm text-muted-foreground">Coming soon</div>
      )}

      <div className="flex justify-center py-4">
        <div className="flex items-center bg-secondary rounded-full p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-full transition-colors ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`p-2 rounded-full transition-colors ${viewMode === "chart" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            <SlidersVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BottomTabs;
