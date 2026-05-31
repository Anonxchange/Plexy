import { useHead } from "@unhead/react";
import { Link } from "wouter";
import { ArrowRight, Linkedin, MapPin, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/app-footer";

/* ─────────────────────────────────────── data ── */

const stats = [
  { value: "180+",  label: "Countries supported" },
  { value: "120+",  label: "Cryptoassets listed" },
  { value: "$2.4B+",label: "Trading volume" },
  { value: "850K+", label: "Verified users" },
];

const values = [
  {
    title: "Inclusive",
    body: "To make crypto accessible to everyone, everywhere — regardless of background or technical knowledge.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-white">
        <circle cx="16" cy="10" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="26" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M29.5 22a5.5 5.5 0 00-5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Reliable",
    body: "To be as transparent and verifiable as we can. Our users trust us with their assets — we take that seriously.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-white">
        <path d="M16 3L4 8v8c0 7 5.5 12.5 12 14 6.5-1.5 12-7 12-14V8L16 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11 16l3.5 3.5L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Compliant",
    body: "To engage with regulators and operate within existing rules — building trust through clear accountability.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-white">
        <rect x="4" y="5" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12h14M9 17h14M9 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Innovative",
    body: "To push the boundaries of what a digital asset platform can be — always building for what comes next.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-white">
        <path d="M16 4a8 8 0 00-3 15.4V22h6v-2.6A8 8 0 0016 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 26h6M14 29h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const team = [
  { name: "Oluwole Olamide", role: "CEO & Co-Founder",    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
  { name: "Priya Nair",      role: "CTO & Co-Founder",    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { name: "James Whitfield", role: "Chief Risk Officer",  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" },
  { name: "Sofia Mendes",    role: "VP of Product",       img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" },
  { name: "Liam O'Brien",    role: "Head of Engineering", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80" },
  { name: "Yuki Tanaka",     role: "Head of Compliance",  img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80" },
];

const S = "currentColor";
const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: S, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "w-5 h-5" };

const services = [
  {
    label: "Spot Trading",
    tag: "120+ trading pairs, deep liquidity, real-time order books.",
    desc: "Buy and sell crypto at real-time market prices across 120+ assets.",
    icon: (
      <svg {...svgProps}>
        {/* 3 candlestick bars */}
        <line x1="5"  y1="3"  x2="5"  y2="21" strokeOpacity=".25" />
        <rect x="3.5" y="7"  width="3" height="7" rx=".6" />
        <line x1="5"  y1="5"  x2="5"  y2="7" />
        <line x1="5"  y1="14" x2="5"  y2="17" />
        <rect x="10.5" y="5" width="3" height="9" rx=".6" />
        <line x1="12" y1="3"  x2="12" y2="5" />
        <line x1="12" y1="14" x2="12" y2="16" />
        <rect x="17.5" y="9" width="3" height="6" rx=".6" />
        <line x1="19" y1="7"  x2="19" y2="9" />
        <line x1="19" y1="15" x2="19" y2="18" />
      </svg>
    ),
  },
  {
    label: "Perpetual Futures",
    tag: "Long and short positions with up to 100x leverage.",
    desc: "Trade perpetual contracts with leverage on major crypto pairs.",
    icon: (
      <svg {...svgProps}>
        {/* Infinity ∞ with arrowheads */}
        <path d="M7 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z" strokeOpacity=".3" />
        <path d="M12 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4" />
        <path d="M12 12c0 2.21-1.79 4-4 4" />
        <polyline points="9.5,14.5 8,16 6.5,14.5" />
        <polyline points="14.5,9.5 16,8 17.5,9.5" />
      </svg>
    ),
  },
  {
    label: "Crypto Swap",
    tag: "No account needed. Swap directly from your self-custody wallet.",
    desc: "Instantly swap between hundreds of tokens at the best available rates.",
    icon: (
      <svg {...svgProps}>
        {/* Two curved opposing arrows */}
        <path d="M4 8h13a3 3 0 0 1 0 6H7" />
        <polyline points="7,11 4,8 7,5" />
        <polyline points="17,19 20,16 17,13" />
        <path d="M20 16H7a3 3 0 0 1 0-6h10" strokeOpacity=".3"/>
      </svg>
    ),
  },
  {
    label: "Staking",
    tag: "Flexible and fixed-term options across multiple blockchains.",
    desc: "Earn yield by staking your crypto assets directly from your wallet.",
    icon: (
      <svg {...svgProps}>
        {/* Stacked layers + upward arrow */}
        <ellipse cx="12" cy="17" rx="7" ry="2.2" />
        <ellipse cx="12" cy="13.5" rx="7" ry="2.2" />
        <path d="M5 13.5V17" />
        <path d="M19 13.5V17" />
        <ellipse cx="12" cy="10" rx="7" ry="2.2" />
        <path d="M5 10V13.5" />
        <path d="M19 10V13.5" />
        <line x1="12" y1="7.8" x2="12" y2="4" />
        <polyline points="9.5,6 12,3.5 14.5,6" />
      </svg>
    ),
  },
  {
    label: "Prediction Markets",
    tag: "Bet on outcomes in crypto, sports, politics, and more.",
    desc: "Forecast real-world events and earn rewards when you get it right.",
    icon: (
      <svg {...svgProps}>
        {/* Target crosshair + pulse line */}
        <circle cx="12" cy="12" r="8" strokeOpacity=".25" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2"  y1="12" x2="6"  y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <circle cx="12" cy="12" r="1.2" fill={S} stroke="none" />
      </svg>
    ),
  },
  {
    label: "Gift Cards",
    tag: "Amazon, Apple, Google Play, Netflix, Steam and hundreds more.",
    desc: "Buy gift cards for hundreds of global brands using your crypto.",
    icon: (
      <svg {...svgProps}>
        {/* Card with ribbon */}
        <rect x="2" y="7" width="20" height="13" rx="2" />
        <line x1="2" y1="11" x2="22" y2="11" />
        <path d="M12 7c0 0-2.5-4 0-4s2.5 4 0 4z" />
        <path d="M12 7c0 0 2.5-4 0-4" strokeOpacity=".4"/>
        <line x1="12" y1="7" x2="12" y2="20" strokeOpacity=".4"/>
      </svg>
    ),
  },
  {
    label: "Mobile Top-up",
    tag: "200+ operators across 150 countries, instant delivery.",
    desc: "Recharge any mobile number worldwide in seconds with crypto.",
    icon: (
      <svg {...svgProps}>
        {/* Phone with lightning bolt */}
        <rect x="6" y="2" width="12" height="20" rx="2.5" />
        <circle cx="12" cy="18.5" r=".8" fill={S} stroke="none" />
        <line x1="9" y1="5" x2="15" y2="5" strokeOpacity=".4"/>
        {/* lightning */}
        <path d="M13.5 8.5 L10.5 12.5 L12.5 12.5 L10.5 16.5" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Utility Bills",
    tag: "Electricity, water, internet, TV and more — paid instantly.",
    desc: "Pay electricity, water, internet, and other bills using crypto.",
    icon: (
      <svg {...svgProps}>
        {/* House with bolt */}
        <path d="M3 12 L12 4 L21 12" />
        <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" />
        <path d="M13 21v-6h-2v6" strokeOpacity=".4"/>
        {/* bolt inside house */}
        <path d="M13.2 11 L11 14 L12.6 14 L11 17.5" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: "Shop",
    tag: "Physical and digital goods, paid entirely with crypto.",
    desc: "Browse and buy products from our integrated crypto-native marketplace.",
    icon: (
      <svg {...svgProps}>
        {/* Shopping bag with tag */}
        <path d="M6 2 L4 22 L20 22 L18 2 Z" rx="1" />
        <path d="M9 2 C9 2 9 6 12 6 C15 6 15 2 15 2" />
        <circle cx="15.5" cy="13" r="1" fill={S} stroke="none" />
        <path d="M8 13 L13.5 13" strokeOpacity=".5"/>
        <path d="M8 16.5 L16 16.5" strokeOpacity=".5"/>
      </svg>
    ),
  },
];

const positions = [
  { title: "Junior Frontend Developer",  location: "San Francisco, CA", type: "Part time" },
  { title: "UI/UX and Product Designer", location: "London, UK",        type: "Full time" },
  { title: "Head of Branding",           location: "Remote",            type: "Full time" },
  { title: "Senior Backend Developer",   location: "San Francisco, CA", type: "Full time" },
  { title: "Customer Support Agent",     location: "Remote",            type: "Part time" },
];

const officePhotos = [
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=80",
];

/* ──────────────────────────────────── component ── */

const About = () => {
  useHead({
    title: "About Us | Pexly",
    meta: [{ name: "description", content: "Learn about Pexly's mission to bring peer-to-peer crypto trading to everyone, everywhere." }],
  });

  return (
    <main className="overflow-x-hidden font-sans">

      {/* ══ 1. HERO ═══════════════════════════════════════════════════════ */}
      <section className="bg-background pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Label */}
          <div className="flex lg:justify-center mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="w-5 h-px bg-primary" />
              Pexly — Est. 2021
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-[80px] xl:text-[96px] font-extrabold leading-[1.04] tracking-tight text-foreground mb-6 lg:text-center">
            One platform.<br />
            Every <span className="text-primary">crypto</span> service.
          </h1>

          {/* Sub */}
          <p className="text-foreground/50 text-lg md:text-xl leading-relaxed max-w-xl mb-12 lg:mx-auto lg:text-center">
            Spot trading, perpetual futures, swaps, staking, gift cards, and a non-custodial wallet — all in one platform available across 180+ countries.
          </p>

          {/* Stats — 4-col row on desktop, 2×2 on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 border-t border-foreground/10 pt-10">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-5xl md:text-6xl font-light tracking-tight text-foreground leading-none">
                  {s.value}
                </p>
                <div className="w-8 h-px bg-primary mt-3 mb-2" />
                <p className="text-foreground/40 text-xs uppercase tracking-[0.15em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 2. WHO WE ARE ════════════════════════════════════════════════ */}
      <section className="bg-background py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Mobile */}
          <div className="lg:hidden">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">Our Company</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">Who we are</h2>
            <div className="space-y-4 text-foreground/60 text-base leading-relaxed">
              <p>Pexly is a multi-product digital asset platform that brings together spot trading, perpetual futures, crypto swaps, staking, gift cards, airtime top-ups, and a self-custody wallet — all in one place.</p>
              <p>Founded in 2021, we've grown from a focused team of crypto-native builders into a platform trusted by hundreds of thousands of users across more than 180 countries.</p>
              <p>We operate as a technology and services provider — not as a financial institution or custodian. Your assets remain under your control at all times.</p>
              <p>With offices in London, New York, and a fully distributed remote team, Pexly brings together the best talent in fintech, compliance, and product design.</p>
            </div>
          </div>

          {/* Desktop: 2-col split */}
          <div className="hidden lg:grid grid-cols-2 gap-16 xl:gap-28 items-start">
            <div className="pt-1">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">Our Company</p>
              <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-tight sticky top-24">
                Who we are
              </h2>
            </div>
            <div className="space-y-5 text-foreground/60 text-lg leading-relaxed">
              <p>Pexly is a multi-product digital asset platform that brings together spot trading, perpetual futures, crypto swaps, staking, gift cards, airtime top-ups, and a self-custody wallet — all in one place.</p>
              <p>Founded in 2021, we've grown from a focused team of crypto-native builders into a platform trusted by hundreds of thousands of users across more than 180 countries.</p>
              <p>We operate as a technology and services provider — not as a financial institution or custodian. Your assets remain under your control at all times.</p>
              <p>With offices in London, New York, and a fully distributed remote team, Pexly brings together the best talent in fintech, compliance, and product design. We're backed by leading technology investors committed to building something that lasts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. OFFICE PHOTOS ═════════════════════════════════════════════ */}
      <section className="bg-background pb-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Mobile: stacked */}
          <div className="flex flex-col gap-3 lg:hidden">
            {officePhotos.map((src, i) => (
              <div key={i} className="w-full rounded-3xl overflow-hidden" style={{ height: 220 }}>
                <img src={src} alt="Pexly office" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Desktop: 3-col horizontal grid */}
          <div className="hidden lg:grid grid-cols-3 gap-4">
            <div className="rounded-3xl overflow-hidden" style={{ height: 340 }}>
              <img src={officePhotos[0]} alt="Pexly office" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl overflow-hidden" style={{ height: 340 }}>
              <img src={officePhotos[1]} alt="Pexly workspace" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-3xl overflow-hidden" style={{ height: 340 }}>
              <img src={officePhotos[2]} alt="Pexly team" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. OUR VISION — curved bottom, overlays Values dark section ══ */}
      <section className="relative z-30 rounded-b-3xl bg-background pt-10 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Mobile */}
          <div className="lg:hidden">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">Our Vision</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-5">Building the new economy</h2>
            <div className="space-y-4 text-foreground/60 text-base leading-relaxed">
              <p>Digital assets and blockchain technology aren't just transforming finance — they're changing how value is created, stored, and moved across the world.</p>
              <p>We're building the infrastructure that makes these tools accessible and practical for everyone — from first-time users to experienced traders — through a single, intuitive, and compliant platform.</p>
            </div>
          </div>

          {/* Desktop: 2-col split */}
          <div className="hidden lg:grid grid-cols-2 gap-16 xl:gap-28 items-start">
            <div className="pt-1">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">Our Vision</p>
              <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-tight sticky top-24">
                Building the new economy
              </h2>
            </div>
            <div className="space-y-5 text-foreground/60 text-lg leading-relaxed">
              <p>Digital assets and blockchain technology aren't just transforming finance — they're changing how value is created, stored, and moved across the world.</p>
              <p>We're building the infrastructure that makes these tools accessible and practical for everyone — from first-time users to experienced traders — through a single, intuitive, and compliant platform.</p>
              <p>Our goal is a future where anyone, anywhere, can access the same financial tools that were once available only to the privileged few — with full transparency, security, and control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 5. VALUES — dark, tucked under Vision, curved bottom ═════════ */}
      <section
        className="relative z-20 -mt-20 rounded-b-3xl bg-[hsl(0_0%_10%)] pt-28 pb-24"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">
            Our Values
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-12">
            What we believe in
          </h2>

          {/* Mobile: stacked */}
          <div className="flex flex-col items-center gap-10 lg:hidden">
            {values.map((v, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
                  {v.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">{v.title}</h3>
                <p className="text-white/50 text-base leading-relaxed max-w-xs">{v.body}</p>
              </div>
            ))}
          </div>

          {/* Desktop: 4-col cards */}
          <div className="hidden lg:grid grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-3xl p-8 flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6">
                  {v.icon}
                </div>
                <h3 className="text-xl font-extrabold text-white mb-3">{v.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. TEAM — light, tucked under Values curve ═══════════════════ */}
      <section className="relative z-10 -mt-20 pt-24 bg-background pb-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Mobile: label + heading + desc stacked, then 2-col grid */}
          <div className="lg:hidden">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">Our People</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2">Senior management</h2>
            <p className="text-foreground/50 text-base leading-relaxed mb-10 max-w-xl">
              Our leadership team is comprised of seasoned executives with years of experience across fintech, compliance, and crypto.
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8">
              {team.map((person, i) => (
                <div key={i}>
                  <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3">
                    <img src={person.img} alt={person.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <p className="font-bold text-foreground text-sm leading-snug">{person.name}</p>
                  <p className="text-foreground/50 text-xs mt-0.5 mb-2">{person.role}</p>
                  <div className="flex items-center gap-2">
                    <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                    <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors"><Linkedin className="w-3.5 h-3.5" /></a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: left label/heading/desc + right 3-col grid */}
          <div className="hidden lg:grid grid-cols-[1fr_2fr] gap-16 xl:gap-24 items-start">

            {/* Left — sticky label, heading, description */}
            <div className="sticky top-24">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-4">Our People</p>
              <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-5">
                Senior management
              </h2>
              <p className="text-foreground/50 text-base leading-relaxed">
                Our leadership team is comprised of seasoned executives with years of experience across fintech, compliance, and crypto.
              </p>
            </div>

            {/* Right — 3-col portrait grid */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-10">
              {team.map((person, i) => (
                <div key={i}>
                  <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-4">
                    <img src={person.img} alt={person.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <p className="font-bold text-foreground text-base leading-snug">{person.name}</p>
                  <p className="text-foreground/50 text-sm mt-1 mb-3">{person.role}</p>
                  <div className="flex items-center gap-2">
                    <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors"><Twitter className="w-4 h-4" /></a>
                    <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors"><Linkedin className="w-4 h-4" /></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 7. WHAT WE OFFER — dark, curved bottom ════════════════════════ */}
      <section className="relative z-30 rounded-b-3xl bg-[hsl(0_0%_8%)] pt-14 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">
            Our Services
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-10">
            Everything you need, in one place
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(({ label, tag, desc, icon }, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl px-6 py-6 flex flex-col gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                  {icon}
                </div>
                <p className="text-white font-bold text-lg">{label}</p>
                <p className="text-primary/70 text-xs font-medium tracking-wide uppercase">{tag}</p>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. CAREERS CTA — light, tucked under Media curve ════════════ */}
      <section className="relative z-20 -mt-20 pt-24 bg-background pb-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Mobile */}
          <div className="lg:hidden">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-3">Careers</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">Elevate your career</h2>
            <p className="text-foreground/50 text-base leading-relaxed mb-6 max-w-md">
              We're looking for exceptionally talented people to join our team and help shape the future of digital asset services.
            </p>
            <Link href="/careers">
              <Button size="lg" className="rounded-full px-10 font-semibold">Check Pexly careers</Button>
            </Link>
            <div className="mt-8 w-full rounded-3xl overflow-hidden" style={{ height: 200 }}>
              <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80" alt="Pexly team" className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-3xl overflow-hidden" style={{ height: 170 }}>
                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" alt="Pexly office culture" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-3xl overflow-hidden" style={{ height: 170 }}>
                <img src="https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?auto=format&fit=crop&w=600&q=80" alt="Pexly team collaboration" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Desktop: 2-col — text left, image collage right */}
          <div className="hidden lg:grid grid-cols-2 gap-16 xl:gap-24 items-start">
            <div>
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">Careers</p>
              <h2 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-5">
                Elevate your career
              </h2>
              <p className="text-foreground/50 text-lg leading-relaxed mb-8 max-w-md">
                We're looking for exceptionally talented people to join our team and help shape the future of digital asset services.
              </p>
              <Link href="/careers">
                <Button size="lg" className="rounded-full px-10 font-semibold">Check Pexly careers</Button>
              </Link>
            </div>

            {/* Right: image collage */}
            <div className="flex flex-col gap-3">
              <div className="w-full rounded-3xl overflow-hidden" style={{ height: 260 }}>
                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80" alt="Pexly team" className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl overflow-hidden" style={{ height: 200 }}>
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" alt="Pexly office culture" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-3xl overflow-hidden" style={{ height: 200 }}>
                  <img src="https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?auto=format&fit=crop&w=600&q=80" alt="Pexly collaboration" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 9. JOIN OUR TEAM — green CTA overlaying footer ══════════════ */}
      <section
        className="relative z-40 -mt-10 rounded-3xl bg-primary pt-14 pb-28 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left — heading + CTA + locations */}
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-primary-foreground mb-3">
                Join our team
              </h2>
              <p className="text-primary-foreground/70 text-base mb-7 max-w-sm">
                Check out our open positions and elevate your career in digital assets.
              </p>
              <Link href="/careers">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-8 font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 mb-9"
                >
                  View open positions
                </Button>
              </Link>

              <div className="flex flex-wrap gap-6">
                {[
                  { region: "North America", cities: "New York, Miami" },
                  { region: "Europe",        cities: "London, Amsterdam" },
                  { region: "Remote",        cities: "Worldwide" },
                ].map((loc, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-2 h-2 rounded-full border-2 border-primary-foreground/40 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">{loc.region}</p>
                      <p className="text-sm font-medium text-primary-foreground/80">{loc.cities}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — open positions list */}
            <div className="rounded-2xl overflow-hidden bg-black/10">
              {positions.map((pos, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center justify-between px-5 py-4 border-b border-black/10 last:border-0 hover:bg-black/10 transition-colors group"
                >
                  <div>
                    <p className="font-bold text-primary-foreground text-sm leading-snug group-hover:underline">
                      {pos.title}
                    </p>
                    <p className="text-primary-foreground/60 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {pos.location}
                      <span className="mx-1">·</span>
                      {pos.type}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary-foreground/50 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER — slides under the green CTA ══════════════════════════ */}
      <div className="relative z-30 -mt-16">
        <AppFooter />
      </div>

    </main>
  );
};

export default About;
