
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
    <section className="py-16 lg:py-24 bg-background overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <Badge className="text-sm px-4 py-2">Simple & Secure</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground">
            Platform Advantages
            <span className="text-primary">.</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
            Security, speed, and tools designed for every trader
          </p>
        </div>

        {/* Cards Container */}
        <div className="relative">
          {/* Gradient Overlays for Desktop Scroll Effect */}
          <div className="absolute left-0 top-0 bottom-0 w-16 xl:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden xl:block"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 xl:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden xl:block"></div>

          {/* Scrollable Cards - Mobile & Tablet / Grid - Desktop */}
          <div className="xl:grid xl:grid-cols-3 xl:gap-8 flex gap-6 overflow-x-auto pb-8 xl:pb-0 snap-x snap-mandatory xl:snap-none scrollbar-hide px-4 sm:px-6 xl:px-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] xl:w-auto snap-center xl:snap-align-none"
              >
                <Card className="h-full bg-gradient-to-br from-card/50 to-card border-2 border-border/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6 relative overflow-hidden h-full flex flex-col min-h-[380px] sm:min-h-[400px]">
                    {/* Background Decoration */}
                    <div 
                      className="absolute -top-20 -right-20 w-40 h-40 sm:w-48 sm:h-48 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300" 
                      style={{ background: `linear-gradient(to bottom right, ${step.gradient.split(' ')[1]}, ${step.gradient.split(' ')[3]})` }}
                    />
                    
                    {/* Icon Container */}
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <step.icon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
                    </div>

                    {/* Step Number */}
                    <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-6xl sm:text-7xl lg:text-8xl font-bold text-muted/5 group-hover:text-muted/10 transition-colors duration-300">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="space-y-3 sm:space-y-4 flex-grow z-10 relative">
                      <h3 className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold text-foreground leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Bottom Accent */}
                    <div className={`h-1 w-full rounded-full bg-gradient-to-r ${step.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Scroll Indicator (Mobile & Tablet Only) */}
          <div className="flex justify-center gap-2 mt-8 xl:hidden">
            {steps.map((_, index) => (
              <div
                key={index}
                className="h-1.5 w-8 rounded-full bg-muted/30 hover:bg-primary/50 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
