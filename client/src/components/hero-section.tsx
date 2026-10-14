import React from "react";
import { Link } from "wouter";
import { ArrowDown } from '@/lib/icons';
import { useTranslation } from "react-i18next";

const BRANDS = [
  { name: "Netflix",      logo: "/logos/brands/netflix.svg"      },
  { name: "Amazon",       logo: "/logos/brands/amazon.svg"       },
  { name: "Spotify",      logo: "/logos/brands/spotify.svg"      },
  { name: "Apple",        logo: "/logos/brands/apple.svg"        },
  { name: "Uber",         logo: "/logos/brands/uber.svg"         },
  { name: "Airbnb",       logo: "/logos/brands/airbnb.svg"       },
  { name: "Google",       logo: "/logos/brands/google.svg"       },
  { name: "Steam",        logo: "/logos/brands/steampowered.svg" },
  { name: "Google Play",  logo: "/logos/brands/googleplay.svg"   },
  { name: "PlayStation",  logo: "/logos/brands/playstation.svg"  },
  { name: "Xbox",         logo: "/logos/brands/xbox.svg"         },
  { name: "eBay",         logo: "/logos/brands/ebay.svg"         },
  { name: "Visa",         logo: "/logos/brands/visa.svg"         },
  { name: "Mastercard",   logo: "/logos/brands/mastercard.svg"   },
];

interface NotifCardProps {
  logo: string;
  logoBgClass: string;
  title: string;
  subtitle: string;
  amount: string;
  amountClass: string;
}

function NotifCard({ logo, logoBgClass, title, subtitle, amount, amountClass }: NotifCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl backdrop-blur-xl shadow-2xl px-4 py-3 min-w-[200px] max-w-[230px] border border-white/25 bg-white/[0.18]">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${logoBgClass}`}
      >
        <img
          src={logo}
          alt=""
          className="w-6 h-6 object-contain brightness-0 invert"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{title}</p>
        <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
      </div>
      <span className={`text-[12px] font-bold flex-shrink-0 ${amountClass}`}>
        {amount}
      </span>
    </div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-background flex flex-col md:flex-row md:items-stretch min-h-screen md:min-h-0">

      {/* ══════════════════════════════════════════
          CONTENT COLUMN
          ══════════════════════════════════════════ */}
      <div
        className={[
          "relative z-10",
          "flex flex-col items-center text-center px-5 pt-6 pb-10",
          "md:flex-none md:w-[52%] md:flex md:flex-col",
          "md:items-start md:text-left md:px-20 md:pt-10 md:pb-10 md:justify-center",
        ].join(" ")}
      >
        {/* Trust badge */}
        <div
          className="inline-flex items-center gap-1 rounded-full px-1 py-1 mb-7 md:mb-4
                     border border-foreground/15 bg-background"
        >
          <span className="text-xs font-medium text-foreground px-2.5">
            {t('hero.trust_badge')}
          </span>
          <span className="rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-xs font-medium text-foreground/90 whitespace-nowrap">
            {t('hero.trust_since')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-black uppercase tracking-tight leading-[0.9] text-foreground mb-5 md:mb-3 max-w-3xl md:max-w-xl break-words text-[length:clamp(2.4rem,6.4vw,5rem)]">
          <span className="block">{t('hero.headline_line1')}</span>
          <span className="block">{t('hero.headline_line2')}</span>
          <span className="block bg-[linear-gradient(90deg,#B4F22E_10%,#78d900_100%)] bg-clip-text text-transparent">
            {t('hero.headline_line3')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mb-9 md:mb-5 font-medium">
          {t('hero.subtitle')}
        </p>

        {/* CTA */}
        <Link href="/signup">
          <button
            className="inline-flex items-center gap-2.5 font-black uppercase tracking-wide text-black rounded-full px-9 py-4 text-sm transition-all hover:scale-[1.03] active:scale-[0.97] mb-10 md:mb-6 bg-[#B4F22E] shadow-[0_4px_36px_rgba(180,242,46,0.42)]"
          >
            {t('hero.cta')}
            <ArrowDown className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
          </button>
        </Link>

        {/* Brand logos strip */}
        <div className="flex flex-col items-center gap-3 md:items-start">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t('hero.brands_label')}
          </p>
          <div className="grid grid-cols-7 gap-3">
            {BRANDS.map((b) => (
              <div
                key={b.name}
                className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-foreground/10 bg-foreground/[0.08] transition-transform hover:scale-110"
                title={b.name}
              >
                <img
                  src={b.logo}
                  alt={b.name}
                  className="w-5 h-5 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE ONLY — photo sits below the content
          ══════════════════════════════════════════ */}
      <div className="md:hidden relative flex-1 min-h-[280px]">
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-20 bg-gradient-to-b from-background to-transparent" />

        <picture>
          {/*
           * Responsive srcset — browser picks the smallest variant that covers
           * the rendered width (100vw on mobile). Saves ~25 KiB on phones vs
           * serving the full 1408-px master.
           */}
          <source
            type="image/webp"
            srcSet="/hero-bg-640.webp 640w, /hero-bg-1024.webp 1024w, /hero-bg.webp 1408w"
            sizes="(max-width: 1023px) 100vw, (max-width: 1280px) 46vw, 42vw"
          />
          <img
            src="/hero-bg.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <div className="absolute inset-y-0 left-0 z-10 pointer-events-none w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 z-10 pointer-events-none w-16 bg-gradient-to-l from-background to-transparent" />

        <div className="absolute z-20 hidden sm:block bottom-[20%] left-[5%]">
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBgClass="bg-[#F7931A]"
            title={t('hero.notif_crypto_received')}
            subtitle={t('hero.notif_2min')}
            amount="+0.042 BTC"
            amountClass="text-[#18A349]"
          />
        </div>

        <div className="absolute z-20 hidden sm:block bottom-[6%] right-[5%]">
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBgClass="bg-[#E50914]"
            title={t('hero.notif_payment_success')}
            subtitle={t('hero.notif_5min')}
            amount="-$15.99"
            amountClass="text-[#F97316]"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP ONLY — right image panel
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-1 lg:relative lg:overflow-hidden">
        <div className="absolute inset-y-0 left-0 z-10 pointer-events-none w-[140px] bg-gradient-to-r from-background to-transparent" />
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none h-20 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none h-20 bg-gradient-to-t from-background to-transparent" />

        <picture>
          {/*
           * Desktop right panel is ~50 vw wide, so sizes="50vw" lets the
           * browser pick the 1024-w variant on typical 1440-px screens (where
           * the panel is ~720 px) instead of always downloading the 1408-px
           * master. The 1408w source is kept for 4K / ultra-wide displays.
           */}
          <source
            type="image/webp"
            srcSet="/hero-bg-640.webp 640w, /hero-bg-1024.webp 1024w, /hero-bg.webp 1408w"
            sizes="(max-width: 1280px) 46vw, 42vw"
          />
          <img
            src="/hero-bg.webp"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <div className="absolute z-20 bottom-[30%] right-[8%]">
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBgClass="bg-[#F7931A]"
            title={t('hero.notif_crypto_received')}
            subtitle={t('hero.notif_2min')}
            amount="+0.042 BTC"
            amountClass="text-[#18A349]"
          />
        </div>

        <div className="absolute z-20 bottom-[12%] right-[22%]">
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBgClass="bg-[#E50914]"
            title={t('hero.notif_payment_success')}
            subtitle={t('hero.notif_5min')}
            amount="-$15.99"
            amountClass="text-[#F97316]"
          />
        </div>
      </div>

    </section>
  );
}
