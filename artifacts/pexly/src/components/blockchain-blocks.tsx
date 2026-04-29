import { useRef, useState, useEffect } from "react";
import { getLatestBlocks } from "@/lib/mempool-api";

export const BlockchainBlocks = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayBlocks, setDisplayBlocks] = useState([
    { id: "#929557", gradient: "from-[#fde8d7] to-[#fcd5bc]" },
    { id: "#929556", gradient: "from-[#fcd5bc] to-[#f8b89a]" },
    { id: "#929555", gradient: "from-[#f8b89a] to-[#f5a089]" },
    { id: "#929554", gradient: "from-[#f5a089] to-[#f28b7d]" },
    { id: "#929553", gradient: "from-[#f28b7d] to-[#ef7872]" },
    { id: "#929552", gradient: "from-[#ef7872] to-[#ec6569]" },
    { id: "#929551", gradient: "from-[#ec6569] to-[#e95260]" },
  ]);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await getLatestBlocks(7);
        if (latest && latest.length > 0) {
          const gradients = [
            "from-[#fde8d7] to-[#fcd5bc]",
            "from-[#fcd5bc] to-[#f8b89a]",
            "from-[#f8b89a] to-[#f5a089]",
            "from-[#f5a089] to-[#f28b7d]",
            "from-[#f28b7d] to-[#ef7872]",
            "from-[#ef7872] to-[#ec6569]",
            "from-[#ec6569] to-[#e95260]",
          ];
          setDisplayBlocks(latest.map((b: any, i: number) => ({
            id: `#${b.height}`,
            gradient: gradients[i % gradients.length]
          })));
        }
      } catch (e) {
        console.error("Failed to fetch blocks for visualizer:", e);
      }
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-2">
      <div className="container px-4">
        <h2 className="text-base font-semibold text-foreground mb-1">Blockchain</h2>
      </div>
      <div className="relative">
        {/* Connecting line behind blocks */}
        <div className="absolute top-12 left-0 right-0 h-0.5 bg-border lg:mx-auto lg:max-w-[1400px]" />
        
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide relative lg:justify-center lg:overflow-x-visible"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayBlocks.map((block) => (
            <div key={block.id} className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${block.gradient} shadow-sm transition-transform hover:scale-105 duration-300`}
              />
              <span className="mt-2 text-sm text-muted-foreground font-mono">{block.id}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlockchainBlocks;
