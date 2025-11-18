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
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (index: number) => {
    const position = (index - currentIndex + features.length) % features.length;

    // Center card (active)
    if (position === 0) {
      return {
        transform: "translateX(-50%) scale(1) rotateY(0deg) translateZ(60px)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
      };
    }

    // Right card - half visible
    if (position === 1) {
      return {
        transform: "translateX(20%) scale(0.75) rotateY(-20deg) translateZ(0px)",
        opacity: 0.6,
        zIndex: 20,
        left: "50%",
      };
    }

    // Left card - half visible
    return {
      transform: "translateX(-120%) scale(0.75) rotateY(20deg) translateZ(0px)",
      opacity: 0.6,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative py-3 md:py-4 w-full overflow-hidden">
      <div className="relative w-full max-w-4xl mx-auto px-4">
        {/* Unified Curved Container */}
        <div className="relative">
          {/* Cards Container */}
          <div
            className="relative w-full h-[510px] md:h-[580px]"
            style={{ 
              perspective: "2000px", 
              perspectiveOrigin: "center center"
            }}
          >
            <div className="relative w-full h-full">
              {features.map((feature, index) => {
                const style = getCardStyle(index);
                const position = (index - currentIndex + features.length) % features.length;
                const isCenter = position === 0;

                return (
                  <div
                    key={feature.id}
                    className="absolute top-1/2 -translate-y-1/2 w-[260px] sm:w-[300px] md:w-[450px]"
                    style={{
                      ...style,
                      transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <div 
                      className={`
                        flex flex-col gap-1
                        ${isCenter ? 'drop-shadow-2xl' : 'drop-shadow-md'}
                      `}
                      style={{
                        filter: isCenter 
                          ? 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))' 
                          : 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.2))',
                      }}
                    >
                      {/* Image with border and glow */}
                      <div 
                        className={`
                          relative overflow-hidden rounded-2xl
                          ${isCenter ? 'ring-2 ring-primary/30' : ''}
                        `}
                        style={{
                          boxShadow: isCenter 
                            ? '0 0 50px rgba(79, 172, 254, 0.35), 0 25px 70px rgba(0, 0, 0, 0.35)' 
                            : '0 15px 40px rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-auto object-cover"
                          loading="eager"
                        />
                        {/* Glossy overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"/>
                      </div>

                      {/* Content - only visible on center card */}
                      <div 
                        className={`
                          transition-all duration-700
                          ${isCenter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                        `}
                      >
                        <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground leading-tight text-center mb-1 px-1">
                          {feature.title}
                        </h3>

                        <Button
                          className="w-full bg-primary hover:opacity-90 text-black font-semibold shadow-xl hover:shadow-2xl transition-all text-xs sm:text-sm"
                          size="sm"
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

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-3">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${currentIndex === index ? 'w-8 bg-primary' : 'w-2 bg-primary/30 hover:bg-primary/50'}
                `}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}