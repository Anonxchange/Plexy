
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
        transform: "translateX(-50%) translateY(-20px) scale(1.1) rotateY(0deg) translateZ(50px)",
        opacity: 1,
        zIndex: 30,
        left: "50%",
      };
    }

    // Right card
    if (position === 1) {
      return {
        transform: "translateX(-50%) translateY(10px) scale(0.85) rotateY(-12deg) translateZ(0px) translateX(280px)",
        opacity: 1,
        zIndex: 20,
        left: "50%",
      };
    }

    // Left card
    return {
      transform: "translateX(-50%) translateY(10px) scale(0.85) rotateY(12deg) translateZ(0px) translateX(-280px)",
      opacity: 1,
      zIndex: 10,
      left: "50%",
    };
  };

  return (
    <section className="relative py-12 md:py-20 w-full overflow-visible px-4">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Curved Background Container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 900 500"
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(79, 172, 254, 0.1)" />
                <stop offset="50%" stopColor="rgba(0, 242, 254, 0.15)" />
                <stop offset="100%" stopColor="rgba(79, 172, 254, 0.1)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Main curved path */}
            <path
              d="M 100 300 Q 450 150 800 300"
              fill="url(#curveGradient)"
              stroke="rgba(79, 172, 254, 0.3)"
              strokeWidth="2"
              filter="url(#glow)"
            />
            {/* Bottom curve for depth */}
            <path
              d="M 100 320 Q 450 170 800 320"
              fill="none"
              stroke="rgba(79, 172, 254, 0.15)"
              strokeWidth="1"
              strokeDasharray="10,5"
            />
          </svg>
        </div>

        {/* Cards Container */}
        <div
          className="relative w-full"
          style={{ 
            perspective: "2500px", 
            perspectiveOrigin: "center center",
            height: "auto",
            minHeight: "500px"
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
                  className="absolute top-1/2 -translate-y-1/2 w-[200px] sm:w-[220px] md:w-[260px] lg:w-[280px]"
                  style={{
                    ...style,
                    transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <div 
                    className={`
                      flex flex-col space-y-3 
                      ${isCenter ? 'drop-shadow-2xl' : 'drop-shadow-lg'}
                    `}
                    style={{
                      filter: isCenter 
                        ? 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))' 
                        : 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.15))',
                    }}
                  >
                    {/* Image container with border and glow */}
                    <div 
                      className={`
                        relative overflow-hidden rounded-2xl w-full
                        ${isCenter ? 'ring-2 ring-primary/20' : ''}
                      `}
                      style={{
                        boxShadow: isCenter 
                          ? '0 0 40px rgba(79, 172, 254, 0.3), 0 20px 60px rgba(0, 0, 0, 0.3)' 
                          : '0 10px 30px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto object-cover"
                        loading="eager"
                      />
                      {/* Glossy overlay for premium look */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"
                      />
                    </div>

                    {/* Content below image - only visible on center card */}
                    <div 
                      className={`
                        space-y-2 px-1 transition-all duration-700
                        ${isCenter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                      `}
                    >
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight text-center px-2">
                        {feature.title}
                      </h3>

                      <Button
                        className="w-full bg-primary hover:opacity-90 text-black font-semibold shadow-xl hover:shadow-2xl transition-all text-sm"
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

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8">
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
    </section>
  );
}
