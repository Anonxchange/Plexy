import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const features = [
  { id: 1, image: "/assets/IMG_1820.jpeg", title: "Secure Wallet. Your keys, your crypto.", buttonText: "Create Wallet" },
  { id: 2, image: "/assets/IMG_1821.jpeg", title: "Live crypto. Pay anywhere. Get 10% back.", buttonText: "Get My Card" },
  { id: 3, image: "/assets/IMG_1824.jpeg", title: "Refer friends. Earn crypto rewards.", buttonText: "Start Earning" },
];

export function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % features.length), 3500);
    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (index: number) => {
    const position = (index - currentIndex + features.length) % features.length;

    if (position === 0) return {
      transform: "translateX(-50%) translateZ(0px) scale(1) rotateY(0deg)",
      opacity: 1,
      zIndex: 30,
      left: "50%",
    };
    if (position === 1) return {
      transform: "translateX(-50%) translateZ(-100px) scale(0.85) rotateY(-20deg) translateX(220px)",
      opacity: 1,
      zIndex: 20,
      left: "50%",
    };
    return {
      transform: "translateX(-50%) translateZ(-100px) scale(0.85) rotateY(20deg) translateX(-220px)",
      opacity: 1,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative w-full px-4 py-8 md:py-12">
      <div className="relative w-full h-[480px] md:h-[520px]" style={{ perspective: "2000px", perspectiveOrigin: "center center" }}>
        {features.map((feature, index) => {
          const style = getCardStyle(index);
          const isFront = (index - currentIndex + features.length) % features.length === 0;
          return (
            <div
              key={feature.id}
              className="absolute top-1/2 -translate-y-1/2 w-[280px] sm:w-[320px] md:w-[360px]"
              style={{ ...style, transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <div className="flex flex-col rounded-2xl overflow-hidden shadow-lg bg-background">
                <img src={feature.image} alt={feature.title} className="w-full h-[200px] sm:h-[240px] md:h-[260px] object-cover" loading="eager" />
                {isFront && (
                  <div className="p-3 sm:p-4 flex flex-col space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">{feature.title}</h3>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300" size="default">
                      {feature.buttonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gradient edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent"></div>
    </section>
  );
}