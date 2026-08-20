import { useState, useRef, useEffect } from "react";
import { ChevronDown, PlusCircle, Loader2, Info } from '@/lib/icons';
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";
import { completeTask } from "@/lib/rewards-api";
import { getSubscribedTaskIds } from "@/hooks/use-task-subscriptions";

const orderTypes = ["Market", "Limit", "Stop Limit", "Stop Market", "Maker Only"];

const UI_TO_SPOT_TYPE: Record<string, string> = {
  "Market":      "MARKET",
  "Limit":       "LIMIT",
  "Stop Limit":  "STOP_LOSS_LIMIT",
  "Stop Market": "STOP_LOSS",
  "Maker Only":  "LIMIT_MAKER",
};

const PCT_STEPS = [0, 25, 50, 75, 100];

interface TradePanelProps {
  symbol?: string;
}

const TradePanel = ({ symbol = "ASTER/USDT" }: TradePanelProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("Market");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [tifDropdownOpen, setTifDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tifRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (tifRef.current && !tifRef.current.contains(e.target as Node)) setTifDropdownOpen(false);
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) setUnitDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apiSymbol = symbol.replace("/", "");
  const baseCoin = symbol.split("/")[0];
  const quoteCoin = symbol.split("/")[1] || "USDT";

  const [amountUnit, setAmountUnit] = useState<string>(baseCoin);
  useEffect(() => { setAmountUnit(baseCoin); }, [baseCoin]);

  const { data: spotAccount } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtBalance = parseFloat(spotAccount?.balances?.find((b: any) => b.asset === quoteCoin)?.free ?? "0");
  const baseBalance = parseFloat(spotAccount?.balances?.find((b: any) => b.asset === baseCoin)?.free ?? "0");

  const avblDisplay = side === "buy"
    ? `${usdtBalance.toFixed(2)} ${quoteCoin}`
    : `${baseBalance.toFixed(4)} ${baseCoin}`;

  const priceNum = parseFloat(price);

  const maxDisplay = (() => {
    if (!user) return `0.00 ${amountUnit}`;
    if (side === "buy") {
      if (amountUnit === quoteCoin) return `${usdtBalance.toFixed(2)} ${quoteCoin}`;
      return priceNum > 0 ? `${(usdtBalance / priceNum).toFixed(4)} ${baseCoin}` : `-- ${baseCoin}`;
    }
    if (amountUnit === quoteCoin) {
      return priceNum > 0 ? `${(baseBalance * priceNum).toFixed(2)} ${quoteCoin}` : `-- ${quoteCoin}`;
    }
    return `${baseBalance.toFixed(4)} ${baseCoin}`;
  })();

  /* Fully flexible slider — any percentage 0-100, ticks are just shortcuts */
  const applySlider = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    setSliderPct(clamped);
    if (clamped === 0) { setAmount(""); setTotalValue(""); return; }
    if (side === "buy") {
      const available = usdtBalance * (clamped / 100);
      setTotalValue(available.toFixed(2));
      if (amountUnit === quoteCoin) {
        setAmount(available.toFixed(2));
      } else if (priceNum > 0) {
        setAmount((available / priceNum).toFixed(6));
      }
    } else {
      const qty = baseBalance * (clamped / 100);
      if (amountUnit === quoteCoin) {
        setAmount(priceNum > 0 ? (qty * priceNum).toFixed(2) : "");
      } else {
        setAmount(qty.toFixed(8));
      }
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

  const asterType = UI_TO_SPOT_TYPE[orderType] as any;
  const isMarket = orderType === "Market";
  const isLimit = orderType === "Limit";
  const isStopLimit = orderType === "Stop Limit";
  const isStopMarket = orderType === "Stop Market";
  const isMakerOnly = orderType === "Maker Only";
  const showPriceField = isLimit || isMakerOnly;
  const showStopPrice = isStopLimit || isStopMarket;
  const showTotalValue = isLimit || isStopLimit || isMakerOnly;

  const orderMutation = useMutation({
    mutationFn: () => {
      return asterTrading.spotPlaceOrder({
        symbol: apiSymbol,
        side: side.toUpperCase() as "BUY" | "SELL",
        type: asterType,
        quantity: amount || "0",
        ...(showPriceField && price ? { price } : {}),
        ...(showStopPrice && stopPrice ? { stopPrice } : {}),
        ...((isLimit || isStopLimit) ? { timeInForce } : {}),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed",
        description: `${side === "buy" ? "Buy" : "Sell"} ${amount} ${baseCoin} submitted (ID: ${data?.orderId ?? "—"})`,
      });
      setAmount(""); setTotalValue(""); setSliderPct(0);
      const subs = getSubscribedTaskIds();
      if (subs.includes("daily-spot"))   completeTask("daily-spot").catch(() => {});
      if (subs.includes("first-trade"))  completeTask("first-trade").catch(() => {});
    },
    onError: (err: Error) => {
      toast({
        title: "Order failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const availableRow = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <span className="truncate text-[13px] text-muted-foreground">Available</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[13px] font-mono-num text-foreground">
          {user ? avblDisplay : `0.00 ${side === "buy" ? quoteCoin : baseCoin}`}
        </span>
        {user && (
          <button className="text-primary hover:opacity-70">
            <PlusCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full bg-background h-full">

      {/* ── Buy / Sell — single shared container ── */}
      <div className="p-3 flex-shrink-0">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => { setSide("buy"); setSliderPct(0); }}
            className={`py-2.5 text-[14px] font-semibold rounded-md transition-colors ${
              side === "buy" ? "bg-trading-green text-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => { setSide("sell"); setSliderPct(0); }}
            className={`py-2.5 text-[14px] font-semibold rounded-md transition-colors ${
              side === "sell" ? "bg-trading-red text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3 pb-3 flex-1 overflow-y-auto">

        {/* ── Order type ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-border bg-transparent text-[13px] text-foreground hover:border-muted-foreground transition-colors"
          >
            <span>{orderType}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                    orderType === type
                      ? "text-trading-green bg-trading-green/5"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Stop Price ── */}
        {showStopPrice && (
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5">
              <span className="text-[11px] leading-tight text-muted-foreground">Stop price</span>
              <input
                type="number"
                value={stopPrice}
                onChange={e => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[14px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <span className="flex shrink-0 items-center px-2.5 text-[12px] text-muted-foreground">{quoteCoin}</span>
          </div>
        )}

        {/* ── Price ── */}
        {showPriceField && (
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-2">
              <span className="text-[11px] leading-tight text-muted-foreground">
                {isMakerOnly ? "Maker price" : "Order price"}
              </span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[15px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <span className="flex shrink-0 items-center px-2.5 text-[12px] text-muted-foreground">{quoteCoin}</span>
          </div>
        )}

        {/* ── Amount (two-column container with unit selector) ── */}
        <div className="relative" ref={unitRef}>
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5">
              <span className="text-[11px] leading-tight text-muted-foreground">Amount</span>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setSliderPct(0); }}
                placeholder="0.00"
                className="w-full bg-transparent text-[14px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <button
              onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
              className="flex shrink-0 items-center gap-1 px-2.5 text-[12px] text-muted-foreground"
            >
              {amountUnit}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${unitDropdownOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
          {unitDropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 min-w-[110px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
              {[baseCoin, quoteCoin].map((unit) => (
                <button
                  key={unit}
                  onClick={() => { setAmountUnit(unit); setUnitDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                    amountUnit === unit ? "text-trading-green bg-trading-green/5" : "text-foreground hover:bg-accent"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Percentage slider — drag anywhere, any value ── */}
        <div className="px-1 pt-1">
          <div
            ref={sliderRef}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            className="relative h-1 rounded-full bg-border cursor-pointer touch-none"
          >
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${side === "buy" ? "bg-trading-green" : "bg-trading-red"}`}
              style={{ width: `${sliderPct}%` }}
            />
            {PCT_STEPS.map((pct) => (
              <span
                key={pct}
                className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full -translate-y-1/2 top-1/2 -translate-x-1/2 ${
                  sliderPct >= pct
                    ? side === "buy" ? "bg-trading-green" : "bg-trading-red"
                    : "bg-muted-foreground/50"
                }`}
                style={{ left: `${pct}%` }}
              />
            ))}
            <span
              className={`pointer-events-none absolute h-4 w-4 rounded-full border-2 border-background -translate-y-1/2 top-1/2 -translate-x-1/2 shadow ${
                side === "buy" ? "bg-trading-green" : "bg-trading-red"
              }`}
              style={{ left: `${sliderPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {PCT_STEPS.map((pct) => (
              <button
                key={pct}
                onClick={() => applySlider(pct)}
                className={`text-[12px] transition-colors ${
                  sliderPct === pct
                    ? side === "buy" ? "text-trading-green font-semibold" : "text-trading-red font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {!showTotalValue && availableRow}

        {/* ── Total Value ── */}
        {showTotalValue && (
          <div className="flex items-stretch rounded-lg border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
            <div className="flex min-w-0 flex-1 flex-col px-2.5 py-1.5">
              <span className="text-[11px] leading-tight text-muted-foreground">Total</span>
              <input
                type="number"
                value={totalValue}
                onChange={e => setTotalValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-[14px] leading-tight text-foreground outline-none placeholder:text-muted-foreground/60 min-w-0 font-mono-num"
              />
            </div>
            <span className="flex shrink-0 items-center px-2.5 text-[12px] text-muted-foreground">{quoteCoin}</span>
          </div>
        )}

        {showTotalValue && availableRow}

        {/* ── Limit options row ── */}
        {isLimit && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hiddenOrder}
                onChange={e => setHiddenOrder(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary"
              />
              Hidden
            </label>
            <div className="relative" ref={tifRef}>
              <button
                onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                className="flex items-center gap-1 text-[13px] text-foreground"
              >
                {timeInForce}
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${tifDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {tifDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-1 z-50 rounded-lg border border-border bg-popover shadow-lg min-w-[210px] overflow-hidden">
                  {[
                    { value: "GTC", label: "GTC — Good Till Canceled" },
                    { value: "FOK", label: "FOK — Fill or Kill" },
                    { value: "IOC", label: "IOC — Immediate or Cancel" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTimeInForce(opt.value); setTifDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                        timeInForce === opt.value
                          ? "text-trading-green bg-trading-green/5"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Max ── */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="truncate text-[13px] text-muted-foreground">Max</span>
          <span className="shrink-0 text-[13px] font-mono-num text-foreground">{maxDisplay}</span>
        </div>

        {/* ── Fee estimate ── */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
            Est. Fee <Info className="w-3.5 h-3.5" />
          </span>
          <span className="text-[13px] font-mono-num text-muted-foreground">
            — {side === "buy" ? baseCoin : quoteCoin}
          </span>
        </div>

        {/* ── CTA ── */}
        {user ? (
          <button
            onClick={() => orderMutation.mutate()}
            disabled={!amount || orderMutation.isPending}
            className={`w-full py-2 rounded-lg text-[14px] font-bold mt-1 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 ${
              side === "buy"
                ? "bg-trading-green text-black hover:opacity-90"
                : "bg-trading-red text-white hover:opacity-90"
            }`}
          >
            {orderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {side === "buy" ? `Buy ${baseCoin}` : `Sell ${baseCoin}`}
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-2 rounded-lg text-[14px] font-bold mt-1 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default TradePanel;
