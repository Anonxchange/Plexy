import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  BaselineSeries,
  LineStyle,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  DeepPartial,
  ChartOptions,
  IPriceLine,
  MouseEventParams,
} from "lightweight-charts";
import type { DrawingTool } from "./DrawingToolbar";

/* ── Interval mapping: TV code → Aster REST interval ─────────────── */
const TV_TO_ASTER: Record<string, string> = {
  "1": "1m",  "3": "3m",  "5": "5m",  "15": "15m", "30": "30m",
  "60": "1h", "120": "2h","240": "4h","360": "6h", "480": "8h",
  "720": "12h","D": "1d", "W": "1w",  "M": "1M",
};

/* ── How many candles to show initially ───────────────────────────── */
const INITIAL_VISIBLE = 70;

export interface CandleColors {
  bullBody:   string;
  bearBody:   string;
  bullBorder: string;
  bearBorder: string;
  bullWick:   string;
  bearWick:   string;
}

export interface CandleToggles {
  colorByPrevClose: boolean;
  body:    boolean;
  borders: boolean;
  wicks:   boolean;
}

interface Props {
  symbol:        string;
  interval:      string;
  mode:          "spot" | "futures";
  chartStyle:    number;
  showVolume:    boolean;
  isDark:        boolean;
  candleColors:  CandleColors;
  candleToggles: CandleToggles;
  onReady?:      () => void;
  /* ── Drawing props ── */
  activeTool?:      DrawingTool | null;
  onToolReset?:     () => void;
  clearAllRef?:     React.MutableRefObject<() => void>;
  magnetMode?:      boolean;
  /* ── Settings props ── */
  showLegend?:        boolean;
  logScale?:          boolean;
  invertScale?:       boolean;
  scaleMarginTop?:    number;
  scaleMarginBottom?: number;
  showHorzGrid?:      boolean;
  showVertGrid?:      boolean;
  showCrosshair?:     boolean;
  showPriceScale?:    boolean;
  showWatermark?:     boolean;
}

function toSecond(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function rowToCandle(row: any[]): CandlestickData<UTCTimestamp> {
  return {
    time:  toSecond(row[0]),
    open:  parseFloat(row[1]),
    high:  parseFloat(row[2]),
    low:   parseFloat(row[3]),
    close: parseFloat(row[4]),
  };
}

function heikinAshi(candles: CandlestickData<UTCTimestamp>[]): CandlestickData<UTCTimestamp>[] {
  const ha: CandlestickData<UTCTimestamp>[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen  = i === 0
      ? (c.open + c.close) / 2
      : (ha[i - 1].open + ha[i - 1].close) / 2;
    ha.push({
      time:  c.time,
      open:  haOpen,
      high:  Math.max(c.high, haOpen, haClose),
      low:   Math.min(c.low,  haOpen, haClose),
      close: haClose,
    });
  }
  return ha;
}

function pricePrecision(price: number): number {
  if (price >= 1000) return 1;
  if (price >= 100)  return 2;
  if (price >= 1)    return 4;
  if (price >= 0.1)  return 5;
  return 6;
}

function fmtPrice(price: number): string {
  const dp = pricePrecision(price);
  return price.toFixed(dp);
}

/* ── Drawing data structures ───────────────────────────────────────── */
const DRAW_COLOR = "#2196f3";

type PriceLineDrawing = { kind: "hline"; ref: IPriceLine };
type SeriesDrawing    = { kind: "series"; ref: ISeriesApi<any> };
type OverlayDrawing   = { kind: "overlay"; el: HTMLElement };
type AnyDrawing = PriceLineDrawing | SeriesDrawing | OverlayDrawing;

async function fetchKlines(
  symbol:   string,
  interval: string,
  mode:     "spot" | "futures",
  limit = 500,
): Promise<any[][]> {
  const asterInterval = TV_TO_ASTER[interval] ?? "1d";
  const base =
    mode === "futures"
      ? "https://fapi.asterdex.com/fapi/v1/klines"
      : "https://sapi.asterdex.com/api/v1/klines";
  const url = `${base}?symbol=${symbol}&interval=${asterInterval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Klines ${res.status}`);
  return res.json();
}

export default function AsterLightweightChart({
  symbol,
  interval,
  mode,
  chartStyle,
  showVolume,
  isDark,
  candleColors,
  candleToggles,
  onReady,
  activeTool,
  onToolReset,
  clearAllRef,
  magnetMode,
  showLegend,
  logScale,
  invertScale,
  scaleMarginTop,
  scaleMarginBottom,
  showHorzGrid,
  showVertGrid,
  showCrosshair,
  showPriceScale,
  showWatermark,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef    = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const priceRef     = useRef<ISeriesApi<any> | null>(null);
  const volRef       = useRef<ISeriesApi<"Histogram"> | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Drawing state in refs (so subscribeClick always reads fresh values) */
  const activeToolRef   = useRef<DrawingTool | null>(null);
  const onToolResetRef  = useRef<(() => void) | undefined>(undefined);
  const magnetModeRef   = useRef<boolean>(false);
  const pendingPt          = useRef<{ time: UTCTimestamp; price: number } | null>(null);
  const pendingLineRef     = useRef<IPriceLine | null>(null);
  const drawingsRef        = useRef<AnyDrawing[]>([]);
  const overlayDivRef      = useRef<HTMLDivElement | null>(null);

  /* Keep refs in sync with props */
  useEffect(() => { activeToolRef.current   = activeTool   ?? null; }, [activeTool]);
  useEffect(() => { onToolResetRef.current  = onToolReset;           }, [onToolReset]);
  useEffect(() => { magnetModeRef.current   = magnetMode   ?? false; }, [magnetMode]);

  /* Cancel pending 2-click drawing when tool changes */
  useEffect(() => {
    if (pendingLineRef.current && priceRef.current) {
      try { priceRef.current.removePriceLine(pendingLineRef.current); } catch {}
      pendingLineRef.current = null;
    }
    pendingPt.current = null;
  }, [activeTool]);

  /* ── Live chart option updates (no recreation needed) ─────────────── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      grid: {
        vertLines: { visible: showVertGrid ?? true },
        horzLines: { visible: showHorzGrid ?? true },
      },
      crosshair: {
        vertLine: { visible: showCrosshair ?? true },
        horzLine: { visible: showCrosshair ?? true },
      },
    });
  }, [showVertGrid, showHorzGrid, showCrosshair]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.priceScale("right").applyOptions({
      mode:          logScale ? 1 : 0,
      invertScale:   invertScale ?? false,
      scaleMargins: {
        top:    scaleMarginTop    ?? 0.04,
        bottom: scaleMarginBottom ?? 0.1,
      },
    });
  }, [logScale, invertScale, scaleMarginTop, scaleMarginBottom]);

  useEffect(() => {
    if (legendRef.current) {
      legendRef.current.style.display = (showLegend === false) ? "none" : "";
    }
  }, [showLegend]);

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({ visible: showPriceScale ?? true });
  }, [showPriceScale]);

  useEffect(() => {
    chartRef.current?.applyOptions({
      watermark: {
        visible:    showWatermark ?? false,
        text:       symbol,
        fontSize:   48,
        horzAlign:  "center",
        vertAlign:  "center",
        color:      "rgba(128,128,128,0.06)",
      },
    });
  }, [showWatermark, symbol]);

  /* ── Main chart creation effect ────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;

    const bg        = isDark ? "#111111" : "#ffffff";
    const textCol   = isDark ? "#9ca3af" : "#6b7280";
    const gridCol   = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
    const borderCol = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background:  { color: bg },
        textColor:   textCol,
        fontFamily:  "Inter, system-ui, sans-serif",
        fontSize:    11,
      },
      grid: {
        vertLines: { color: gridCol },
        horzLines: { color: gridCol },
      },
      crosshair: {
        vertLine: {
          color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
          labelBackgroundColor: isDark ? "#374151" : "#e5e7eb",
        },
        horzLine: {
          color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
          labelBackgroundColor: isDark ? "#374151" : "#e5e7eb",
        },
      },
      rightPriceScale: {
        borderColor: borderCol,
        minimumWidth: 52,
        autoScale: true,
        scaleMargins: { top: 0.04, bottom: 0.1 },
      },
      timeScale: {
        borderColor: borderCol,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    };

    const chart = createChart(containerRef.current, chartOptions);
    chartRef.current = chart;

    /* ── ResizeObserver ──────────────────────────────────────────────── */
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) chart.resize(e.contentRect.width, e.contentRect.height);
    });
    ro.observe(containerRef.current);

    /* ── bull/bear colors ────────────────────────────────────────────── */
    const bullColor = candleToggles.body ? candleColors.bullBody : "transparent";
    const bearColor = candleToggles.body ? candleColors.bearBody : "transparent";

    /* ── price series ────────────────────────────────────────────────── */
    let priceSeries: ISeriesApi<any>;

    if (chartStyle === 1 || chartStyle === 0) {
      priceSeries = chart.addSeries(CandlestickSeries, {
        upColor:          bullColor,
        downColor:        bearColor,
        borderUpColor:    candleToggles.borders ? candleColors.bullBorder : "transparent",
        borderDownColor:  candleToggles.borders ? candleColors.bearBorder : "transparent",
        wickUpColor:      candleToggles.wicks   ? candleColors.bullWick   : "transparent",
        wickDownColor:    candleToggles.wicks   ? candleColors.bearWick   : "transparent",
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 8) {
      priceSeries = chart.addSeries(CandlestickSeries, {
        upColor:          bullColor,
        downColor:        bearColor,
        borderUpColor:    candleToggles.borders ? candleColors.bullBorder : "transparent",
        borderDownColor:  candleToggles.borders ? candleColors.bearBorder : "transparent",
        wickUpColor:      candleToggles.wicks   ? candleColors.bullWick   : "transparent",
        wickDownColor:    candleToggles.wicks   ? candleColors.bearWick   : "transparent",
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 2) {
      priceSeries = chart.addSeries(LineSeries, {
        color:            bullColor,
        lineWidth:        2,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 3) {
      priceSeries = chart.addSeries(AreaSeries, {
        topColor:    isDark ? "rgba(38,166,154,0.30)" : "rgba(38,166,154,0.20)",
        bottomColor: "rgba(38,166,154,0.00)",
        lineColor:   bullColor,
        lineWidth:   2,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 4) {
      priceSeries = chart.addSeries(BarSeries, {
        upColor:          bullColor,
        downColor:        bearColor,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 9) {
      /* Hollow candles — up body is transparent (hollow) */
      priceSeries = chart.addSeries(CandlestickSeries, {
        upColor:          "transparent",
        downColor:        bearColor,
        borderUpColor:    candleToggles.borders ? candleColors.bullBorder : "transparent",
        borderDownColor:  candleToggles.borders ? candleColors.bearBorder : "transparent",
        wickUpColor:      candleToggles.wicks   ? candleColors.bullWick   : "transparent",
        wickDownColor:    candleToggles.wicks   ? candleColors.bearWick   : "transparent",
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 7) {
      /* Step line */
      priceSeries = chart.addSeries(LineSeries, {
        color:            bullColor,
        lineWidth:        2,
        lineType:         1,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 10) {
      /* Baseline */
      priceSeries = chart.addSeries(BaselineSeries, {
        topLineColor:     bullColor,
        topFillColor1:    isDark ? "rgba(38,166,154,0.28)" : "rgba(38,166,154,0.18)",
        topFillColor2:    "rgba(38,166,154,0.00)",
        bottomLineColor:  bearColor,
        bottomFillColor1: "rgba(239,83,80,0.00)",
        bottomFillColor2: isDark ? "rgba(239,83,80,0.28)" : "rgba(239,83,80,0.18)",
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else if (chartStyle === 13) {
      /* Columns */
      priceSeries = chart.addSeries(HistogramSeries, {
        color:            bullColor,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    } else {
      priceSeries = chart.addSeries(AreaSeries, {
        topColor:    isDark ? "rgba(38,166,154,0.30)" : "rgba(38,166,154,0.20)",
        bottomColor: "rgba(38,166,154,0.00)",
        lineColor:   bullColor,
        lineWidth:   2,
        priceLineVisible: true,
        lastValueVisible: true,
      } as any);
    }
    priceRef.current = priceSeries;

    /* ── volume series ───────────────────────────────────────────────── */
    if (showVolume) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat:      { type: "volume" },
        priceScaleId:     "vol",
        lastValueVisible: false,
        priceLineVisible: false,
      } as any);
      volSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volRef.current = volSeries;
    }

    /* ── OHLC legend ─────────────────────────────────────────────────── */
    let lastOHLC = { o: 0, h: 0, l: 0, c: 0 };

    function updateLegend(o: number, h: number, l: number, c: number) {
      const el = legendRef.current;
      if (!el) return;
      const dp  = pricePrecision(c);
      const chg = c - o;
      const pct = o !== 0 ? (chg / o) * 100 : 0;
      const up  = chg >= 0;
      const col = up ? "#26a69a" : "#ef5350";
      const bg  = up ? "rgba(38,166,154,0.12)" : "rgba(239,83,80,0.12)";
      const txt = isDark ? "#e5e7eb" : "#111827";
      el.innerHTML =
        `<span style="color:${txt};font-weight:600;font-size:13px;letter-spacing:-0.01em">${c.toFixed(dp)}</span>` +
        `<span style="display:inline-flex;align-items:center;margin-left:6px;padding:1px 5px;border-radius:4px;background:${bg};color:${col};font-size:10.5px;font-weight:500">${up ? "▲" : "▼"} ${up ? "+" : ""}${chg.toFixed(dp)}&nbsp;(${up ? "+" : ""}${pct.toFixed(2)}%)</span>`;
    }

    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !priceRef.current) {
        updateLegend(lastOHLC.o, lastOHLC.h, lastOHLC.l, lastOHLC.c);
        return;
      }
      const bar = param.seriesData.get(priceRef.current) as any;
      if (!bar) return;
      const o = bar.open  ?? bar.value ?? 0;
      const h = bar.high  ?? bar.value ?? 0;
      const l = bar.low   ?? bar.value ?? 0;
      const c = bar.close ?? bar.value ?? 0;
      lastOHLC = { o, h, l, c };
      updateLegend(o, h, l, c);
    });

    /* ── Drawing: subscribeClick ─────────────────────────────────────── */
    chart.subscribeClick((param: MouseEventParams<UTCTimestamp>) => {
      const tool = activeToolRef.current;
      if (!tool || tool === "cursor" || tool === "eraseall") return;
      if (!param.time || !priceRef.current || !param.point) return;

      const rawPrice = priceRef.current.coordinateToPrice(param.point.y);
      if (rawPrice === null) return;
      const price = rawPrice;
      const time  = param.time as UTCTimestamp;

      const dp = pricePrecision(price);

      /* ── Single-click tools ─────────────────────── */
      if (tool === "highlighter") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "rgba(255,235,59,0.55)",
          lineWidth:        8,
          lineStyle:        LineStyle.Solid,
          axisLabelVisible: false,
          title:            "",
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "note" || tool === "callout" || tool === "anchored_note") {
        const label = window.prompt("Enter note:", "");
        if (!label) return;
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "#f59e0b",
          lineWidth:        1,
          lineStyle:        LineStyle.Dotted,
          axisLabelVisible: false,
          title:            `📌 ${label}`,
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "hline") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            DRAW_COLOR,
          lineWidth:        1,
          lineStyle:        LineStyle.Solid,
          axisLabelVisible: true,
          title:            `H ${fmtPrice(price)}`,
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "crossline") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            DRAW_COLOR,
          lineWidth:        1,
          lineStyle:        LineStyle.Dashed,
          axisLabelVisible: true,
          title:            "",
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        addVlineOverlay(time, chart, overlayDivRef);
        return;
      }

      if (tool === "vline") {
        addVlineOverlay(time, chart, overlayDivRef);
        return;
      }

      if (tool === "pricelabel") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "#f59e0b",
          lineWidth:        1,
          lineStyle:        LineStyle.Dashed,
          axisLabelVisible: true,
          title:            `▶ ${fmtPrice(price)}`,
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "text") {
        const label = window.prompt("Enter text:", "");
        if (!label) return;
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "#f59e0b",
          lineWidth:        1,
          lineStyle:        LineStyle.Dotted,
          axisLabelVisible: false,
          title:            label,
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "longpos") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "#26a69a",
          lineWidth:        2,
          lineStyle:        LineStyle.Solid,
          axisLabelVisible: true,
          title:            "▲ Long",
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      if (tool === "shortpos") {
        const pl = priceRef.current.createPriceLine({
          price,
          color:            "#ef5350",
          lineWidth:        2,
          lineStyle:        LineStyle.Solid,
          axisLabelVisible: true,
          title:            "▼ Short",
        });
        drawingsRef.current.push({ kind: "hline", ref: pl });
        return;
      }

      /* ── Two-click tools ────────────────────────── */
      const twoClickTools = new Set([
        "trendline", "ray", "extline", "hray",
        "trendangle", "rectangle", "measure",
        "parallelchannel", "disjointchannel",
        "daterange", "pricerange",
        "zoom",
      ]);

      if (twoClickTools.has(tool)) {
        if (!pendingPt.current) {
          /* First click — store point and show a dashed guide line */
          pendingPt.current = { time, price };
          pendingLineRef.current = priceRef.current.createPriceLine({
            price,
            color:            DRAW_COLOR,
            lineWidth:        1,
            lineStyle:        LineStyle.Dashed,
            axisLabelVisible: false,
            title:            "·",
          });
          return;
        }

        /* Second click — remove guide, draw final shape */
        if (pendingLineRef.current) {
          try { priceRef.current.removePriceLine(pendingLineRef.current); } catch {}
          pendingLineRef.current = null;
        }
        const p1 = pendingPt.current;
        const p2 = { time, price };
        pendingPt.current = null;

        if (tool === "rectangle") {
          /* Two hlines + shaded area via priceLine */
          const topPrice    = Math.max(p1.price, p2.price);
          const bottomPrice = Math.min(p1.price, p2.price);
          const pl1 = priceRef.current.createPriceLine({
            price:            topPrice,
            color:            DRAW_COLOR,
            lineWidth:        1,
            lineStyle:        LineStyle.Solid,
            axisLabelVisible: false,
            title:            "",
          });
          const pl2 = priceRef.current.createPriceLine({
            price:            bottomPrice,
            color:            DRAW_COLOR,
            lineWidth:        1,
            lineStyle:        LineStyle.Solid,
            axisLabelVisible: false,
            title:            "",
          });
          drawingsRef.current.push({ kind: "hline", ref: pl1 });
          drawingsRef.current.push({ kind: "hline", ref: pl2 });
          return;
        }

        if (tool === "measure" || tool === "pricerange") {
          const topPrice    = Math.max(p1.price, p2.price);
          const bottomPrice = Math.min(p1.price, p2.price);
          const diff        = topPrice - bottomPrice;
          const pct         = (diff / bottomPrice) * 100;
          const pl = priceRef.current.createPriceLine({
            price:            (topPrice + bottomPrice) / 2,
            color:            "#9c27b0",
            lineWidth:        1,
            lineStyle:        LineStyle.Dashed,
            axisLabelVisible: true,
            title:            `${diff.toFixed(dp)} (${pct.toFixed(2)}%)`,
          });
          drawingsRef.current.push({ kind: "hline", ref: pl });
          return;
        }

        if (tool === "daterange") {
          addVlineOverlay(p1.time, chart, overlayDivRef);
          addVlineOverlay(p2.time, chart, overlayDivRef);
          return;
        }

        if (tool === "zoom") {
          const from = (p1.time as number) < (p2.time as number) ? p1.time : p2.time;
          const to   = (p1.time as number) < (p2.time as number) ? p2.time : p1.time;
          chart.timeScale().setVisibleRange({ from, to } as any);
          return;
        }

        /* trendline, ray, extline, hray, trendangle, parallelchannel, disjointchannel */
        const timeDiff = (p2.time as number) - (p1.time as number);
        let from = p1;
        let to   = p2;

        if (tool === "ray") {
          to = { time: (p2.time as number + timeDiff * 50) as UTCTimestamp, price: p2.price + (p2.price - p1.price) * 50 };
        }
        if (tool === "extline") {
          from = { time: (p1.time as number - timeDiff * 50) as UTCTimestamp, price: p1.price - (p2.price - p1.price) * 50 };
          to   = { time: (p2.time as number + timeDiff * 50) as UTCTimestamp, price: p2.price + (p2.price - p1.price) * 50 };
        }
        if (tool === "hray") {
          to = { time: (p1.time as number + timeDiff * 100) as UTCTimestamp, price: p1.price };
          from = p1;
        }

        const lineSeries = chart.addSeries(LineSeries, {
          color:            DRAW_COLOR,
          lineWidth:        1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        } as any);

        lineSeries.setData([
          { time: from.time, value: from.price },
          { time: to.time,   value: to.price   },
        ] as any);

        drawingsRef.current.push({ kind: "series", ref: lineSeries });
        return;
      }
    });

    /* ── Erase All via clearAllRef ───────────────────────────────────── */
    if (clearAllRef) {
      clearAllRef.current = () => {
        drawingsRef.current.forEach(d => {
          if (d.kind === "hline" && priceRef.current) {
            try { priceRef.current.removePriceLine(d.ref); } catch {}
          } else if (d.kind === "series") {
            try { chart.removeSeries(d.ref); } catch {}
          } else if (d.kind === "overlay") {
            d.el.remove();
          }
        });
        drawingsRef.current = [];
        overlayDivRef.current?.querySelectorAll(".draw-vline").forEach(el => el.remove());
        pendingPt.current = null;
        if (pendingLineRef.current) {
          try { pendingLineRef.current = null; } catch {}
        }
      };
    }

    /* ── load data ───────────────────────────────────────────────────── */
    let cancelled = false;

    async function loadData() {
      try {
        const rows = await fetchKlines(symbol, interval, mode, 500);
        if (cancelled || !chartRef.current) return;

        let candles = rows.map(rowToCandle);
        if (chartStyle === 8) candles = heikinAshi(candles);

        const isOHLC = chartStyle === 1 || chartStyle === 8 || chartStyle === 0 || chartStyle === 9;
        if (isOHLC) {
          priceSeries.setData(candles as any);
        } else {
          priceSeries.setData(candles.map(c => ({ time: c.time, value: c.close })) as any);
        }

        if (showVolume && volRef.current) {
          volRef.current.setData(
            rows.map(row => ({
              time:  toSecond(row[0]),
              value: parseFloat(row[5]),
              color: parseFloat(row[4]) >= parseFloat(row[1])
                ? (isDark ? "rgba(38,166,154,0.55)" : "rgba(38,166,154,0.45)")
                : (isDark ? "rgba(239,83,80,0.55)"  : "rgba(239,83,80,0.45)"),
            })) as any,
          );
        }

        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          lastOHLC = { o: last.open, h: last.high, l: last.low, c: last.close };
          updateLegend(last.open, last.high, last.low, last.close);
        }

        if (candles.length > 0) {
          const from = candles[Math.max(0, candles.length - INITIAL_VISIBLE)].time;
          const to   = candles[candles.length - 1].time;
          chart.timeScale().setVisibleRange({ from, to });
        }

        onReady?.();
      } catch (err) {
        console.warn("[AsterChart] load error:", err);
        onReady?.();
      }
    }

    async function updateLatest() {
      try {
        const rows = await fetchKlines(symbol, interval, mode, 2);
        if (cancelled || !rows.length || !priceRef.current) return;

        const latest = rows[rows.length - 1];
        const candle = rowToCandle(latest);
        const isOHLC = chartStyle === 1 || chartStyle === 8 || chartStyle === 0 || chartStyle === 9;

        if (isOHLC) {
          priceRef.current.update(candle as any);
        } else {
          priceRef.current.update({ time: candle.time, value: candle.close } as any);
        }

        lastOHLC = { o: candle.open, h: candle.high, l: candle.low, c: candle.close };

        if (showVolume && volRef.current) {
          volRef.current.update({
            time:  toSecond(latest[0]),
            value: parseFloat(latest[5]),
            color: parseFloat(latest[4]) >= parseFloat(latest[1])
              ? (isDark ? "rgba(38,166,154,0.55)" : "rgba(38,166,154,0.45)")
              : (isDark ? "rgba(239,83,80,0.55)"  : "rgba(239,83,80,0.45)"),
          } as any);
        }
      } catch {
        /* silently ignore poll errors */
      }
    }

    loadData();
    pollRef.current = setInterval(updateLatest, 5000);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      priceRef.current = null;
      volRef.current   = null;
      drawingsRef.current = [];
      pendingPt.current   = null;
    };
  }, [symbol, interval, mode, chartStyle, showVolume, isDark,
      candleColors.bullBody, candleColors.bearBody,
      candleColors.bullBorder, candleColors.bearBorder,
      candleColors.bullWick, candleColors.bearWick,
      candleToggles.body, candleToggles.borders, candleToggles.wicks]);

  /* ── Cursor style when tool changes ────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cursors: Partial<Record<DrawingTool, string>> = {
      cursor:    "default",
      zoom:      "zoom-in",
      text:      "text",
      measure:   "crosshair",
      hline:     "crosshair",
      vline:     "crosshair",
      trendline: "crosshair",
      ray:       "crosshair",
      extline:   "crosshair",
      hray:      "crosshair",
      crossline: "crosshair",
      rectangle: "crosshair",
      longpos:   "crosshair",
      shortpos:  "crosshair",
      pricelabel:"crosshair",
    };
    el.style.cursor = (activeTool ? cursors[activeTool] : undefined) ?? "default";
  }, [activeTool]);

  return (
    <div className="relative h-full w-full">
      {/* OHLC legend */}
      <div
        ref={legendRef}
        className="absolute top-2 left-2 z-10 flex items-center pointer-events-none select-none"
        style={{ lineHeight: "1" }}
      />
      {/* Drawing overlay container (vlines, etc.) */}
      <div
        ref={overlayDivRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-20"
      />
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function addVlineOverlay(
  time: UTCTimestamp,
  chart: IChartApi,
  overlayRef: React.MutableRefObject<HTMLDivElement | null>,
) {
  const overlay = overlayRef.current;
  if (!overlay) return;

  const el = document.createElement("div");
  el.className = "draw-vline absolute top-0 bottom-0 w-px bg-blue-400/80";
  el.style.left = "-9999px";
  overlay.appendChild(el);

  function updatePos() {
    const x = chart.timeScale().timeToCoordinate(time);
    if (x !== null) {
      el.style.left = `${x}px`;
    }
  }

  updatePos();
  chart.timeScale().subscribeVisibleTimeRangeChange(updatePos);
}
