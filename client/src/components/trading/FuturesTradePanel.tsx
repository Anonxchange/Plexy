import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Info, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTypes = ["Market", "Limit", "Stop Limit", "Stop Market", "Maker Only"];

const UI_TO_FUTURES_TYPE: Record<string, string> = {
  "Market":      "MARKET",
  "Limit":       "LIMIT",
  "Stop Limit":  "STOP",
  "Stop Market": "STOP_MARKET",
  "Maker Only":  "LIMIT_MAKER",
};

interface FuturesTradePanelProps {
  symbol?: string;
  onOrderTypeChange?: (type: string) => void;
}

const FuturesTradePanel = ({ symbol = "ASTER/USDT", onOrderTypeChange }: FuturesTradePanelProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [leverage, setLeverage] = useState("20");
  const [leverageOpen, setLeverageOpen] = useState(false);
  const [orderType, setOrderType] = useState("Limit");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [tpsl, setTpsl] = useState(false);
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<"USDT" | string>("USDT");
  const [stopPriceUnit, setStopPriceUnit] = useState<"USDT" | string>("USDT");
  const [priceUnit, setPriceUnit] = useState<"USDT" | string>("USDT");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [stopUnitDropdownOpen, setStopUnitDropdownOpen] = useState(false);
  const [priceUnitDropdownOpen, setPriceUnitDropdownOpen] = useState(false);
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [tifDropdownOpen, setTifDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const stopUnitRef = useRef<HTMLDivElement>(null);
  const priceUnitRef = useRef<HTMLDivElement>(null);
  const tifRef = useRef<HTMLDivElement>(null);
  const leverageRef = useRef<HTMLDivElement>(null);
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

  const orderMutation = useMutation({
    mutationFn: async () => {
      await asterTrading.futuresSetLeverage(apiSymbol, leverage);
      await asterTrading.futuresSetMarginType(apiSymbol, marginMode === "isolated" ? "ISOLATED" : "CROSSED");
      return asterTrading.futuresPlaceOrder({
        symbol: apiSymbol,
        side: side === "buy" ? "BUY" : "SELL",
        type: asterType,
        quantity: size || "0",
        ...(showPriceField && price ? { price } : {}),
        ...(showStopPrice && stopPrice ? { stopPrice } : {}),
        ...((isLimit || isMakerOnly) ? { timeInForce } : {}),
        ...(reduceOnly ? { reduceOnly: "true" } : {}),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed",
        description: `${side === "buy" ? "Long" : "Short"} ${size} ${baseCoin} submitted (ID: ${data?.orderId ?? "—"})`,
      });
      setSize(""); setTotalValue(""); setSliderValue(0);
    },
    onError: (err: Error) => {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) setUnitDropdownOpen(false);
      if (stopUnitRef.current && !stopUnitRef.current.contains(e.target as Node)) setStopUnitDropdownOpen(false);
      if (priceUnitRef.current && !priceUnitRef.current.contains(e.target as Node)) setPriceUnitDropdownOpen(false);
      if (tifRef.current && !tifRef.current.contains(e.target as Node)) setTifDropdownOpen(false);
      if (leverageRef.current && !leverageRef.current.contains(e.target as Node)) setLeverageOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col w-full bg-background">

      {/* ── Cross / Isolated + Leverage ── */}
      <div className="grid grid-cols-2 gap-1 px-2 pt-1.5 pb-0.5">
        <div className="flex items-center bg-secondary rounded overflow-hidden">
          <button
            onClick={() => setMarginMode("cross")}
            className={`flex-1 py-1 text-[11px] font-medium transition-colors ${marginMode === "cross" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            Cross
          </button>
          <button
            onClick={() => setMarginMode("isolated")}
            className={`flex-1 py-1 text-[11px] font-medium transition-colors ${marginMode === "isolated" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
          >
            Isolated
          </button>
        </div>

        <div className="relative" ref={leverageRef}>
          <button
            onClick={() => setLeverageOpen(!leverageOpen)}
            className="w-full py-1 text-[11px] font-semibold bg-secondary rounded text-foreground flex items-center justify-center gap-0.5"
          >
            {leverage}x
            {leverageOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {leverageOpen && (
            <div className="absolute z-50 mt-0.5 w-full rounded border border-border bg-secondary shadow-lg">
              {leverageOptions.map((lev) => (
                <button
                  key={lev}
                  onClick={() => { setLeverage(lev); setLeverageOpen(false); }}
                  className={`w-full text-left px-2 py-1 text-[11px] transition-colors ${leverage === lev ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          )}
        </div>
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

        {/* Order type */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 rounded border border-border bg-transparent text-[11px] text-foreground hover:border-muted-foreground transition-colors"
          >
            <span>{orderType}</span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-0.5 rounded border border-border bg-popover shadow-lg overflow-hidden">
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setDropdownOpen(false); onOrderTypeChange?.(type); }}
                  className={`w-full text-left px-2 py-1.5 text-[11px] transition-colors ${orderType === type ? "text-trading-green bg-trading-green/5" : "text-foreground hover:bg-accent"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

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
          <div ref={stopUnitRef}>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">Stop Price</label>
            <div className="relative">
              <div className="flex items-center rounded border border-border bg-transparent px-2 py-[5px] focus-within:border-muted-foreground transition-colors overflow-hidden">
                <input
                  type="number"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
                />
                <button
                  onClick={() => setStopUnitDropdownOpen(!stopUnitDropdownOpen)}
                  className="flex items-center gap-0.5 text-[11px] text-muted-foreground ml-1.5 shrink-0"
                >
                  {stopPriceUnit}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              {stopUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-0.5 rounded border border-border bg-popover shadow-lg min-w-[80px]">
                  {[quoteCoin, baseCoin].map((unit) => (
                    <button key={unit} onClick={() => { setStopPriceUnit(unit); setStopUnitDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1 text-[11px] transition-colors ${stopPriceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price field */}
        {showPriceField && (
          <div ref={priceUnitRef}>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 block">
              {isMakerOnly ? "Maker Price" : "Price"}
            </label>
            <div className="relative">
              <div className="flex items-center rounded border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-2 py-[5px] bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
                />
                <button onClick={() => setPriceUnitDropdownOpen(!priceUnitDropdownOpen)}
                  className="flex items-center gap-0.5 px-1.5 py-[5px] text-[11px] text-muted-foreground shrink-0">
                  {priceUnit} <ChevronDown className="w-3 h-3" />
                </button>
                <button className="px-1.5 py-[5px] text-[11px] text-trading-amber font-semibold shrink-0">BBO</button>
              </div>
              {priceUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-0.5 rounded border border-border bg-popover shadow-lg min-w-[80px]">
                  {[quoteCoin, baseCoin].map((unit) => (
                    <button key={unit} onClick={() => { setPriceUnit(unit); setPriceUnitDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1 text-[11px] transition-colors ${priceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                      {unit}
                    </button>
                  ))}
                </div>
              )}
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
          <div className="relative" ref={unitDropdownRef}>
            <div className="flex items-center rounded border border-border bg-transparent overflow-hidden divide-x divide-border focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={size}
                onChange={(e) => { setSize(e.target.value); setSliderValue(0); }}
                placeholder="0.00"
                className="flex-1 px-2 py-[5px] bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <button onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                className="flex items-center gap-0.5 px-1.5 py-[5px] text-[11px] text-muted-foreground shrink-0">
                {sizeUnit} <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {unitDropdownOpen && (
              <div className="absolute right-0 z-50 mt-0.5 rounded border border-border bg-popover shadow-lg min-w-[80px]">
                {[quoteCoin, baseCoin].map((unit) => (
                  <button key={unit} onClick={() => { setSizeUnit(unit); setUnitDropdownOpen(false); }}
                    className={`w-full text-left px-2 py-1 text-[11px] transition-colors ${sizeUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                    {unit}
                  </button>
                ))}
              </div>
            )}
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
            <input type="checkbox" checked={tpsl} onChange={(e) => setTpsl(e.target.checked)}
              className="w-3 h-3 rounded accent-primary" />
            <span className="border-b border-dashed border-muted-foreground/50 whitespace-nowrap">TP/SL</span>
          </label>
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
            {isLimit && (
              <div className="relative" ref={tifRef}>
                <button onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                  className="flex items-center gap-0.5 text-[11px] text-foreground">
                  {timeInForce}
                  <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${tifDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {tifDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 rounded border border-border bg-popover shadow-lg min-w-[210px] overflow-hidden">
                    {[
                      { value: "GTC", label: "GTC — Good Till Canceled" },
                      { value: "FOK", label: "FOK — Fill or Kill" },
                      { value: "IOC", label: "IOC — Immediate or Cancel" },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => { setTimeInForce(opt.value); setTifDropdownOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 text-[11px] transition-colors ${timeInForce === opt.value ? "text-trading-green bg-trading-green/5" : "text-foreground hover:bg-accent"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
};

export default FuturesTradePanel;
