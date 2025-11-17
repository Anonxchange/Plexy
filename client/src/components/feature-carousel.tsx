import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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
  const [order, setOrder] = useState([0, 1, 2]); // track which card is front

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder((prev) => {
        const newOrder = [prev[2], prev[0], prev[1]]; // rotate right
        return newOrder;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="overflow-hidden relative w-full max-w-[600px] mx-auto">
      <div className="relative h-[350px] sm:h-[400px] flex justify-center items-center">
        {order.map((cardIndex, position) => {
          const feature = features[cardIndex];

          // Determine style based on position
          let scale = 0.85;
          let opacity = 0.5;
          let zIndex = 1;
          let translateX = 0;

          if (position === 1) {
            scale = 1;
            opacity = 1;
            zIndex = 3;
            translateX = 0;
          } else if (position === 0) {
            translateX = -100;
            zIndex = 2;
          } else if (position === 2) {
            translateX = 100;
            zIndex = 2;
          }

          return (
            <div
              key={feature.id}
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                opacity,
                zIndex,
              }}
            >
              <div className="w-[280px] sm:w-[320px] h-[300px] sm:h-[350px] rounded-xl overflow-hidden relative">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white z-10 space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold">{feature.title}</h3>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    {feature.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}