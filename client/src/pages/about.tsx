import { useHead } from "@unhead/react";
import { Link } from "wouter";
import { ArrowRight, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────── data ── */

const stats = [
  { value: "180+",  label: "Countries supported" },
  { value: "120+",  label: "Cryptoassets listed" },
  { value: "$2.4B+",label: "Peer trading volume" },
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
    body: "To push the boundaries of peer-to-peer finance — always building for what comes next.",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 text-white">
        <path d="M16 4a8 8 0 00-3 15.4V22h6v-2.6A8 8 0 0016 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 26h6M14 29h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const team = [
  { name: "Alex Carter",     role: "CEO & Co-Founder",    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" },
  { name: "Priya Nair",      role: "CTO & Co-Founder",    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
  { name: "James Whitfield", role: "Chief Risk Officer",  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
  { name: "Sofia Mendes",    role: "VP of Product",       img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
  { name: "Liam O'Brien",    role: "Head of Engineering", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80" },
  { name: "Yuki Tanaka",     role: "Head of Compliance",  img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80" },
];

const press = [
  {
    outlet: "FINANCIAL TIMES",
    outletStyle: "font-serif italic",
    quote: "Pexly is redefining what peer-to-peer crypto trading looks like for the next generation of retail investors.",
  },
  {
    outlet: "CoinDesk",
    outletStyle: "font-bold tracking-wide",
    quote: "The platform has grown 300% year-over-year, making it one of the fastest-growing P2P exchanges in Europe.",
  },
  {
    outlet: "TechCrunch",
    outletStyle: "font-bold",
    quote: "Pexly's compliance-first approach puts it in a strong position as regulators tighten the screws on crypto.",
  },
];

const officePhotos = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
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
      <section className="bg-background px-6 lg:px-12 pt-14 pb-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-foreground mb-8">
            Our mission is to bring{" "}
            <span className="text-primary">crypto</span>{" "}
            to everyone
          </h1>
          <p className="text-foreground/60 text-lg md:text-xl leading-relaxed max-w-xl">
            Pexly is a peer-to-peer marketplace that gives anyone — from first-time buyers to seasoned traders — a fast, secure, and compliant way to buy and sell crypto with real people.
          </p>
        </div>

        {/* Stats 2×2 grid inside a bordered rounded box */}
        <div className="max-w-3xl mx-auto mt-14 grid grid-cols-2 border border-border rounded-3xl overflow-hidden">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`px-8 py-8 ${i % 2 === 0 ? "border-r border-border" : ""} ${i < 2 ? "border-b border-border" : ""}`}
            >
              <p className="text-primary text-4xl md:text-5xl font-extrabold tracking-tight leading-none mb-2">
                {s.value}
              </p>
              <p className="text-foreground/50 text-sm leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 2. WHO WE ARE ════════════════════════════════════════════════ */}
      <section className="bg-background px-6 lg:px-12 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Our Company
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-10">
            Who we are
          </h2>
          <div className="space-y-5 text-foreground/60 text-base md:text-lg leading-relaxed max-w-2xl">
            <p>
              Pexly is a global fintech company building the infrastructure that connects people who want to buy crypto with people who want to sell it — securely, compliantly, and at fair prices.
            </p>
            <p>
              Founded in 2021, we've grown from a small team of blockchain enthusiasts into a platform trusted by hundreds of thousands of users across more than 180 countries.
            </p>
            <p>
              With offices in London, New York, and a fully distributed remote team, Pexly brings together the best talent in fintech, compliance, and product design.
            </p>
            <p>
              We're backed by leading technology investors and guided by an experienced board committed to building something that actually lasts — not just something that moves fast.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 3. OFFICE PHOTOS ═════════════════════════════════════════════ */}
      <section className="bg-background px-6 lg:px-12 pb-16">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {officePhotos.map((src, i) => (
            <div key={i} className="w-full rounded-3xl overflow-hidden" style={{ height: 280 }}>
              <img src={src} alt="Pexly office" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* ══ 4. OUR VISION ════════════════════════════════════════════════ */}
      <section className="bg-background px-6 lg:px-12 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Our Vision
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8">
            Building the new economy
          </h2>
          <div className="space-y-5 text-foreground/60 text-base md:text-lg leading-relaxed max-w-2xl">
            <p>
              Blockchain and tokenization aren't just transforming finance — they're changing the way value is created, transferred, and owned.
            </p>
            <p>
              We're harnessing this technology to shape a more open, efficient, and equitable financial system — one that works for the many, not just the few with access to traditional banking.
            </p>
          </div>
        </div>
      </section>

      {/* ══ 5. VALUES — dark, rounded top ════════════════════════════════ */}
      <section
        className="rounded-t-3xl bg-[hsl(222_14%_10%)] px-6 lg:px-12 pt-16 pb-24"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Our Values
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-14">
            What we believe in
          </h2>
          <div className="flex flex-col items-center gap-16">
            {values.map((v, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
                  {v.icon}
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-3">{v.title}</h3>
                <p className="text-white/50 text-base leading-relaxed max-w-xs">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 6. TEAM — light, overlapping dark ════════════════════════════ */}
      <section className="relative z-10 -mt-10 rounded-3xl bg-background px-6 lg:px-12 pt-16 pb-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Our People
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            Senior management
          </h2>
          <p className="text-foreground/50 text-base leading-relaxed mb-12 max-w-lg">
            Our leadership team is comprised of seasoned executives with years of experience across fintech, compliance, and crypto.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
            {team.map((person, i) => (
              <div key={i}>
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
                  <img src={person.img} alt={person.name} className="w-full h-full object-cover object-top" />
                </div>
                <p className="font-bold text-foreground text-base leading-snug">{person.name}</p>
                <p className="text-foreground/50 text-sm mt-0.5 mb-3">{person.role}</p>
                <div className="flex items-center gap-2">
                  <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="text-foreground/30 hover:text-foreground/70 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. IN THE MEDIA — dark, overlapping team ═════════════════════ */}
      <section className="relative z-10 -mt-10 rounded-t-3xl bg-[hsl(222_14%_8%)] px-6 lg:px-12 pt-16 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Featured On
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-12">
            Pexly in the media
          </h2>
          <div className="flex flex-col gap-4">
            {press.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl px-7 py-7">
                <p className={`text-white/40 text-lg mb-5 ${p.outletStyle}`}>{p.outlet}</p>
                <p className="text-white text-lg leading-relaxed mb-5">"{p.quote}"</p>
                <a href="#" className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
                  Read full article <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. CAREERS CTA — light, overlapping dark ═════════════════════ */}
      <section className="relative z-20 -mt-10 rounded-3xl bg-background px-6 lg:px-12 pt-16 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary uppercase tracking-[0.18em] text-xs font-semibold mb-5">
            Careers
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Elevate your career
          </h2>
          <p className="text-foreground/50 text-base leading-relaxed mb-8 max-w-md">
            We're looking for exceptionally talented people to join our team and help us bring peer-to-peer crypto to the world.
          </p>
          <Link href="/careers">
            <Button size="lg" className="rounded-full px-10 font-semibold">
              Check Pexly careers
            </Button>
          </Link>

          <div className="mt-12 w-full rounded-3xl overflow-hidden" style={{ height: 260 }}>
            <img
              src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80"
              alt="Pexly team"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

    </main>
  );
};

export default About;
