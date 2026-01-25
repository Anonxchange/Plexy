import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    iconSrc: "https://raw.githubusercontent.com/Anonxchange/Plexy/refs/heads/main/client/src/assets/svg-image-1%206.svg",
    title: "Create Your Account",
    description: "Sign up in seconds and get instant access to the global crypto marketplace.",
  },
  {
    iconSrc: "https://raw.githubusercontent.com/Anonxchange/Plexy/refs/heads/main/client/src/assets/svg-image-1%205.svg",
    title: "Choose Payment Method",
    description: "Select from 500+ payment options including bank transfers, cards, and e-wallets.",
  },
  {
    iconSrc: "https://raw.githubusercontent.com/Anonxchange/Plexy/refs/heads/main/client/src/assets/svg-image-1%208.svg",
    title: "Trade with Smart Contract Protection",
    description: "Your transaction is secured by automated smart contracts until both parties complete the trade.",
  },
];

export function HowItWorks() {
  return (
    <section className="pt-8 lg:pt-10 pb-0 bg-background" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="text-center space-y-6 mb-12">
          <Badge className="text-sm px-4 py-2">Simple & Secure</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Start trading cryptocurrency in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <Card key={index} className="relative hover-elevate border-2 shadow-xl">
              <CardContent className="pt-16 pb-10 text-center space-y-6">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <img
                      src={step.iconSrc}
                      alt={step.title}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="absolute top-4 right-4 text-6xl font-bold text-muted/10">
                  {index + 1}
                </div>

                <h3 className="text-2xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}