import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CryptoCard } from "./crypto-card";

const cards = [
  {
    title: "Pexly",
    value: "2,000,000",
    image: "/assets/IMG_1820.jpeg",
    variant: "lemon" as const,
  },
  {
    title: "Pexly",
    value: "1,500,000",
    image: "/assets/IMG_1821.jpeg",
    variant: "black" as const,
  },
  {
    title: "Pexly",
    value: "3,250,000",
    image: "/assets/IMG_1824.jpeg",
    variant: "default" as const,
  },
  {
    title: "Pexly",
    value: "2,000,000",
    image: "/assets/IMG_1820.jpeg",
    variant: "lemon" as const,
  },
  {
    title: "Pexly",
    value: "1,500,000",
    image: "/assets/IMG_1821.jpeg",
    variant: "black" as const,
  },
];

export function FeatureCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });

  const autoplayRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = () => {
      emblaApi.scrollNext();
    };

    autoplayRef.current = setInterval(autoplay, 3000);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const slides = emblaApi.slideNodes();
      const selectedIndex = emblaApi.selectedScrollSnap();

      slides.forEach((slide, index) => {
        const offset = index - selectedIndex;

        // Only show 3 cards: center (0), left (-1), and right (+1)
        if (Math.abs(offset) > 1) {
          slide.style.opacity = "0";
          slide.style.pointerEvents = "none";
        } else if (offset === 0) {
          // Center card - straight, no rotation
          slide.style.transform = `
            perspective(2000px)
            rotateY(0deg)
            translateX(0px)
            translateZ(0px)
            scale(1)
          `;
          slide.style.opacity = "1";
          slide.style.pointerEvents = "auto";
          slide.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        } else {
          // Side cards - curve inward dramatically (positive rotateY for left, negative for right)
          const rotateY = offset * 45; // Increased from 35 to 45 for even stronger curve
          const translateX = offset * -50; // Increased offset
          const translateZ = -250; // Push back more for depth
          const scale = 0.8; // Smaller

          slide.style.transform = `
            perspective(2000px)
            rotateY(${rotateY}deg)
            translateX(${translateX}px)
            translateZ(${translateZ}px)
            scale(${scale})
          `;
          slide.style.opacity = "0.6";
          slide.style.pointerEvents = "auto";
          slide.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        }
      });
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="w-full py-12 md:py-20 lg:py-24 overflow-hidden relative">
      {/* Text Section */}
      <div className="text-center mb-8 md:mb-12">
       <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-3">
          Live Crypto. Pay Anywhere. Get 10% Back.
        </h2>
      </div>

      {/* Carousel */}
      <div style={{ perspective: "2000px" }}>
        <div ref={emblaRef} className="overflow-visible">
          <div 
            className="flex items-center gap-12 md:gap-16 lg:gap-20" 
            style={{ 
              transformStyle: "preserve-3d",
              paddingLeft: "calc(50% - 140px)",
              paddingRight: "calc(50% - 140px)"
            }}
          >
            {cards.map((card, index) => (
              <div 
                key={index} 
                className="flex-shrink-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                <CryptoCard {...card} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}