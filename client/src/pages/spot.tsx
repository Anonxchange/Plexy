import { useState } from "react";
import AccountBar from "@/components/trading/AccountBar";
import PairInfo from "@/components/trading/PairInfo";
import BottomTabs from "@/components/trading/BottomTabs";
import DesktopTradingLayout from "@/components/trading/DesktopTradingLayout";
import { useIsMobile } from "@/hooks/use-mobile";

export const Spot = () => {
  const [chartVisible, setChartVisible] = useState(true);
  const [pair, setPair] = useState("ASTER/USDT");
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden w-full max-w-full">
      <AccountBar />
      <PairInfo 
        pair={pair}
        onPairChange={setPair}
        chartVisible={chartVisible} 
        onToggleChart={() => setChartVisible(!chartVisible)} 
      />
      {isMobile ? (
        <BottomTabs chartVisible={chartVisible} pair={pair} />
      ) : (
        <DesktopTradingLayout chartVisible={chartVisible} pair={pair} />
      )}
    </div>
  );
};

export default Spot;
