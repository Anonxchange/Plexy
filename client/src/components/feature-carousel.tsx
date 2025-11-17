import { Card } from "@/components/ui/card";
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
  return (
    <section className="overflow-hidden relative">
      <div className="flex gap-4 w-max animate-scroll">
        {[...features, ...features, ...features].map((feature, index) => (
          <div
            key={`${feature.id}-${index}`}
            className="flex-shrink-0 w-[280px] sm:w-[320px] group relative overflow-hidden h-[300px] sm:h-[350px] transform transition-transform duration-500 hover:scale-105"
          >
            {/* Background Image */}
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-full object-cover"
              loading="eager"
            />

            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

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
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${features.length * 324}px); /* width + gap of one set */
          }
        }
        .animate-scroll {
          display: flex;
          gap: 16px;
          animation: scroll ${features.length * 6}s linear infinite;
        }
      `}</style>
    </section>
  );
}