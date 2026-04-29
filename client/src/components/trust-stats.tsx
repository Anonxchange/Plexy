import { useTranslation } from "react-i18next";

const personMeta = [
  { image: "/images/trust-person-1.webp", nameKey: "trust.p1_name", quoteKey: "trust.p1_quote", descKey: "trust.p1_desc" },
  { image: "/images/trust-person-2.webp", nameKey: "trust.p2_name", quoteKey: "trust.p2_quote", descKey: "trust.p2_desc" },
  { image: "/images/trust-person-3.webp", nameKey: "trust.p3_name", quoteKey: "trust.p3_quote", descKey: "trust.p3_desc" },
  { image: "/images/trust-person-4.webp", nameKey: "trust.p4_name", quoteKey: "trust.p4_quote", descKey: "trust.p4_desc" },
];

export const TrustStats = () => {
  const { t } = useTranslation();
  const pills = [
    t('trust.pill_e2e'),
    t('trust.pill_zk'),
    t('trust.pill_escrow'),
    t('trust.pill_bio'),
    t('trust.pill_alerts'),
  ];

  return (
    <section
      id="features"
      className="py-12 bg-primary text-primary-foreground relative overflow-hidden rounded-3xl -mt-10 z-10"
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Centre glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[96rem] mx-auto px-4 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-primary-foreground/80 text-xl md:text-2xl font-semibold mb-1">
            {t('trust.section_label')}
          </p>
          <h2 className="text-7xl md:text-8xl lg:text-9xl font-black italic leading-none tracking-tight">
            {t('trust.section_title')}
          </h2>
        </div>

        {/* FEATURE CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {personMeta.map((item, i) => {
            const name = t(item.nameKey);
            return (
              <div
                key={i}
                className="rounded-[32px] overflow-hidden relative h-[480px] lg:h-[560px] xl:h-[640px] 2xl:h-[720px]"
              >
                <img
                  src={item.image}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                <div className="absolute top-0 left-0 right-0 px-5 pt-5 z-20">
                  <p className="text-white font-semibold text-lg" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.55)" }}>
                    {name}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-6 z-20">
                  <p className="text-white font-bold text-lg leading-snug italic mb-3">
                    {t(item.quoteKey)}
                  </p>
                  <p
                    className="text-white/90 text-sm leading-relaxed"
                    style={{
                      backdropFilter: "blur(3px)",
                      WebkitBackdropFilter: "blur(3px)",
                    }}
                  >
                    {t(item.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing text block */}
        <div className="mt-10 text-center max-w-2xl mx-auto lg:max-w-4xl lg:text-left lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="lg:max-w-xl">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary-foreground leading-tight mb-4">
              {t('trust.closing_title_l1')}<br />{t('trust.closing_title_l2')}
            </h3>
            <p className="text-primary-foreground/70 text-base md:text-lg mb-5 leading-relaxed">
              {t('trust.closing_p')}
            </p>
            <p className="text-primary-foreground font-bold italic text-lg md:text-xl">
              {t('trust.closing_italic')}
            </p>
          </div>

          {/* Desktop-only feature pills */}
          <div className="hidden lg:flex flex-col gap-3 shrink-0 pb-1">
            {pills.map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/15 transition-colors rounded-xl px-4 py-3"
              >
                <div className="w-5 h-5 rounded-full bg-primary-foreground/25 flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <span className="text-primary-foreground/90 text-sm font-medium whitespace-nowrap">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
