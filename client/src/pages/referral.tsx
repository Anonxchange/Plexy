import { useHead } from "@unhead/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Copy, Share2, ChevronDown, ChevronRight,
  Users, Coins, TrendingUp, CheckCircle2, ArrowRight,
  Zap, Gift, Star,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ─── Constants ────────────────────────────────────────────────────────────────

const PTS_PER_REFERRAL = 75;
const USDT_PER_REFERRAL = 2.5;
const FRIEND_USDT = 2.5;
const MAX_USDT = 250;
const TIER1_PCT = 40;
const TIER2_PCT = 10;

// Mock logged-in stats
const STATS = {
  referrals: 12,
  usdtEarned: 847.50,
  ptsEarned: 900,
  linkOpens: 38,
  signups: 14,
  kycDone: 12,
  firstTrade: 9,
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
      {children}
    </p>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 text-left">
        <span className="text-sm font-medium text-foreground pr-4">{q}</span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4 text-[13px] text-muted-foreground leading-relaxed">
        {a}
      </CollapsibleContent>
    </Collapsible>
  );
}

const FAQS = [
  {
    q: "What trading products does the commission apply to?",
    a: "All products on Pexly — P2P Trading, Spot Trading, and Swap. You earn commission from every trading fee your referrals generate.",
  },
  {
    q: "When do my rewards land?",
    a: "Points are credited instantly when your friend completes their first verified trade. USDT commission is distributed daily at 4 AM UTC.",
  },
  {
    q: "Why does my friend's referral show someone else's code?",
    a: "The first referral link used is permanently tied to that account. If they signed up via another link first, that code takes priority.",
  },
  {
    q: "Is there a cap on how much I can earn?",
    a: `You can earn up to ${MAX_USDT} USDT in USDT rewards. Points earnings are uncapped — invite as many friends as you like.`,
  },
  {
    q: "When does the program end?",
    a: "The program is ongoing. We'll give advance notice of any changes to commission rates or structure.",
  },
];

// ─── How It Works steps ───────────────────────────────────────────────────────

const STEPS = [
  { icon: Share2,      title: "Share your link",     body: "Copy your unique referral link or code and share it anywhere — social, chat, email." },
  { icon: Users,       title: "Friend signs up",      body: "They create a Pexly account using your link and complete identity verification." },
  { icon: TrendingUp,  title: "They trade",           body: "Once they complete their first trade you both get rewarded immediately." },
  { icon: Coins,       title: "You earn",             body: `${PTS_PER_REFERRAL} pts + ${USDT_PER_REFERRAL} USDT per friend, up to ${MAX_USDT} USDT total.` },
];

// ─── Commission split bar ─────────────────────────────────────────────────────

function CommissionBar() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Commission split</p>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Up to {TIER1_PCT}%</span>
      </div>

      {/* Split bar */}
      <div className="relative h-8 rounded-xl overflow-hidden flex">
        <div className="h-full bg-primary flex items-center justify-center" style={{ width: "66.6%" }}>
          <span className="text-[11px] font-bold text-primary-foreground">You {TIER1_PCT}%</span>
        </div>
        <div className="h-full bg-primary/25 flex items-center justify-center flex-1">
          <span className="text-[11px] font-bold text-primary">Friend {TIER2_PCT}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Tier 1 (your referrals)", value: `${TIER1_PCT}%`, sub: "of their trading fees" },
          { label: "Tier 2 (their referrals)", value: `${TIER2_PCT}%`, sub: "of trading fees" },
        ].map((row) => (
          <div key={row.label} className="bg-muted rounded-xl px-3 py-3">
            <p className="text-base font-bold text-foreground tabular-nums">{row.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{row.label}</p>
            <p className="text-[10px] text-muted-foreground/70 leading-tight">{row.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guest View ───────────────────────────────────────────────────────────────

function GuestView({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Refer &amp; Earn</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Invite friends, earn together</p>
          </div>
          <button
            onClick={onSignup}
            className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            Sign up
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4 pb-12">

        {/* Hero card */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6 pb-5">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-bold text-primary">Referral program</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                  Invite friends.<br />
                  <span className="text-primary">Earn together.</span>
                </h2>
                <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                  You earn <span className="text-foreground font-semibold">{PTS_PER_REFERRAL} pts + {USDT_PER_REFERRAL} USDT</span> for every friend who joins and trades. They get <span className="text-foreground font-semibold">{FRIEND_USDT} USDT</span> on their first trade.
                </p>
              </div>

              {/* Decorative stat bubble */}
              <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary flex flex-col items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-2xl font-black text-primary-foreground">{TIER1_PCT}%</span>
                <span className="text-[9px] font-bold text-primary-foreground/80 uppercase tracking-wider">Commission</span>
              </div>
            </div>

            {/* 3 reward metrics */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: "You get / friend", value: `${PTS_PER_REFERRAL} pts`, sub: `+ ${USDT_PER_REFERRAL} USDT`, color: "text-primary" },
                { label: "Friend gets", value: `${FRIEND_USDT} USDT`, sub: "on first trade", color: "text-foreground" },
                { label: "Max total", value: `$${MAX_USDT}`, sub: "USDT cap", color: "text-foreground" },
              ].map((m) => (
                <div key={m.label} className="bg-muted rounded-xl px-2 py-3 text-center">
                  <p className={cn("text-sm font-bold tabular-nums leading-tight", m.color)}>{m.value}</p>
                  <p className="text-[9px] text-muted-foreground/80 leading-tight">{m.sub}</p>
                  <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={onSignup}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Sign up to start earning
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* How it works */}
        <div>
          <SectionLabel>How it works</SectionLabel>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Step {i + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground mt-0.5">{step.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission split */}
        <CommissionBar />

        {/* FAQ */}
        <div>
          <SectionLabel>Frequently asked</SectionLabel>
          <div className="rounded-2xl border border-border bg-card px-5 divide-y divide-border">
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logged-in View ───────────────────────────────────────────────────────────

function LoggedInView({ referralCode, referralLink, onCopy, onShare }: {
  referralCode: string;
  referralLink: string;
  onCopy: (text: string, label: string) => void;
  onShare: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "completed" | "progress" | "expired">("all");
  const usdtProgress = Math.min((STATS.usdtEarned / MAX_USDT) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Refer &amp; Earn</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Invite friends, earn together</p>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums text-foreground">{STATS.ptsEarned.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4 pb-12">

        {/* Hero / referral card */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/4 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6">

            {/* Earnings headline */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total earned</p>
                <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                  ${STATS.usdtEarned.toLocaleString("en", { minimumFractionDigits: 2 })}
                  <span className="text-base font-medium text-muted-foreground ml-1.5">USDT</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  <span className="text-primary font-semibold">{STATS.ptsEarned.toLocaleString()} pts</span>
                  {" "}· {STATS.referrals} friends referred
                </p>
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary flex flex-col items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-xl font-black text-primary-foreground">{TIER1_PCT}%</span>
                <span className="text-[8px] font-bold text-primary-foreground/80 uppercase tracking-wider">Rate</span>
              </div>
            </div>

            {/* USDT progress */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
                <span>Earnings progress</span>
                <span className="tabular-nums">${STATS.usdtEarned} / ${MAX_USDT} USDT cap</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[#7ECB0C] transition-all duration-1000"
                  style={{ width: `${usdtProgress}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-5 pt-4 border-t border-border">
              {[
                { label: "Friends invited", value: STATS.referrals, color: "text-foreground" },
                { label: "Pts earned",       value: `+${STATS.ptsEarned}`, color: "text-primary" },
                { label: "Commission",       value: `${TIER1_PCT}%`, color: "text-foreground" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-sm font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Code row */}
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">Your referral code</p>
                <p className="font-mono font-black text-foreground text-base tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={() => onCopy(referralCode, "Referral code")}
                className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Link row */}
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-4 py-3 mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">Referral link</p>
                <p className="text-sm text-foreground truncate font-medium">{referralLink}</p>
              </div>
              <button
                onClick={() => onCopy(referralLink, "Referral link")}
                className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* CTA */}
            <button
              onClick={onShare}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              Invite &amp; Earn
            </button>
          </div>
        </div>

        {/* Per-referral reward callout */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Per referral reward</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              You earn <span className="text-primary font-bold">{PTS_PER_REFERRAL} pts</span> + <span className="text-primary font-bold">{USDT_PER_REFERRAL} USDT</span> · friend earns <span className="font-semibold text-foreground">{FRIEND_USDT} USDT</span>
            </p>
          </div>
          <Star className="w-4 h-4 text-primary/60 flex-shrink-0" />
        </div>

        {/* Funnel stats */}
        <div>
          <SectionLabel>Referral funnel</SectionLabel>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {[
              { label: "Link opened",             value: STATS.linkOpens, icon: ChevronRight },
              { label: "Signed up",               value: STATS.signups,   icon: CheckCircle2 },
              { label: "KYC completed",           value: STATS.kycDone,   icon: CheckCircle2 },
              { label: "Completed first trade",   value: STATS.firstTrade, icon: CheckCircle2, highlight: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <row.icon className={cn("w-4 h-4 flex-shrink-0", row.highlight ? "text-primary" : "text-muted-foreground/40")} />
                  <span className="text-sm text-foreground">{row.label}</span>
                </div>
                <span className={cn("text-sm font-bold tabular-nums", row.highlight ? "text-primary" : "text-foreground")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral list */}
        <div>
          <SectionLabel>Your referrals</SectionLabel>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-3">
            {(["all", "completed", "progress", "expired"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all",
                  activeTab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "progress" ? "In progress" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Empty state */}
          <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No referrals yet</p>
            <p className="text-[12px] text-muted-foreground mb-5">Share your link to start tracking friends here</p>
            <button className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold hover:opacity-90 transition-opacity">
              Share referral link
            </button>
          </div>
        </div>

        {/* Commission split */}
        <CommissionBar />

        {/* FAQ */}
        <div>
          <SectionLabel>Frequently asked</SectionLabel>
          <div className="rounded-2xl border border-border bg-card px-5 divide-y divide-border">
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  useHead({
    title: "Refer & Earn | Pexly",
    meta: [{ name: "description", content: "Invite friends to Pexly and earn points plus USDT commission on every trade they make." }],
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const referralCode = user?.id ? `PEX${user.id.slice(0, 8).toUpperCase()}` : "PEXUSER123";
  const referralLink = `https://pexly.com/signup?ref=${referralCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Pexly",
        text: `Use my referral code and get ${FRIEND_USDT} USDT when you complete your first trade! Code: ${referralCode}`,
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink, "Referral link");
    }
  };

  if (!user) {
    return <GuestView onSignup={() => navigate("/signup")} />;
  }

  return (
    <LoggedInView
      referralCode={referralCode}
      referralLink={referralLink}
      onCopy={copyToClipboard}
      onShare={shareReferral}
    />
  );
}
