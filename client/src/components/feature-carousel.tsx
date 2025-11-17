import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: 1,
    image: "/assets/IMG_1820.jpeg",
    title: "Secure Wallet. Your keys, your crypto.",
    buttonText: "Create Wallet",
  },
  {
    id: 2,
    image: "/assets/IMG_1821.jpeg",
    title: "Live crypto. Pay anywhere. Get 10% back.",
    buttonText: "Get My Card",
  },
  {
    id: 3,
    image: "/assets/IMG_1824.jpeg",
    title: "Refer friends. Earn crypto rewards.",
    buttonText: "Start Earning",
  },
];

export function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (index: number) => {
    const position = (index - currentIndex + features.length) % features.length;
    
    // Center card (position 0)
    if (position === 0) {
      return {
        transform: "translateX(-50%) translateZ(0px) scale(1) rotateY(0deg)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
      };
    }
    
    // Right card (position 1)
    if (position === 1) {
      return {
        transform: "translateX(-50%) translateZ(-150px) scale(0.85) rotateY(-25deg) translateX(280px)",
        opacity: 0.85,
        zIndex: 20,
        left: "50%",
      };
    }
    
    // Left card (position 2)
    return {
      transform: "translateX(-50%) translateZ(-150px) scale(0.85) rotateY(25deg) translateX(-280px)",
      opacity: 0.85,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative h-[600px] w-full overflow-hidden px-4 md:h-[650px]">
      <div
        className="relative h-full w-full"
        style={{
          perspective: "2000px",
          perspectiveOrigin: "center center",
        }}
      >
        {features.map((feature, index) => {
          const style = getCardStyle(index);
          return (
            <div
              key={feature.id}
              className="absolute top-1/2 w-[280px] -translate-y-1/2 sm:w-[320px] md:w-[360px]"
              style={{
                ...style,
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="flex flex-col space-y-4">
                {/* Image container */}
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-[220px] sm:h-[260px] object-contain"
                    loading="eager"
                  />
                </div>

                {/* Content below image */}
                <div className="space-y-3 px-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                    {feature.title}
                  </h3>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    size="default"
                  >
                    {feature.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Gradient fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent md:w-48"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent md:w-48"></div>
    </section>
  );
}
