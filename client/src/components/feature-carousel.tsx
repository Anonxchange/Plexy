import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: 1,
    image: "/assets/IMG_1821_1761687661785.jpeg",
    title: "Secure Wallet. Your keys, your crypto.",
    buttonText: "Create Wallet",
  },
  {
    id: 2,
    image: "/assets/IMG_1820_1761687661785.jpeg",
    title: "Live crypto. Pay anywhere. Get 10% back.",
    buttonText: "Get My Card",
  },
  {
    id: 3,
    image: "/assets/IMG_1824_1761687661785.jpeg",
    title: "Refer friends. Earn crypto rewards.",
    buttonText: "Start Earning",
  },
];

export function FeatureCarousel() {
  return (
    <section className="py-8 sm:py-12 bg-muted/30 overflow-hidden">
      <div className="relative">
        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {/* Duplicate features twice for seamless loop */}
          {[...features, ...features, ...features].map((feature, index) => (
            <div
              key={`${feature.id}-${index}`}
              className="flex-shrink-0 w-[280px] sm:w-[320px]"
            >
              <div className="group relative overflow-hidden h-[400px] sm:h-[450px]">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                  {/* Dark gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 space-y-3 z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
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
          ))}
        </div>
      </div>
    </section>
  );
}