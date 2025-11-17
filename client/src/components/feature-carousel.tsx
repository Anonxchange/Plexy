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

    if (position === 0) {
      return {
        transform: "translateX(-50%) translateZ(0px) scale(1) rotateY(0deg)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
      };
    }

    if (position === 1) {
      return {
        transform: "translateX(-50%) translateZ(-100px) scale(0.85) rotateY(-20deg) translateX(220px)",
        opacity: 0.85,
        zIndex: 20,
        left: "50%",
      };
    }

    return {
      transform: "translateX(-50%) translateZ(-100px) scale(0.85) rotateY(20deg) translateX(-220px)",
      opacity: 0.85,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative w-full px-4 py-8 md:py-12">
      <div
        className="relative w-full flex justify-center items-end"
        style={{ perspective: "2000px", perspectiveOrigin: "center bottom" }}
      >
        {features.map((feature, index) => {
          const style = getCardStyle(index);
          return (
            <div
              key={feature.id}
              className="absolute bottom-0 w-64 sm:w-72 md:w-80 lg:w-96"
              style={{
                ...style,
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="flex flex-col bg-background rounded-2xl shadow-lg overflow-hidden">
                {/* Image */}
                <div className="w-full h-48 sm:h-56 md:h-64 lg:h-72">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                {/* Text & Button */}
                <div className="p-4 flex flex-col space-y-3">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground leading-snug">
                    {feature.title}
                  </h3>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300"
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
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent"></div>
    </section>
  );
}