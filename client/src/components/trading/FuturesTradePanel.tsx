import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, PlusCircle, Info } from "lucide-react";

const orderTypes = ["Market", "Limit", "Stop Limit", "Stop Market", "Maker Only"];

const FuturesTradePanel = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [leverage, setLeverage] = useState("20");
  const [leverageOpen, setLeverageOpen] = useState(false);
  const [orderType, setOrderType] = useState("Limit");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("0.68570");
  const [stopPrice, setStopPrice] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [sliderValue, setSliderValue] = useState(0);
  const [tpsl, setTpsl] = useState(false);
  const [hiddenOrder, setHiddenOrder] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<"USDT" | "ASTER">("USDT");
  const [stopPriceUnit, setStopPriceUnit] = useState<"USDT" | "ASTER">("USDT");
  const [priceUnit, setPriceUnit] = useState<"USDT" | "ASTER">("USDT");
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

  const percentages = [0, 25, 50, 75, 100];
  const leverageOptions = ["1", "2", "3", "5", "10", "20", "50", "75", "100"];

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

  const isMarket = orderType === "Market";
  const isLimit = orderType === "Limit";
  const isStopLimit = orderType === "Stop Limit";
  const isStopMarket = orderType === "Stop Market";
  const isMakerOnly = orderType === "Maker Only";

  const showPriceField = isLimit || isMakerOnly || isStopLimit;
  const showStopPrice = isStopLimit || isStopMarket;
  const showTotalValue = !isMarket;

  return (
    <div className="flex flex-col w-full bg-background">
      {/* Cross / Leverage — two equal buttons */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-1">
        <div className="flex items-center bg-secondary rounded overflow-hidden">
          <button
            onClick={() => setMarginMode("cross")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              marginMode === "cross" ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            Cross
          </button>
          <button
            onClick={() => setMarginMode("isolated")}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              marginMode === "isolated" ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            Isolated
          </button>
        </div>

        <div className="relative" ref={leverageRef}>
          <button
            onClick={() => setLeverageOpen(!leverageOpen)}
            className="w-full py-2 text-xs font-semibold bg-secondary rounded text-foreground flex items-center justify-center gap-1"
          >
            {leverage}x
            {leverageOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {leverageOpen && (
            <div className="absolute z-50 mt-1 w-full rounded border border-border bg-secondary shadow-lg">
              {leverageOptions.map((lev) => (
                <button
                  key={lev}
                  onClick={() => { setLeverage(lev); setLeverageOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    leverage === lev ? "text-trading-green" : "text-foreground hover:bg-accent"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="flex flex-col gap-3 p-4">
        {/* Order type dropdown with info icon */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-3 rounded border border-border bg-secondary text-sm text-foreground"
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{orderType}</span>
            </div>
            {dropdownOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 rounded border border-border bg-secondary shadow-lg">
              {orderTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setOrderType(type); setDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-3 text-sm transition-colors ${
                    orderType === type ? "text-trading-green" : "text-foreground hover:bg-accent"
                  }`}
                >
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
                <input
                  type="text"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  placeholder="Stop Price"
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0"
                />
                <button
                  onClick={() => setStopUnitDropdownOpen(!stopUnitDropdownOpen)}
                  className="flex items-center gap-1 text-sm text-foreground ml-2 shrink-0"
                >
                  {stopPriceUnit}
                  {stopUnitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
              </div>
              {stopUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
                  {["USDT", "ASTER"].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => { setStopPriceUnit(unit as "USDT" | "ASTER"); setStopUnitDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${stopPriceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price field — value | USDT | BBO in one row */}
        {showPriceField && (
          <div ref={priceUnitRef}>
            {isMakerOnly && <span className="text-xs text-muted-foreground mb-1 block">Maker Only</span>}
            <div className="relative">
              <div className="flex items-center w-full rounded border border-border bg-secondary overflow-hidden divide-x divide-border">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price"
                  className="flex-1 px-3 py-3 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0"
                />
                <button
                  onClick={() => setPriceUnitDropdownOpen(!priceUnitDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-3 text-sm text-foreground shrink-0"
                >
                  {priceUnit}
                  {priceUnitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                <button className="px-3 py-3 text-xs text-trading-amber font-semibold shrink-0">
                  BBO
                </button>
              </div>
              {priceUnitDropdownOpen && (
                <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
                  {["USDT", "ASTER"].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => { setPriceUnit(unit as "USDT" | "ASTER"); setPriceUnitDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${priceUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Price (disabled) */}
        {isMarket && (
          <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary">
            <input
              type="text"
              value="Market Price"
              disabled
              className="flex-1 bg-transparent text-sm text-muted-foreground outline-none"
            />
          </div>
        )}

        {/* Size input */}
        <div className="relative" ref={unitDropdownRef}>
          <div className="flex items-center w-full rounded border border-border bg-secondary overflow-hidden divide-x divide-border">
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Size"
              className="flex-1 px-3 py-3 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0"
            />
            <button
              onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
              className="flex items-center gap-1 px-3 py-3 text-sm text-foreground shrink-0"
            >
              {sizeUnit}
              {unitDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
          {unitDropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 rounded border border-border bg-secondary shadow-lg min-w-[80px]">
              {["USDT", "ASTER"].map((unit) => (
                <button
                  key={unit}
                  onClick={() => { setSizeUnit(unit as "USDT" | "ASTER"); setUnitDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${sizeUnit === unit ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                >
                  {unit}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Percentage slider with amber tick marks */}
        <div className="relative flex items-center w-full h-4">
          <div className="absolute inset-x-0 h-[3px] bg-secondary rounded-full" />
          {/* filled track */}
          <div
            className={`absolute left-0 h-[3px] rounded-full transition-all ${side === "buy" ? "bg-trading-green" : "bg-trading-red"}`}
            style={{ width: `${sliderValue}%` }}
          />
          {/* tick marks */}
          {percentages.map((pct, idx) => (
            <button
              key={pct}
              onClick={() => setSliderValue(pct)}
              className="absolute w-2.5 h-2.5 rounded-[2px] border transition-colors z-10"
              style={{
                left: `${(idx / (percentages.length - 1)) * 100}%`,
                transform: "translateX(-50%)",
                backgroundColor: sliderValue >= pct
                  ? side === "buy" ? "#4ADE80" : "#EF4444"
                  : "#242424",
                borderColor: sliderValue >= pct
                  ? side === "buy" ? "#4ADE80" : "#EF4444"
                  : "#333",
              }}
            />
          ))}
        </div>

        {/* Total Value */}
        {showTotalValue && (
          <div className="flex items-center w-full px-3 py-3 rounded border border-border bg-secondary overflow-hidden">
            <input
              type="text"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="Total Value"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <span className="text-sm text-foreground ml-2 shrink-0">USDT</span>
          </div>
        )}

        {/* Avbl row */}
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Avbl</span>
          <div className="flex items-center gap-1">
            <span className="text-foreground font-mono-num">0.00 USDT</span>
            <PlusCircle className="w-3.5 h-3.5 text-trading-amber" />
          </div>
        </div>

        {/* Checkboxes — each on its own line */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border bg-secondary accent-trading-green"
            />
            <span className="border-b border-dashed border-muted-foreground/50">TP/SL</span>
          </label>

          {isLimit && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={hiddenOrder}
                onChange={(e) => setHiddenOrder(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border bg-secondary accent-trading-green"
              />
              Hidden Order
            </label>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border bg-secondary accent-trading-green"
              />
              <span className="border-b border-dashed border-muted-foreground/50">Reduce-Only</span>
            </label>

            {isLimit && (
              <div className="relative" ref={tifRef}>
                <button
                  onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                  className="flex items-center gap-1 text-xs text-foreground"
                >
                  {timeInForce}
                  {tifDropdownOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                {tifDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-1 z-50 rounded border border-border bg-secondary shadow-lg min-w-[220px]">
                    {[
                      { value: "GTC", label: "GTC (Good till canceled)" },
                      { value: "FOK", label: "FOK (Fill or Kill)" },
                      { value: "IOC", label: "IOC (Immediate or canceled)" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setTimeInForce(opt.value); setTifDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${timeInForce === opt.value ? "text-trading-green" : "text-foreground hover:bg-accent"}`}
                      >
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
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. liq. price</span>
            <span className="text-foreground font-mono-num">-- USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margin</span>
            <span className="text-foreground font-mono-num">0.00 USDT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max</span>
            <span className="text-foreground font-mono-num">0.00 USDT</span>
          </div>
        </div>

        {/* Connect button only */}
        <button className="w-full py-3 rounded-lg bg-lime text-black text-sm font-semibold mt-1 hover:opacity-90">
          Connect
        </button>
      </div>
    </div>
  );
};

export default FuturesTradePanel;
