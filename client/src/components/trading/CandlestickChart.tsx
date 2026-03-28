import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  ReceiptText,
  Maximize2, Minimize2, Cog, X, Check,
  CandlestickChart as CandleIcon, BarChart2, TrendingUp, AreaChart,
  Volume2, VolumeX, Loader2, Search, Star, Activity,
  AlignLeft, Sliders, Layers, Target, Minus
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { asterMarket } from "@/lib/asterdex-service";
import { useAuth } from "@/lib/auth-context";

interface CandlestickChartProps {
  pair?: string;
  className?: string;
  mode?: "spot" | "futures";
}

/* TradingView chart style codes */
const CHART_STYLES = [
  { label: "Candles",      value: 1, Icon: CandleIcon   },
  { label: "Heikin Ashi",  value: 8, Icon: CandleIcon   },
  { label: "Bars",         value: 0, Icon: BarChart2     },
  { label: "Line",         value: 2, Icon: TrendingUp    },
  { label: "Area",         value: 3, Icon: AreaChart     },
];

const INTERVALS = [
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "1D",  value: "D"   },
  { label: "1W",  value: "W"   },
];

const PRICE_TYPES = ["Last Price", "Mark Price", "Index Price"];

const STUDIES: { id: string; label: string }[] = [
  { id: "52WeekHighLow@tv-basicstudies",           label: "52 Week High/Low"                },
  { id: "Acceleration@tv-basicstudies",             label: "Accelerator Oscillator"          },
  { id: "AccumulationDistribution@tv-basicstudies", label: "Accumulation/Distribution"       },
  { id: "AccumulativeSwingIndex@tv-basicstudies",   label: "Accumulative Swing Index"        },
  { id: "AdvanceDecline@tv-basicstudies",           label: "Advance/Decline"                 },
  { id: "ALMA@tv-basicstudies",                     label: "Arnaud Legoux Moving Average"    },
  { id: "Aroon@tv-basicstudies",                    label: "Aroon"                           },
  { id: "ADX@tv-basicstudies",                      label: "Average Directional Index"       },
  { id: "AveragePrice@tv-basicstudies",             label: "Average Price"                   },
  { id: "ATR@tv-basicstudies",                      label: "Average True Range"              },
  { id: "AwesomeOscillator@tv-basicstudies",        label: "Awesome Oscillator"              },
  { id: "BalanceOfPower@tv-basicstudies",           label: "Balance of Power"                },
  { id: "BB@tv-basicstudies",                       label: "Bollinger Bands"                 },
  { id: "BollingerBandsPct@tv-basicstudies",        label: "Bollinger Bands %B"              },
  { id: "BollingerBandsWidth@tv-basicstudies",      label: "Bollinger Bands Width"           },
  { id: "BullBearPower@tv-basicstudies",            label: "Bull Bear Power"                 },
  { id: "CCI@tv-basicstudies",                      label: "Commodity Channel Index"         },
  { id: "CMF@tv-basicstudies",                      label: "Chaikin Money Flow"              },
  { id: "ChandeKrollStop@tv-basicstudies",          label: "Chande Kroll Stop"               },
  { id: "CMO@tv-basicstudies",                      label: "Chande Momentum Oscillator"      },
  { id: "ChoppinessIndex@tv-basicstudies",          label: "Choppiness Index"                },
  { id: "ConnorsRSI@tv-basicstudies",               label: "Connors RSI"                     },
  { id: "CoppockCurve@tv-basicstudies",             label: "Coppock Curve"                   },
  { id: "DEMA@tv-basicstudies",                     label: "Double EMA"                      },
  { id: "DPO@tv-basicstudies",                      label: "Detrended Price Oscillator"      },
  { id: "DMI@tv-basicstudies",                      label: "Directional Movement"            },
  { id: "DonchianChannels@tv-basicstudies",         label: "Donchian Channels"               },
  { id: "EaseOfMovement@tv-basicstudies",           label: "Ease of Movement"                },
  { id: "MAExp@tv-basicstudies",                    label: "Exponential Moving Average"      },
  { id: "FisherTransform@tv-basicstudies",          label: "Fisher Transform"                },
  { id: "HistoricalVolatility@tv-basicstudies",     label: "Historical Volatility"           },
  { id: "HullMA@tv-basicstudies",                   label: "Hull Moving Average"             },
  { id: "IchimokuCloud@tv-basicstudies",            label: "Ichimoku Cloud"                  },
  { id: "KeltnerChannels@tv-basicstudies",          label: "Keltner Channels"                },
  { id: "KnowSureThing@tv-basicstudies",            label: "Know Sure Thing"                 },
  { id: "MACD@tv-basicstudies",                     label: "MACD"                            },
  { id: "MassIndex@tv-basicstudies",                label: "Mass Index"                      },
  { id: "McGinleyDynamic@tv-basicstudies",          label: "McGinley Dynamic"                },
  { id: "MFI@tv-basicstudies",                      label: "Money Flow Index"                },
  { id: "MOM@tv-basicstudies",                      label: "Momentum"                        },
  { id: "MASimple@tv-basicstudies",                 label: "Moving Average"                  },
  { id: "OBV@tv-basicstudies",                      label: "On Balance Volume"               },
  { id: "PSAR@tv-basicstudies",                     label: "Parabolic SAR"                   },
  { id: "PriceOsc@tv-basicstudies",                 label: "Price Oscillator"                },
  { id: "PriceVolumeTrend@tv-basicstudies",         label: "Price Volume Trend"              },
  { id: "ROC@tv-basicstudies",                      label: "Rate of Change"                  },
  { id: "RelativeVigorIndex@tv-basicstudies",       label: "Relative Vigor Index"            },
  { id: "RSI@tv-basicstudies",                      label: "Relative Strength Index"         },
  { id: "SMIErgodicIndicator@tv-basicstudies",      label: "SMI Ergodic Indicator"           },
  { id: "MASimple@tv-basicstudies-2",               label: "Smoothed Moving Average"         },
  { id: "Stochastic@tv-basicstudies",               label: "Stochastic"                      },
  { id: "StochasticRSI@tv-basicstudies",            label: "Stochastic RSI"                  },
  { id: "TEMA@tv-basicstudies",                     label: "Triple EMA"                      },
  { id: "Trix@tv-basicstudies",                     label: "TRIX"                            },
  { id: "TSI@tv-basicstudies",                      label: "True Strength Index"             },
  { id: "UltimateOscillator@tv-basicstudies",       label: "Ultimate Oscillator"             },
  { id: "VWAP@tv-basicstudies",                     label: "VWAP"                            },
  { id: "VWMA@tv-basicstudies",                     label: "Volume Weighted MA"              },
  { id: "VolatilityStop@tv-basicstudies",           label: "Volatility Stop"                 },
  { id: "Volume@tv-basicstudies",                   label: "Volume"                          },
  { id: "VOscillator@tv-basicstudies",              label: "Volume Oscillator"               },
  { id: "Alligator@tv-basicstudies",                label: "Williams Alligator"              },
  { id: "WilliamsFractals@tv-basicstudies",         label: "Williams Fractals"               },
  { id: "WilliamR@tv-basicstudies",                 label: "Williams %R"                     },
  { id: "WoodiesCCI@tv-basicstudies",               label: "Woodies CCI"                     },
  { id: "ZigZag@tv-basicstudies",                   label: "Zig Zag"                         },
];

interface CandleColors {
  bullBody:    string;
  bearBody:    string;
  bullBorder:  string;
  bearBorder:  string;
  bullWick:    string;
  bearWick:    string;
}

interface CandleToggles {
  colorByPrevClose: boolean;
  body:    boolean;
  borders: boolean;
  wicks:   boolean;
}

/* ── Indicators Modal ────────────────────────────────────────────── */
const IndicatorsModal = ({
  selected, favorites, onToggle, onFavorite, onClose,
}: {
  selected: string[];
  favorites: string[];
  onToggle: (id: string) => void;
  onFavorite: (id: string) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState("");

  const filtered = STUDIES.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-[480px] max-h-[70vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Indicators</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Column header */}
        <div className="px-5 py-2 border-b border-border/50">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Script Name
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No indicators found</div>
          ) : (
            filtered.map(({ id, label }) => {
              const active = selected.includes(id);
              const starred = favorites.includes(id);
              return (
                <div
                  key={id}
                  className={`group flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors ${
                    active ? "bg-primary/10" : "hover:bg-accent"
                  }`}
                  onClick={() => onToggle(id)}
                >
                  <button
                    onClick={e => { e.stopPropagation(); onFavorite(id); }}
                    className={`flex-shrink-0 transition-colors ${starred ? "text-yellow-400" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}`}
                  >
                    <Star className="w-3.5 h-3.5" fill={starred ? "currentColor" : "none"} />
                  </button>
                  <span className={`flex-1 text-sm ${active ? "text-primary font-medium" : "text-foreground"}`}>
                    {label}
                  </span>
                  {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {selected.length > 0 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{selected.length} active</span>
            <button
              onClick={() => selected.forEach(id => onToggle(id))}
              className="text-xs text-trading-red hover:opacity-80 transition-opacity"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Color Swatch ────────────────────────────────────────────────── */
const ColorSwatch = ({ color, onChange }: { color: string; onChange: (c: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className="w-7 h-6 rounded cursor-pointer border border-white/20 hover:border-white/50 transition-colors overflow-hidden flex-shrink-0"
      style={{ backgroundColor: color }}
      onClick={() => ref.current?.click()}
    >
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="opacity-0 w-full h-full cursor-pointer"
      />
    </div>
  );
};

type SettingsSection = "Symbol" | "Status line" | "Scales" | "Canvas";

/* ── Chart Settings Modal ────────────────────────────────────────── */
const SettingsModal = ({
  chartStyle, onStyleChange,
  showVolume, onVolumeToggle,
  candleColors, onCandleColorChange,
  candleToggles, onCandleToggleChange,
  onClose, onApply,
}: {
  chartStyle: number; onStyleChange: (s: number) => void;
  showVolume: boolean; onVolumeToggle: () => void;
  candleColors: CandleColors; onCandleColorChange: (key: keyof CandleColors, val: string) => void;
  candleToggles: CandleToggles; onCandleToggleChange: (key: keyof CandleToggles) => void;
  onClose: () => void; onApply: () => void;
}) => {
  const [section, setSection] = useState<SettingsSection>("Symbol");

  const sidebarItems: { key: SettingsSection; Icon: React.ElementType; label: string }[] = [
    { key: "Symbol",      Icon: Target,    label: "Symbol"      },
    { key: "Status line", Icon: AlignLeft, label: "Status line" },
    { key: "Scales",      Icon: Sliders,   label: "Scales"      },
    { key: "Canvas",      Icon: Layers,    label: "Canvas"      },
  ];

  const CheckRow = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center gap-2.5 py-0.5">
      <div
        onClick={onToggle}
        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border cursor-pointer transition-colors ${
          checked ? "bg-primary border-primary" : "border-border bg-transparent"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-[560px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-foreground">Chart settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-44 border-r border-border flex-shrink-0 py-2">
            {sidebarItems.map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                  section === key
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {section === "Symbol" && (
              <div className="space-y-5">
                {/* Candles */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Candles</p>
                  <div className="space-y-3">
                    <CheckRow
                      label="Color bars based on previous close"
                      checked={candleToggles.colorByPrevClose}
                      onToggle={() => onCandleToggleChange("colorByPrevClose")}
                    />
                    {/* Body */}
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => onCandleToggleChange("body")}
                        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border cursor-pointer transition-colors ${
                          candleToggles.body ? "bg-primary border-primary" : "border-border bg-transparent"
                        }`}
                      >
                        {candleToggles.body && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground flex-1">Body</span>
                      <ColorSwatch color={candleColors.bullBody} onChange={v => onCandleColorChange("bullBody", v)} />
                      <ColorSwatch color={candleColors.bearBody} onChange={v => onCandleColorChange("bearBody", v)} />
                    </div>
                    {/* Borders */}
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => onCandleToggleChange("borders")}
                        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border cursor-pointer transition-colors ${
                          candleToggles.borders ? "bg-primary border-primary" : "border-border bg-transparent"
                        }`}
                      >
                        {candleToggles.borders && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground flex-1">Borders</span>
                      <ColorSwatch color={candleColors.bullBorder} onChange={v => onCandleColorChange("bullBorder", v)} />
                      <ColorSwatch color={candleColors.bearBorder} onChange={v => onCandleColorChange("bearBorder", v)} />
                    </div>
                    {/* Wick */}
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => onCandleToggleChange("wicks")}
                        className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border cursor-pointer transition-colors ${
                          candleToggles.wicks ? "bg-primary border-primary" : "border-border bg-transparent"
                        }`}
                      >
                        {candleToggles.wicks && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="text-sm text-foreground flex-1">Wick</span>
                      <ColorSwatch color={candleColors.bullWick} onChange={v => onCandleColorChange("bullWick", v)} />
                      <ColorSwatch color={candleColors.bearWick} onChange={v => onCandleColorChange("bearWick", v)} />
                    </div>
                  </div>
                </div>

                {/* Price Lines */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Price Lines</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border border-primary bg-primary cursor-pointer">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-foreground flex-1">Last</span>
                    <div className="w-7 h-6 rounded border border-white/20 flex items-center justify-center bg-transparent flex-shrink-0">
                      <Minus className="w-4 h-2 text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Chart Type */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Chart Type</p>
                  <div className="space-y-0.5">
                    {CHART_STYLES.map(({ label, value, Icon }) => (
                      <button
                        key={value}
                        onClick={() => onStyleChange(value)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded text-sm transition-colors text-left ${
                          chartStyle === value
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                        {chartStyle === value && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">Volume</p>
                  <button
                    onClick={onVolumeToggle}
                    className="flex items-center gap-2.5 w-full"
                  >
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${showVolume ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showVolume ? "left-4" : "left-0.5"}`} />
                    </div>
                    <span className="text-sm text-foreground">Show Volume</span>
                    {showVolume ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}

            {section === "Status line" && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Status line settings coming soon
              </div>
            )}

            {section === "Scales" && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Scale settings coming soon
              </div>
            )}

            {section === "Canvas" && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Canvas settings coming soon
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border flex-shrink-0 bg-card">
          <div className="flex items-center gap-2">
            <select className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground outline-none cursor-pointer">
              <option>Template</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded border border-border text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onApply(); onClose(); }}
              className="px-5 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Orders dropdown items & overlay ────────────────────────────── */
interface OrderOverlays {
  quickOrder:        boolean;
  position:          boolean;
  order:             boolean;
  historicalOrders:  boolean;
  liquidationPrice:  boolean;
}

const ORDER_OVERLAY_ITEMS: { key: keyof OrderOverlays; label: string }[] = [
  { key: "quickOrder",       label: "Quick Order"       },
  { key: "position",         label: "Position"          },
  { key: "order",            label: "Order"             },
  { key: "historicalOrders", label: "Historical orders" },
  { key: "liquidationPrice", label: "Liquidation price" },
];

/* ── Orders overlay (shown on chart when "Order" is checked) ─────── */
const OrdersOverlay = ({ symbol, mode }: { symbol: string; mode: "spot" | "futures" }) => {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: [`chart-orders-${mode}`, symbol],
    queryFn: () =>
      mode === "futures"
        ? (asterMarket as any).futuresOpenOrders?.(symbol)
        : (asterMarket as any).spotOpenOrders?.(symbol),
    enabled: !!user,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  if (!user) {
    return (
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-card/95 border border-border rounded-lg px-4 py-2.5 shadow-lg text-xs text-muted-foreground backdrop-blur-sm">
        Sign in to view orders on chart
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-card/95 border border-border rounded-lg px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const list = Array.isArray(orders) ? orders.slice(0, 5) : [];

  if (!list.length) {
    return (
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-card/95 border border-border rounded-lg px-4 py-2.5 shadow-lg text-xs text-muted-foreground backdrop-blur-sm">
        No open orders
      </div>
    );
  }

  return (
    <div className="absolute bottom-10 left-4 z-40 bg-card/95 border border-border rounded-lg shadow-xl backdrop-blur-sm overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        Open Orders
      </div>
      <div className="divide-y divide-border/50">
        {list.map((o: any, i: number) => (
          <div key={o.orderId ?? i} className="flex items-center gap-4 px-3 py-2 text-xs">
            <span className={`font-semibold w-8 ${o.side === "BUY" ? "text-trading-green" : "text-trading-red"}`}>
              {o.side}
            </span>
            <span className="font-mono-num text-foreground">{parseFloat(o.price || 0).toFixed(4)}</span>
            <span className="text-muted-foreground">{parseFloat(o.origQty || 0).toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Depth Chart ─────────────────────────────────────────────────── */
const DepthChart = ({ symbol, mode }: { symbol: string; mode: "spot" | "futures" }) => {
  const { data, isLoading } = useQuery({
    queryKey: [`depth-${mode}`, symbol],
    queryFn: () =>
      mode === "futures"
        ? asterMarket.futuresOrderBook(symbol, "100")
        : asterMarket.spotOrderBook(symbol, "100"),
    staleTime: 3_000,
    refetchInterval: 5_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading depth chart…
      </div>
    );
  }

  const rawBids: [string, string][] = data?.bids ?? [];
  const rawAsks: [string, string][] = data?.asks ?? [];
  const bids = rawBids.slice(0, 60).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));
  const asks = rawAsks.slice(0, 60).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) }));

  let bidCum = 0;
  const bidRows = bids.map(r => { bidCum += r.qty; return { ...r, cum: bidCum }; });
  let askCum = 0;
  const askRows = [...asks].reverse().map(r => { askCum += r.qty; return { ...r, cum: askCum }; }).reverse();
  const maxCum = Math.max(bidCum, askCum, 1);

  const midPrice = bids[0] && asks[0]
    ? ((bids[0].price + asks[0].price) / 2).toLocaleString("en-US", { maximumSignificantDigits: 6 })
    : "—";

  const W = 1000; const H = 400; const pad = 20;
  const allPrices = [...bidRows.map(r => r.price), ...askRows.map(r => r.price)];
  const minP = Math.min(...allPrices); const maxP = Math.max(...allPrices);
  const toX = (p: number) => pad + ((p - minP) / (maxP - minP || 1)) * (W - 2 * pad);
  const toY  = (c: number) => H - pad - (c / maxCum) * (H - 2 * pad);

  const bidPath = bidRows.length
    ? "M " + bidRows.map(r => `${toX(r.price)},${toY(r.cum)}`).join(" L ") +
      ` L ${toX(bidRows[bidRows.length - 1].price)},${H - pad} L ${toX(bidRows[0].price)},${H - pad} Z`
    : "";
  const askPath = askRows.length
    ? "M " + askRows.map(r => `${toX(r.price)},${toY(r.cum)}`).join(" L ") +
      ` L ${toX(askRows[askRows.length - 1].price)},${H - pad} L ${toX(askRows[0].price)},${H - pad} Z`
    : "";

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-border text-xs text-muted-foreground">
        <span className="text-trading-green font-medium">Bid (Buy)</span>
        <span className="text-foreground font-mono-num font-bold text-sm">{midPrice}</span>
        <span className="text-trading-red font-medium">Ask (Sell)</span>
      </div>
      <div className="flex-1 min-h-0 px-3 py-3">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142 76% 45%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(142 76% 45%)" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 84% 55%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(0 84% 55%)" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={pad} y1={toY(maxCum * f)} x2={W - pad} y2={toY(maxCum * f)}
              stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" className="text-foreground" />
          ))}
          <line x1={toX((minP + maxP) / 2)} y1={pad} x2={toX((minP + maxP) / 2)} y2={H - pad}
            stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 3" className="text-muted-foreground" />
          {bidPath && <path d={bidPath} fill="url(#bidGrad)" stroke="hsl(142 76% 45%)" strokeWidth="1.5" />}
          {askPath && <path d={askPath} fill="url(#askGrad)" stroke="hsl(0 84% 55%)" strokeWidth="1.5" />}
        </svg>
      </div>
      <div className="flex items-center justify-between px-5 py-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-trading-green/70" />
          <span className="text-[11px] text-muted-foreground">Total bids: <span className="text-trading-green font-mono-num">{bidCum.toFixed(2)}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">Total asks: <span className="text-trading-red font-mono-num">{askCum.toFixed(2)}</span></span>
          <div className="w-2 h-2 rounded-sm bg-trading-red/70" />
        </div>
      </div>
    </div>
  );
};

/* ── Details Panel ───────────────────────────────────────────────── */
const DetailsPanel = ({ symbol, mode }: { symbol: string; mode: "spot" | "futures" }) => {
  const { data: ticker } = useQuery({
    queryKey: [`details-ticker-${mode}`, symbol],
    queryFn: () =>
      mode === "futures" ? asterMarket.futuresTicker(symbol) : asterMarket.spotTicker(symbol),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const t = Array.isArray(ticker) ? ticker[0] : ticker;
  const base = symbol.replace("USDT", "");
  const pct = t?.priceChangePercent ? parseFloat(t.priceChangePercent) : null;

  const rows = [
    { label: "Last Price",    value: t?.lastPrice  ? parseFloat(t.lastPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "24h Change",    value: pct !== null  ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—",
      color: pct === null ? "" : pct >= 0 ? "text-trading-green" : "text-trading-red" },
    { label: "24h High",      value: t?.highPrice  ? parseFloat(t.highPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: "24h Low",       value: t?.lowPrice   ? parseFloat(t.lowPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
    { label: `Vol (${base})`, value: t?.volume     ? parseFloat(t.volume) >= 1e6 ? (parseFloat(t.volume) / 1e6).toFixed(2) + "M" : parseFloat(t.volume).toFixed(2) : "—" },
    { label: "Vol (USDT)",    value: t?.quoteVolume? parseFloat(t.quoteVolume) >= 1e6 ? (parseFloat(t.quoteVolume) / 1e6).toFixed(2) + "M" : parseFloat(t.quoteVolume).toFixed(2) : "—" },
    ...(mode === "futures" ? [
      { label: "Mark Price",    value: (t as any)?.markPrice    ? parseFloat((t as any).markPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
      { label: "Index Price",   value: (t as any)?.indexPrice   ? parseFloat((t as any).indexPrice).toLocaleString("en-US", { maximumSignificantDigits: 6 }) : "—" },
      { label: "Funding Rate",  value: (t as any)?.lastFundingRate ? (parseFloat((t as any).lastFundingRate) * 100).toFixed(4) + "%" : "—" },
      { label: "Open Interest", value: (t as any)?.openInterest  ? parseFloat((t as any).openInterest) >= 1e6 ? (parseFloat((t as any).openInterest) / 1e6).toFixed(2) + "M" : parseFloat((t as any).openInterest).toFixed(2) : "—" },
    ] : []),
  ];

  return (
    <div className="overflow-auto h-full bg-background">
      {rows.map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/40 px-4 last:border-0">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-xs font-mono-num font-medium text-foreground ${color ?? ""}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

/* ══ Main Chart Component ════════════════════════════════════════════ */
const CandlestickChart = ({ pair = "BTC/USDT", className, mode = "spot" }: CandlestickChartProps) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);

  /* toolbar state */
  const [toolsVisible,    setToolsVisible]    = useState(() => window.innerWidth >= 768);
  const [interval,        setInterval]        = useState("D");
  const [showOrdersMenu,  setShowOrdersMenu]  = useState(false);
  const [orderOverlays,   setOrderOverlays]   = useState<OrderOverlays>({
    quickOrder:       true,
    position:         true,
    order:            false,
    historicalOrders: false,
    liquidationPrice: false,
  });
  const [view,            setView]            = useState<"chart" | "depth" | "details">("chart");
  const [fullscreen,      setFullscreen]      = useState(false);
  const [priceType,       setPriceType]       = useState("Last Price");
  const [showPriceMenu,   setShowPriceMenu]   = useState(false);
  const [showLineType,    setShowLineType]    = useState(false);
  const [showIndicators,  setShowIndicators]  = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [selectedStudies, setSelectedStudies] = useState<string[]>(() =>
    window.innerWidth >= 768 ? ["MAExp@tv-basicstudies", "MASimple@tv-basicstudies"] : []
  );
  const [favoriteStudies, setFavoriteStudies] = useState<string[]>([]);
  const [chartStyle,      setChartStyle]      = useState(1);
  const [showVolume,      setShowVolume]      = useState(true);
  const [loaded,          setLoaded]          = useState(false);

  const [candleColors, setCandleColors] = useState<CandleColors>({
    bullBody:   "#26a69a",
    bearBody:   "#ef5350",
    bullBorder: "#26a69a",
    bearBorder: "#ef5350",
    bullWick:   "#26a69a",
    bearWick:   "#ef5350",
  });

  const [candleToggles, setCandleToggles] = useState<CandleToggles>({
    colorByPrevClose: false,
    body:    true,
    borders: true,
    wicks:   true,
  });

  const apiSymbol = pair.replace("/", "");

  const toggleStudy = (id: string) =>
    setSelectedStudies(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleFavorite = (id: string) =>
    setFavoriteStudies(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  /* close toolbar dropdowns on outside click */
  useEffect(() => {
    const handler = () => { setShowLineType(false); setShowPriceMenu(false); setShowOrdersMenu(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* fullscreen */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (fullscreen) {
      el.style.position = "fixed"; el.style.inset = "0"; el.style.zIndex = "9999";
      document.body.style.overflow = "hidden";
    } else {
      el.style.position = ""; el.style.inset = ""; el.style.zIndex = "";
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  /* TradingView widget */
  useEffect(() => {
    if (view !== "chart") return;
    setLoaded(false);
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const innerDiv = document.createElement("div");
    innerDiv.className = "tradingview-widget-container__widget";
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";
    widgetContainer.appendChild(innerDiv);

    const isDark = theme === "dark";
    const bgColor   = isDark ? "rgba(26, 26, 26, 1)"   : "rgba(245, 245, 245, 1)";
    const toolbarBg = isDark ? "rgba(33, 33, 33, 1)"   : "rgba(255, 255, 255, 1)";
    const gridColor = isDark ? "rgba(54, 54, 54, 0.8)" : "rgba(220, 220, 220, 1)";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${pair.replace("/", "")}`,
      interval,
      timezone: "Etc/UTC",
      theme: isDark ? "dark" : "light",
      style: chartStyle,
      locale: "en",
      backgroundColor: bgColor,
      toolbarBg,
      gridColor,
      hide_top_toolbar: true,
      hide_legend: false,
      hide_side_toolbar: !toolsVisible,
      hide_volume: !showVolume,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      studies: selectedStudies,
      support_host: "https://www.tradingview.com",
    });
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        observer.disconnect();
        if (iframe.contentDocument?.readyState === "complete") {
          setLoaded(true);
        } else {
          iframe.addEventListener("load", () => setLoaded(true), { once: true });
        }
      }
    });
    observer.observe(containerRef.current, { childList: true, subtree: true });
    const fallback = setTimeout(() => setLoaded(true), 8000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [toolsVisible, pair, theme, isMobile, interval, view, selectedStudies, chartStyle, showVolume]);

  return (
    <div ref={wrapperRef} className={`flex flex-col min-h-0 h-full bg-background ${fullscreen ? "" : className || ""}`}>

      {/* ══ Toolbar ══ */}
      <div className="flex items-center h-10 px-2 gap-0.5 border-b border-panel-border bg-card flex-shrink-0 min-w-0">

        {/* Timeframe buttons */}
        <div className="flex items-center flex-shrink-0">
          {INTERVALS.map(({ label, value }) => (
            <button key={value}
              onClick={() => { setInterval(value); setView("chart"); }}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                interval === value && view === "chart"
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
          <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors ml-0.5">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-2 flex-shrink-0" />

        {/* ── Indicators — opens modal with full list + search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowIndicators(true)}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                selectedStudies.length > 0
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Indicators{selectedStudies.length > 0 ? ` (${selectedStudies.length})` : ""}
          </TooltipContent>
        </Tooltip>

        {/* ── Line Type — chart style selector */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setShowLineType(v => !v); setShowPriceMenu(false); }}
                className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                  showLineType ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {(() => { const s = CHART_STYLES.find(s => s.value === chartStyle); return s ? <s.Icon className="w-4 h-4" /> : <CandleIcon className="w-4 h-4" />; })()}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Line Type ({CHART_STYLES.find(s => s.value === chartStyle)?.label ?? "Candles"})
            </TooltipContent>
          </Tooltip>
          {showLineType && (
            <div className="absolute top-full left-0 mt-1 z-50 w-44 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1">
              {CHART_STYLES.map(({ label, value, Icon }) => (
                <button
                  key={value}
                  onClick={() => { setChartStyle(value); setShowLineType(false); setView("chart"); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                    chartStyle === value
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                  {chartStyle === value && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Show Orders — dropdown with overlay checkboxes */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setShowOrdersMenu(v => !v); setShowLineType(false); setShowPriceMenu(false); }}
                className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                  showOrdersMenu || Object.values(orderOverlays).some(Boolean)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <ReceiptText className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Show Orders</TooltipContent>
          </Tooltip>
          {showOrdersMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1.5">
              {ORDER_OVERLAY_ITEMS.map(({ key, label }) => {
                const checked = orderOverlays[key];
                return (
                  <button
                    key={key}
                    onClick={() => setOrderOverlays(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                  >
                    <div className={`w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center border transition-colors ${
                      checked ? "bg-primary border-primary" : "border-border bg-transparent"
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-foreground">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border mx-2 flex-shrink-0" />

        {/* ── Settings (Cog) — opens chart settings modal */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                showSettings ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Cog className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Chart Settings</TooltipContent>
        </Tooltip>

        {/* ── Last Price dropdown */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setShowPriceMenu(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors font-medium"
          >
            {priceType}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showPriceMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 w-36 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1">
              {PRICE_TYPES.map(pt => (
                <button key={pt}
                  onClick={() => { setPriceType(pt); setShowPriceMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    pt === priceType ? "text-primary font-semibold bg-primary/10" : "text-foreground hover:bg-accent"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chart / Depth / Details tabs — desktop only */}
        {!isMobile && (
          <div className="flex items-center gap-0 flex-shrink-0">
            {(["Chart", "Depth", "Details"] as const).map((tab) => (
              <button key={tab}
                onClick={() => setView(tab.toLowerCase() as "chart" | "depth" | "details")}
                className={`px-2.5 py-1 text-xs font-medium transition-colors border-b-2 ${
                  view === tab.toLowerCase()
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Fullscreen — desktop only */}
        {!isMobile && (
          <>
            <div className="w-px h-5 bg-border mx-2 flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFullscreen(v => !v)}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                >
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{fullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* ══ Body ══ */}
      <div className="relative flex-1 min-h-0">

        {/* TradingView chart */}
        <div className={`absolute inset-0 ${view === "chart" ? "block" : "hidden"}`}>
          <div ref={containerRef} className="h-full w-full" />
          {!loaded && view === "chart" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
              <div className="animate-pulse">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11.5L10 22L20 9.5H13.5L13 2Z" fill="hsl(var(--primary))" />
                </svg>
              </div>
            </div>
          )}
          {/* Orders overlay — shown when "Order" is checked */}
          {orderOverlays.order && <OrdersOverlay symbol={apiSymbol} mode={mode} />}
          {/* Side tools toggle tab */}
          <button
            onClick={() => setToolsVisible(!toolsVisible)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-card/90 border border-l-0 border-border rounded-r-md py-4 px-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {toolsVisible ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Depth view */}
        {view === "depth" && (
          <div className="absolute inset-0">
            <DepthChart symbol={apiSymbol} mode={mode} />
          </div>
        )}

        {/* Details view */}
        {view === "details" && (
          <div className="absolute inset-0 overflow-auto">
            <DetailsPanel symbol={apiSymbol} mode={mode} />
          </div>
        )}
      </div>

      {/* ══ Modals ══ */}
      {showIndicators && (
        <IndicatorsModal
          selected={selectedStudies}
          favorites={favoriteStudies}
          onToggle={toggleStudy}
          onFavorite={toggleFavorite}
          onClose={() => setShowIndicators(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          chartStyle={chartStyle}
          onStyleChange={(s) => { setChartStyle(s); setView("chart"); }}
          showVolume={showVolume}
          onVolumeToggle={() => setShowVolume(v => !v)}
          candleColors={candleColors}
          onCandleColorChange={(key, val) => setCandleColors(prev => ({ ...prev, [key]: val }))}
          candleToggles={candleToggles}
          onCandleToggleChange={(key) => setCandleToggles(prev => ({ ...prev, [key]: !prev[key] }))}
          onClose={() => setShowSettings(false)}
          onApply={() => setView("chart")}
        />
      )}
    </div>
  );
};

export default CandlestickChart;
