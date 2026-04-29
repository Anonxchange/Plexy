import { useHead } from "@unhead/react";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/app-footer";

/* ─────────────────────────────────────────── data ── */

const values = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <path d="M8 36L24 12l16 24H8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M30 12a8 8 0 010 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Never settle",
    body1: "We operate with hunger, grit and determination. We're high-performing and believe in exacting standards.",
    body2: "We break the mould and are motivated to achieve what hasn't been done before. One eye on the next thing, and the other on the now.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 12a8 8 0 010 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "No egos",
    body1: "We value what you bring, not the title you have or the power you yield.",
    body2: "We believe in the strength of many, not the contribution of one. Skills over seniority and action over motion. Humility is our superpower.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 4v30M6 14l18 10 18-10" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Liberate excellence",
    body1: "Passion is everything to us. Each individual is hired for one reason — because they're exceptional at what they do.",
    body2: "We provide space for ambition and allow people to be their brilliant self. Everyone is empowered with trust and autonomy.",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
        <path d="M24 12v12l8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    title: "With pace and precision",
    body1: "For us, impatience is a virtue. We are laser-focused on achieving outcomes at pace, but never risking quality.",
    body2: "Big goals require swift strides and we're ready to run at any challenge. We're quick to adapt and pivot when needed.",
  },
];

const benefits = [
  { label: "Competitive salaries & equity", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.8"/><path d="M13 20h14M20 14v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: "Unlimited PTO & flexible hours", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8"/><path d="M20 12v8l6 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: "100% remote & hybrid options", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><rect x="6" y="10" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M13 30v4M27 30v4M10 34h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: "Medical & mental health cover", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><path d="M20 34S6 26 6 16a8 8 0 0116-2 8 8 0 0116 2c0 10-14 18-18 18z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
  { label: "Learning & conference budget", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><path d="M6 10h28v20H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 16h16M12 22h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: "Gym pass & wellness perks", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><path d="M4 20h4M32 20h4M8 20v-6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2v-6M32 20v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2v-6M16 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  { label: "Modern global workspaces", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><path d="M20 4C13.373 4 8 9.373 8 16c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" stroke="currentColor" strokeWidth="1.8"/><circle cx="20" cy="16" r="4" stroke="currentColor" strokeWidth="1.8"/></svg> },
  { label: "Zero-fee crypto purchases", icon: <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9"><circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8"/><path d="M16 16h6a4 4 0 010 8h-6v-8zM16 24h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M20 14v2M20 24v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
];

const positions = [
  { title: "Junior Frontend Developer",  location: "San Francisco, CA", type: "Part time" },
  { title: "UI/UX and Product Designer", location: "London, UK",        type: "Full time" },
  { title: "Head of Branding",           location: "Remote",            type: "Full time" },
  { title: "Senior Backend Developer",   location: "San Francisco, CA", type: "Full time" },
  { title: "Customer Support Agent",     location: "Remote",            type: "Part time" },
];

const teamPhotos = [
  { img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", size: "lg", pos: "top-left" },
  { img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80", size: "sm", pos: "mid-left" },
  { img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80", size: "sm", pos: "bottom-right-inner" },
  { img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80", size: "lg", pos: "top-right" },
  { img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", size: "sm", pos: "bottom-center" },
];

const culturePhotos = [
  { label: "Team sessions", sub: "Collaborative by design",   img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" },
  { label: "Our offices",   sub: "London · New York · Remote", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" },
  { label: "Team lunch",    sub: "We eat together",            img: "https://images.unsplash.com/photo-1543269664-56d93c216abd?auto=format&fit=crop&w=400&q=80" },
];

/* ─────────────────────────────────── component ── */

const Careers = () => {
  useHead({
    title: "Careers | Join Pexly",
    meta: [{ name: "description", content: "Open roles at Pexly — join the team building next-generation decentralized financial tools." }],
  });

  return (
    <main className="overflow-x-hidden font-sans">

      {/* ══ 1. HERO ═════════════════════════════════════════════════════════ */}
      <section className="bg-background pt-12 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* ── MOBILE: stack heading then photos ── */}
          <div className="lg:hidden">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">We're hiring</p>
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-foreground mb-5">
                Elevate your <span className="text-primary">crypto</span> career
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                Looking for an exciting new role at a high-growth blockchain scale-up? We need passionate, thoughtful, curious, and purpose-led people. Come join us.
              </p>
              <Button size="lg" className="rounded-full px-10 text-base font-semibold">
                <a href="#positions">View open positions</a>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {teamPhotos.slice(0, 3).map((p, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-border" style={{ height: 160 }}>
                  <img src={p.img} alt="Team member" className="w-full h-full object-cover object-top" />
                </div>
              ))}
            </div>
          </div>

          {/* ── DESKTOP: floating photos + centered text ── */}
          <div className="hidden lg:block relative w-full" style={{ minHeight: 560 }}>

            {/* Center text — absolutely centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-8">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">We're hiring</p>
              <h1 className="text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight text-foreground mb-5 max-w-xl">
                Elevate your <span className="text-primary">crypto</span> career
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md">
                Looking for an exciting new role at a high-growth blockchain scale-up? We need passionate, thoughtful, curious, and purpose-led people.
              </p>
              <Button size="lg" className="rounded-full px-10 text-base font-semibold">
                <a href="#positions">View open positions</a>
              </Button>
            </div>

            {/* Top-left large */}
            <div className="absolute top-0 left-0 w-44 xl:w-52 rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height: 220 }}>
              <img src={teamPhotos[0].img} alt="" className="w-full h-full object-cover object-top" />
            </div>

            {/* Mid-left small */}
            <div className="absolute top-52 left-8 w-28 xl:w-32 rounded-2xl overflow-hidden border border-border shadow-md" style={{ height: 140 }}>
              <img src={teamPhotos[1].img} alt="" className="w-full h-full object-cover object-top" />
            </div>

            {/* Top-right large */}
            <div className="absolute top-0 right-0 w-52 xl:w-60 rounded-2xl overflow-hidden border border-border shadow-lg" style={{ height: 260 }}>
              <img src={teamPhotos[3].img} alt="" className="w-full h-full object-cover object-top" />
            </div>

            {/* Bottom-right-inner small */}
            <div className="absolute bottom-0 right-48 xl:right-64 w-28 xl:w-32 rounded-2xl overflow-hidden border border-border shadow-md" style={{ height: 130 }}>
              <img src={teamPhotos[2].img} alt="" className="w-full h-full object-cover object-center" />
            </div>

            {/* Bottom-center small */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-x-28 xl:translate-x-36 w-28 xl:w-32 rounded-2xl overflow-hidden border border-border shadow-md" style={{ height: 120 }}>
              <img src={teamPhotos[4].img} alt="" className="w-full h-full object-cover object-top" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. CULTURE — dark, rounded top ═════════════════════════════════ */}
      <section
        className="relative z-10 -mt-10 rounded-t-3xl bg-[hsl(0_0%_10%)] pt-16 pb-24"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* ── MOBILE: centered ── */}
          <div className="lg:hidden max-w-2xl mx-auto text-center mb-10">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-4">Our Culture</p>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white mb-5">
              What it's like to work at Pexly
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-2">
              Together, we are building a culture that nurtures high performance, aids accelerated development and is rich in diversity.
            </p>
            <p className="text-white/50 text-base leading-relaxed">
              We take our culture incredibly seriously and only hire people who share and embody our core values.
            </p>
          </div>
          <div className="lg:hidden grid grid-cols-1 gap-4">
            {culturePhotos.slice(0, 2).map((c, i) => (
              <div key={i} className="relative overflow-hidden rounded-3xl border border-white/10" style={{ height: 260 }}>
                <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <span className="text-white text-base font-semibold block">{c.label}</span>
                  <span className="text-white/60 text-sm">{c.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── DESKTOP: left text + right image collage ── */}
          <div className="hidden lg:grid grid-cols-2 gap-12 xl:gap-20 items-center">
            <div>
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">Our Culture</p>
              <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight text-white mb-6">
                What it's like to work at Pexly
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-4">
                Together, we are building a culture that nurtures high performance, aids accelerated development and is rich in diversity.
              </p>
              <p className="text-white/50 text-base leading-relaxed">
                We take our culture incredibly seriously and only hire people who share and embody our core values.
              </p>
            </div>

            <div className="relative" style={{ height: 400 }}>
              <div className="absolute top-0 left-0 right-32 bottom-0 rounded-2xl overflow-hidden border border-white/10">
                <img src={culturePhotos[0].img} alt={culturePhotos[0].label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-white text-sm font-semibold block">{culturePhotos[0].label}</span>
                  <span className="text-white/60 text-xs">{culturePhotos[0].sub}</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-28 rounded-2xl overflow-hidden border border-white/10" style={{ height: 180 }}>
                <img src={culturePhotos[1].img} alt={culturePhotos[1].label} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-28 rounded-2xl overflow-hidden border border-white/10" style={{ height: 170 }}>
                <img src={culturePhotos[2].img} alt={culturePhotos[2].label} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 3. VALUES ════════════════════════════════════════════════════════ */}
      <section className="relative z-20 -mt-10 rounded-3xl bg-background pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* ── MOBILE: centered heading + stacked list ── */}
          <div className="lg:hidden">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-4">Our Values</p>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">What we believe in</h2>
            </div>
            <div className="grid grid-cols-1 gap-y-12">
              {values.map((v, i) => (
                <div key={i} className="flex flex-col items-start text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border text-foreground mb-5">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground mb-3">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-2">{v.body1}</p>
                  <p className="text-foreground/70 text-sm leading-relaxed">{v.body2}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── DESKTOP: sticky left heading + right stacked values ── */}
          <div className="hidden lg:grid grid-cols-2 gap-16 xl:gap-24">
            <div>
              <div className="sticky top-24 pt-2">
                <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">Our Values</p>
                <h2 className="text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
                  What we believe in
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-14">
              {values.map((v, i) => (
                <div key={i} className="flex flex-col items-start">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border text-foreground mb-5">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground mb-3">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-2">{v.body1}</p>
                  <p className="text-foreground/70 text-sm leading-relaxed">{v.body2}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. BENEFITS ══════════════════════════════════════════════════════ */}
      <section
        className="relative z-30 -mt-10 rounded-t-3xl bg-[hsl(0_0%_10%)] pt-16 pb-24"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-4">Our Benefits</p>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white">
              Why work with us
            </h2>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.08] lg:grid lg:grid-cols-4 lg:divide-y-0 lg:gap-3">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex flex-row items-center gap-4 py-4 last:border-0
                           lg:flex-col lg:items-center lg:justify-start lg:text-center lg:gap-0
                           lg:py-8 lg:px-4 lg:rounded-2xl lg:border lg:border-white/[0.08] lg:bg-white/[0.04]"
              >
                <div className="text-primary flex-shrink-0 [&>svg]:w-10 [&>svg]:h-10 lg:[&>svg]:w-12 lg:[&>svg]:h-12 lg:mb-5">
                  {b.icon}
                </div>
                <p className="text-white font-semibold text-sm leading-snug">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 5. JOIN CTA ══════════════════════════════════════════════════════ */}
      <section
        id="positions"
        className="relative z-40 -mt-10 rounded-3xl bg-primary pt-16 pb-28 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-primary-foreground mb-4">
                Join our team
              </h2>
              <p className="text-primary-foreground/70 text-base mb-8 max-w-sm">
                Check out our open positions and elevate your blockchain career now.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="rounded-full px-8 font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90 mb-10"
              >
                View open positions
              </Button>

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

            <div className="rounded-2xl overflow-hidden bg-black/10">
              {positions.map((pos, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center justify-between px-5 py-4 border-b border-black/10 last:border-0 hover:bg-black/10 transition-colors group"
                >
                  <div>
                    <p className="font-bold text-primary-foreground text-sm leading-snug group-hover:underline">{pos.title}</p>
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

      {/* ══ 6. FOOTER ════════════════════════════════════════════════════════ */}
      <div className="relative z-30 -mt-16">
        <AppFooter />
      </div>

    </main>
  );
};

export default Careers;
