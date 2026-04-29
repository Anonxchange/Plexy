import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AppFooter } from '@/components/app-footer';
import { ArrowRight, CheckCircle, Shield, Snowflake, Lock, BellRing, Ban, Zap, Globe } from 'lucide-react';
import { SiBitcoin, SiEthereum, SiTether, SiBinance, SiSolana, SiXrp } from 'react-icons/si';

// ─── SVG: Realistic Virtual Card ────────────────────────────────────────────
const VirtualCardSVG = () => (
  <svg viewBox="0 0 380 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ filter: 'drop-shadow(0 20px 48px rgba(180,242,46,0.18)) drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}>
    <defs>
      <linearGradient id="vBase" x1="0" y1="0" x2="380" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0C1829" />
        <stop offset="55%" stopColor="#091422" />
        <stop offset="100%" stopColor="#060D18" />
      </linearGradient>
      {/* Lime accent sweep */}
      <linearGradient id="vSweep" x1="0" y1="0" x2="380" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B4F22E" stopOpacity="0" />
        <stop offset="40%" stopColor="#B4F22E" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
      </linearGradient>
      {/* Top glow */}
      <radialGradient id="vGlow" cx="70%" cy="0%" r="60%">
        <stop offset="0%" stopColor="#B4F22E" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
      </radialGradient>
      {/* Shine on top edge */}
      <linearGradient id="vShine" x1="0" y1="0" x2="380" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="30%" stopColor="white" stopOpacity="0.07" />
        <stop offset="70%" stopColor="white" stopOpacity="0.04" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <clipPath id="vClip"><rect width="380" height="240" rx="20" /></clipPath>
    </defs>

    <g clipPath="url(#vClip)">
      {/* Base */}
      <rect width="380" height="240" fill="url(#vBase)" />
      <rect width="380" height="240" fill="url(#vSweep)" />
      <rect width="380" height="240" fill="url(#vGlow)" />

      {/* Subtle hex dot grid */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 14 }).map((_, col) => {
          const x = col * 28 + (row % 2 === 0 ? 0 : 14);
          const y = row * 24;
          return <circle key={`${row}-${col}`} cx={x} cy={y} r="1" fill="#B4F22E" fillOpacity="0.04" />;
        })
      )}

      {/* Diagonal highlight band */}
      <rect x="-60" y="-20" width="500" height="2" fill="white" fillOpacity="0.05" transform="rotate(18 190 120)" />
      <rect x="-60" y="10" width="500" height="1" fill="white" fillOpacity="0.03" transform="rotate(18 190 120)" />

      {/* Accent lime stripe — bottom */}
      <rect x="0" y="228" width="380" height="3" fill="url(#vSweep)" opacity="0.8" />
      <rect x="36" y="228" width="140" height="3" fill="#B4F22E" fillOpacity="0.35" />

      {/* Top-right glow orb */}
      <ellipse cx="330" cy="30" rx="80" ry="55" fill="#B4F22E" fillOpacity="0.06" />

      {/* "VIRTUAL" type badge */}
      <rect x="296" y="24" width="58" height="17" rx="4" fill="#B4F22E" fillOpacity="0.12" />
      <text x="325" y="35.5" fontFamily="system-ui" fontSize="7.5" fontWeight="700" fill="#B4F22E" fillOpacity="0.85" textAnchor="middle" letterSpacing="1.8">VIRTUAL</text>

      {/* Pexly brand */}
      <text x="36" y="46" fontFamily="system-ui" fontSize="18" fontWeight="800" fill="#B4F22E">Pexly</text>

      {/* Contactless / NFC symbol (virtual cards can still show it for digital wallets) */}
      <g transform="translate(36, 78)" opacity="0.55">
        <path d="M0 10 Q5 5 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M5 14 Q12 7 19 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M10 18 Q19 9 28 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>

      {/* Card number — large, proper spacing */}
      <text x="36" y="155" fontFamily="'Courier New',monospace" fontSize="16" fontWeight="600" fill="white" fillOpacity="0.75" letterSpacing="3">
        4291  8823  7741  6652
      </text>

      {/* Bottom info */}
      <text x="36" y="186" fontFamily="system-ui" fontSize="8" fill="white" fillOpacity="0.38" letterSpacing="2">CARD HOLDER</text>
      <text x="36" y="200" fontFamily="system-ui" fontSize="11" fontWeight="600" fill="white" fillOpacity="0.6" letterSpacing="1">ALEX MORGAN</text>

      <text x="200" y="186" fontFamily="system-ui" fontSize="8" fill="white" fillOpacity="0.38" letterSpacing="2">EXPIRES</text>
      <text x="200" y="200" fontFamily="system-ui" fontSize="11" fontWeight="600" fill="white" fillOpacity="0.6" letterSpacing="1">12 / 28</text>

      {/* VISA logo */}
      <text x="344" y="218" fontFamily="system-ui" fontSize="24" fontWeight="900" fill="white" fillOpacity="0.85" textAnchor="middle" fontStyle="italic">VISA</text>

      {/* Top shine line */}
      <rect x="0" y="0" width="380" height="1.5" fill="url(#vShine)" />
      {/* Card border */}
      <rect x="0.75" y="0.75" width="378.5" height="238.5" rx="19.5" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
    </g>
  </svg>
);

// ─── SVG: Realistic Physical Card ───────────────────────────────────────────
const PhysicalCardSVG = () => (
  <svg viewBox="0 0 380 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.55)) drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>
    <defs>
      {/* Dark gunmetal base */}
      <linearGradient id="pBase" x1="0" y1="0" x2="380" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1C1C1E" />
        <stop offset="50%" stopColor="#141416" />
        <stop offset="100%" stopColor="#0E0E10" />
      </linearGradient>
      {/* Surface micro-sheen */}
      <linearGradient id="pSheen" x1="0" y1="0" x2="380" y2="240" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0.06" />
        <stop offset="45%" stopColor="white" stopOpacity="0.02" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      {/* Lime accent */}
      <radialGradient id="pAccent" cx="20%" cy="80%" r="55%">
        <stop offset="0%" stopColor="#B4F22E" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#B4F22E" stopOpacity="0" />
      </radialGradient>
      {/* EMV Chip base gold */}
      <linearGradient id="chipBase" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F0D060" />
        <stop offset="30%" stopColor="#D4A820" />
        <stop offset="70%" stopColor="#C09018" />
        <stop offset="100%" stopColor="#A87010" />
      </linearGradient>
      {/* Chip pad (contact areas) */}
      <linearGradient id="chipPad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8C840" />
        <stop offset="100%" stopColor="#B88820" />
      </linearGradient>
      {/* Hologram iridescent */}
      <linearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff6ec7" stopOpacity="0.7" />
        <stop offset="16%" stopColor="#ff9500" stopOpacity="0.7" />
        <stop offset="33%" stopColor="#ffde00" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#00e676" stopOpacity="0.7" />
        <stop offset="67%" stopColor="#00b0ff" stopOpacity="0.7" />
        <stop offset="83%" stopColor="#7c4dff" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ff6ec7" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="holoOverlay" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="white" stopOpacity="0.25" />
        <stop offset="50%" stopColor="white" stopOpacity="0.05" />
        <stop offset="100%" stopColor="white" stopOpacity="0.2" />
      </linearGradient>
      {/* Top edge shine */}
      <linearGradient id="pTopShine" x1="0" y1="0" x2="380" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="25%" stopColor="white" stopOpacity="0.09" />
        <stop offset="75%" stopColor="white" stopOpacity="0.05" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <clipPath id="pClip"><rect width="380" height="240" rx="20" /></clipPath>
      <clipPath id="holoClip"><ellipse cx="300" cy="100" rx="28" ry="20" /></clipPath>
    </defs>

    <g clipPath="url(#pClip)">
      {/* Base layers */}
      <rect width="380" height="240" fill="url(#pBase)" />
      <rect width="380" height="240" fill="url(#pSheen)" />
      <rect width="380" height="240" fill="url(#pAccent)" />

      {/* Subtle carbon fibre weave pattern */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 13} x2="380" y2={i * 13} stroke="white" strokeOpacity="0.015" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 32} y1="0" x2={i * 32} y2="240" stroke="white" strokeOpacity="0.015" strokeWidth="0.5" />
      ))}

      {/* Diagonal highlight */}
      <rect x="-100" y="-10" width="600" height="1.5" fill="white" fillOpacity="0.055" transform="rotate(20 190 120)" />

      {/* Bottom lime accent line */}
      <rect x="0" y="233" width="380" height="4" fill="#B4F22E" fillOpacity="0.08" />
      <rect x="36" y="233" width="100" height="4" fill="#B4F22E" fillOpacity="0.3" />

      {/* Pexly brand */}
      <text x="36" y="46" fontFamily="system-ui" fontSize="18" fontWeight="800" fill="#B4F22E">Pexly</text>

      {/* ── EMV CHIP ── */}
      {/* Chip outer body */}
      <rect x="36" y="82" width="52" height="40" rx="5" fill="url(#chipBase)" />
      {/* Chip inner frame (slightly inset) */}
      <rect x="38" y="84" width="48" height="36" rx="3.5" fill="none" stroke="#C8A020" strokeWidth="0.7" strokeOpacity="0.6" />
      {/* Contact pads - 6 pads in 2 col × 3 row layout */}
      {/* Left column */}
      <rect x="40" y="86"  width="18" height="9" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      <rect x="40" y="99"  width="18" height="9" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      <rect x="40" y="112" width="18" height="7" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      {/* Right column */}
      <rect x="62" y="86"  width="18" height="9" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      <rect x="62" y="99"  width="18" height="9" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      <rect x="62" y="112" width="18" height="7" rx="1.5" fill="url(#chipPad)" opacity="0.9" />
      {/* Chip center groove lines */}
      <line x1="60" y1="84" x2="60" y2="120" stroke="#A07010" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="38" y1="97" x2="86" y2="97" stroke="#A07010" strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="38" y1="110" x2="86" y2="110" stroke="#A07010" strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Chip top highlight */}
      <rect x="36" y="82" width="52" height="4" rx="5" fill="white" fillOpacity="0.12" />

      {/* ── NFC SYMBOL ── right of chip */}
      <g transform="translate(97, 91)" opacity="0.7">
        <circle cx="6" cy="11" r="3.5" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" />
        <path d="M11 17 Q17 11 11 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.75" />
        <path d="M15 20 Q23 11 15 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
        <path d="M19 23 Q29 11 19 -1" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" strokeOpacity="0.3" />
      </g>

      {/* ── HOLOGRAM STICKER ── top-right area */}
      <ellipse cx="300" cy="100" rx="28" ry="20" fill="url(#holo)" />
      <ellipse cx="300" cy="100" rx="28" ry="20" fill="url(#holoOverlay)" />
      {/* Hologram inner lines */}
      {[-15,-5,5,15].map(offset => (
        <line key={offset} x1={300 + offset} y1="80" x2={300 - offset * 0.5} y2="120" stroke="white" strokeOpacity="0.12" strokeWidth="0.8" />
      ))}
      {/* Hologram border */}
      <ellipse cx="300" cy="100" rx="28" ry="20" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="0.7" />
      {/* Dove/star inside hologram */}
      <path d="M292 100 Q296 96 300 98 Q304 96 308 100 Q304 104 300 102 Q296 104 292 100Z" fill="white" fillOpacity="0.25" />

      {/* Card number — embossed feel */}
      <text x="36" y="157" fontFamily="'Courier New',monospace" fontSize="15.5" fontWeight="700" fill="white" fillOpacity="0.82" letterSpacing="2.8">
        4291  8823  7741  6652
      </text>
      {/* Subtle emboss shadow under number */}
      <text x="36.5" y="157.7" fontFamily="'Courier New',monospace" fontSize="15.5" fontWeight="700" fill="black" fillOpacity="0.25" letterSpacing="2.8">
        4291  8823  7741  6652
      </text>

      {/* Bottom labels */}
      <text x="36" y="185" fontFamily="system-ui" fontSize="7.5" fill="white" fillOpacity="0.35" letterSpacing="2">CARD HOLDER</text>
      <text x="36" y="199" fontFamily="system-ui" fontSize="11" fontWeight="700" fill="white" fillOpacity="0.72" letterSpacing="0.8">ALEX MORGAN</text>

      <text x="200" y="185" fontFamily="system-ui" fontSize="7.5" fill="white" fillOpacity="0.35" letterSpacing="2">EXPIRES</text>
      <text x="200" y="199" fontFamily="system-ui" fontSize="11" fontWeight="700" fill="white" fillOpacity="0.72" letterSpacing="0.8">12 / 28</text>

      {/* VISA logo — italic, bottom right */}
      <text x="344" y="218" fontFamily="system-ui" fontSize="24" fontWeight="900" fill="white" fillOpacity="0.88" textAnchor="middle" fontStyle="italic">VISA</text>

      {/* Top edge shine */}
      <rect x="0" y="0" width="380" height="1.5" fill="url(#pTopShine)" />
      {/* Card border */}
      <rect x="0.75" y="0.75" width="378.5" height="238.5" rx="19.5" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" />
    </g>
  </svg>
);

// ─── Unified entry point ─────────────────────────────────────────────────────
const CardSVG = ({ variant = 'virtual' }: { variant?: 'virtual' | 'physical' }) =>
  variant === 'physical' ? <PhysicalCardSVG /> : <VirtualCardSVG />;

// ─── SVG: Marquee Item Icon ─────────────────────────────────────────────────
const MarqueeItem = ({ label, sub }: { label: string; sub: string }) => (
  <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-border bg-card/50 mx-2 flex-shrink-0">
    <span className="text-primary font-bold text-sm">{label}</span>
    <span className="text-muted-foreground text-xs">{sub}</span>
  </div>
);

// ─── Marquee Strip ──────────────────────────────────────────────────────────
const marqueItems = [
  { label: '0% monthly fee', sub: 'Forever free' },
  { label: '140+ countries', sub: 'VISA network' },
  { label: '1.99% deposit', sub: 'Only fee ever' },
  { label: '€7,500/day', sub: 'Spending limit' },
  { label: '24/7 support', sub: 'Always on' },
  { label: 'Instant top-up', sub: 'BTC, ETH, USDC' },
  { label: '3D Secure', sub: 'Every transaction' },
  { label: 'EU ready', sub: '27 countries' },
];

const Marquee = () => (
  <div className="relative overflow-hidden py-3 border-y border-border/50">
    <div className="flex animate-marquee-left gap-0" style={{ width: 'max-content' }}>
      {[...marqueItems, ...marqueItems, ...marqueItems].map((item, i) => (
        <MarqueeItem key={i} label={item.label} sub={item.sub} />
      ))}
    </div>
  </div>
);

// ─── SVG: Security Gauge ───────────────────────────────────────────────────
const Gauge = () => {
  const r = 52, c = 2 * Math.PI * r, pct = 0.98;
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" strokeOpacity="0.25" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#B4F22E" strokeWidth="7"
        strokeDasharray={`${pct * c} ${(1 - pct) * c}`} strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#B4F22E" fontFamily="system-ui">98%</text>
      <text x="60" y="70" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))" fontFamily="system-ui" letterSpacing="1.5">FRAUD FREE</text>
    </svg>
  );
};

// ─── World Map SVG (minimal dots) ──────────────────────────────────────────
const WorldDots = () => (
  <svg viewBox="0 0 400 220" fill="none" className="w-full opacity-60">
    {/* Simplified dot grid representing a world map */}
    {[
      // North America
      [50,60],[65,55],[80,60],[95,65],[110,60],[125,55],[85,75],[100,80],
      // South America
      [100,110],[110,120],[105,135],[115,145],[110,160],
      // Europe
      [175,55],[185,50],[195,55],[205,52],[215,55],[225,58],[190,65],[200,60],[210,62],
      // Africa
      [195,85],[205,90],[215,95],[200,110],[210,120],[205,135],[195,150],
      // Asia
      [250,45],[265,42],[280,45],[295,50],[310,48],[325,52],[285,60],[300,58],[270,65],
      [290,72],[305,68],[320,65],[285,80],[300,78],[315,75],
      // Oceania
      [310,130],[325,135],[340,128],[330,145],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="2.5" fill="#B4F22E" fillOpacity="0.4" />
    ))}
    {/* EU highlight */}
    {[[175,55],[185,50],[195,55],[205,52],[215,55],[225,58],[190,65],[200,60],[210,62]].map(([cx,cy],i) => (
      <circle key={`eu-${i}`} cx={cx} cy={cy} r="3.5" fill="#B4F22E" fillOpacity="0.9" />
    ))}
  </svg>
);

// ─── HERO ──────────────────────────────────────────────────────────────────
const Hero = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden px-4 pt-6 pb-8">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #B4F22E 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #00bfff 0%, transparent 70%)' }} />
        {/* Diagonal grain line */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="100%" y1="0" x2="0" y2="100%" stroke="#B4F22E" strokeOpacity="0.03" strokeWidth="1" />
          <line x1="80%" y1="0" x2="0" y2="60%" stroke="#B4F22E" strokeOpacity="0.02" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center">
        {/* Left */}
        <div className="order-2 lg:order-1">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">Coming Soon</span>
          </div>

          <h1 className="text-display-2xl text-foreground mb-5 leading-[0.98]">
            Your crypto.<br />
            <span className="text-gradient-brand">Anywhere</span><br />
            you spend.
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-7 max-w-md">
            Fund with BTC, ETH, USDC and more. Spend anywhere VISA is accepted — in store, online, or overseas. Free card. Always.
          </p>

          {/* Email CTA */}
          {!sent ? (
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 h-11 px-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all" />
              <Button onClick={() => email && setSent(true)} className="h-11 px-5 rounded-xl font-semibold text-sm whitespace-nowrap glow-primary">
                Get Early Access <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-primary font-semibold h-11">
              <CheckCircle className="w-5 h-5" /> You're on the list — we'll be in touch!
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-2.5">No spam. Unsubscribe anytime.</p>

          {/* Inline stats */}
          <div className="flex gap-5 mt-8 flex-wrap">
            {[['0%','Monthly fee'],['140+','Countries'],['1.99%','Deposit only'],['24/7','Support']].map(([v,l]) => (
              <div key={l}>
                <div className="text-lg font-bold text-foreground num leading-none">{v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Card */}
        <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[340px]">
            {/* Glow halo */}
            <div className="absolute inset-[-20%] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, #B4F22E22 0%, transparent 70%)' }} />
            {/* Orbit rings */}
            <svg viewBox="0 0 380 380" className="absolute inset-[-18%] w-[136%] h-[136%] pointer-events-none">
              <ellipse cx="190" cy="190" rx="175" ry="130" stroke="#B4F22E" strokeOpacity="0.07" strokeWidth="1" fill="none" strokeDasharray="5 8" />
              <ellipse cx="190" cy="190" rx="140" ry="104" stroke="#B4F22E" strokeOpacity="0.05" strokeWidth="1" fill="none" strokeDasharray="3 14" />
              <circle cx="190" cy="60" r="4" fill="#B4F22E" fillOpacity="0.5" />
              <circle cx="365" cy="190" r="3" fill="#B4F22E" fillOpacity="0.35" />
              <circle cx="15" cy="190" r="3" fill="#B4F22E" fillOpacity="0.25" />
            </svg>
            {/* Card */}
            <div className="relative z-10"><CardSVG variant="virtual" /></div>
            {/* Floating chips */}
            <div className="absolute -bottom-3 -left-3 z-20 glass-dark rounded-2xl px-3 py-1.5 border border-white/10 flex items-center gap-1.5 shadow-xl">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-white">No monthly fee</span>
            </div>
            <div className="absolute -top-3 -right-3 z-20 glass-dark rounded-2xl px-3 py-1.5 border border-white/10 flex items-center gap-1.5 shadow-xl">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-white">3D Secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── BENTO GRID ────────────────────────────────────────────────────────────
const BentoGrid = () => (
  <section className="px-4 pb-10">
    <div className="max-w-6xl mx-auto">
      {/* Section label */}
      <div className="mb-6">
        <span className="text-label text-primary">What you get</span>
        <h2 className="text-display-lg text-foreground mt-1">Everything. Built in.</h2>
      </div>

      {/* Desktop bento, mobile stack */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-auto">

        {/* 1: Big — Free card [col-span-2 row-span-2] */}
        <div className="col-span-2 row-span-2 relative rounded-2xl bg-card border border-border overflow-hidden p-6 flex flex-col justify-between min-h-[220px] card-hover group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 20% 80%, hsl(75 85% 60% / 0.07) 0%, transparent 60%)' }} />
          <div>
            <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><rect x="2" y="6" width="20" height="13" rx="3" stroke="#B4F22E" strokeWidth="1.5"/><path d="M2 10h20" stroke="#B4F22E" strokeWidth="1.5" strokeLinecap="round"/><rect x="5" y="14" width="5" height="2" rx="1" fill="#B4F22E" fillOpacity="0.6"/></svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1.5">Zero fees. Always.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">No card creation fee, no monthly charge, no foreign transaction fee. The only cost is 1.99% when you top up.</p>
          </div>
          <div className="mt-4 text-3xl font-black text-primary num">€0 / mo</div>
        </div>

        {/* 2: Worldwide */}
        <div className="col-span-2 lg:col-span-1 relative rounded-2xl bg-card border border-border p-5 card-hover min-h-[106px] flex flex-col justify-between">
          <Globe className="w-5 h-5 text-primary/60" />
          <div>
            <div className="text-2xl font-black text-foreground num">140+</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
        </div>

        {/* 3: 3D Secure */}
        <div className="col-span-2 lg:col-span-1 relative rounded-2xl bg-card border border-border p-5 card-hover min-h-[106px] flex flex-col justify-between">
          <Lock className="w-5 h-5 text-primary/60" />
          <div>
            <div className="text-base font-bold text-foreground">3D Secure</div>
            <div className="text-xs text-muted-foreground">On every transaction</div>
          </div>
        </div>

        {/* 4: Instant */}
        <div className="col-span-2 lg:col-span-2 relative rounded-2xl overflow-hidden p-5 card-hover min-h-[110px] flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, hsl(75 85% 60% / 0.12) 0%, hsl(75 85% 60% / 0.04) 100%)', border: '1px solid hsl(75 85% 60% / 0.25)' }}>
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <div className="text-base font-bold text-foreground">Instant top-up</div>
            <div className="text-xs text-muted-foreground">BTC · ETH · USDC · BNB · SOL · XRP</div>
          </div>
        </div>

        {/* 5: Freeze */}
        <div className="col-span-1 relative rounded-2xl bg-card border border-border p-5 card-hover min-h-[106px] flex flex-col justify-between">
          <Snowflake className="w-5 h-5 text-primary/60" />
          <div>
            <div className="text-sm font-bold text-foreground">Freeze</div>
            <div className="text-[11px] text-muted-foreground">1 tap</div>
          </div>
        </div>

        {/* 6: Alerts */}
        <div className="col-span-1 relative rounded-2xl bg-card border border-border p-5 card-hover min-h-[106px] flex flex-col justify-between">
          <BellRing className="w-5 h-5 text-primary/60" />
          <div>
            <div className="text-sm font-bold text-foreground">Alerts</div>
            <div className="text-[11px] text-muted-foreground">Real-time</div>
          </div>
        </div>

        {/* 7: EU wide banner */}
        <div className="col-span-2 lg:col-span-4 relative rounded-2xl bg-card border border-border p-5 flex items-center gap-4 card-hover">
          <div className="text-3xl">🇪🇺</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-foreground">Available in 27 EU countries</div>
            <div className="text-xs text-muted-foreground truncate">Austria · Belgium · Croatia · Czech Republic · Denmark · Estonia · Finland · France · Germany · Greece +17 more</div>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-lg border-border text-xs flex-shrink-0">
            View all
          </Button>
        </div>
      </div>
    </div>
  </section>
);

// ─── CARD SHOWCASE ─────────────────────────────────────────────────────────
const CardShowcase = () => {
  const [active, setActive] = useState<'virtual' | 'physical'>('virtual');
  const info = {
    virtual: {
      tag: 'Available at launch',
      title: 'Virtual card',
      desc: 'Get issued instantly. Use it for online shopping, subscriptions, or add to Google Wallet.',
      perks: ['Instant activation','Google Wallet','Apple Wallet (soon)','Online payments'],
      cta: 'Join the waitlist',
    },
    physical: {
      tag: 'Coming soon',
      title: 'Physical card',
      desc: 'A sleek card shipped to your door. Contactless, chip-and-PIN, and ATM-ready.',
      perks: ['NFC contactless','ATM withdrawals','SEPA cash-out','Chip & PIN'],
      cta: 'Join waitlist',
    },
  };
  const d = info[active];

  return (
    <section className="px-4 pb-10">
      <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-border"
        style={{ background: 'linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)' }}>
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: visual */}
          <div className="relative flex items-center justify-center p-8 lg:p-12 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(215 28% 10%) 0%, hsl(215 28% 7%) 100%)' }}>
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(75 85% 60% / 0.12) 0%, transparent 65%)' }} />
            <div className="relative z-10 w-full max-w-xs">
              <CardSVG variant={active} />
            </div>
          </div>

          {/* Right: info */}
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            {/* Toggle */}
            <div className="flex bg-muted rounded-xl p-1 gap-1 w-fit mb-7">
              {(['virtual','physical'] as const).map(v => (
                <button key={v} onClick={() => setActive(v)}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200
                    ${active === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {v}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/30 bg-primary/8 w-fit mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary">{d.tag}</span>
            </div>

            <h2 className="text-display-md text-foreground mb-3">{d.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{d.desc}</p>

            <ul className="space-y-2.5 mb-7">
              {d.perks.map((p, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-foreground">{p}</span>
                </li>
              ))}
            </ul>

            <Button className="w-fit h-10 px-6 rounded-xl text-sm font-semibold glow-primary">
              {d.cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── CRYPTO DEPOSIT ────────────────────────────────────────────────────────
// USDC — faithful recreation of the Circle USDC logo
const USDCIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2775CA" />
    <circle cx="16" cy="16" r="11.5" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.35" />
    {/* Dollar sign vertical bar */}
    <rect x="15.1" y="7" width="1.8" height="18" rx="0.9" fill="white" />
    {/* C arc top */}
    <path d="M20.5 11.5 Q16 8.5 11.5 11.5 Q9 13.5 9 16 Q9 18.5 11.5 20.5 Q16 23.5 20.5 20.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const cryptos = [
  { s: 'BTC',  name: 'Bitcoin',   icon: <SiBitcoin  className="w-full h-full" />, color: '#F7931A' },
  { s: 'ETH',  name: 'Ethereum',  icon: <SiEthereum className="w-full h-full" />, color: '#627EEA' },
  { s: 'USDT', name: 'Tether',    icon: <SiTether   className="w-full h-full" />, color: '#26A17B' },
  { s: 'BNB',  name: 'BNB',       icon: <SiBinance  className="w-full h-full" />, color: '#F3BA2F' },
  { s: 'SOL',  name: 'Solana',    icon: <SiSolana   className="w-full h-full" />, color: '#9945FF' },
  { s: 'XRP',  name: 'XRP',       icon: <SiXrp      className="w-full h-full" />, color: '#346AA9' },
  { s: 'USDC', name: 'USD Coin',  icon: <USDCIcon />,                             color: '#2775CA' },
];

const CryptoDeposit = () => (
  <section className="px-4 pb-10">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <span className="text-label text-primary">Deposit & spend</span>
        <h2 className="text-display-lg text-foreground mt-1 mb-3">Crypto in, money out.</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Top up your Pexly Card with crypto from your wallet. We handle the conversion at the best rate — you just spend.
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          {cryptos.map(c => (
            <div key={c.s} className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full lift">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden p-[3px]"
                style={{ backgroundColor: c.color, color: 'white' }}>
                {c.icon}
              </div>
              <span className="text-xs font-semibold text-foreground">{c.s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="relative rounded-2xl p-6 text-center min-w-[160px]"
          style={{ background: 'linear-gradient(135deg, hsl(75 85% 60% / 0.1) 0%, hsl(75 85% 60% / 0.04) 100%)', border: '1px solid hsl(75 85% 60% / 0.3)' }}>
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 0 32px hsl(75 85% 60% / 0.1)' }} />
          <div className="text-4xl font-black text-primary num mb-0.5">1.99%</div>
          <div className="text-[11px] text-muted-foreground">Deposit fee only</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">Everything else is free</div>
        </div>
      </div>
    </div>
  </section>
);

// ─── SECURITY ──────────────────────────────────────────────────────────────
const SecuritySection = () => (
  <section className="px-4 pb-10">
    <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, hsl(215 28% 8%) 0%, hsl(215 28% 6%) 100%)', border: '1px solid hsl(215 20% 18%)' }}>
      <div className="grid lg:grid-cols-2 gap-0 items-stretch">
        {/* Left */}
        <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
          <span className="text-label text-primary">Security</span>
          <h2 className="text-display-md text-white mt-1 mb-3">
            Light on complexity.<br />
            <span style={{ color: '#B4F22E' }}>Heavy on safety.</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed mb-6">
            Every transaction protected. Every setting at your fingertips. You're always in full control.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Snowflake className="w-4 h-4" />, label: 'Freeze card', desc: 'Instant lock' },
              { icon: <BellRing className="w-4 h-4" />, label: 'Instant alerts', desc: 'Every payment' },
              { icon: <Ban className="w-4 h-4" />, label: 'Revoke', desc: 'Cancel anytime' },
              { icon: <Lock className="w-4 h-4" />, label: '3D Secure', desc: 'All transactions' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-3.5 flex gap-2.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(180,242,46,0.12)', border: '1px solid rgba(180,242,46,0.2)' }}>
                  <span style={{ color: '#B4F22E' }}>{item.icon}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{item.label}</div>
                  <div className="text-[10px] text-white/40">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: gauge + stats */}
        <div className="p-8 lg:p-10 flex flex-col items-center justify-center gap-6">
          <Gauge />
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {[['€7,500','Daily limit'],['27','EU countries'],['Free','Card creation'],['24/7','Support']].map(([v,l]) => (
              <div key={l} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-base font-bold text-white num">{v}</div>
                <div className="text-[10px] text-white/40">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── COUNTRIES ─────────────────────────────────────────────────────────────
const CountriesSection = () => (
  <section className="px-4 pb-10">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <span className="text-label text-primary">Where you can use it</span>
        <h2 className="text-display-lg text-foreground mt-1 mb-3">Built for Europe</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md">
          Available for EU nationals and residents across 27 countries. More regions coming soon.
        </p>
        <div className="flex flex-wrap gap-1.5 max-w-lg">
          {['🇩🇪','🇫🇷','🇮🇹','🇪🇸','🇳🇱','🇵🇱','🇵🇹','🇧🇪','🇸🇪','🇦🇹','🇩🇰','🇬🇷','🇫🇮','🇮🇪','🇷🇴','🇭🇺','🇨🇿','🇸🇰','🇸🇮','🇭🇷','🇧🇬','🇱🇹','🇱🇻','🇪🇪','🇱🇺','🇲🇹','🇨🇾'].map((f,i) => (
            <span key={i} className="text-2xl">{f}</span>
          ))}
        </div>
      </div>
      <div className="hidden lg:block w-[260px]">
        <WorldDots />
      </div>
    </div>
  </section>
);

// ─── FAQ ───────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'Why get the Pexly Card?', a: 'Spend your crypto anywhere VISA is accepted — with zero monthly fees, instant top-up, and global acceptance.' },
  { q: 'Where can I use it?', a: 'Online and in store wherever VISA is accepted, globally. ATM withdrawals available with the physical card.' },
  { q: 'What fees are there?', a: 'Only a 1.99% deposit fee. Card creation, monthly use, foreign transactions, and cash-out are all free.' },
  { q: 'What are the spending limits?', a: 'Starter: €7,500/day and €7,500/month. Higher limits available with enhanced identity verification.' },
  { q: 'Who is eligible?', a: 'EU nationals and residents across 27 countries. A simple identity check through our card partner is required.' },
  { q: 'When does the physical card launch?', a: 'Very soon. Join the waitlist and you\'ll be first in line.' },
];

const FAQSection = () => (
  <section className="px-4 pb-10">
    <div className="max-w-2xl mx-auto">
      <div className="mb-7">
        <span className="text-label text-primary">FAQ</span>
        <h2 className="text-display-lg text-foreground mt-1">Questions answered</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f${i}`}
            className="bg-card border border-border rounded-xl px-5 overflow-hidden">
            <AccordionTrigger className="text-foreground font-semibold py-4 text-left hover:no-underline text-sm">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
              {f.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

// ─── FINAL CTA ─────────────────────────────────────────────────────────────
const CTASection = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section className="px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="relative rounded-3xl p-10 md:p-14 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(215 28% 10%) 0%, hsl(215 28% 7%) 100%)',
            border: '1px solid hsl(75 85% 60% / 0.2)',
            boxShadow: '0 0 60px hsl(75 85% 60% / 0.07)',
          }}>
          {/* Glow top */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full"
            style={{ background: 'radial-gradient(ellipse, #B4F22E22 0%, transparent 70%)', filter: 'blur(20px)' }} />
          {/* Faint card watermark */}
          <div className="pointer-events-none absolute -bottom-6 -right-4 w-44 opacity-[0.06] rotate-12">
            <CardSVG />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
              style={{ border: '1px solid rgba(180,242,46,0.3)', background: 'rgba(180,242,46,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#B4F22E' }} />
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#B4F22E' }}>Limited early access</span>
            </div>

            <h2 className="text-display-lg text-white mb-3">Be first in line.</h2>
            <p className="text-sm text-white/50 mb-7 max-w-sm mx-auto">
              Drop your email and get notified the moment the Pexly Card goes live in your country.
            </p>

            {!sent ? (
              <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }} />
                <Button onClick={() => email && setSent(true)}
                  className="h-11 px-5 rounded-xl font-semibold text-sm whitespace-nowrap glow-primary">
                  Join waitlist <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 font-semibold" style={{ color: '#B4F22E' }}>
                <CheckCircle className="w-5 h-5" /> You're on the list!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function VisaCard() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Marquee />
      <div className="h-10" />
      <BentoGrid />
      <CardShowcase />
      <div className="h-4" />
      <CryptoDeposit />
      <div className="h-4" />
      <SecuritySection />
      <div className="h-8" />
      <CountriesSection />
      <div className="h-4" />
      <FAQSection />
      <CTASection />
      <AppFooter />
    </main>
  );
}
