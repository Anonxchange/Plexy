import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import testimonial1 from "@assets/generated_images/Female_entrepreneur_testimonial_portrait_ea102c07.png";
import testimonial2 from "@assets/generated_images/Male_trader_testimonial_portrait_db84c1f1.png";
import testimonial3 from "@assets/generated_images/Businesswoman_testimonial_portrait_0bf0f886.png";
import testimonial4 from "@assets/generated_images/Entrepreneur_testimonial_portrait_bcaca431.png";

//todo: remove mock functionality
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Entrepreneur",
    image: testimonial1,
    content: "Trading Bitcoin has allowed me to earn an independent income and reach goals in my life. I now own a car, bought a piece of land, and upgraded my business.",
  },
  {
    name: "Michael Chen",
    role: "Trader",
    image: testimonial2,
    content: "Before Bitcoin, sending money internationally was almost impossible because of high fees. Now with Pexly I just send Bitcoin instantly and for free.",
  },
  {
    name: "Maria Rodriguez",
    role: "Business Owner",
    image: testimonial3,
    content: "I store my earnings in BTC because banks are becoming unreliable. It's very safe for me to keep them in this form using online wallets like Pexly.",
  },
  {
    name: "Ahmed Hassan",
    role: "NGO Director",
    image: testimonial4,
    content: "Before Bitcoin, we were losing 15-20% of donations to fees. Now we went from losing 15% of all donations to gaining 2% through crypto trading.",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Real users. Real stories.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn how Pexly is changing the lives of thousands across the globe
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate">
              <CardContent className="pt-6 space-y-4">
                <Quote className="h-8 w-8 text-primary/40" />
                <p className="text-muted-foreground italic">{testimonial.content}</p>
                <div className="flex items-center gap-3 pt-4">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
