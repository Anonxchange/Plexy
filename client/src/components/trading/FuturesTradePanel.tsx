import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Info, Loader2 } from '@/lib/icons';
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";
import { completeTask } from "@/lib/rewards-api";
import { getSubscribedTaskIds } from "@/hooks/use-task-subscriptions";

const orderTypes = ["Market", "Limit", "Stop Limit", "Stop Market", "Maker Only"];

const UI_TO_FUTURES_TYPE: Record<string, string> = {
  "Market":      "MARKET",
  "Limit":       "LIMIT",
  "Stop Limit":  "STOP",
  "Stop Market": "STOP_MARKET",
  "Maker Only":  "LIMIT_MAKER",
};

/* ────────────────────────────────────────────────────────────
   Bottom sheet — slides up from the bottom of the screen.
   Used for every selector on mobile (margin mode, leverage,
   asset mode, order type, units, time-in-force).
   ──────────────────────────────────────────────────────────── */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const BottomSheet = ({ open, onClose, title, children }: BottomSheetProps) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-150"
      />
      {/* panel */}
      <div
        className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-popover px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground transition-colors hover:text-foreground text-lg leading-none px-1"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* Simple full-width option row used inside sheets */
const SheetOption = ({
  active,
  onClick,
  label,
  sub,
}: { active: boolean; onClick: () => void; label: string; sub?: string }) => (
  <button
    onClick={onClick}
    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
      active
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-secondary/40 text-foreground hover:bg-accent"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium">{label}</span>
      {active && <span className="text-[12px] font-semibold text-primary">✓</span>}
    </div>
    {sub && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{sub}</p>}
  </button>
);

interface FuturesTradePanelProps {
  symbol?: string;
}

const FuturesTradePanel = ({ symbol = "ASTER/USDT" }: FuturesTradePanelProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [leverage, setLeverage] = useState("20");
  const [orderType, setOrderType] = useState("Market");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [tpsl, setTpsl] = useState(false);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<"USDT" | string>("USDT");
  const [stopPriceUnit, setStopPriceUnit] = useState<"USDT" | string>("USDT");
  const [priceUnit, setPriceUnit] = useState<"USDT" | string>("USDT");
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [assetMode, setAssetMode] = useState<"single" | "multi">("single");

  // Bottom-sheet visibility
  const [marginSheet, setMarginSheet] = useState(false);
  const [leverageSheet, setLeverageSheet] = useState(false);
  const [assetSheet, setAssetSheet] = useState(false);
  const [orderTypeSheet, setOrderTypeSheet] = useState(false);
  const [sizeUnitSheet, setSizeUnitSheet] = useState(false);
  const [priceUnitSheet, setPriceUnitSheet] = useState(false);
  const [stopUnitSheet, setStopUnitSheet] = useState(false);
  const [tifSheet, setTifSheet] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const apiSymbol = symbol.replace("/", "");
  const baseCoin = symbol.split("/")[0];
  const quoteCoin = symbol.split("/")[1] || "USDT";

  const percentages = [0, 25, 50, 75, 100];
  const leverageOptions = ["1", "2", "3", "5", "10", "20", "50", "75", "100"];

  const { data: futuresBalance } = useQuery({
    queryKey: ["futures-balance"],
    queryFn: () => asterTrading.futuresBalance(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const futuresUsdt = Array.isArray(futuresBalance)
    ? futuresBalance.find((b: any) => b.asset === quoteCoin)
    : null;
  const availableBalance = parseFloat(futuresUsdt?.availableBalance ?? "0");

  const priceNum = parseFloat(price) || 0;
  const sizeNum = parseFloat(size) || 0;
  const leverageNum = parseInt(leverage) || 1;

  const notional = sizeUnit === quoteCoin
    ? sizeNum
    : priceNum > 0 ? sizeNum * priceNum : 0;
  const estMargin = leverageNum > 0 ? notional / leverageNum : 0;
  const maxOrderSize = priceNum > 0
    ? ((availableBalance * leverageNum) / priceNum).toFixed(4)
    : "--";

  const applySlider = (pct: number) => {
    setSliderValue(pct);
    if (pct === 0) { setSize(""); return; }
    const avbl = availableBalance * (pct / 100) * leverageNum;
    if (sizeUnit === quoteCoin) {
      setSize(avbl.toFixed(2));
    } else {
      setSize(priceNum > 0 ? (avbl / priceNum).toFixed(6) : "");
    }
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const snapped = percentages.reduce((a, b) => Math.abs(b - pct) < Math.abs(a - pct) ? b : a);
    applySlider(snapped);
  };

  const asterType = UI_TO_FUTURES_TYPE[orderType] as any;
  const isMarket = orderType === "Market";
  const isLimit = orderType === "Limit";
  const isStopLimit = orderType === "Stop Limit";
  const isStopMarket = orderType === "Stop Market";
  const isMakerOnly = orderType === "Maker Only";
  const showPriceField = isLimit || isMakerOnly || isStopLimit;
  const showStopPrice = isStopLimit || isStopMarket;
  const showTotalValue = isLimit || isStopLimit || isMakerOnly;
  // Time in force now applies to Limit, Maker Only and Stop Limit
  const showTif = isLimit || isStopLimit || isMakerOnly;

  const marginMutation = useMutation({
    mutationFn: (mode: "cross" | "isolated") =>
      asterTrading.futuresSetMarginType(apiSymbol, mode === "isolated" ? "ISOLATED" : "CROSSED"),
    onSuccess: (_data, mode) => {
      setMarginMode(mode);
      setMarginSheet(false);
      toast({ title: `Margin mode set to ${mode === "isolated" ? "Isolated" : "Cross"}` });
    },
    onError: (err: Error) => {
      toast({ title: "Margin mode change failed", description: err.message, variant: "destructive" });
    },
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      await asterTrading.futuresSetLeverage(apiSymbol, leverage);
      return asterTrading.futuresPlaceOrder({
        symbol: apiSymbol,
        side: side === "buy" ? "BUY" : "SELL",
        type: asterType,
        quantity: size || "0",
        ...(showPriceField && price ? { price } : {}),
        ...(showStopPrice && stopPrice ? { stopPrice } : {}),
        ...((isLimit || isMakerOnly) ? { timeInForce } : {}),
        ...(reduceOnly ? { reduceOnly: "true" } : {}),
        ...(tpsl && takeProfit ? { takeProfit: JSON.stringify({ type: "LIMIT", price: takeProfit, workingType: "CONTRACT_PRICE", priceProtect: "FALSE" }) } : {}),
        ...(tpsl && stopLoss   ? { stopLoss:   JSON.stringify({ type: "STOP_MARKET", price: stopLoss, workingType: "CONTRACT_PRICE", priceProtect: "FALSE" }) } : {}),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed",
        description: `${side === "buy" ? "Long" : "Short"} ${size} ${baseCoin} submitted (ID: ${data?.orderId ?? "—"})`,
      });
      setSize(""); setTotalValue(""); setSliderValue(0); setTakeProfit(""); setStopLoss("");
      const subs = getSubscribedTaskIds();
      if (subs.includes("daily-perpetual")) completeTask("daily-perpetual").catch(() => {});
    },
    onError: (err: Error) => {
      const isNoAgent = err.message?.toLowerCase().includes("no agent");
      toast({
        title: "Order failed",
        description: isNoAgent
          ? "Your trading session expired. Please re-link your wallet in Account → Deposit to restore access."
          : err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col w-full bg-background">

      {/* ── Cross | 20x | M ── */}
      <div className="grid grid-cols-3 gap-1 px-2 pt-1.5 pb-0.5">
        <button
          onClick={() => setMarginSheet(true)}
          className="flex items-center justify-center gap-0.5 rounded bg-secondary py-1.5 text-[11px] font-medium text-foreground"
        >
          {marginMode === "cross" ? "Cross" : "Isolated"}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          onClick={() => setLeverageSheet(true)}
          className="flex items-center justify-center gap-0.5 rounded bg-secondary py-1.5 text-[11px] font-semibold text-foreground"
        >
          {leverage}x
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        <button
          onClick={() => setAssetSheet(true)}
          className="flex items-center justify-center gap-0.5 rounded bg-secondary py-1.5 text-[11px] font-medium text-foreground"
        >
          {assetMode === "single" ? "S" : "M"}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* ── Buy / Sell toggle ── */}
      <div className="flex gap-1 px-2 pb-0.5">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-[7px] text-[11px] font-semibold rounded-md transition-colors ${side === "buy" ? "bg-trading-green text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-[7px] text-[11px] font-semibold rounded-md transition-colors ${side === "sell" ? "bg-trading-red text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Sell / Short
        </button>
      </div>

      {/* ── Form body ── */}
      <div className="flex flex-col gap-1.5 px-2 pb-2">

        {/* Order type → bottom sheet */}
        <button
          onClick={() => setOrderTypeSheet(true)}
          className="flex items-center justify-between w-full px-2 py-1.5 rounded border border-border bg-transparent text-[11px] text-foreground hover:border-muted-foreground transition-colors"
        >
          <span>{orderType}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {/* Available balance */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Available</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono-num text-foreground">
              {user ? `${availableBalance.toFixed(2)} ${quoteCoin}` : `0.00 ${quoteCoin}`}
            </span>
            {user && <PlusCircle className="w-3 h-3 text-trading-amber" />}
          </div>
        </div>

        {/* Stop Price */}
        {showStopPrice && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Stop Price</label>
            <div className="flex items-center rounded border border-border bg-transparent px-2 py-[5px] focus-within:border-muted-foreground transition-colors overflow-hidden">
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <button
                onClick={() => setStopUnitSheet(true)}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground ml-1.5 shrink-0"
              >
                {stopPriceUnit}
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Price field */}
        {showPriceField && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">
              {isMakerOnly ? "Maker Price" : "Price"}
            </label>
            <div className="flex items-center rounded border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-2 py-[5px] bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <button onClick={() => setPriceUnitSheet(true)}
                className="flex items-center gap-0.5 px-1.5 py-[5px] text-[11px] text-muted-foreground shrink-0">
                {priceUnit} <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-1.5 py-[5px] text-[11px] text-trading-amber font-semibold shrink-0">BBO</button>
            </div>
          </div>
        )}

        {/* Market Price placeholder */}
        {isMarket && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Price</label>
            <div className="flex items-center rounded border border-border bg-accent/30 px-2 py-[5px]">
              <span className="flex-1 text-[11px] text-muted-foreground">Market Price</span>
            </div>
          </div>
        )}

        {/* Size input */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Size</label>
          <div className="flex items-center rounded border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <input
              type="number"
              value={size}
              onChange={(e) => { setSize(e.target.value); setSliderValue(0); }}
              placeholder="0.00"
              className="flex-1 px-2 py-[5px] bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
            />
            <button onClick={() => setSizeUnitSheet(true)}
              className="flex items-center gap-0.5 px-1.5 py-[5px] text-[11px] text-muted-foreground shrink-0">
              {sizeUnit} <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Percentage slider */}
        <div className="px-0.5">
          <div
            ref={sliderRef}
            onClick={handleSliderClick}
            className="relative h-[3px] rounded-full bg-border cursor-pointer"
          >
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-150 ${side === "buy" ? "bg-trading-green" : "bg-trading-red"}`}
              style={{ width: `${sliderValue}%` }}
            />
            {percentages.map((pct) => (
              <button
                key={pct}
                onClick={(e) => { e.stopPropagation(); applySlider(pct); }}
                className={`absolute w-2.5 h-2.5 rounded-full border-2 -translate-y-1/2 top-1/2 -translate-x-1/2 transition-all duration-150 ${
                  sliderValue >= pct
                    ? side === "buy" ? "bg-trading-green border-trading-green" : "bg-trading-red border-trading-red"
                    : "bg-background border-border hover:border-muted-foreground"
                }`}
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {percentages.map((pct) => (
              <button key={pct} onClick={() => applySlider(pct)}
                className={`text-[10px] transition-colors ${sliderValue === pct
                  ? side === "buy" ? "text-trading-green font-semibold" : "text-trading-red font-semibold"
                  : "text-muted-foreground hover:text-foreground"}`}>
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Total Value */}
        {showTotalValue && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Total</label>
            <div className="flex items-center rounded border border-border bg-transparent px-2 py-[5px] focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <span className="text-[11px] text-muted-foreground ml-1.5 shrink-0">{quoteCoin}</span>
            </div>
          </div>
        )}

        {/* Checkboxes + TIF */}
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={tpsl} onChange={(e) => { setTpsl(e.target.checked); if (!e.target.checked) { setTakeProfit(""); setStopLoss(""); } }}
              className="w-3 h-3 rounded accent-primary" />
            <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">TP/SL</span>
          </label>
          {tpsl && (
            <div className="flex flex-col gap-1 pl-0.5">
              <div className="flex items-center gap-1.5 rounded border border-border bg-secondary/40 px-2 py-1">
                <span className="text-[10px] text-trading-green font-medium w-6 shrink-0">TP</span>
                <input
                  type="number"
                  placeholder="Take Profit Price"
                  value={takeProfit}
                  onChange={e => setTakeProfit(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">{quoteCoin}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-border bg-secondary/40 px-2 py-1">
                <span className="text-[10px] text-trading-red font-medium w-6 shrink-0">SL</span>
                <input
                  type="number"
                  placeholder="Stop Loss Price"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <span className="text-[10px] text-muted-foreground shrink-0">{quoteCoin}</span>
              </div>
            </div>
          )}
          {isLimit && (
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={hiddenOrder} onChange={(e) => setHiddenOrder(e.target.checked)}
                className="w-3 h-3 rounded accent-primary" />
              <span className="whitespace-nowrap">Hidden Order</span>
            </label>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)}
                className="w-3 h-3 rounded accent-primary" />
              <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">Reduce-Only</span>
            </label>
            {showTif && (
              <button onClick={() => setTifSheet(true)}
                className="flex items-center gap-0.5 text-[11px] text-foreground">
                {timeInForce}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-0.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. liq. price</span>
            <span className="text-foreground font-mono-num">-- {quoteCoin}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margin ({leverage}x)</span>
            <span className="text-foreground font-mono-num">{estMargin > 0 ? estMargin.toFixed(2) : "0.00"} {quoteCoin}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max</span>
            <span className="text-foreground font-mono-num">{maxOrderSize} {baseCoin}</span>
          </div>
        </div>

        {/* CTA */}
        {user ? (
          <button
            onClick={() => orderMutation.mutate()}
            disabled={!size || orderMutation.isPending}
            className={`w-full py-[7px] rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50 ${
              side === "buy" ? "bg-trading-green text-black hover:opacity-90" : "bg-trading-red text-white hover:opacity-90"
            }`}
          >
            {orderMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {side === "buy" ? `Long ${baseCoin}` : `Short ${baseCoin}`}
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-2.5 rounded text-sm font-bold bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            Connect
          </button>
        )}
      </div>

      {/* ══════════ Bottom sheets ══════════ */}

      {/* Margin mode */}
      <BottomSheet open={marginSheet} onClose={() => setMarginSheet(false)} title={`${apiSymbol} Margin mode`}>
        <p className="mb-4 text-[12px] leading-snug text-muted-foreground">
          Switching of margin mode only applies to the selected contract
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SheetOption
            active={marginMode === "cross"}
            label="Cross"
            onClick={() => { if (marginMode === "cross") { setMarginSheet(false); return; } marginMutation.mutate("cross"); }}
          />
          <SheetOption
            active={marginMode === "isolated"}
            label="Isolated"
            onClick={() => { if (marginMode === "isolated") { setMarginSheet(false); return; } marginMutation.mutate("isolated"); }}
          />
        </div>
        <h4 className="mt-5 text-[14px] font-medium text-foreground">What are cross and isolated modes?</h4>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          The margin assigned to a position is restricted to a certain amount. If the margin falls below the
          maintenance margin level, the position is liquidated. However, you can add and remove margin at will
          under isolated mode. Cross mode shares your whole balance as margin across positions.
        </p>
        {marginMutation.isPending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
          </div>
        )}
      </BottomSheet>

      {/* Leverage */}
      <BottomSheet open={leverageSheet} onClose={() => setLeverageSheet(false)} title="Adjust Leverage">
        <div className="grid grid-cols-3 gap-2">
          {leverageOptions.map((lev) => (
            <button
              key={lev}
              onClick={() => { setLeverage(lev); setLeverageSheet(false); }}
              className={`rounded-xl border py-3 text-[14px] font-semibold transition-colors ${
                leverage === lev
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/40 text-foreground hover:bg-accent"
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <Info className="mt-[1px] h-3 w-3 shrink-0" />
          Selecting higher leverage increases liquidation risk.
        </p>
      </BottomSheet>

      {/* Asset mode */}
      <BottomSheet open={assetSheet} onClose={() => setAssetSheet(false)} title="Asset Mode">
        <div className="flex flex-col gap-3">
          <SheetOption
            active={assetMode === "single"}
            label="Single-Asset Mode"
            sub="Use pair's settlement currency as margin. PnL offsets across Cross positions of the same currency. Supports Cross and Isolated margin."
            onClick={() => { setAssetMode("single"); setAssetSheet(false); }}
          />
          <SheetOption
            active={assetMode === "multi"}
            label="Multi-Asset Mode"
            sub="Contracts can be traded across margin assets. Profits and losses of positions with different margin assets can offset one another. Supports cross margin."
            onClick={() => { setAssetMode("multi"); setAssetSheet(false); }}
          />
        </div>
      </BottomSheet>

      {/* Order type */}
      <BottomSheet open={orderTypeSheet} onClose={() => setOrderTypeSheet(false)} title="Order Type">
        <div className="flex flex-col gap-2">
          {orderTypes.map((type) => (
            <SheetOption
              key={type}
              active={orderType === type}
              label={type}
              onClick={() => { setOrderType(type); setOrderTypeSheet(false); }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Size unit */}
      <BottomSheet open={sizeUnitSheet} onClose={() => setSizeUnitSheet(false)} title="Size Unit">
        <div className="flex flex-col gap-2">
          {[quoteCoin, baseCoin].map((unit) => (
            <SheetOption key={unit} active={sizeUnit === unit} label={unit}
              onClick={() => { setSizeUnit(unit); setSizeUnitSheet(false); }} />
          ))}
        </div>
      </BottomSheet>

      {/* Price unit */}
      <BottomSheet open={priceUnitSheet} onClose={() => setPriceUnitSheet(false)} title="Price Unit">
        <div className="flex flex-col gap-2">
          {[quoteCoin, baseCoin].map((unit) => (
            <SheetOption key={unit} active={priceUnit === unit} label={unit}
              onClick={() => { setPriceUnit(unit); setPriceUnitSheet(false); }} />
          ))}
        </div>
      </BottomSheet>

      {/* Stop price unit */}
      <BottomSheet open={stopUnitSheet} onClose={() => setStopUnitSheet(false)} title="Stop Price Unit">
        <div className="flex flex-col gap-2">
          {[quoteCoin, baseCoin].map((unit) => (
            <SheetOption key={unit} active={stopPriceUnit === unit} label={unit}
              onClick={() => { setStopPriceUnit(unit); setStopUnitSheet(false); }} />
          ))}
        </div>
      </BottomSheet>

      {/* Time in force */}
      <BottomSheet open={tifSheet} onClose={() => setTifSheet(false)} title="Time in Force">
        <div className="flex flex-col gap-2">
          {[
            { value: "GTC", label: "GTC", sub: "Good Till Canceled" },
            { value: "FOK", label: "FOK", sub: "Fill or Kill" },
            { value: "IOC", label: "IOC", sub: "Immediate or Cancel" },
          ].map((opt) => (
            <SheetOption
              key={opt.value}
              active={timeInForce === opt.value}
              label={opt.label}
              sub={opt.sub}
              onClick={() => { setTimeInForce(opt.value); setTifSheet(false); }}
            />
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default FuturesTradePanel;
