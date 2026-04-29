import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { QRCodeSVG as QRCode } from "qrcode.react";


/* ─── Inline SVG icons (no emojis) ──────────────────────────────────────── */
function SvgZap({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"
        fill="currentColor" stroke="currentColor" strokeWidth="1.2"
        strokeLinejoin="round" />
    </svg>
  );
}

function SvgShield({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3L4 7v5c0 5.25 3.75 10.15 8 11.5C16.25 22.15 20 17.25 20 12V7L12 3z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgFee({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v1.5M12 15.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 10a2.5 2 0 015 0c0 1.4-1.2 2-2.5 2s-2.5.7-2.5 2a2.5 2 0 005 0"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SvgGlobe({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3C12 3 9 8 9 12s3 9 3 9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3c0 0 3 5 3 9s-3 9-3 9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

function SvgClock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Feature icons — custom SVG paths
───────────────────────────────────────────────────────────────────────────── */
function IconInstant() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <path d="M22 8L10 22h10l-2 10 12-14H20L22 8z"
        fill="hsl(var(--primary))" />
    </svg>
  );
}
function IconFees() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <circle cx="20" cy="17" r="6" stroke="hsl(var(--primary))" strokeWidth="2" />
      <path d="M20 11V8M20 26v3" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 20h6" stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 20l-2 2.5" stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconGlobal() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <circle cx="20" cy="20" r="11" stroke="hsl(var(--primary))" strokeWidth="1.8" />
      <path d="M20 9c0 0-4 5-4 11s4 11 4 11" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M20 9c0 0 4 5 4 11s-4 11-4 11" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M9 20h22" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M10.5 14.5h19M10.5 25.5h19" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}
function IconSecure() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <path d="M20 8L11 13v8c0 6 4.5 11.5 9 13 4.5-1.5 9-7 9-13v-8L20 8z"
        stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 20.5l3 3 6-6"
        stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMicro() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <circle cx="14" cy="20" r="5" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="27" cy="14" r="3.5" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <circle cx="27" cy="26" r="3.5" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M19 17.5l4.5-2M19 22.5l4.5 2" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconAlways() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <rect width="40" height="40" rx="10" fill="hsl(var(--primary)/0.12)" />
      <circle cx="20" cy="21" r="10" stroke="hsl(var(--primary))" strokeWidth="1.8" />
      <path d="M20 14v7l4 2.5" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 9.5l2 3-3 1" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 9.5C25 7.5 22.5 6.5 20 6.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Step icons ─────────────────────────────────────────────────────────── */
function StepIconCreate() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="12" fill="hsl(var(--primary)/0.12)" />
      <path d="M16 24h16M24 16v16" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function StepIconShare() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="12" fill="hsl(var(--primary)/0.12)" />
      <circle cx="32" cy="16" r="4" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="16" cy="24" r="4" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="32" cy="32" r="4" stroke="hsl(var(--primary))" strokeWidth="2" />
      <path d="M20 22l8-4M20 26l8 4" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function StepIconReceive() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
      <rect width="48" height="48" rx="12" fill="hsl(var(--primary)/0.12)" />
      <path d="M24 14v14M18 22l6 6 6-6" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 34h16" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CIRCUIT BOARD BACKGROUND
   PCB-style horizontal/vertical traces with animated glowing signals.
   Pure SVG + CSS — no JS hooks required.
───────────────────────────────────────────────────────────────────────────── */
function CircuitBoard() {
  type Pt = [number, number];

  /* All waypoints must only change X *or* Y between steps (right-angle only) */
  const traces: Pt[][] = [
    [[0,60],[160,60],[160,180],[380,180],[380,60],[580,60]],
    [[0,180],[80,180],[80,320],[260,320],[260,240],[480,240],[480,420],[720,420]],
    [[860,60],[1060,60],[1060,180],[1280,180],[1280,60],[1440,60]],
    [[1100,280],[1300,280],[1300,160],[1440,160]],
    [[0,500],[200,500],[200,380],[460,380],[460,560],[700,560]],
    [[800,580],[1000,580],[1000,460],[1200,460],[1200,580],[1440,580]],
    [[0,340],[140,340],[140,440],[320,440],[320,340],[560,340],[560,220],[720,220]],
    [[720,420],[900,420],[900,300],[1080,300],[1080,420],[1300,420],[1300,300],[1440,300]],
    [[300,60],[300,140],[480,140],[480,60],[660,60],[660,180],[840,180],[840,60]],
    [[560,340],[560,500],[740,500],[740,380],[960,380],[960,500],[1140,500],[1140,340]],
    [[0,440],[100,440],[100,560],[200,560]],
    [[1240,440],[1340,440],[1340,560],[1440,560]],
  ];

  /* Manhattan distance = exact SVG path length for right-angle-only paths */
  const plen = (pts: Pt[]) =>
    pts.slice(1).reduce((s, p, i) => s + Math.abs(p[0]-pts[i][0]) + Math.abs(p[1]-pts[i][1]), 0);

  const toD = (pts: Pt[]) =>
    pts.map(([x,y], i) => `${i===0?"M":"L"}${x},${y}`).join(" ");

  const durations = [4.4, 5.9, 4.1, 3.8, 5.6, 5.1, 4.9, 5.4, 4.0, 6.2, 3.3, 3.6];
  const delays    = [0, -1.4, -0.9, -2.0, -1.6, -0.5, -1.9, -0.7, -2.4, -1.2, -0.3, -1.8];

  const lengths = traces.map(plen);

  return (
    <>
      <style>{`
        ${lengths.map((l,i) => `@keyframes cs${i}{from{stroke-dashoffset:22;}to{stroke-dashoffset:${-l};}}`).join("")}
        @keyframes node-pulse{0%,100%{opacity:.12;}50%{opacity:.40;}}
      `}</style>
      <svg
        viewBox="0 0 1440 640"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <defs>
          <filter id="pcb-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Dim base traces */}
        {traces.map((pts, i) => (
          <path
            key={`b${i}`}
            d={toD(pts)}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
            opacity={0.09}
          />
        ))}

        {/* Junction nodes — pulsing dots at every waypoint */}
        {traces.map((pts, pi) =>
          pts.map(([x,y], ji) => (
            <circle
              key={`n${pi}-${ji}`}
              cx={x} cy={y} r={2.5}
              fill="hsl(var(--primary))"
              style={{
                animation: `node-pulse ${1.8 + (pi+ji)*0.23}s ease-in-out infinite`,
                animationDelay: `${-(pi*0.4 + ji*0.15)}s`,
              }}
            />
          ))
        )}

        {/* Animated glowing signals */}
        {traces.map((pts, i) => (
          <path
            key={`s${i}`}
            d={toD(pts)}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
            opacity={0.9}
            strokeDasharray={`22 ${lengths[i] + 100}`}
            filter="url(#pcb-glow)"
            style={{
              animation: `cs${i} ${durations[i]}s linear infinite`,
              animationDelay: `${delays[i]}s`,
            }}
          />
        ))}
      </svg>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function Lightning() {
  const { user, session } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"receive" | "send">("receive");
  const [amount, setAmount] = useState("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{ lightning_invoice: string; amount: string } | null>(null);
  const [sendInvoice, setSendInvoice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReceive = async () => {
    if (!user) { setLocation("/signin"); return; }
    const receiveAmount = amount || "0.001";
    const satoshis = Math.round(parseFloat(receiveAmount) * 100_000_000);
    if (satoshis <= 0) { alert("Please enter a valid amount"); return; }
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const token = session?.access_token;
      if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL not configured");
      if (!token) throw new Error("Not signed in.");
      const response = await fetch(`${supabaseUrl}/functions/v1/opennode-create-invoice`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount: satoshis, description: `Deposit ${receiveAmount} BTC` }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || `HTTP ${response.status}`);
      if (data.success && data.invoice?.lightning_invoice) {
        setInvoiceData({ lightning_invoice: data.invoice.lightning_invoice, amount: receiveAmount });
        setShowReceiveModal(true);
        setAmount("");
      } else {
        throw new Error(data.error || "No invoice returned");
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!user) { setLocation("/signin"); return; }
    if (!amount || parseFloat(amount) <= 0) { alert("Please enter a valid amount"); return; }
    setShowSendModal(true);
  };

  const handleCopyInvoice = () => {
    if (invoiceData?.lightning_invoice) {
      navigator.clipboard.writeText(invoiceData.lightning_invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWithInvoice = () => {
    if (!sendInvoice.trim()) { alert("Please paste a valid Lightning invoice"); return; }
    alert(`Ready to send ${amount} BTC. Payment processing...`);
    setSendInvoice("");
    setShowSendModal(false);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — circuit board PCB traces
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background border-b border-border" style={{ minHeight: "80vh" }}>

        {/* PCB circuit board background */}
        <CircuitBoard />

        {/* Radial vignette — keeps centre readable */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, hsl(var(--background)/0.88) 30%, transparent 100%)" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-8"
          style={{ minHeight: "80vh" }}>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] tracking-tight mb-5 max-w-3xl">
            Instant.<br />
            <span className="text-primary">Frictionless.</span><br />
            Bitcoin.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-9 leading-relaxed">
            Send and receive BTC anywhere on earth in under a second, for a fraction of a cent. The Lightning Network is live on Pexly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs sm:max-w-none sm:w-auto">
            <Button size="lg"
              className="h-12 px-8 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => {
                setActiveTab("receive");
                document.getElementById("action-panel")?.scrollIntoView({ behavior: "smooth" });
              }}>
              Receive Bitcoin
            </Button>
            <Button size="lg" variant="outline"
              className="h-12 px-8 text-sm font-semibold rounded-xl transition-all hover:bg-primary/8"
              onClick={() => {
                setActiveTab("send");
                document.getElementById("action-panel")?.scrollIntoView({ behavior: "smooth" });
              }}>
              Send Bitcoin
            </Button>
          </div>

        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {[
            { label: "Settlement time", value: "< 1 sec" },
            { label: "Average fee", value: "< $0.01" },
            { label: "Network nodes", value: "15,000+" },
            { label: "Countries supported", value: "190+" },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-2">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary mb-3">How it works</p>
        <h2 className="text-3xl font-bold text-foreground mb-8 max-w-sm leading-tight">
          Three steps to your first Lightning payment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          <div className="hidden md:block absolute top-5 left-[calc(33.33%+24px)] right-[calc(33.33%+24px)] h-px border-t border-dashed border-border" />
          {[
            { step: "01", icon: <StepIconCreate />, title: "Create an invoice", desc: "Enter the BTC amount you want to receive and generate a Lightning invoice instantly." },
            { step: "02", icon: <StepIconShare />, title: "Share it", desc: "Copy the invoice string or let them scan the QR code. Works with any Lightning wallet." },
            { step: "03", icon: <StepIconReceive />, title: "Funds arrive instantly", desc: "Settlement in under a second. No block confirmations. No waiting room." },
          ].map((item) => (
            <div key={item.step}>
              <div className="flex items-center gap-4 mb-5">
                {item.icon}
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">{item.step}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEND / RECEIVE PANEL ─────────────────────────────────────────── */}
      <section id="action-panel" className="bg-muted/30 border-y border-border py-12 scroll-mt-20">
        <div className="max-w-lg mx-auto px-4 sm:px-8">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary mb-2 text-center">Transact now</p>
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">Send or receive BTC via Lightning</h2>

          {/* Tab switcher */}
          <div className="flex bg-card border border-border rounded-2xl p-1.5 mb-6 shadow-sm">
            {(["receive", "send"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={[
                  "flex-1 h-10 rounded-xl text-sm font-semibold transition-all",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}>
                {tab === "receive" ? "↓  Receive" : "↑  Send"}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2.5">
                {activeTab === "receive" ? "Request amount (BTC)" : "Amount to send (BTC)"}
              </label>
              <div className="relative">
                <input
                  type="number" step="0.00000001" min="0" placeholder="0.001"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-14 px-4 pr-14 border border-input rounded-xl bg-background text-foreground text-xl font-mono focus:ring-2 focus:ring-primary/25 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground tracking-widest">BTC</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Minimum: 0.00000001 BTC — 1 satoshi</p>
            </div>

            {!user ? (
              <div className="space-y-3">
                <Button size="lg" className="w-full h-12 font-bold rounded-xl text-sm" onClick={() => setLocation("/signin")}>
                  Sign in to continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Sign in only required to transact — browse freely.
                </p>
              </div>
            ) : (
              <Button size="lg" disabled={isLoading}
                className="w-full h-12 font-bold rounded-xl text-sm"
                onClick={activeTab === "receive" ? handleReceive : handleSend}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating invoice…
                  </span>
                ) : activeTab === "receive" ? (
                  <span className="flex items-center gap-2"><SvgZap className="w-4 h-4" /> Create Invoice</span>
                ) : (
                  <span className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Send Now</span>
                )}
              </Button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">Powered by OpenNode</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Trust pills — SVG icons, no emoji */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <SvgZap className="w-4 h-4 mx-auto mb-1 text-primary" />, label: "Instant" },
                { icon: <SvgShield className="w-4 h-4 mx-auto mb-1 text-primary" />, label: "Non-custodial" },
                { icon: <SvgFee className="w-4 h-4 mx-auto mb-1 text-primary" />, label: "Near-zero fees" },
              ].map((item) => (
                <div key={item.label} className="bg-muted/60 rounded-xl p-3 text-center">
                  {item.icon}
                  <p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary mb-3">Why Lightning</p>
        <h2 className="text-3xl font-bold text-foreground mb-8">Built for real-world payments</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <IconInstant />, title: "Instant settlement", desc: "Transactions confirm in milliseconds. No waiting for block confirmations — payment is final the moment it leaves your wallet." },
            { icon: <IconFees />, title: "Negligible fees", desc: "Move any amount for less than a fraction of a cent. Routing fees are typically 0–0.1%, often just a few satoshis." },
            { icon: <IconGlobal />, title: "Globally borderless", desc: "190+ countries, no bank account required. If the recipient has a Lightning wallet, you can pay them in seconds." },
            { icon: <IconSecure />, title: "Cryptographically secure", desc: "Payment channels are secured by on-chain Bitcoin contracts. The network enforces the rules — no trusted third party." },
            { icon: <IconMicro />, title: "Micropayments", desc: "Pay per article, per API call, per second of streaming. Lightning makes sub-cent value transfer practical." },
            { icon: <IconAlways />, title: "Always on", desc: "The Lightning Network runs 24/7/365 — no business hours, no cut-off times, no public holidays." },
          ].map((f) => (
            <div key={f.title}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="mb-5">{f.icon}</div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIGHTNING ADDRESS BANNER ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-primary/8 border border-primary/20 px-8 py-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <SvgZap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary">Lightning Address</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Your personal Lightning address</h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Get a permanent address like{" "}
                <code className="font-mono text-primary/80 bg-primary/8 px-1.5 py-0.5 rounded text-xs">you@pexly.app</code>
                {" "}— share it once and receive payments forever.
              </p>
            </div>
            <Button className="shrink-0 h-11 px-6 text-sm font-bold rounded-xl transition-all hover:scale-[1.02]"
              onClick={() => user ? undefined : setLocation("/signup")}>
              {user ? "View My Address" : "Get Your Address"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-primary mb-3">FAQ</p>
          <h2 className="text-3xl font-bold text-foreground mb-8">Common questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "Is the Lightning Network safe?", a: "Yes. Lightning channels are secured by Bitcoin smart contracts called Hash Time-Locked Contracts (HTLCs). Your funds can only be claimed by the intended recipient — cryptographic guarantees are enforced by the network, not by any third party." },
              { q: "What is the Lightning Network used for?", a: "Lightning is designed for any payment that benefits from instant finality and low cost — retail purchases, cross-border remittances, micropayments for content or APIs, and high-frequency trading settlement." },
              { q: "How do I receive BTC via Lightning?", a: "Enter the amount above, click 'Create Invoice', and share the resulting QR code or invoice string with the sender. The payment arrives in your balance within seconds." },
              { q: "How do I send BTC via Lightning?", a: "Enter the amount you want to send, click 'Send Now', and paste the recipient's Lightning invoice (starts with lnbc…). Confirm and the payment routes through the network instantly." },
              { q: "Can I pay merchants with Lightning?", a: "Yes. Any merchant displaying a Lightning invoice QR code or a Lightning Address can be paid directly from your Pexly wallet. Millions of merchants worldwide already accept Lightning." },
              { q: "Why might a payment fail?", a: "Rare failures occur when routing nodes lack sufficient liquidity. Ensure your balance covers the amount plus routing fee, and that the invoice hasn't expired. Most payments succeed on the first attempt." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}
                className="border border-border rounded-xl px-6 bg-background">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── RECEIVE MODAL ────────────────────────────────────────────────── */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SvgZap className="w-4 h-4 text-primary" /> Lightning Invoice
            </DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <div className="space-y-4 pt-1">
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCode value={invoiceData.lightning_invoice} size={180} level="H" includeMargin />
                </div>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Amount</p>
                <p className="text-xl font-bold font-mono">{invoiceData.amount} BTC</p>
              </div>
              <div className="bg-muted rounded-xl p-4">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-bold">Invoice</p>
                <p className="text-xs font-mono break-all text-foreground/70 leading-relaxed line-clamp-3">
                  {invoiceData.lightning_invoice}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Expires in 1 hour</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopyInvoice} className="h-11 rounded-xl font-semibold text-sm">
                  {copied ? <><Check className="w-4 h-4 mr-2" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy Invoice</>}
                </Button>
                <Button onClick={() => setShowReceiveModal(false)} variant="outline" className="h-11 rounded-xl font-semibold text-sm">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── SEND MODAL ───────────────────────────────────────────────────── */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" /> Send via Lightning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Sending</p>
              <p className="text-xl font-bold font-mono">{amount} BTC</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2.5">
                Recipient's Lightning invoice
              </label>
              <textarea
                placeholder="lnbc1…"
                value={sendInvoice} onChange={(e) => setSendInvoice(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-xl bg-background text-foreground font-mono text-xs min-h-[100px] resize-none focus:ring-2 focus:ring-primary/25 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Lightning invoices start with "lnbc…"</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleSendWithInvoice} className="h-11 rounded-xl font-semibold text-sm">Send Now</Button>
              <Button onClick={() => { setSendInvoice(""); setShowSendModal(false); }}
                variant="outline" className="h-11 rounded-xl font-semibold text-sm">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
