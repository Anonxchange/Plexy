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
  /** "center" = big centered title (margin / leverage / asset mode sheets),
   *  "left"   = small muted label (order type & unit sheets) */
  align?: "center" | "left";
  children: ReactNode;
}

const BottomSheet = ({ open, onClose, title, align = "center", children }: BottomSheetProps) => {
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
        <div className="relative mb-4 flex items-center">
          {align === "center" ? (
            <h3 className="w-full text-center text-[17px] font-semibold text-foreground">{title}</h3>
          ) : (
            <h3 className="text-[13px] font-normal text-muted-foreground">{title}</h3>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* Pill choice used side-by-side in the margin-mode sheet, with the
   little check badge tucked into the top-right corner (screenshot 1) */
const PillChoice = ({
  active,
  onClick,
  label,
}: { active: boolean; onClick: () => void; label: string }) => (
  <button
    onClick={onClick}
    className={`relative w-full overflow-hidden rounded-xl border py-3.5 text-[15px] transition-colors ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-secondary/60 text-foreground hover:bg-accent"
    }`}
  >
    {label}
    {active && (
      <span className="absolute right-0 top-0 flex h-5 w-5 items-end justify-end rounded-bl-xl bg-primary pr-[3px] pb-[1px] text-[10px] font-bold leading-none text-primary-foreground">
        ✓
      </span>
    )}
  </button>
);

/* Radio row: circle + title, then one muted line per sentence (screenshot 2) */
const RadioChoice = ({
  active,
  onClick,
  label,
  lines,
}: { active: boolean; onClick: () => void; label: string; lines: string[] }) => (
  <button onClick={onClick} className="w-full text-left">
    <div className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          active ? "border-primary bg-primary" : "border-border bg-secondary"
        }`}
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </span>
      <span className="text-[16px] font-medium text-foreground">{label}</span>
    </div>
    <div className="mt-2 flex flex-col gap-1 pl-8">
      {lines.map((line) => (
        <p key={line} className="text-[12px] leading-snug text-muted-foreground">{line}</p>
      ))}
    </div>
  </button>
);

/* Flat list row with a trailing check — order type & unit sheets (screenshot 4) */
const ListChoice = ({
  active,
  onClick,
  label,
  sub,
}: { active: boolean; onClick: () => void; label: string; sub?: string }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center justify-between border-b border-border/60 py-3.5 text-left last:border-b-0"
  >
    <span>
      <span className={`block text-[15px] ${active ? "font-semibold text-foreground" : "text-foreground/90"}`}>
        {label}
      </span>
      {sub && <span className="mt-0.5 block text-[11px] text-muted-foreground">{sub}</span>}
    </span>
    {active && <span className="text-[15px] font-bold text-foreground">✓</span>}
  </button>
);

/* Full-width rounded CTA pinned to the bottom of a sheet */
const SheetCta = ({
  label,
  onClick,
  loading,
}: { label: string; onClick: () => void; loading?: boolean }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[16px] font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {label}
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
  const [slippage, setSlippage] = useState(false);
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
  const maxNotional = (availableBalance * leverageNum).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const maxOrderSize = priceNum > 0
    ? ((availableBalance * leverageNum) / priceNum).toFixed(4)
    : "--";

  /* Size slider — fully flexible: any percentage 0-100, ticks are just shortcuts */
  const applySlider = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    setSliderValue(clamped);
    if (clamped === 0) { setSize(""); return; }
    const avbl = availableBalance * (clamped / 100) * leverageNum;
    if (sizeUnit === quoteCoin) {
      setSize(avbl.toFixed(2));
    } else {
      setSize(priceNum > 0 ? (avbl / priceNum).toFixed(6) : "");
    }
  };

  const pctFromClientX = (clientX: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const handleSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    applySlider(pctFromClientX(e.clientX));
  };

  const handleSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    applySlider(pctFromClientX(e.clientX));
  };

  const asterType = UI_TO_FUTURES_TYPE[orderType] as any;
  const isMarket = orderType === "Market";
  const isLimit = orderType === "Limit";
  const isStopLimit = orderType === "Stop Limit";
  const isStopMarket = orderType === "Stop Market";
  const isMakerOnly = orderType === "Maker Only";
  const showPriceField = isLimit || isMakerOnly || isStopLimit;
  const showStopPrice = isStopLimit || isStopMarket;
  // Time in force now applies to Limit, Maker Only and Stop Limit
  const showTif = isLimit || isStopLimit || isMakerOnly;

  // Multi-asset mode only supports cross margin; isolated needs Single-Asset Mode.
  const isolatedAllowed = assetMode === "single";

  // Draft selection inside the margin sheet — only committed on Confirm.
  const [draftMarginMode, setDraftMarginMode] = useState<"cross" | "isolated">(marginMode);
  const openMarginSheet = () => {
    setDraftMarginMode(marginMode);
    setMarginSheet(true);
  };

  // Draft selection inside the asset-mode sheet — only committed on Confirm.
  const [draftAssetMode, setDraftAssetMode] = useState<"single" | "multi">(assetMode);
  const openAssetSheet = () => {
    setDraftAssetMode(assetMode);
    setAssetSheet(true);
  };

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

  const assetMutation = useMutation({
    mutationFn: async (mode: "single" | "multi") => {
      const svc = asterTrading as any;
      const fn = svc.futuresSetMultiAssetsMargin ?? svc.futuresMultiAssetsMargin;
      if (typeof fn === "function") {
        return fn.call(svc, mode === "multi");
      }
      return null;
    },
    onSuccess: (_data, mode) => {
      setAssetMode(mode);
      // Multi-asset mode is cross-only — fall back to cross if isolated was selected.
      if (mode === "multi" && marginMode === "isolated") {
        setMarginMode("cross");
        setDraftMarginMode("cross");
      }
      setAssetSheet(false);
      toast({ title: `Asset mode set to ${mode === "multi" ? "Multi-Asset" : "Single-Asset"}` });
    },
    onError: (err: Error) => {
      toast({ title: "Asset mode change failed", description: err.message, variant: "destructive" });
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
      <div className="grid grid-cols-3 gap-2 px-3 pt-3 pb-1">
        <button
          onClick={openMarginSheet}
          className="flex items-center justify-center gap-1 rounded-lg bg-secondary py-2.5 text-[13px] font-medium text-foreground"
        >
          {marginMode === "cross" ? "Cross" : "Isolated"}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => setLeverageSheet(true)}
          className="flex items-center justify-center gap-1 rounded-lg bg-secondary py-2.5 text-[13px] font-semibold text-foreground"
        >
          {leverage}x
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={openAssetSheet}
          className="flex items-center justify-center gap-1 rounded-lg bg-secondary py-2.5 text-[13px] font-medium text-foreground"
        >
          {assetMode === "single" ? "S" : "M"}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Buy / Sell toggle ── */}
      <div className="flex gap-2 px-3 pb-1">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${side === "buy" ? "bg-trading-green text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-2.5 text-[13px] font-semibold rounded-lg transition-colors ${side === "sell" ? "bg-trading-red text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Sell / Short
        </button>
      </div>

      {/* ── Form body ── */}
      <div className="flex flex-col gap-2.5 px-3 pb-3">

        {/* Order type → bottom sheet */}
        <button
          onClick={() => setOrderTypeSheet(true)}
          className="relative flex items-center justify-center w-full px-3 py-2 rounded-lg border border-border bg-transparent text-[13px] text-foreground hover:border-muted-foreground transition-colors"
        >
          <span className="text-center">{orderType}</span>
          <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground" />
        </button>

        {/* Stop Price — compact like Size */}
        {showStopPrice && (
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5">
              <span className="text-[10px] leading-tight text-muted-foreground">Stop price</span>
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[14px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <button
              onClick={() => setStopUnitSheet(true)}
              className="flex shrink-0 items-center gap-1 px-2.5 text-[12px] text-muted-foreground"
            >
              {stopPriceUnit}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Price field — number section gets more vertical space so values don't hide */}
        {showPriceField && (
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-2">
              <span className="text-[10px] leading-tight text-muted-foreground">
                {isMakerOnly ? "Maker price" : "Order price"}
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[15px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <span className="flex shrink-0 items-center px-1.5 text-[11px] leading-none text-muted-foreground">
              {priceUnit}
            </span>
            <button className="shrink-0 px-2 text-[12px] text-trading-amber font-semibold">BBO</button>

          </div>
        )}

        {/* Size input — compact */}
        <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
          <div className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5">
            <span className="text-[10px] leading-tight text-muted-foreground">Size</span>
            <input
              type="number"
              value={size}
              onChange={(e) => { setSize(e.target.value); setSliderValue(0); }}
              placeholder="0.00"
              className="w-full bg-transparent text-[14px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
            />
          </div>
          <button onClick={() => setSizeUnitSheet(true)}
            className="flex shrink-0 items-center gap-1 px-2.5 text-[12px] text-muted-foreground">
            {sizeUnit} <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Percentage slider — drag anywhere, any value */}
        <div className="px-1 pt-1">
          <div
            ref={sliderRef}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            className="relative h-1 rounded-full bg-border cursor-pointer touch-none"
          >
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${side === "buy" ? "bg-trading-green" : "bg-trading-red"}`}
              style={{ width: `${sliderValue}%` }}
            />
            {percentages.map((pct) => (
              <span
                key={pct}
                className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full -translate-y-1/2 top-1/2 -translate-x-1/2 ${
                  sliderValue >= pct
                    ? side === "buy" ? "bg-trading-green" : "bg-trading-red"
                    : "bg-muted-foreground/50"
                }`}
                style={{ left: `${pct}%` }}
              />
            ))}
            {/* draggable thumb */}
            <span
              className={`pointer-events-none absolute h-4 w-4 rounded-full border-2 border-background -translate-y-1/2 top-1/2 -translate-x-1/2 shadow ${
                side === "buy" ? "bg-trading-green" : "bg-trading-red"
              }`}
              style={{ left: `${sliderValue}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {percentages.map((pct) => (
              <button key={pct} onClick={() => applySlider(pct)}
                className={`text-[12px] transition-colors ${sliderValue === pct
                  ? side === "buy" ? "text-trading-green font-semibold" : "text-trading-red font-semibold"
                  : "text-muted-foreground hover:text-foreground"}`}>
                {pct}%
              </button>
            ))}
          </div>

        </div>

        {/* Available balance — sits under the slider */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="truncate text-[13px] text-muted-foreground">Available</span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[13px] font-mono-num text-foreground">
              {user ? `${availableBalance.toFixed(2)} ${quoteCoin}` : `0.00 ${quoteCoin}`}
            </span>
            {user && <PlusCircle className="w-4 h-4 text-trading-amber" />}
          </div>
        </div>

        {/* Checkboxes + TIF */}
        <div className="flex flex-col gap-2">
          {(isMarket || isStopMarket) && (
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={slippage} onChange={(e) => setSlippage(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary" />
              <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">Slippage Tolerance</span>
            </label>
          )}
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={tpsl} onChange={(e) => { setTpsl(e.target.checked); if (!e.target.checked) { setTakeProfit(""); setStopLoss(""); } }}
              className="w-3.5 h-3.5 rounded accent-primary" />
            <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">TP/SL</span>
          </label>
          {tpsl && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <span className="text-[12px] text-trading-green font-medium w-6 shrink-0">TP</span>
                <input
                  type="number"
                  placeholder="Take Profit Price"
                  value={takeProfit}
                  onChange={e => setTakeProfit(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <span className="text-[12px] text-muted-foreground shrink-0">{quoteCoin}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                <span className="text-[12px] text-trading-red font-medium w-6 shrink-0">SL</span>
                <input
                  type="number"
                  placeholder="Stop Loss Price"
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
                />
                <span className="text-[12px] text-muted-foreground shrink-0">{quoteCoin}</span>
              </div>
            </div>
          )}
          {isLimit && (
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={hiddenOrder} onChange={(e) => setHiddenOrder(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary" />
              <span className="whitespace-nowrap">Hidden Order</span>
            </label>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary" />
              <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">Reduce-Only</span>
            </label>
            {showTif && (
              <button onClick={() => setTifSheet(true)}
                className="flex items-center gap-1 text-[13px] text-foreground">
                {timeInForce}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="flex flex-col gap-1.5 text-[13px]">
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
            className={`w-full py-3 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 ${
              side === "buy" ? "bg-trading-green text-black hover:opacity-90" : "bg-trading-red text-white hover:opacity-90"
            }`}
          >
            {orderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {side === "buy" ? `Long ${baseCoin}` : `Short ${baseCoin}`}
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-3 rounded-lg text-[14px] font-bold bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            Connect
          </button>
        )}
      </div>


      {/* ══════════ Bottom sheets ══════════ */}

      {/* Margin mode — screenshot 1 arrangement */}
      <BottomSheet open={marginSheet} onClose={() => setMarginSheet(false)} title={`${apiSymbol} Margin mode`}>
        <p className="text-[14px] leading-snug text-foreground">
          Switching of margin mode only applies to the selected contract
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PillChoice active={draftMarginMode === "cross"} label="Cross" onClick={() => setDraftMarginMode("cross")} />
          <PillChoice active={draftMarginMode === "isolated"} label="Isolated" onClick={() => setDraftMarginMode("isolated")} />
        </div>
        <h4 className="mt-6 text-[15px] font-medium text-foreground">What are cross and isolated modes?</h4>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          The Margin assigned to a position is restricted to a certain amount. If the Margin falls below the
          Maintenance Margin level, the position is liquidated. However, you can add and remove Margin at will
          under this mode.
        </p>
        <SheetCta
          label={user ? "Confirm" : "Connect"}
          loading={marginMutation.isPending}
          onClick={() => { if (!user) { navigate("/signin"); return; } marginMutation.mutate(draftMarginMode); }}
        />
      </BottomSheet>

      {/* Adjust leverage — screenshot 3 arrangement */}
      <BottomSheet open={leverageSheet} onClose={() => setLeverageSheet(false)} title={`${apiSymbol} Adjust leverage`}>
        <p className="text-[13px] text-muted-foreground">Leverage</p>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <button
            onClick={() => setLeverage(String(Math.max(1, leverageNum - 1)))}
            aria-label="Decrease leverage"
            className="text-[20px] leading-none text-muted-foreground hover:text-foreground"
          >
            −
          </button>
          <span className="text-[17px] font-semibold text-foreground font-mono-num">{leverage}</span>
          <button
            onClick={() => setLeverage(String(Math.min(200, leverageNum + 1)))}
            aria-label="Increase leverage"
            className="text-[20px] leading-none text-muted-foreground hover:text-foreground"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={200}
          step={1}
          value={leverageNum}
          onChange={(e) => setLeverage(e.target.value)}
          className="mt-4 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <div className="mt-2 flex justify-between">
          {[1, 40, 80, 120, 160, 200].map((tick) => (
            <button
              key={tick}
              onClick={() => setLeverage(String(tick))}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              {tick}x
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-border px-4 py-4 text-center">
          <p className="text-[14px] text-foreground">Remaining openable notional value</p>
          <p className="mt-1.5 text-[15px] font-semibold text-foreground font-mono-num">
            {maxNotional} {quoteCoin}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            The maximum notional value you can open under your current leverage and system risk control limits.{" "}
            <span className="text-primary">Learn more</span>
          </p>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Please note that leverage changing will also apply for open positions and open orders.
          <br />
          Selecting higher leverage (such as 10x) increases your chances of liquidation.
        </p>
        <SheetCta
          label={user ? "Confirm" : "Connect"}
          onClick={() => { if (!user) { navigate("/signin"); return; } setLeverageSheet(false); }}
        />
      </BottomSheet>

      {/* Asset mode — screenshot 2 arrangement */}
      <BottomSheet open={assetSheet} onClose={() => setAssetSheet(false)} title="Asset Mode">
        <div className="flex flex-col gap-6">
          <RadioChoice
            active={assetMode === "single"}
            label="Single-Asset Mode"
            lines={[
              "Use pair's settlement currency as margin.",
              "PnL offsets across Cross positions of the same currency.",
              "Supports Cross and Isolated margin.",
            ]}
            onClick={() => setAssetMode("single")}
          />
          <RadioChoice
            active={assetMode === "multi"}
            label="Multi-Asset Mode"
            lines={[
              "Contracts can be traded across margin assets",
              "The profits and losses of positions with different margin assets can offset one another",
              "Supports cross margin",
            ]}
            onClick={() => setAssetMode("multi")}
          />
        </div>
        <p className="mt-6 text-[13px] text-muted-foreground">
          Read about <span className="text-primary">Multi-Asset Mode</span> to better manage risk.
        </p>
        <SheetCta
          label={user ? "Confirm" : "Enable Trading"}
          onClick={() => { if (!user) { navigate("/signin"); return; } setAssetSheet(false); }}
        />
      </BottomSheet>

      {/* Order type — screenshot 4 arrangement */}
      <BottomSheet open={orderTypeSheet} onClose={() => setOrderTypeSheet(false)} title="Order Type" align="left">
        <div className="flex flex-col">
          {orderTypes.map((type) => (
            <ListChoice
              key={type}
              active={orderType === type}
              label={type}
              onClick={() => { setOrderType(type); setOrderTypeSheet(false); }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* Size unit */}
      <BottomSheet open={sizeUnitSheet} onClose={() => setSizeUnitSheet(false)} title="Size Unit" align="left">
        <div className="flex flex-col gap-2">
          {[quoteCoin, baseCoin].map((unit) => (
            <ListChoice key={unit} active={sizeUnit === unit} label={unit}
              onClick={() => { setSizeUnit(unit); setSizeUnitSheet(false); }} />
          ))}
        </div>
      </BottomSheet>




      {/* Stop price unit */}
      <BottomSheet open={stopUnitSheet} onClose={() => setStopUnitSheet(false)} title="Stop Price Unit" align="left">
        <div className="flex flex-col gap-2">
          {[quoteCoin, baseCoin].map((unit) => (
            <ListChoice key={unit} active={stopPriceUnit === unit} label={unit}
              onClick={() => { setStopPriceUnit(unit); setStopUnitSheet(false); }} />
          ))}
        </div>
      </BottomSheet>

      {/* Time in force */}
      <BottomSheet open={tifSheet} onClose={() => setTifSheet(false)} title="Time in Force" align="left">
        <div className="flex flex-col gap-2">
          {[
            { value: "GTC", label: "GTC", sub: "Good Till Canceled" },
            { value: "FOK", label: "FOK", sub: "Fill or Kill" },
            { value: "IOC", label: "IOC", sub: "Immediate or Cancel" },
          ].map((opt) => (
            <ListChoice
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
