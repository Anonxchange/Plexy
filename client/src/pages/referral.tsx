import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Copy, Share2, ChevronDown, Users, Coins,
  CheckCircle2, ArrowRight, Zap, Star, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ─── Program constants ────────────────────────────────────────────────────────

const PTS_PER_REFERRAL   = 75;
const MILESTONE_FRIENDS  = 5;
const MILESTONE_BONUS    = 400;
const TIER1_PCT          = 40;
const TIER2_PCT          = 10;

// Mock stats (replace with API data)
const STATS = {
  referrals:  3,
  ptsEarned:  225,
  linkOpens:  18,
  signups:    5,
  kycDone:    4,
  firstTrade: 3,
};

// ─── Animated points counter ──────────────────────────────────────────────────

function PtsCounter({ value, size = "large" }: { value: number; size?: "large" | "small" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const steps = 40;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      setDisplay(Math.round((value / steps) * i));
      if (i >= steps) clearInterval(tick);
    }, 20);
    return () => clearInterval(tick);
  }, [value]);
  return size === "large"
    ? <span className="text-4xl font-black text-foreground tabular-nums leading-none">{display.toLocaleString()}</span>
    : <span className="text-xl font-bold text-primary tabular-nums">{display.toLocaleString()}</span>;
}

// ─── Milestone dots ───────────────────────────────────────────────────────────

function MilestoneDots({ filled }: { filled: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {Array.from({ length: MILESTONE_FRIENDS }).map((_, i) => {
        const done = i < filled;
        const isNext = i === filled;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={cn(
              "w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-500",
              done  ? "bg-primary shadow-md shadow-primary/30"
              : isNext ? "bg-muted border-2 border-primary/40 border-dashed"
              : "bg-muted border border-border"
            )}>
              {done
                ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                : <Users className={cn("w-3.5 h-3.5", isNext ? "text-primary/50" : "text-muted-foreground/30")} />}
            </div>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider",
              done ? "text-primary" : isNext ? "text-muted-foreground/60" : "text-muted-foreground/30"
            )}>F{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Points badge SVG decoration ─────────────────────────────────────────────

function PtsBadge() {
  return (
    <div className="relative flex-shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        {/* Outer ring with dash pattern */}
        <circle cx="44" cy="44" r="40" stroke="#B4F22E" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        {/* Filled circle */}
        <circle cx="44" cy="44" r="32" fill="#B4F22E" />
        {/* Star shape in center */}
        <path d="M44 26 L47.5 37.5 L59.5 37.5 L50 44.5 L53.5 56 L44 49 L34.5 56 L38 44.5 L28.5 37.5 L40.5 37.5 Z"
          fill="#0a1a00" opacity="0.85" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-black text-primary-foreground/0 select-none" />
      </div>
      {/* Floating pts label */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary border-2 border-background rounded-full px-2 py-0.5 whitespace-nowrap">
        <span className="text-[10px] font-black text-primary-foreground uppercase tracking-wider">{PTS_PER_REFERRAL} pts</span>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
      {children}
    </p>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 text-left gap-4">
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4 text-[13px] text-muted-foreground leading-relaxed">
        {a}
      </CollapsibleContent>
    </Collapsible>
  );
}

const FAQS = [
  { q: "How do I earn points?", a: `You earn ${PTS_PER_REFERRAL} pts for every friend who signs up using your link and completes their first trade. Refer ${MILESTONE_FRIENDS} friends and unlock a bonus ${MILESTONE_BONUS} pts on top.` },
  { q: "What's the trading commission?", a: `On top of points, you earn ${TIER1_PCT}% of the trading fees your Tier 1 referrals generate, and ${TIER2_PCT}% from their referrals (Tier 2). This is paid in the traded asset.` },
  { q: "When are points credited?", a: "Points land in your account the moment your friend completes their first verified trade — no delays." },
  { q: "Why does my friend's code show someone else's?", a: "The code is permanently tied to the first referral link they used. If they clicked someone else's link first, that takes priority." },
  { q: "Is there a cap on referral points?", a: "No cap on points. Invite as many friends as you like — every one who trades earns you 75 pts." },
];

// ─── How it works steps ───────────────────────────────────────────────────────

const STEPS = [
  { icon: Share2,     label: "Share your link",   body: "Copy your unique link or code and send it to friends via chat, email, or social." },
  { icon: Users,      label: "Friend joins",       body: "They sign up using your link and complete identity verification." },
  { icon: TrendingUp, label: "They make a trade",  body: "Their first completed trade triggers the reward instantly." },
  { icon: Coins,      label: `You earn ${PTS_PER_REFERRAL} pts`, body: `Points land immediately. Hit ${MILESTONE_FRIENDS} friends and earn an extra ${MILESTONE_BONUS} pts bonus.` },
];

// ─── Commission split ─────────────────────────────────────────────────────────

function CommissionCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Trading fee commission</p>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          Up to {TIER1_PCT}%
        </span>
      </div>

      {/* Visual bar */}
      <div className="h-8 rounded-xl overflow-hidden flex text-[11px] font-bold">
        <div className="bg-primary flex items-center justify-center" style={{ width: "80%" }}>
          <span className="text-primary-foreground">Tier 1 · {TIER1_PCT}%</span>
        </div>
        <div className="bg-primary/20 flex items-center justify-center flex-1">
          <span className="text-primary">T2 · {TIER2_PCT}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { tier: "Tier 1", pct: `${TIER1_PCT}%`, desc: "Your direct referrals" },
          { tier: "Tier 2", pct: `${TIER2_PCT}%`, desc: "Their referrals" },
        ].map((t) => (
          <div key={t.tier} className="bg-muted rounded-xl px-3 py-3">
            <p className="text-lg font-black text-foreground tabular-nums">{t.pct}</p>
            <p className="text-[10px] font-semibold text-foreground/70 mt-0.5">{t.tier}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Commission is separate from points and is paid from your referrals' trading fees — distributed daily at 4 AM UTC.
      </p>
    </div>
  );
}

// ─── Guest view ───────────────────────────────────────────────────────────────

function GuestView({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Refer &amp; Earn</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earn points with every invite</p>
          </div>
          <button
            onClick={onSignup}
            className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/15 transition-colors"
          >
            Sign up free
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4 pb-16">

        {/* Hero card */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          {/* Blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6">
            {/* Tag line */}
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-5">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-bold text-primary tracking-wide">Referral rewards</span>
            </div>

            {/* Headline + badge */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-[26px] font-black text-foreground leading-tight tracking-tight">
                  Invite a friend.<br />
                  <span className="text-primary">Earn {PTS_PER_REFERRAL} points.</span>
                </h2>
                <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed">
                  Every friend who joins and makes their first trade earns you <span className="font-bold text-foreground">{PTS_PER_REFERRAL} pts</span>. Refer {MILESTONE_FRIENDS} friends and unlock a <span className="font-bold text-primary">{MILESTONE_BONUS} pts bonus</span>.
                </p>
              </div>
              <PtsBadge />
            </div>

            {/* Reward tiles */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: "Per friend",   value: `${PTS_PER_REFERRAL}`,  unit: "pts",   color: "text-primary",    bg: "bg-primary/8 border-primary/15" },
                { label: `${MILESTONE_FRIENDS} friends bonus`, value: `${MILESTONE_BONUS}`, unit: "pts", color: "text-primary", bg: "bg-primary/8 border-primary/15" },
                { label: "Commission",   value: `${TIER1_PCT}%`,         unit: "T1",    color: "text-foreground", bg: "bg-muted border-border" },
              ].map((m) => (
                <div key={m.label} className={cn("rounded-2xl border px-3 py-3 text-center", m.bg)}>
                  <p className={cn("text-lg font-black tabular-nums leading-none", m.color)}>
                    {m.value}<span className="text-[11px] font-bold ml-0.5 opacity-70">{m.unit}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Milestone progress preview */}
            <div className="rounded-2xl bg-muted border border-border px-4 py-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">5-friend milestone</p>
                  <p className="text-[11px] text-muted-foreground">Unlock {MILESTONE_BONUS} bonus pts</p>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2.5 py-1">
                  <Star className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-bold text-primary">+{MILESTONE_BONUS}</span>
                </div>
              </div>
              <MilestoneDots filled={0} />
            </div>

            <button
              onClick={onSignup}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Get started — it's free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* How it works */}
        <div>
          <SectionLabel>How it works</SectionLabel>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-start gap-4 px-5 py-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-0.5">Step {i + 1}</p>
                  <p className="text-sm font-bold text-foreground">{s.label}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission */}
        <CommissionCard />

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

// ─── Logged-in view ───────────────────────────────────────────────────────────

function LoggedInView({ code, link, onCopy, onShare }: {
  code: string; link: string;
  onCopy: (t: string, l: string) => void;
  onShare: () => void;
}) {
  const [tab, setTab] = useState<"all" | "completed" | "progress" | "expired">("all");
  const toMilestone = Math.max(MILESTONE_FRIENDS - STATS.referrals, 0);
  const milestoneReached = STATS.referrals >= MILESTONE_FRIENDS;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Refer &amp; Earn</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earn points with every invite</p>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums text-foreground">{STATS.ptsEarned.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4 pb-16">

        {/* Hero card */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6">
            {/* Points earned + badge */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Points from referrals</p>
                <div className="flex items-end gap-2">
                  <PtsCounter value={STATS.ptsEarned} />
                  <span className="text-base font-bold text-muted-foreground mb-1">pts</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5">
                  from <span className="font-bold text-foreground">{STATS.referrals}</span> referrals · <span className="text-primary font-semibold">{PTS_PER_REFERRAL} pts each</span>
                </p>
              </div>
              <PtsBadge />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border">
              {[
                { label: "Friends referred", value: STATS.referrals,           color: "text-foreground" },
                { label: "Pts per friend",   value: `${PTS_PER_REFERRAL}`,     color: "text-primary"    },
                { label: "Commission",       value: `${TIER1_PCT}%`,           color: "text-foreground" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={cn("text-sm font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestone tracker */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-foreground">
                {milestoneReached ? "Milestone unlocked!" : `${toMilestone} more to unlock`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Refer {MILESTONE_FRIENDS} friends → earn {MILESTONE_BONUS} bonus pts</p>
            </div>
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 border",
              milestoneReached
                ? "bg-primary/15 border-primary/25 text-primary"
                : "bg-muted border-border text-muted-foreground"
            )}>
              <Star className="w-3 h-3" />
              <span className="text-[11px] font-bold">+{MILESTONE_BONUS}</span>
            </div>
          </div>
          <MilestoneDots filled={Math.min(STATS.referrals, MILESTONE_FRIENDS)} />
          {!milestoneReached && (
            <div className="mt-4 bg-muted rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Progress</span>
              <span className="text-[11px] font-bold text-primary tabular-nums">
                {STATS.referrals} / {MILESTONE_FRIENDS} friends
              </span>
            </div>
          )}
        </div>

        {/* Referral code + link */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-bold text-foreground mb-1">Your invite</p>

          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground mb-0.5">Referral code</p>
              <p className="font-mono font-black text-foreground text-base tracking-widest">{code}</p>
            </div>
            <button
              onClick={() => onCopy(code, "Referral code")}
              className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-card transition-colors flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground mb-0.5">Referral link</p>
              <p className="text-sm text-foreground truncate font-medium">{link}</p>
            </div>
            <button
              onClick={() => onCopy(link, "Referral link")}
              className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-card transition-colors flex-shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <button
            onClick={onShare}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            Share &amp; Earn {PTS_PER_REFERRAL} pts
          </button>
        </div>

        {/* Funnel */}
        <div>
          <SectionLabel>Referral funnel</SectionLabel>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {[
              { label: "Link opened",           value: STATS.linkOpens,   done: false },
              { label: "Signed up",             value: STATS.signups,     done: false },
              { label: "KYC completed",         value: STATS.kycDone,     done: false },
              { label: "First trade completed", value: STATS.firstTrade,  done: true  },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0", row.done ? "text-primary" : "text-muted-foreground/30")} />
                  <span className="text-sm text-foreground">{row.label}</span>
                </div>
                <span className={cn("text-sm font-bold tabular-nums", row.done ? "text-primary" : "text-foreground")}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral list */}
        <div>
          <SectionLabel>Referral history</SectionLabel>

          {/* Segmented control */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-3">
            {(["all", "completed", "progress", "expired"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all",
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "progress" ? "Active" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Empty state */}
          <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-black text-primary-foreground">+{PTS_PER_REFERRAL}</span>
              </div>
            </div>
            <p className="text-sm font-bold text-foreground mb-1.5">No referrals yet</p>
            <p className="text-[12px] text-muted-foreground mb-5 max-w-[200px] leading-relaxed">
              Share your link — each friend who trades earns you {PTS_PER_REFERRAL} pts
            </p>
            <button
              onClick={onShare}
              className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold hover:opacity-90 transition-opacity"
            >
              Invite a friend
            </button>
          </div>
        </div>

        {/* Commission */}
        <CommissionCard />

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
    meta: [{ name: "description", content: `Invite friends to Pexly and earn ${PTS_PER_REFERRAL} points for every friend who joins and trades.` }],
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const code = user?.id ? `PEX${user.id.slice(0, 8).toUpperCase()}` : "PEXUSER123";
  const link = `https://pexly.com/signup?ref=${code}`;

  const onCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const onShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Pexly",
        text: `Join me on Pexly — use my referral code ${code} when you sign up and let's both earn rewards!`,
        url: link,
      });
    } else {
      onCopy(link, "Referral link");
    }
  };

  if (!user) return <GuestView onSignup={() => navigate("/signup")} />;
  return <LoggedInView code={code} link={link} onCopy={onCopy} onShare={onShare} />;
}
