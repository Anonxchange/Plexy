import { useTranslation } from "react-i18next";

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { iconSrc: "/svgs/step1.svg", title: t('how_it_works.step1_title'), description: t('how_it_works.step1_desc') },
    { iconSrc: "/svgs/step2.svg", title: t('how_it_works.step2_title'), description: t('how_it_works.step2_desc') },
    { iconSrc: "/svgs/step3.svg", title: t('how_it_works.step3_title'), description: t('how_it_works.step3_desc') },
  ];

  return (
    <section className="relative pt-8 lg:pt-10 pb-0 bg-background" id="how-it-works"
      style={{ backgroundImage: "linear-gradient(to bottom, hsl(var(--primary)/0.05), transparent)" }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="text-center space-y-6 mb-12">
          <span className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors border-transparent bg-primary text-primary-foreground">
            {t('how_it_works.badge')}
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            {t('how_it_works.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('how_it_works.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative hover-elevate border-2 shadow-xl rounded-xl pt-16 pb-10 text-center space-y-6 bg-card">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <img
                  src={step.iconSrc}
                  alt={step.title}
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                  decoding="async"
                  width={32}
                  height={32}
                />
              </div>
              <span className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/10" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
