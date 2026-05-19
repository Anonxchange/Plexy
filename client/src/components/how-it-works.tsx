import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { iconSrc: "/svgs/step1.svg", title: t('how_it_works.step1_title'), description: t('how_it_works.step1_desc') },
    { iconSrc: "/svgs/step2.svg", title: t('how_it_works.step2_title'), description: t('how_it_works.step2_desc') },
    { iconSrc: "/svgs/step3.svg", title: t('how_it_works.step3_title'), description: t('how_it_works.step3_desc') },
  ];

  return (
    <section className="relative pt-8 lg:pt-10 pb-0 bg-background" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" style={{ willChange: 'transform' }}></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 relative">
        <div className="text-center space-y-6 mb-12">
          <Badge className="text-sm px-4 py-2">{t('how_it_works.badge')}</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t('how_it_works.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('how_it_works.subtitle')}
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
