import { useMemo } from "react";

const R = 42;
const H = R * Math.sqrt(3);
const COL_SPACING = R * 1.5;
const HEX = "currentColor";

function hexPoints(cx: number, cy: number, r = R) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function HoneycombGrid() {
  const cells = useMemo(() => {
    const out: { cx: number; cy: number; filled: boolean }[] = [];
    for (let col = -1; col <= 24; col++) {
      for (let row = -1; row <= 10; row++) {
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
      viewBox="0 0 1440 560"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="lhFade" cx="50%" cy="40%" r="75%">
          <stop offset="0%"   stopColor="white" stopOpacity="1" />
          <stop offset="60%"  stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0.05" />
        </radialGradient>
        <mask id="lhMask">
          <rect width="1440" height="560" fill="url(#lhFade)" />
        </mask>
        <filter id="lhGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g mask="url(#lhMask)">
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

      <polygon
        points={hexPoints(-60, 60, 180)}
        fill={HEX}
        fillOpacity="0.04"
        stroke={HEX}
        strokeWidth="2"
        strokeOpacity="0.25"
        filter="url(#lhGlow)"
      />
      <polygon
        points={hexPoints(1480, 500, 160)}
        fill={HEX}
        fillOpacity="0.04"
        stroke={HEX}
        strokeWidth="2"
        strokeOpacity="0.22"
        filter="url(#lhGlow)"
      />
      <polygon
        points={hexPoints(1200, 60, 100)}
        fill={HEX}
        fillOpacity="0.04"
        stroke={HEX}
        strokeWidth="1.5"
        strokeOpacity="0.22"
      />
    </svg>
  );
}

interface LegalPageHeroProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
}

export function LegalPageHero({ title, subtitle, lastUpdated }: LegalPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background dark:bg-none dark:bg-background pt-20 pb-40 px-4">
      <HoneycombGrid />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.30) 0%, hsl(var(--background) / 0.10) 50%, hsl(var(--background) / 0.55) 100%)",
        }}
      />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[80px] pointer-events-none dark:hidden" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[60px] pointer-events-none dark:hidden" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <p className="text-sm text-muted-foreground/70">
          Last Updated: {lastUpdated}
        </p>
      </div>
    </section>
  );
}
