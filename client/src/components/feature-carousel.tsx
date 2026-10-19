import { useTranslation } from "react-i18next";

export function FeatureCarousel() {
  const { t } = useTranslation();
  return (
    <section className="w-full py-12 lg:py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">

          {/* LEFT: floating tiles with the checkout card centered on top */}
          <div className="relative mx-auto w-full max-w-[640px] aspect-[800/768]">
            <img
              src="/assets/feature-tiles.png"
              alt=""
              aria-hidden="true"
              width="800"
              height="768"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <img
              src="/assets/feature-checkout.png"
              alt={t("feature.title_line1")}
              width="800"
              height="638"
              loading="lazy"
              className="absolute left-[18%] top-[21%] w-[66%] h-auto rounded-xl shadow-2xl ring-1 ring-black/5"
            />
          </div>

          {/* RIGHT: text */}
          <div className="text-left space-y-6 lg:pl-8">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {t("feature.title_line1")} <br />
              <span className="text-green-800 dark:text-primary">{t("feature.title_line2")}</span> <br />
              {t("feature.title_line3")}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t("feature.subtitle")}
            </p>

            <button className="rounded-none border border-gray-300 bg-gray-200 px-8 py-3 text-base font-semibold tracking-wide text-gray-900 transition-colors hover:bg-gray-300 active:bg-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
              {t("feature.cta")}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
