import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MarginMode = "cross" | "isolated";
export type AssetMode = "single" | "multi";
export type OrderType =
  | "Market"
  | "Limit"
  | "Stop Limit"
  | "Stop Market"
  | "Trailing Stop"
  | "Post Only"
  | "TWAP";
export type Tif = "GTC" | "IOC" | "FOK";
export type Side = "long" | "short";

const ORDER_TYPES: OrderType[] = [
  "Market",
  "Limit",
  "Stop Limit",
  "Stop Market",
  "Trailing Stop",
  "Post Only",
  "TWAP",
];

const TIFS: Tif[] = ["GTC", "IOC", "FOK"];

export interface FuturesTradePanelProps {
  symbol?: string;
  baseAsset?: string;
  quoteAsset?: string;
  markPrice?: number;
  available?: number;
  maxLeverage?: number;
  /** Called when the user confirms a new leverage in the sheet. */
  onLeverageChange?: (leverage: number) => Promise<void> | void;
  /** Called when the user confirms a new margin mode. */
  onMarginModeChange?: (mode: MarginMode) => Promise<void> | void;
  /** Called when the user confirms a new asset mode (multi is the default). */
  onAssetModeChange?: (mode: AssetMode) => Promise<void> | void;
  /** Current asset mode from the account API; defaults to multi. */
  assetMode?: AssetMode;
  onSubmit?: (order: {
    side: Side;
    orderType: OrderType;
    tif: Tif;
    size: string;
    sizeUnit: string;
    price: string;
    triggerPrice: string;
    reduceOnly: boolean;
    slippage: number;
    leverage: number;
    marginMode: MarginMode;
    assetMode: AssetMode;
  }) => Promise<void> | void;
}

/* ------------------------------------------------------------------ */
/* Bottom sheet                                                        */
/* ------------------------------------------------------------------ */

function BottomSheet({
  open,
  onClose,
  title,
  children,
  mutedTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  mutedTitle?: boolean;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-[2px]"
      />
      <div className="relative w-full rounded-t-3xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3
            className={cn(
              "text-lg font-semibold",
              mutedTitle
                ? "text-muted-foreground text-base font-normal"
                : "text-card-foreground mx-auto",
            )}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-card-foreground"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

/* Simple option list (image 3 style: plain rows + checkmark) */
function OptionList<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <ul className="divide-y divide-border/40">
      {options.map((o) => {
        const active = o === value;
        return (
          <li key={o}>
            <button
              onClick={() => onSelect(o)}
              className="flex w-full items-center justify-between py-4 text-left"
            >
              <span
                className={cn(
                  "text-[17px]",
                  active ? "font-semibold text-card-foreground" : "text-card-foreground/80",
                )}
              >
                {o}
              </span>
              {active && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-card-foreground">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* Pill button in the top control row */
function Pill({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-medium text-secondary-foreground"
    >
      {children}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* Stepper + slider block (image 1 style) */
function StepperSlider({
  value,
  min,
  max,
  step,
  ticks,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  ticks: number[];
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Number(v.toFixed(2))));
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <button
          onClick={() => onChange(clamp(value - step))}
          className="text-2xl leading-none text-muted-foreground"
          aria-label="Decrease"
        >
          −
        </button>
        <span className="text-lg font-medium text-card-foreground">
          {value}
          {suffix}
        </span>
        <button
          onClick={() => onChange(clamp(value + step))}
          className="text-2xl leading-none text-muted-foreground"
          aria-label="Increase"
        >
          +
        </button>
      </div>

      <div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        />
        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {ticks.map((t) => (
            <button key={t} onClick={() => onChange(clamp(t))}>
              {t}
              {suffix}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Radio row used by Asset Mode / Margin Mode (image 2 style) */
function RadioCard({
  title,
  bullets,
  selected,
  onSelect,
}: {
  title: string;
  bullets: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button onClick={onSelect} className="flex w-full gap-3 py-4 text-left">
      <span
        className={cn(
          "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
          selected ? "border-primary bg-primary" : "border-border bg-secondary",
        )}
      >
        {selected && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary-foreground">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-medium text-card-foreground">{title}</span>
        <span className="mt-2 block space-y-1">
          {bullets.map((b) => (
            <span key={b} className="block text-sm leading-relaxed text-muted-foreground">
              {b}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function FuturesTradePanel({
  symbol = "BTCUSDT",
  baseAsset = "BTC",
  quoteAsset = "USDT",
  markPrice = 64459.1,
  available = 0,
  maxLeverage = 200,
  onLeverageChange,
  onMarginModeChange,
  onAssetModeChange,
  assetMode: assetModeProp,
  onSubmit,
}: FuturesTradePanelProps) {
  const [side, setSide] = React.useState<Side>("long");
  const [orderType, setOrderType] = React.useState<OrderType>("Market");
  const [tif, setTif] = React.useState<Tif>("GTC");
  const [marginMode, setMarginMode] = React.useState<MarginMode>("cross");
  const [leverage, setLeverage] = React.useState(20);
  // Multi-Asset Mode is the default.
  const [assetMode, setAssetMode] = React.useState<AssetMode>(assetModeProp ?? "multi");
  const [slippage, setSlippage] = React.useState(0.5);
  const [size, setSize] = React.useState("");
  const [sizeUnit, setSizeUnit] = React.useState(baseAsset);
  const [price, setPrice] = React.useState("");
  const [triggerPrice, setTriggerPrice] = React.useState("");
  const [reduceOnly, setReduceOnly] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (assetModeProp) setAssetMode(assetModeProp);
  }, [assetModeProp]);

  // Draft state for sheets that confirm on a button
  const [sheet, setSheet] = React.useState<
    null | "margin" | "leverage" | "asset" | "orderType" | "tif" | "sizeUnit" | "priceUnit" | "slippage"
  >(null);
  const [draftLeverage, setDraftLeverage] = React.useState(leverage);
  const [draftAssetMode, setDraftAssetMode] = React.useState(assetMode);
  const [draftSlippage, setDraftSlippage] = React.useState(slippage);

  const openSheet = (s: typeof sheet) => {
    if (s === "leverage") setDraftLeverage(leverage);
    if (s === "asset") setDraftAssetMode(assetMode);
    if (s === "slippage") setDraftSlippage(slippage);
    setSheet(s);
  };
  const close = () => setSheet(null);

  const needsPrice = orderType === "Limit" || orderType === "Stop Limit" || orderType === "Post Only";
  const needsTrigger = orderType === "Stop Limit" || orderType === "Stop Market" || orderType === "Trailing Stop";
  const showTif = orderType === "Limit" || orderType === "Stop Limit" || orderType === "Post Only";
  const showSlippage = orderType === "Market" || orderType === "Stop Market";

  const commit = async (fn?: () => Promise<void> | void) => {
    try {
      setPending(true);
      await fn?.();
    } finally {
      setPending(false);
      close();
    }
  };

  const submit = async () => {
    await commit(() =>
      onSubmit?.({
        side,
        orderType,
        tif,
        size,
        sizeUnit,
        price,
        triggerPrice,
        reduceOnly,
        slippage,
        leverage,
        marginMode,
        assetMode,
      }),
    );
  };

  return (
    <div className="w-full space-y-3 bg-background px-3 pb-6 pt-3 text-foreground">
      {/* Long / Short */}
      <div className="grid grid-cols-2 gap-2">
        {(["long", "short"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "rounded-lg py-2.5 text-sm font-semibold capitalize",
              side === s
                ? s === "long"
                  ? "bg-chart-2/20 text-chart-2"
                  : "bg-destructive/20 text-destructive"
                : "bg-secondary/60 text-muted-foreground",
            )}
          >
            {s === "long" ? "Buy / Long" : "Sell / Short"}
          </button>
        ))}
      </div>

      {/* Cross | 20x | M */}
      <div className="flex gap-2">
        <Pill onClick={() => openSheet("margin")}>{marginMode === "cross" ? "Cross" : "Isolated"}</Pill>
        <Pill onClick={() => openSheet("leverage")}>{leverage}x</Pill>
        <Pill onClick={() => openSheet("asset")}>{assetMode === "multi" ? "M" : "S"}</Pill>
      </div>

      {/* Order type */}
      <button
        onClick={() => openSheet("orderType")}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm"
      >
        <span className="text-card-foreground">{orderType}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Trigger price */}
      {needsTrigger && (
        <Field
          label="Stop Price"
          value={triggerPrice}
          onChange={setTriggerPrice}
          unit={quoteAsset}
          onUnit={() => openSheet("priceUnit")}
        />
      )}

      {/* Price */}
      {needsPrice && (
        <Field
          label="Price"
          value={price}
          onChange={setPrice}
          unit={quoteAsset}
          placeholder={markPrice.toString()}
          onUnit={() => openSheet("priceUnit")}
        />
      )}

      {/* Size */}
      <Field label="Size" value={size} onChange={setSize} unit={sizeUnit} onUnit={() => openSheet("sizeUnit")} />

      {/* TIF */}
      {showTif && (
        <button
          onClick={() => openSheet("tif")}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm"
        >
          <span className="text-muted-foreground">Time in force</span>
          <span className="flex items-center gap-1 text-card-foreground">
            {tif}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}

      {/* Slippage */}
      {showSlippage && (
        <button
          onClick={() => openSheet("slippage")}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm"
        >
          <span className="text-muted-foreground">Slippage</span>
          <span className="flex items-center gap-1 text-card-foreground">
            {slippage}%
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={reduceOnly}
          onChange={(e) => setReduceOnly(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Reduce Only
      </label>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Available</span>
        <span className="text-card-foreground">
          {available} {quoteAsset}
        </span>
      </div>

      <button
        onClick={submit}
        disabled={pending}
        className={cn(
          "w-full rounded-full py-3.5 text-base font-semibold disabled:opacity-60",
          side === "long"
            ? "bg-chart-2 text-background"
            : "bg-destructive text-destructive-foreground",
        )}
      >
        {side === "long" ? "Buy / Long" : "Sell / Short"} {symbol}
      </button>

      {/* ---------------- Sheets ---------------- */}

      {/* Margin mode */}
      <BottomSheet open={sheet === "margin"} onClose={close} title="Margin Mode">
        <RadioCard
          title="Cross Margin"
          bullets={[
            "All cross positions share the same margin balance.",
            "Higher capital efficiency, shared liquidation risk.",
          ]}
          selected={marginMode === "cross"}
          onSelect={() => setMarginMode("cross")}
        />
        <RadioCard
          title="Isolated Margin"
          bullets={[
            "Margin assigned to a position is restricted to a certain amount.",
            "Liquidation is limited to that position only.",
          ]}
          selected={marginMode === "isolated"}
          onSelect={() => setMarginMode("isolated")}
        />
        <SheetCta
          label="Confirm"
          pending={pending}
          onClick={() => commit(() => onMarginModeChange?.(marginMode))}
        />
      </BottomSheet>

      {/* Leverage */}
      <BottomSheet open={sheet === "leverage"} onClose={close} title={`${symbol} Adjust leverage`}>
        <p className="mb-3 text-sm text-muted-foreground">Leverage</p>
        <StepperSlider
          value={draftLeverage}
          min={1}
          max={maxLeverage}
          step={1}
          ticks={[1, 40, 80, 120, 160, maxLeverage]}
          suffix="x"
          onChange={setDraftLeverage}
        />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Please note that leverage changing will also apply for open positions and open orders. Selecting
          higher leverage increases your chances of liquidation.
        </p>
        <SheetCta
          label="Confirm"
          pending={pending}
          onClick={() =>
            commit(async () => {
              setLeverage(draftLeverage);
              await onLeverageChange?.(draftLeverage);
            })
          }
        />
      </BottomSheet>

      {/* Asset mode */}
      <BottomSheet open={sheet === "asset"} onClose={close} title="Asset Mode">
        <RadioCard
          title="Single-Asset Mode"
          bullets={[
            "Use pair's settlement currency as margin.",
            "PnL offsets across Cross positions of the same currency.",
            "Supports Cross and Isolated margin.",
          ]}
          selected={draftAssetMode === "single"}
          onSelect={() => setDraftAssetMode("single")}
        />
        <RadioCard
          title="Multi-Asset Mode"
          bullets={[
            "Contracts can be traded across margin assets.",
            "The profits and losses of positions with different margin assets can offset one another.",
            "Supports cross margin.",
          ]}
          selected={draftAssetMode === "multi"}
          onSelect={() => setDraftAssetMode("multi")}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Read about <span className="text-primary">Multi-Asset Mode</span> to better manage risk.
        </p>
        <SheetCta
          label="Confirm"
          pending={pending}
          onClick={() =>
            commit(async () => {
              setAssetMode(draftAssetMode);
              await onAssetModeChange?.(draftAssetMode);
            })
          }
        />
      </BottomSheet>

      {/* Order type — plain list */}
      <BottomSheet open={sheet === "orderType"} onClose={close} title="Order Type" mutedTitle>
        <OptionList
          options={ORDER_TYPES}
          value={orderType}
          onSelect={(v) => {
            setOrderType(v);
            close();
          }}
        />
      </BottomSheet>

      {/* TIF */}
      <BottomSheet open={sheet === "tif"} onClose={close} title="Time in Force" mutedTitle>
        <OptionList
          options={TIFS}
          value={tif}
          onSelect={(v) => {
            setTif(v);
            close();
          }}
        />
      </BottomSheet>

      {/* Size unit */}
      <BottomSheet open={sheet === "sizeUnit"} onClose={close} title="Unit" mutedTitle>
        <OptionList
          options={[baseAsset, quoteAsset]}
          value={sizeUnit}
          onSelect={(v) => {
            setSizeUnit(v);
            close();
          }}
        />
      </BottomSheet>

      {/* Price unit */}
      <BottomSheet open={sheet === "priceUnit"} onClose={close} title="Currency" mutedTitle>
        <OptionList options={[quoteAsset]} value={quoteAsset} onSelect={close} />
      </BottomSheet>

      {/* Slippage — image 1 layout */}
      <BottomSheet open={sheet === "slippage"} onClose={close} title="Slippage Tolerance">
        <p className="mb-3 text-sm text-muted-foreground">Slippage</p>
        <StepperSlider
          value={draftSlippage}
          min={0.1}
          max={5}
          step={0.1}
          ticks={[0.1, 0.5, 1, 2, 3, 5]}
          suffix="%"
          onChange={setDraftSlippage}
        />
        <div className="mt-6 rounded-xl border border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">Estimated worst fill price</p>
          <p className="mt-1 text-lg font-semibold text-card-foreground">
            {(markPrice * (1 + (side === "long" ? 1 : -1) * (draftSlippage / 100))).toFixed(1)} {quoteAsset}
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Orders will be rejected if the fill price moves beyond your slippage tolerance. Lower values reduce
          price risk but increase the chance of failed orders.
        </p>
        <SheetCta
          label="Confirm"
          pending={pending}
          onClick={() => commit(() => setSlippage(draftSlippage))}
        />
      </BottomSheet>
    </div>
  );
}

function SheetCta({
  label,
  onClick,
  pending,
}: {
  label: string;
  onClick: () => void;
  pending?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="mt-6 w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Please wait…" : label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  unit,
  onUnit,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  onUnit: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder ?? "0.00"}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-right text-sm text-card-foreground outline-none placeholder:text-muted-foreground/60"
      />
      <button onClick={onUnit} className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
        {unit}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
