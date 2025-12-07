
import { UserPlus, CreditCard, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up in seconds and get instant access to the global crypto marketplace.",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    icon: CreditCard,
    title: "Choose Payment Method",
    description: "Select from 500+ payment options including bank transfers, cards, and e-wallets.",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    icon: Shield,
    title: "Trade with Escrow",
    description: "Your funds are protected by our secure escrow system until trade completion.",
    gradient: "from-emerald-500 to-teal-600",
  },
];

export function HowItWorks() {
  return (
    <section className="pt-16 lg:pt-20 pb-8 bg-background overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-4 mb-8">
          <Badge className="text-sm px-4 py-2">Simple & Secure</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Platform Advantages
            <span className="text-primary">.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Security, speed, and tools designed for every trader
          </p>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative mt-12">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden lg:block"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden lg:block"></div>

          {/* Scrollable Cards */}
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide lg:justify-center px-4 lg:px-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[300px] lg:w-[340px] snap-center"
              >
                <Card className="h-full bg-gradient-to-br from-card/50 to-card border-2 border-border/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group">
                  <CardContent className="p-8 space-y-6 relative overflow-hidden h-full flex flex-col">
                    {/* Background Decoration */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity" 
                         style={{ background: `linear-gradient(to bottom right, ${step.gradient.split(' ')[1]}, ${step.gradient.split(' ')[3]})` }}></div>
                    
                    {/* Icon Container */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="h-10 w-10 text-white" />
                    </div>

                    {/* Step Number */}
                    <div className="absolute top-6 right-6 text-7xl font-bold text-muted/5 group-hover:text-muted/10 transition-colors">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="space-y-3 flex-grow">
                      <h3 className="text-2xl font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-base leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Bottom Accent */}
                    <div className={`h-1 w-full rounded-full bg-gradient-to-r ${step.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Scroll Indicator (Mobile) */}
          <div className="flex justify-center gap-2 mt-6 lg:hidden">
            {steps.map((_, index) => (
              <div
                key={index}
                className="h-1.5 w-8 rounded-full bg-muted transition-all duration-300"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
