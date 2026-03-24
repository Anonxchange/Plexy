import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Activity, PenLine, ReceiptText,
  Maximize2, Minimize2, Cog, X, Check,
  CandlestickChart as CandleIcon, BarChart2, TrendingUp, AreaChart,
  Volume2, VolumeX, Loader2
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
  { id: "MASimple@tv-basicstudies",  label: "SMA (Simple MA)"   },
  { id: "MAExp@tv-basicstudies",     label: "EMA"               },
  { id: "BB@tv-basicstudies",        label: "Bollinger Bands"   },
  { id: "MACD@tv-basicstudies",      label: "MACD"              },
  { id: "RSI@tv-basicstudies",       label: "RSI"               },
  { id: "VWAP@tv-basicstudies",      label: "VWAP"              },
  { id: "ATR@tv-basicstudies",       label: "ATR"               },
];

/* ── Shared dropdown wrapper ─────────────────────────────────────── */
const DropdownPanel = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      <span className="text-xs font-semibold text-foreground">{title}</span>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    {children}
  </div>
);

/* ── Indicators panel ────────────────────────────────────────────── */
const IndicatorsPanel = ({
  selected, onToggle, onClose,
}: { selected: string[]; onToggle: (id: string) => void; onClose: () => void }) => (
  <DropdownPanel title="Indicators" onClose={onClose}>
    <div className="py-1 max-h-64 overflow-y-auto">
      {STUDIES.map(({ id, label }) => {
        const active = selected.includes(id);
        return (
          <button key={id} onClick={() => onToggle(id)}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
          >
            <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
              active ? "bg-primary border-primary" : "border-border"
            }`}>
              {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
            </div>
            <span className="text-xs text-foreground">{label}</span>
          </button>
        );
      })}
    </div>
    {selected.length > 0 && (
      <div className="px-3 py-2 border-t border-border">
        <button onClick={() => selected.forEach(id => onToggle(id))}
          className="text-[11px] text-trading-red hover:opacity-80">
          Clear all ({selected.length})
        </button>
      </div>
    )}
  </DropdownPanel>
);

/* ── Settings panel ─────────────────────────────────────────────── */
const SettingsPanel = ({
  chartStyle, onStyleChange,
  showVolume, onVolumeToggle,
  onClose,
}: {
  chartStyle: number; onStyleChange: (s: number) => void;
  showVolume: boolean; onVolumeToggle: () => void;
  onClose: () => void;
}) => (
  <DropdownPanel title="Chart Settings" onClose={onClose}>
    <div className="p-3 space-y-3">
      {/* Chart type */}
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">Chart Type</p>
        <div className="grid grid-cols-1 gap-0.5">
          {CHART_STYLES.map(({ label, value, Icon }) => (
            <button key={value} onClick={() => { onStyleChange(value); }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors text-left ${
                chartStyle === value
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
              {chartStyle === value && <Check className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </div>
      </div>
      {/* Volume toggle */}
      <div className="border-t border-border pt-3">
        <button onClick={onVolumeToggle}
          className="flex items-center justify-between w-full px-0.5 text-xs text-foreground hover:text-primary transition-colors"
        >
          <span className="flex items-center gap-2">
            {showVolume ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            Show Volume
          </span>
          <div className={`w-8 h-4 rounded-full transition-colors relative ${showVolume ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${showVolume ? "left-4" : "left-0.5"}`} />
          </div>
        </button>
      </div>
    </div>
  </DropdownPanel>
);

/* ── Show Orders overlay ─────────────────────────────────────────── */
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
  const [toolsVisible,    setToolsVisible]    = useState(true);
  const [interval,        setInterval]        = useState("D");
  const [showOrders,      setShowOrders]      = useState(false);
  const [view,            setView]            = useState<"chart" | "depth" | "details">("chart");
  const [fullscreen,      setFullscreen]      = useState(false);
  const [priceType,       setPriceType]       = useState("Last Price");
  const [showPriceMenu,   setShowPriceMenu]   = useState(false);
  const [showIndicators,  setShowIndicators]  = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);
  const [chartStyle,      setChartStyle]      = useState(1); // 1 = Candles
  const [showVolume,      setShowVolume]      = useState(true);
  const [loaded,          setLoaded]          = useState(false);

  const apiSymbol = pair.replace("/", "");

  const closeAllMenus = () => { setShowPriceMenu(false); setShowIndicators(false); setShowSettings(false); };

  const toggleStudy = (id: string) =>
    setSelectedStudies(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

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

  /* close menus on outside click */
  useEffect(() => {
    const handler = () => closeAllMenus();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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
    script.innerHTML = JSON.stringify({
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

  const currentStyleLabel = CHART_STYLES.find(s => s.value === chartStyle)?.label ?? "Candles";

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

        {/* ── Indicators (Activity) — opens dropdown, reloads chart with studies */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setShowIndicators(v => !v); setShowSettings(false); setShowPriceMenu(false); }}
                className={`p-1.5 rounded transition-colors ${
                  selectedStudies.length > 0 || showIndicators
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
          {showIndicators && (
            <IndicatorsPanel
              selected={selectedStudies}
              onToggle={toggleStudy}
              onClose={() => setShowIndicators(false)}
            />
          )}
        </div>

        {/* ── Lines (PenLine) — toggles TradingView's drawing tools sidebar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setToolsVisible(v => !v)}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                toolsVisible ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <PenLine className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Drawing Tools ({toolsVisible ? "on" : "off"})
          </TooltipContent>
        </Tooltip>

        {/* ── Show Orders (ReceiptText) — shows open orders overlay on chart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowOrders(v => !v)}
              className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                showOrders ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <ReceiptText className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Show Orders ({showOrders ? "on" : "off"})
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-2 flex-shrink-0" />

        {/* ── Settings (Cog) — chart type + volume toggle */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => { setShowSettings(v => !v); setShowIndicators(false); setShowPriceMenu(false); }}
                className={`p-1.5 rounded transition-colors ${
                  showSettings ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Cog className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Chart Settings ({currentStyleLabel})</TooltipContent>
          </Tooltip>
          {showSettings && (
            <SettingsPanel
              chartStyle={chartStyle}
              onStyleChange={(s) => { setChartStyle(s); setView("chart"); }}
              showVolume={showVolume}
              onVolumeToggle={() => setShowVolume(v => !v)}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        {/* ── Last Price dropdown */}
        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => { setShowPriceMenu(v => !v); setShowIndicators(false); setShowSettings(false); }}
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

        {/* Chart / Depth / Details tabs */}
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

        <div className="w-px h-5 bg-border mx-2 flex-shrink-0" />

        {/* Fullscreen */}
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
          {/* Orders overlay */}
          {showOrders && <OrdersOverlay symbol={apiSymbol} mode={mode} />}
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
    </div>
  );
};

export default CandlestickChart;
