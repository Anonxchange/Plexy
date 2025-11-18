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
        transform: "translateX(-50%) translateY(0px) translateZ(0px) scale(1) rotateY(0deg)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
      };
    }

    if (position === 1) {
      return {
        transform: "translateX(-50%) translateY(-30px) translateZ(-100px) scale(0.85) rotateY(-15deg) translateX(240px)",
        opacity: 0.6,
        zIndex: 20,
        left: "50%",
      };
    }

    return {
      transform: "translateX(-50%) translateY(-30px) translateZ(-100px) scale(0.85) rotateY(15deg) translateX(-240px)",
      opacity: 0.6,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative py-8 w-full overflow-visible px-4">
      <div
        className="relative w-full max-w-7xl mx-auto"
        style={{ perspective: "2000px", perspectiveOrigin: "center center" }}
      >
        <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 flex-wrap md:flex-nowrap">
        {features.map((feature, index) => {
          const style = getCardStyle(index);
          const position = (index - currentIndex + features.length) % features.length;
          const isCenter = position === 0;

          return (
            <div
              key={feature.id}
              className="w-full sm:w-[45%] md:w-[30%] lg:w-[28%] max-w-[380px]"
              style={{
                ...style,
                position: 'relative',
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div className="flex flex-col space-y-4">
                {/* Image container */}
                <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-lg w-full">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>

                {/* Content below image - only visible on center card */}
                <div className={`space-y-3 px-2 transition-opacity duration-300 ${isCenter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground leading-snug text-center">
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
      </div>
    </section>
  );
}