import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CandlestickChartProps {
  pair?: string;
  className?: string;
}

const CandlestickChart = ({ pair = "BTC/USDT", className }: CandlestickChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolsVisible, setToolsVisible] = useState(false);

  useEffect(() => {
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

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${pair.replace("/", "")}`,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(18, 18, 18, 1)",
      gridColor: "rgba(40, 40, 40, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: !toolsVisible,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      studies: [],
      support_host: "https://www.tradingview.com",
    });
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [toolsVisible, pair]);

  return (
    <div className={`relative flex-1 min-h-0 h-full ${className || ""}`}>
      <div ref={containerRef} className="h-full w-full" />
      <button
        onClick={() => setToolsVisible(!toolsVisible)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-card/90 border border-l-0 border-border rounded-r-md py-4 px-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {toolsVisible ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default CandlestickChart;
