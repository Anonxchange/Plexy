import React from "react";
import { Link } from "wouter";
import { ArrowDown } from "lucide-react";
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
  logoBg: string;
  title: string;
  subtitle: string;
  amount: string;
  amountColor: string;
}

function NotifCard({ logo, logoBg, title, subtitle, amount, amountColor }: NotifCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl backdrop-blur-xl shadow-2xl px-4 py-3 min-w-[200px] max-w-[230px] border border-white/25"
      style={{ background: "rgba(255,255,255,0.18)" }}>
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: logoBg }}
      >
        <img
          src={logo}
          alt=""
          className="w-6 h-6 object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{title}</p>
        <p className="text-[10px] text-white/60 mt-0.5">{subtitle}</p>
      </div>
      <span className="text-[12px] font-bold flex-shrink-0" style={{ color: amountColor }}>
        {amount}
      </span>
    </div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <section
      className="relative overflow-hidden bg-background flex flex-col lg:flex-row lg:items-stretch min-h-screen lg:min-h-0"
    >

      {/* ══════════════════════════════════════════
          DESKTOP ONLY — ambient background decorators
          ══════════════════════════════════════════ */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            top: "-80px", left: "-80px",
            width: "520px", height: "520px",
            background: "radial-gradient(circle, rgba(180,242,46,0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            bottom: "-60px", left: "30%",
            width: "360px", height: "360px",
            background: "radial-gradient(circle, rgba(180,242,46,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════
          MOBILE ONLY — subtle lime glow
          ══════════════════════════════════════════ */}
      <div
        className="lg:hidden absolute pointer-events-none"
        style={{
          top: "5%", left: "50%", transform: "translateX(-50%)",
          width: "60%", height: "40%",
          background: "radial-gradient(ellipse at center, rgba(180,242,46,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ══════════════════════════════════════════
          CONTENT COLUMN
          ══════════════════════════════════════════ */}
      <div
        className={[
          "relative z-10",
          "flex flex-col items-center text-center px-5 pt-6 pb-10",
          "lg:flex-none lg:w-[52%] lg:flex lg:flex-col",
          "lg:items-start lg:text-left lg:px-20 lg:pt-10 lg:pb-10 lg:justify-center",
        ].join(" ")}
      >
        {/* Trust badge */}
        <div
          className="inline-flex items-center gap-1 rounded-full px-1 py-1 mb-7 lg:mb-4
                     border border-foreground/15 bg-background"
        >
          <span className="text-[11px] font-medium text-foreground px-2.5">
            {t('hero.trust_badge')}
          </span>
          <span className="rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-foreground/60 whitespace-nowrap">
            {t('hero.trust_since')}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-black uppercase tracking-tight leading-[0.9] text-foreground mb-5 lg:mb-3 max-w-3xl lg:max-w-xl break-words"
          style={{ fontSize: "clamp(2.4rem, 6.4vw, 5rem)" }}
        >
          <span className="block">{t('hero.headline_line1')}</span>
          <span className="block">{t('hero.headline_line2')}</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(90deg, #B4F22E 10%, #78d900 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t('hero.headline_line3')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md mb-9 lg:mb-5 font-medium">
          {t('hero.subtitle')}
        </p>

        {/* CTA */}
        <Link href="/signup">
          <button
            className="inline-flex items-center gap-2.5 font-black uppercase tracking-wide text-black rounded-full px-9 py-4 text-sm transition-all hover:scale-[1.03] active:scale-[0.97] mb-10 lg:mb-6"
            style={{ background: "#B4F22E", boxShadow: "0 4px 36px rgba(180,242,46,0.42)" }}
          >
            {t('hero.cta')}
            <ArrowDown className="w-4 h-4" strokeWidth={3} />
          </button>
        </Link>

        {/* Brand logos strip */}
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
      <div className="lg:hidden relative flex-1 min-h-[280px]">
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, hsl(var(--background)), transparent)",
          }}
        />

        <picture>
          {/*
           * Responsive srcset — browser picks the smallest variant that covers
           * the rendered width (100vw on mobile). Saves ~25 KiB on phones vs
           * serving the full 1408-px master.
           */}
          <source
            type="image/webp"
            srcSet="/hero-bg-640.webp 640w, /hero-bg-1024.webp 1024w, /hero-bg.webp 1408w"
            sizes="100vw"
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

        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none w-16"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-0 z-10 pointer-events-none w-16"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }}
        />

        <div className="absolute z-20 hidden sm:block" style={{ bottom: "20%", left: "5%" }}>
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBg="#F7931A"
            title={t('hero.notif_crypto_received')}
            subtitle={t('hero.notif_2min')}
            amount="+0.042 BTC"
            amountColor="#18A349"
          />
        </div>

        <div className="absolute z-20 hidden sm:block" style={{ bottom: "6%", right: "5%" }}>
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBg="#E50914"
            title={t('hero.notif_payment_success')}
            subtitle={t('hero.notif_5min')}
            amount="-$15.99"
            amountColor="#F97316"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP ONLY — right image panel
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-1 lg:relative lg:overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: "140px",
            background: "linear-gradient(to right, hsl(var(--background)), transparent)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, hsl(var(--background)), transparent)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to top, hsl(var(--background)), transparent)",
          }}
        />

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
            sizes="50vw"
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

        <div className="absolute z-20" style={{ bottom: "30%", right: "8%" }}>
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBg="#F7931A"
            title={t('hero.notif_crypto_received')}
            subtitle={t('hero.notif_2min')}
            amount="+0.042 BTC"
            amountColor="#18A349"
          />
        </div>

        <div className="absolute z-20" style={{ bottom: "12%", right: "22%" }}>
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBg="#E50914"
            title={t('hero.notif_payment_success')}
            subtitle={t('hero.notif_5min')}
            amount="-$15.99"
            amountColor="#F97316"
          />
        </div>
      </div>

    </section>
  );
}
