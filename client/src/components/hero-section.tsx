import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

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
    <div className="flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl px-4 py-3 min-w-[200px] max-w-[230px]">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ background: logoBg }}
      >
        <img src={logo} alt="" className="w-6 h-6 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">{title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
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
      className="relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(175deg, #1b5c78 0%, #0d3347 38%, #07192a 100%)",
      }}
    >
      {/* Subtle lime glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0%", left: "25%",
          width: "50%", height: "60%",
          background: "radial-gradient(ellipse at center, rgba(180,242,46,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Split layout container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center min-h-screen gap-10 lg:gap-0 pt-10 lg:pt-0">

        {/* ── LEFT: Text content ── */}
        <div className="flex-1 flex flex-col items-start text-left py-10 lg:py-24 lg:pr-10">

          {/* Trust pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["Non-Custodial", "Decentralized", "14M+ Users"].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border border-white/15 text-white/55"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {label === "Non-Custodial" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                )}
                {label}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h1
            className="font-black uppercase tracking-tight leading-[0.9] text-white mb-5 max-w-xl"
            style={{ fontSize: "clamp(2.8rem, 5.5vw, 5.2rem)" }}
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
          <p className="text-white/50 text-base lg:text-lg leading-relaxed max-w-sm mb-8 font-medium">
            Buy, swap and spend crypto at top merchants worldwide — you always hold your keys.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Link href="/signup">
              <button
                className="inline-flex items-center gap-2.5 font-black uppercase tracking-wide text-black rounded-full px-8 py-4 text-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "#B4F22E", boxShadow: "0 4px 36px rgba(180,242,46,0.42)" }}
              >
                Get started
                <ArrowRight className="w-4 h-4" strokeWidth={3} />
              </button>
            </Link>
            <Link href="/market">
              <button className="inline-flex items-center gap-2 font-bold text-white/70 hover:text-white text-sm transition-colors px-2">
                Explore market →
              </button>
            </Link>
          </div>

          {/* Brand logos strip */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Spend at 500+ merchants
            </p>
            <div className="flex flex-wrap gap-2.5">
              {BRANDS.map((b) => (
                <div
                  key={b.name}
                  className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 transition-transform hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                  title={b.name}
                >
                  <img src={b.logo} alt={b.name} className="w-5 h-5 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Visual ── */}
        <div className="flex-1 relative flex items-center justify-center w-full lg:h-screen max-h-[700px] lg:max-h-none">

          {/* Glow behind image */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(180,242,46,0.08) 0%, transparent 70%)",
            }}
          />

          {/* Hero image */}
          <img
            src="/hero-bg.webp"
            alt=""
            aria-hidden="true"
            className="relative z-10 w-full h-full object-cover object-center rounded-2xl"
            fetchPriority="high"
            decoding="async"
          />

          {/* Notification card — left */}
          <div className="absolute z-20 hidden lg:block" style={{ bottom: "28%", left: "-2%" }}>
            <NotifCard
              logo="/logos/brands/bitcoin.svg"
              logoBg="#F7931A"
              title="Crypto received"
              subtitle="2 min ago"
              amount="+0.042 BTC"
              amountColor="#18A349"
            />
          </div>

          {/* Notification card — right */}
          <div className="absolute z-20 hidden lg:block" style={{ bottom: "12%", right: "-2%" }}>
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

      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "120px",
          background: "linear-gradient(to bottom, transparent, #07192a)",
        }}
      />
    </section>
  );
}
