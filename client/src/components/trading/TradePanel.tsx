import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Loader2, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

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
  const [orderType, setOrderType] = useState("Limit");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [amountUnit, setAmountUnit] = useState<"USDT" | string>("USDT");
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [tifDropdownOpen, setTifDropdownOpen] = useState(false);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const tifRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (tifRef.current && !tifRef.current.contains(e.target as Node)) setTifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apiSymbol = symbol.replace("/", "");
  const baseCoin = symbol.split("/")[0];
  const quoteCoin = symbol.split("/")[1] || "USDT";

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

  const applySlider = (pct: number) => {
    setSliderPct(pct);
    if (pct === 0) { setAmount(""); setTotalValue(""); return; }
    if (side === "buy") {
      const available = usdtBalance * (pct / 100);
      const priceNum = parseFloat(price);
      if (priceNum > 0) {
        setAmount((available / priceNum).toFixed(6));
        setTotalValue(available.toFixed(2));
      } else {
        setTotalValue(available.toFixed(2));
      }
    } else {
      setAmount((baseBalance * (pct / 100)).toFixed(8));
    }
  };

  // Slider drag
  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const snapped = PCT_STEPS.reduce((a, b) => Math.abs(b - pct) < Math.abs(a - pct) ? b : a);
    applySlider(snapped);
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
    },
    onError: (err: Error) => {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    },
  });

  const accentColor = side === "buy" ? "trading-green" : "trading-red";

  return (
    <div className="flex flex-col w-full bg-background h-full">

      {/* ── Buy / Sell buttons ── */}
      <div className="flex gap-2 p-3 flex-shrink-0">
        <button
          onClick={() => { setSide("buy"); setSliderPct(0); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            side === "buy" ? "bg-trading-green text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => { setSide("sell"); setSliderPct(0); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            side === "sell" ? "bg-trading-red text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex flex-col gap-2.5 p-3 flex-1 overflow-y-auto">

        {/* ── Order type ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-border bg-transparent text-xs text-foreground hover:border-muted-foreground transition-colors"
          >
            <span>{orderType}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
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

        {/* ── Available balance ── */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Available</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono-num text-foreground">
              {user ? avblDisplay : `0.00 ${side === "buy" ? quoteCoin : baseCoin}`}
            </span>
            {user && (
              <button className="text-primary hover:opacity-70">
                <PlusCircle className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Stop Price ── */}
        {showStopPrice && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Stop Price</label>
            <div className="flex items-center rounded-md border border-border bg-transparent px-3 py-2 focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={stopPrice}
                onChange={e => setStopPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{quoteCoin}</span>
            </div>
          </div>
        )}

        {/* ── Price ── */}
        {showPriceField && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">
              {isMakerOnly ? "Maker Price" : "Price"}
            </label>
            <div className="flex items-center rounded-md border border-border bg-transparent px-3 py-2 focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{quoteCoin}</span>
            </div>
          </div>
        )}

        {/* ── Market price placeholder ── */}
        {isMarket && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Price</label>
            <div className="flex items-center rounded-md border border-border bg-accent/30 px-3 py-2">
              <span className="flex-1 text-xs text-muted-foreground">Market Price</span>
            </div>
          </div>
        )}

        {/* ── Amount ── */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Amount</label>
          <div className="flex items-center rounded-md border border-border bg-transparent px-3 py-2 focus-within:border-muted-foreground transition-colors">
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setSliderPct(0); }}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
            />
            <span className="text-xs text-muted-foreground ml-2 shrink-0">
              {isMarket ? amountUnit : baseCoin}
            </span>
          </div>
        </div>

        {/* ── Percentage slider ── */}
        <div className="px-1">
          <div
            ref={sliderRef}
            onClick={handleSliderClick}
            className="relative h-1 rounded-full bg-border cursor-pointer"
          >
            {/* Fill */}
            <div
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-150 ${
                side === "buy" ? "bg-trading-green" : "bg-trading-red"
              }`}
              style={{ width: `${sliderPct}%` }}
            />
            {/* Dots */}
            {PCT_STEPS.map((pct) => (
              <button
                key={pct}
                onClick={(e) => { e.stopPropagation(); applySlider(pct); }}
                className={`absolute w-3 h-3 rounded-full border-2 -translate-y-1/2 top-1/2 -translate-x-1/2 transition-all duration-150 ${
                  sliderPct >= pct
                    ? side === "buy"
                      ? "bg-trading-green border-trading-green"
                      : "bg-trading-red border-trading-red"
                    : "bg-background border-border hover:border-muted-foreground"
                }`}
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
          {/* Percentage labels */}
          <div className="flex justify-between mt-2">
            {PCT_STEPS.map((pct) => (
              <button
                key={pct}
                onClick={() => applySlider(pct)}
                className={`text-[10px] transition-colors ${
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

        {/* ── Total Value ── */}
        {showTotalValue && (
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1 block">Total</label>
            <div className="flex items-center rounded-md border border-border bg-transparent px-3 py-2 focus-within:border-muted-foreground transition-colors">
              <input
                type="number"
                value={totalValue}
                onChange={e => setTotalValue(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground min-w-0 font-mono-num"
              />
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{quoteCoin}</span>
            </div>
          </div>
        )}

        {/* ── Limit options row ── */}
        {isLimit && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hiddenOrder}
                onChange={e => setHiddenOrder(e.target.checked)}
                className="w-3 h-3 rounded accent-primary"
              />
              Hidden
            </label>
            <div className="relative" ref={tifRef}>
              <button
                onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                className="flex items-center gap-1 text-[11px] text-foreground"
              >
                {timeInForce}
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${tifDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {tifDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-1 z-50 rounded-md border border-border bg-popover shadow-lg min-w-[210px] overflow-hidden">
                  {[
                    { value: "GTC", label: "GTC — Good Till Canceled" },
                    { value: "FOK", label: "FOK — Fill or Kill" },
                    { value: "IOC", label: "IOC — Immediate or Cancel" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setTimeInForce(opt.value); setTifDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
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

        {/* ── Fee estimate ── */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            Est. Fee <Info className="w-3 h-3" />
          </span>
          <span className="text-[11px] font-mono-num text-muted-foreground">
            — {side === "buy" ? baseCoin : quoteCoin}
          </span>
        </div>

        {/* ── CTA ── */}
        {user ? (
          <button
            onClick={() => orderMutation.mutate()}
            disabled={!amount || orderMutation.isPending}
            className={`w-full py-2.5 rounded-md text-xs font-bold mt-1 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 ${
              side === "buy"
                ? "bg-trading-green text-black hover:opacity-90"
                : "bg-trading-red text-white hover:opacity-90"
            }`}
          >
            {orderMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {side === "buy" ? `Buy ${baseCoin}` : `Sell ${baseCoin}`}
          </button>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <button
              onClick={() => navigate("/signin")}
              className="w-full py-2.5 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePanel;
