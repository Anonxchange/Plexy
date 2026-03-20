import React, { useMemo } from "react";
import { HeroForm } from "@/components/hero-form";

const R = 42;
const H = R * Math.sqrt(3);
const COL_SPACING = R * 1.5;

function hexPoints(cx: number, cy: number, r = R) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

const HEX = "#0f172a";

function HoneycombGrid() {
  const cells = useMemo(() => {
    const out: { cx: number; cy: number; filled: boolean }[] = [];
    for (let col = -1; col <= 24; col++) {
      for (let row = -1; row <= 14; row++) {
        const cx = col * COL_SPACING;
        const cy = row * H + (col % 2 !== 0 ? H / 2 : 0);
        const filled = ((col * 5 + row * 11) % 7 === 0);
        out.push({ cx, cy, filled });
      }
    }
    return out;
  }, []);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="hgFade" cx="20%" cy="30%" r="80%">
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="65%"  stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </radialGradient>
        <mask id="hgMask">
          <rect width="1440" height="860" fill="url(#hgFade)" />
        </mask>

        <filter id="hexGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Honeycomb grid */}
      <g mask="url(#hgMask)">
        {cells.map(({ cx, cy, filled }, i) => (
          <polygon
            key={i}
            points={hexPoints(cx, cy)}
            fill={filled ? HEX : "none"}
            fillOpacity={filled ? 0.06 : 0}
            stroke={HEX}
            strokeWidth="0.9"
            strokeOpacity="0.22"
          />
        ))}
      </g>

      {/* Large accent — top-left, partially off-screen */}
      <polygon
        points={hexPoints(-60, 80, 200)}
        fill={HEX}
        fillOpacity="0.05"
        stroke={HEX}
        strokeWidth="2"
        strokeOpacity="0.30"
        filter="url(#hexGlow)"
      />
      <polygon
        points={hexPoints(-60, 80, 148)}
        fill="none"
        stroke={HEX}
        strokeWidth="1"
        strokeOpacity="0.14"
      />

      {/* Large accent — bottom-right */}
      <polygon
        points={hexPoints(1480, 780, 180)}
        fill={HEX}
        fillOpacity="0.04"
        stroke={HEX}
        strokeWidth="2"
        strokeOpacity="0.25"
        filter="url(#hexGlow)"
      />

      {/* Mid accent — top-right */}
      <polygon
        points={hexPoints(1300, 100, 120)}
        fill={HEX}
        fillOpacity="0.04"
        stroke={HEX}
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <polygon
        points={hexPoints(1300, 100, 80)}
        fill="none"
        stroke={HEX}
        strokeWidth="0.75"
        strokeOpacity="0.12"
      />

      {/* Small floating accent — center-left */}
      <polygon
        points={hexPoints(260, 560, 60)}
        fill={HEX}
        fillOpacity="0.05"
        stroke={HEX}
        strokeWidth="1.2"
        strokeOpacity="0.28"
      />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background min-h-[85vh] flex items-center" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>

      <HoneycombGrid />

      {/* Gradient wash behind text — fades hex pattern so text reads cleanly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, hsl(var(--background) / 0.88) 0%, hsl(var(--background) / 0.72) 35%, hsl(var(--background) / 0.20) 60%, transparent 100%)",
        }}
      />

      <div className="absolute top-10 right-0 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[80px] pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[60px] pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0)' }} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 relative z-10 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          <div className="text-center lg:text-left space-y-6 lg:space-y-8 max-w-4xl mx-auto lg:mx-0 mb-8 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-semibold">Trusted by 14M+ users worldwide</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-[1.1] lg:leading-[1.05] tracking-tight">
              <span className="block text-foreground">Trade crypto</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                your way
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-xl xl:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 lg:max-w-xl">
              Unlock the power of decentralized finance. Earn, shop, and manage crypto seamlessly simple, secure, and for everyone.
            </p>

            <div className="flex justify-between lg:justify-start items-center pt-4 max-w-[340px] mx-auto lg:mx-0 lg:max-w-none gap-4 lg:gap-12">
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[120px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">140+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Countries</div>
              </div>
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[180px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">500+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Payment methods</div>
              </div>
              <div className="text-center lg:text-left flex-1 lg:flex-none lg:w-[120px]">
                <div className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">14M+</div>
                <div className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap lg:mt-1">Users</div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto lg:mx-0 w-full">
            <HeroForm />
          </div>

        </div>
      </div>
    </section>
  );
}
