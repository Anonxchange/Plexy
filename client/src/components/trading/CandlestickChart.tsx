import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";

interface CandlestickChartProps {
  pair?: string;
  className?: string;
}

const CandlestickChart = ({ pair = "BTC/USDT", className }: CandlestickChartProps) => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolsVisible, setToolsVisible] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${pair.replace("/", "")}`,
      interval: "D",
      timezone: "Etc/UTC",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: "en",
      backgroundColor: isDark ? "rgba(26, 26, 26, 1)" : "rgba(255, 255, 255, 1)",
      gridColor: isDark ? "rgba(54, 54, 54, 0.8)" : "rgba(230, 230, 230, 1)",
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: !toolsVisible,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      studies: [],
      support_host: "https://www.tradingview.com",
    });
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        observer.disconnect();
        const onLoad = () => setLoaded(true);
        if (iframe.contentDocument?.readyState === "complete") {
          setLoaded(true);
        } else {
          iframe.addEventListener("load", onLoad, { once: true });
        }
      }
    });

    observer.observe(containerRef.current, { childList: true, subtree: true });

    const fallback = setTimeout(() => setLoaded(true), 8000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [toolsVisible, pair, theme, isMobile]);

  return (
    <div className={`relative flex-1 min-h-0 h-full ${className || ""}`}>
      <div ref={containerRef} className="h-full w-full" />

      {!loaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background">
          <div className="animate-pulse">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.5 13.5H11.5L10 22L20 9.5H13.5L13 2Z" fill="hsl(var(--primary))" />
            </svg>
          </div>
        </div>
      )}

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
