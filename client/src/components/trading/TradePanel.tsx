import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { asterTrading } from "@/lib/asterdex-service";
import { useToast } from "@/hooks/use-toast";

const orderTypes = ["Market", "Limit", "Stop Limit", "Stop Market", "Maker Only"];

interface TradePanelProps {
  symbol?: string;
}

const TradePanel = ({ symbol = "ASTER/USDT" }: TradePanelProps) => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState("Market");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("0.68570");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [amountUnit, setAmountUnit] = useState<"USDT" | "ASTER">("USDT");
  const [stopPriceUnit, setStopPriceUnit] = useState<"USDT" | "ASTER">("USDT");
  const [priceUnit, setPriceUnit] = useState<"USDT" | "ASTER">("USDT");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [stopUnitDropdownOpen, setStopUnitDropdownOpen] = useState(false);
  const [priceUnitDropdownOpen, setPriceUnitDropdownOpen] = useState(false);
  const [timeInForce, setTimeInForce] = useState("GTC");
  const [tifDropdownOpen, setTifDropdownOpen] = useState(false);

  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const stopUnitRef = useRef<HTMLDivElement>(null);
  const priceUnitRef = useRef<HTMLDivElement>(null);
  const tifRef = useRef<HTMLDivElement>(null);

  const percentages = [0, 25, 50, 75, 100];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(e.target as Node)) setUnitDropdownOpen(false);
      if (stopUnitRef.current && !stopUnitRef.current.contains(e.target as Node)) setStopUnitDropdownOpen(false);
      if (priceUnitRef.current && !priceUnitRef.current.contains(e.target as Node)) setPriceUnitDropdownOpen(false);
      if (tifRef.current && !tifRef.current.contains(e.target as Node)) setTifDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const apiSymbol = symbol.replace("/", "");
  const baseCoin = symbol.split("/")[0];

  // Fetch spot account balance
  const { data: spotAccount } = useQuery({
    queryKey: ["spot-account"],
    queryFn: () => asterTrading.spotAccount(),
    enabled: !!user,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const usdtBalance = spotAccount?.balances?.find((b: any) => b.asset === "USDT")?.free ?? "0.00";
  const asterBalance = spotAccount?.balances?.find((b: any) => b.asset === baseCoin)?.free ?? "0.00";
  const avblDisplay = side === "buy"
    ? `${parseFloat(usdtBalance).toFixed(2)} USDT`
    : `${parseFloat(asterBalance).toFixed(8)} ${baseCoin}`;

  // Place order mutation
  const orderMutation = useMutation({
    mutationFn: () => {
      const isMarket = orderType === "Market";
      const qty = amount || "0";
      return asterTrading.spotPlaceOrder({
        symbol: apiSymbol,
        side: side.toUpperCase() as "BUY" | "SELL",
        type: isMarket ? "MARKET" : "LIMIT",
        quantity: qty,
        ...((!isMarket) && { price, timeInForce }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed",
        description: `${side === "buy" ? "Buy" : "Sell"} ${amount} ${baseCoin} order submitted (ID: ${data?.orderId ?? "—"})`,
      });
      setAmount("");
      setTotalValue("");
    },
    onError: (err: Error) => {
      toast({ title: "Order failed", description: err.message, variant: "destructive" });
    },
  });

  const isMarket = orderType === "Market";
  const isLimit = orderType === "Limit";
  const isStopLimit = orderType === "Stop Limit";
  const isStopMarket = orderType === "Stop Market";
  const isMakerOnly = orderType === "Maker Only";
  const showPriceField = isLimit || isMakerOnly;
  const showStopPrice = isStopLimit || isStopMarket;
  const showAmountField = isMarket || isLimit;
  const showHiddenOrder = isLimit;
  const showTotalValue = !isMarket;

  return (
    <div className="flex flex-col w-full bg-background">
      {/* Buy/Sell toggle */}
      <div className="flex">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-3 text-sm font-semibold rounded-none ${side === "buy" ? "bg-trading-green text-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-3 text-sm font-semibold rounded-none ${side === "sell" ? "bg-trading-red text-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          Sell
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Order type dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-3 rounded border border-border bg-secondary text-sm text-foreground"
          >
            <span>{orderType}</span>
            {dropdownOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 rounded border border-border bg-secondary shadow-lg">
              {orderTypes.map((type) => (
                <button key={type} onClick={() => { setOrderType(type); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-3 text-sm transition-colors ${orderType === type ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stop Price */}
        {showStopPrice && (
          <div ref={stopUnitRef}>
            <span className="text-xs text-muted-foreground mb-1 block">{orderType}</span>
            <div className="relative">
              <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary overflow-hidden">
                <input type="text" value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder="Stop Price"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0" />
                <button onClick={() => setStopUnitDropdownOpen(!stopUnitDropdownOpen)}
                  className="flex items-center gap-1 text-sm text-foreground ml-2 shrink-0">
                  {stopPriceUnit}
                  {stopUnitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
              {stopUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
                  {["USDT", "ASTER"].map(unit => (
                    <button key={unit} onClick={() => { setStopPriceUnit(unit as any); setStopUnitDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${stopPriceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
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
            {isMakerOnly && <span className="text-xs text-muted-foreground mb-1 block">Maker Only</span>}
            <div className="relative">
              <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary overflow-hidden">
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0" />
                <button onClick={() => setPriceUnitDropdownOpen(!priceUnitDropdownOpen)}
                  className="flex items-center gap-1 text-sm text-foreground ml-2 shrink-0">
                  {priceUnit}
                  {priceUnitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
              {priceUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
                  {["USDT", "ASTER"].map(unit => (
                    <button key={unit} onClick={() => { setPriceUnit(unit as any); setPriceUnitDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${priceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Price disabled */}
        {isMarket && (
          <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary">
            <input type="text" value="Market Price" disabled className="flex-1 bg-transparent text-sm text-muted-foreground outline-none" />
          </div>
        )}

        {/* Amount input */}
        {showAmountField && (
          <div className="relative" ref={unitDropdownRef}>
            <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary overflow-hidden">
              <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0" />
              {isMarket ? (
                <button onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                  className="flex items-center gap-1 text-sm text-foreground ml-2 shrink-0">
                  {amountUnit}
                  {unitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
              ) : (
                <span className="text-sm text-foreground ml-2 shrink-0">{baseCoin}</span>
              )}
            </div>
            {isMarket && unitDropdownOpen && (
              <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
                {["USDT", "ASTER"].map(unit => (
                  <button key={unit} onClick={() => { setAmountUnit(unit as any); setUnitDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${amountUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                    {unit}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Percentage slider */}
        <div className="flex items-center gap-0 w-full">
          <div className="flex-1 h-[3px] bg-secondary relative flex items-center">
            {percentages.map((pct, idx) => (
              <button key={pct} onClick={() => setSliderValue(pct)}
                className="absolute w-2.5 h-2.5 rounded-[2px] border transition-colors"
                style={{
                  left: `${(idx / (percentages.length - 1)) * 100}%`,
                  transform: "translateX(-50%)",
                  backgroundColor: sliderValue >= pct ? side === "buy" ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))" : "hsl(0, 0%, 14%)",
                  borderColor: sliderValue >= pct ? side === "buy" ? "hsl(var(--trading-green))" : "hsl(var(--trading-red))" : "hsl(0, 0%, 20%)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Total Value */}
        {showTotalValue && (
          <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary overflow-hidden">
            <input type="text" value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="Total Value"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            <span className="text-sm text-foreground ml-2 shrink-0">USDT</span>
          </div>
        )}

        {/* Info rows */}
        <div className="flex flex-col gap-2 text-xs mt-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avbl</span>
            <div className="flex items-center gap-1">
              <span className="text-foreground font-mono-num">{user ? avblDisplay : `0.00 ${side === "buy" ? "USDT" : baseCoin}`}</span>
              <PlusCircle className="w-3.5 h-3.5 text-trading-amber" />
            </div>
          </div>
          {showHiddenOrder && (
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" checked={hiddenOrder} onChange={e => setHiddenOrder(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-border bg-secondary accent-trading-green" />
                Hidden Order
              </label>
              <div className="relative" ref={tifRef}>
                <button onClick={() => setTifDropdownOpen(!tifDropdownOpen)} className="flex items-center gap-1 text-foreground text-xs">
                  {timeInForce}
                  {tifDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                {tifDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 rounded border border-border bg-secondary shadow-lg min-w-[220px]">
                    {[{ value: "GTC", label: "GTC (Good till canceled)" }, { value: "FOK", label: "FOK (Fill or Kill)" }, { value: "IOC", label: "IOC (Immediate or canceled)" }].map(opt => (
                      <button key={opt.value} onClick={() => { setTimeInForce(opt.value); setTifDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${timeInForce === opt.value ? "text-trading-green" : "text-foreground hover:bg-accent"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Fee</span>
            <span className="text-foreground font-mono-num">-- {side === "buy" ? baseCoin : "USDT"}</span>
          </div>
        </div>

        {/* CTA button */}
        {user ? (
          <button
            onClick={() => orderMutation.mutate()}
            disabled={!amount || orderMutation.isPending}
            className={`w-full py-3 rounded-lg text-sm font-semibold mt-2 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 ${
              side === "buy" ? "bg-trading-green text-background" : "bg-trading-red text-background"
            }`}
          >
            {orderMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {side === "buy" ? `Buy ${baseCoin}` : `Sell ${baseCoin}`}
          </button>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="w-full py-3 rounded-lg bg-lime text-black text-sm font-semibold mt-2 hover:opacity-90"
          >
            Sign In to Trade
          </button>
        )}
      </div>
    </div>
  );
};

export default TradePanel;
