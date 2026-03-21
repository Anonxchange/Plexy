import { useState } from "react";
import PerpetualAccountBar from "@/components/trading/PerpetualAccountBar";
import PerpetualPairInfo from "@/components/trading/PerpetualPairInfo";
import MobilePerpetualTabs from "@/components/trading/MobilePerpetualTabs";
import DesktopPerpetualLayout from "@/components/trading/DesktopPerpetualLayout";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PerpetualPage() {
  const [chartVisible, setChartVisible] = useState(true);
  const [pair, setPair] = useState("ASTER/USDT");
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-x-hidden w-full max-w-full">
      {isMobile && <PerpetualAccountBar />}
      {isMobile && (
        <PerpetualPairInfo
          pair={pair}
          onPairChange={setPair}
          chartVisible={chartVisible}
          onToggleChart={() => setChartVisible(!chartVisible)}
        />
      )}
      {isMobile ? (
        <MobilePerpetualTabs chartVisible={chartVisible} pair={pair} />
      ) : (
        <DesktopPerpetualLayout
          chartVisible={chartVisible}
          pair={pair}
          onPairChange={setPair}
          onToggleChart={() => setChartVisible(!chartVisible)}
        />
      )}
    </div>
  );
}
