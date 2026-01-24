import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import testimonial1 from "@assets/generated_images/IMG_3814.webp";
import testimonial2 from "@assets/generated_images/IMG_3815.webp";
import testimonial3 from "@assets/generated_images/IMG_3816.webp";
import testimonial4 from "@assets/generated_images/IMG_3810.webp";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Entrepreneur",
    image: testimonial1,
    content:
      "Trading Bitcoin has allowed me to earn an independent income and reach goals in my life. I now own a car, bought a piece of land, and upgraded my business.",
  },
  {
    name: "Michael Chen",
    role: "Trader",
    image: testimonial2,
    content:
      "Before Bitcoin, sending money internationally was almost impossible because of high fees. Now with Pexly I just send Bitcoin instantly and for free.",
  },
  {
    name: "Maria Rodriguez",
    role: "Business Owner",
    image: testimonial3,
    content:
      "I store my earnings in BTC because banks are becoming unreliable. It's very safe for me to keep them in this form using online wallets like Pexly.",
  },
  {
    name: "Ahmed Hassan",
    role: "NGO Director",
    image: testimonial4,
    content:
      "Before Bitcoin, we were losing 15-20% of donations to fees. Now we went from losing 15% of all donations to gaining 2% through crypto trading.",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Helper to get responsive image paths
  const getResponsiveSrcSet = (imageName) => {
    const base = imageName.replace(".webp", "");
    return `
      ${base}-276w.webp 276w,
      ${base}-553w.webp 553w,
      ${base}-1106w.webp 1106w
    `;
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Real users. Real stories.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn how Pexly is changing the lives of thousands across the globe
          </p>
        </div>

        {/* Desktop: Horizontal Scroll */}
        <div className="hidden md:block relative">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 snap-x snap-mandatory">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-center"
              >
                <Card className="h-full bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/15 dark:hover:bg-white/10 transition-all duration-300">
                  <CardContent className="pt-6 space-y-6 h-full flex flex-col">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white/20">
                        <AvatarImage
                          src={testimonial.image}
                          srcSet={getResponsiveSrcSet(testimonial.image)}
                          sizes="(max-width: 600px) 276px, 553px"
                          alt={testimonial.name}
                        />
                        <AvatarFallback>
                          {testimonial.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <Quote className="h-8 w-8 text-primary/40 mb-3" />
                      <p className="text-muted-foreground italic leading-relaxed">
                        "{testimonial.content}"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Carousel with Navigation */}
        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2">
                  <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20">
                    <CardContent className="pt-6 space-y-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-white/20">
                          <AvatarImage
                            src={testimonial.image}
                            srcSet={getResponsiveSrcSet(testimonial.image)}
                            sizes="(max-width: 600px) 276px, 553px"
                            alt={testimonial.name}
                          />
                          <AvatarFallback>
                            {testimonial.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-foreground">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        </div>
                      </div>

                      <div>
                        <Quote className="h-8 w-8 text-primary/40 mb-3" />
                        <p className="text-muted-foreground italic leading-relaxed">
                          "{testimonial.content}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full bg-black dark:bg-white text-white dark:text-black border-0 h-14 w-14 hover:bg-black/80 dark:hover:bg-white/80"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full bg-black dark:bg-white text-white dark:text-black border-0 h-14 w-14 hover:bg-black/80 dark:hover:bg-white/80"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
