import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CandlestickChart = () => {
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
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.type = "text/x-tradingview-widget";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(10, 10, 10, 1)",
      gridColor: "rgba(30, 30, 30, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: !toolsVisible,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      studies: ["Volume@tv-basicstudies"],
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    const loaderScript = document.createElement("script");
    loaderScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    loaderScript.async = true;
    containerRef.current.appendChild(loaderScript);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [toolsVisible]);

  return (
    <div className="relative flex-1 min-h-0 h-full">
      <div className="tradingview-widget-container h-full w-full" ref={containerRef} />
      {/* Custom toggle arrow */}
      <button
        onClick={() => setToolsVisible(!toolsVisible)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-l-0 border-border rounded-r-md py-4 px-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {toolsVisible ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default CandlestickChart;
