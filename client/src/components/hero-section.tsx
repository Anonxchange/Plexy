import React from "react";
import { Link } from "wouter";
import { ArrowDown } from "lucide-react";

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
  return (
    <section
      className="relative overflow-hidden bg-background flex flex-col lg:flex-row lg:items-stretch"
      style={{ minHeight: "100vh" }}
    >

      {/* ══════════════════════════════════════════
          DESKTOP ONLY — ambient background decorators
          (no full-bleed image; split layout instead)
          ══════════════════════════════════════════ */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
        {/* Lime accent glow — upper left, behind the text */}
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            top: "-80px", left: "-80px",
            width: "520px", height: "520px",
            background: "radial-gradient(circle, rgba(180,242,46,0.10) 0%, transparent 70%)",
          }}
        />
        {/* Soft glow near bottom-center */}
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
          Mobile: centered, full-width
          Desktop: left column (~52%), vertically centered
          ══════════════════════════════════════════ */}
      <div
        className={[
          "relative z-10",
          /* mobile */
          "flex flex-col items-center text-center px-5 pt-6 pb-10",
          /* desktop: left column */
          "lg:flex-none lg:w-[52%] lg:flex lg:flex-col",
          "lg:items-start lg:text-left lg:px-20 lg:py-24 lg:justify-center",
        ].join(" ")}
      >
        {/* Trust badge */}
        <div
          className="inline-flex items-center gap-1 rounded-full px-1 py-1 mb-7
                     border border-foreground/15 bg-background"
        >
          <span className="text-[11px] font-medium text-foreground px-2.5">
            Trusted by millions of customers
          </span>
          <span className="rounded-full bg-foreground/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-foreground/60 whitespace-nowrap">
            Since 2022
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-black uppercase tracking-tight leading-[0.9] text-foreground mb-5 max-w-3xl lg:max-w-xl"
          style={{ fontSize: "clamp(2.6rem, 7.5vw, 5.8rem)" }}
        >
          <span className="block">Your crypto,</span>
          <span className="block">minus the</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(90deg, #B4F22E 10%, #78d900 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            middleman.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-md mb-9 font-medium">
          Buy, swap and spend crypto at top merchants worldwide — you always hold your keys.
        </p>

        {/* CTA */}
        <Link href="/signup">
          <button
            className="inline-flex items-center gap-2.5 font-black uppercase tracking-wide text-black rounded-full px-9 py-4 text-sm transition-all hover:scale-[1.03] active:scale-[0.97] mb-10"
            style={{ background: "#B4F22E", boxShadow: "0 4px 36px rgba(180,242,46,0.42)" }}
          >
            Get started
            <ArrowDown className="w-4 h-4" strokeWidth={3} />
          </button>
        </Link>

        {/* Brand logos strip */}
        <div className="flex flex-col items-center gap-3 lg:items-start">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Spend at 500+ merchants
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
        {/* Gradient blend from background into photo */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, hsl(var(--background)), transparent)",
          }}
        />

        <picture>
          <source srcSet="/hero-bg.webp" type="image/webp" />
          <img
            src="/hero-bg.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Side vignettes using background color gradients */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none w-16"
          style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-0 z-10 pointer-events-none w-16"
          style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }}
        />

        {/* Notification card — bottom left */}
        <div className="absolute z-20 hidden sm:block" style={{ bottom: "20%", left: "5%" }}>
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBg="#F7931A"
            title="Crypto received"
            subtitle="2 min ago"
            amount="+0.042 BTC"
            amountColor="#18A349"
          />
        </div>

        {/* Notification card — bottom right */}
        <div className="absolute z-20 hidden sm:block" style={{ bottom: "6%", right: "5%" }}>
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBg="#E50914"
            title="Payment successful"
            subtitle="5 min ago"
            amount="-$15.99"
            amountColor="#F97316"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP ONLY — right image panel
          ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-1 lg:relative lg:overflow-hidden">
        {/* Left-edge fade — blends the image into the background */}
        <div
          className="absolute inset-y-0 left-0 z-10 pointer-events-none"
          style={{
            width: "140px",
            background: "linear-gradient(to right, hsl(var(--background)), transparent)",
          }}
        />
        {/* Top-edge fade */}
        <div
          className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to bottom, hsl(var(--background)), transparent)",
          }}
        />
        {/* Bottom-edge fade */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          style={{
            height: "80px",
            background: "linear-gradient(to top, hsl(var(--background)), transparent)",
          }}
        />

        {/* Hero image — fills the right panel */}
        <picture>
          <source srcSet="/hero-bg.webp" type="image/webp" />
          <img
            src="/hero-bg.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        {/* Notification card — upper area of image */}
        <div className="absolute z-20" style={{ bottom: "30%", right: "8%" }}>
          <NotifCard
            logo="/logos/brands/bitcoin.svg"
            logoBg="#F7931A"
            title="Crypto received"
            subtitle="2 min ago"
            amount="+0.042 BTC"
            amountColor="#18A349"
          />
        </div>

        {/* Notification card — lower area of image */}
        <div className="absolute z-20" style={{ bottom: "12%", right: "22%" }}>
          <NotifCard
            logo="/logos/brands/netflix.svg"
            logoBg="#E50914"
            title="Payment successful"
            subtitle="5 min ago"
            amount="-$15.99"
            amountColor="#F97316"
          />
        </div>
      </div>

    </section>
  );
}
