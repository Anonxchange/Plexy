import { useState } from "react";
import { Coins, ArrowRight, Zap, TrendingUp, Users, Flame, Gift, Star, CheckCircle2, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PexlyFooter } from "@/components/pexly-footer";
import { TIERS } from "@/components/rewards/rewards-data";
import { RewardsHeroSection } from "@/components/rewards/rewards-hero-section";
import { RewardsTiersSection } from "@/components/rewards/rewards-tiers-section";
import { RewardsEngagementSection } from "@/components/rewards/rewards-engagement-section";
import {
  TierCrystalNewcomer, TierCrystalBronze, TierCrystalSilver,
  TierCrystalGold, TierCrystalDiamond,
} from "@/components/reward-icons";
import { PhoneIcon, AmazonIcon, SpotifyIcon } from "@/components/rewards/reward-brand-icons";
import {
  useRewardsProfile, useTaskCompletions,
  useCompleteTask, useClaimDailyLogin, useRedeemReward, useApplyPromo,
} from "@/hooks/use-rewards";

// ─── Tier crystal lookup ──────────────────────────────────────────────────────

function TierCrystal({ name, size = 72 }: { name: string; size?: number }) {
  const map: Record<string, JSX.Element> = {
    Newcomer: <TierCrystalNewcomer size={size} />,
    Bronze:   <TierCrystalBronze   size={size} />,
    Silver:   <TierCrystalSilver   size={size} />,
    Gold:     <TierCrystalGold     size={size} />,
    Diamond:  <TierCrystalDiamond  size={size} />,
  };
  return map[name] ?? null;
}

// ─── Tier perks ───────────────────────────────────────────────────────────────

const TIER_HERO_PERK: Record<string, string> = {
  Newcomer: "Standard trading rate",
  Bronze:   "3% fee discount · 1.2× pts",
  Silver:   "8% fee discount · 1.5× pts",
  Gold:     "18% fee discount · 2× pts",
  Diamond:  "28% fee discount · 3× pts",
};

// ─── Ways to earn ─────────────────────────────────────────────────────────────

const EARN_WAYS = [
  { icon: TrendingUp, label: "Trade Spot or Perp",     pts: "Earn pts on every trade",    color: "bg-blue-500/10 text-blue-500"     },
  { icon: Users,      label: "Refer a friend",        pts: "+75 pts per referral",        color: "bg-pink-500/10 text-pink-500"     },
  { icon: Flame,      label: "Daily login streak",    pts: "+5 pts/day + streak bonus",   color: "bg-orange-500/10 text-orange-500" },
  { icon: Star,       label: "Complete milestones",   pts: "Up to +500 pts per task",     color: "bg-primary/10 text-primary"       },
  { icon: Gift,       label: "Seasonal campaigns",    pts: "Bonus pts during events",     color: "bg-violet-500/10 text-violet-500" },
];

// ─── Redeem preview ───────────────────────────────────────────────────────────

const REDEEM_PREVIEW = [
  { icon: <PhoneIcon   size={44} />, name: "Mobile Airtime",   from: "800 pts"    },
  { icon: <AmazonIcon  size={44} />, name: "Amazon Gift Card", from: "4,500 pts"  },
  { icon: <SpotifyIcon size={44} />, name: "Spotify Premium",  from: "8,500 pts"  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How do I earn points?",
    a: "Points are earned automatically when you trade on Spot or Perp, log in daily, refer friends, and complete milestone tasks. Every action adds up — no manual claim needed.",
  },
  {
    q: "What do points unlock?",
    a: "Points determine your tier (Newcomer → Bronze → Silver → Gold → Diamond). Higher tiers give you trading fee discounts up to 28%, faster point earn rates up to 3×, more active offers, priority support, and Lucky Draw entries.",
  },
  {
    q: "What can I redeem points for?",
    a: "You can spend points on mobile airtime, data bundles, and gift cards for Amazon, Google Play, Apple, Uber, Spotify, Steam, Netflix, and more — directly inside the app.",
  },
  {
    q: "Do points expire?",
    a: "Points are valid as long as your account is active. Extended periods of inactivity (no trades or logins for 180+ days) may result in point expiry — you'll be notified well in advance.",
  },
  {
    q: "How does the referral bonus work?",
    a: "Share your unique referral link. When a friend signs up and completes their first trade, you earn 75 pts instantly. Refer 5 friends and unlock a 400 pts milestone bonus on top.",
  },
  {
    q: "Is the rewards program free to join?",
    a: "Yes — completely free. Create a Pexly account and you're automatically enrolled. Your first points start accumulating from your very first login.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 text-left gap-4">
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4 text-sm text-muted-foreground leading-relaxed">
        {a}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Guest landing ────────────────────────────────────────────────────────────

function RewardsGuestPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="relative border-b border-border bg-background overflow-hidden">
        {/* Gift card illustration — desktop only, right edge */}
        <img
          aria-hidden="true"
          src="/assets/IMG_4863.webp"
          alt=""
          className="hidden lg:block absolute right-[-24px] top-1/2 -translate-y-1/2 w-[460px] h-auto pointer-events-none select-none"
        />
        {/* Faint mirror on left — desktop only */}
        <img
          aria-hidden="true"
          src="/assets/svg-image-1-2.svg"
          alt=""
          className="hidden lg:block absolute pointer-events-none select-none opacity-[0.16]"
          style={{ left: "-110px", top: "50%", transform: "scaleX(-1) translateY(-50%)", width: "360px" }}
        />

        <div className="relative max-w-2xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-3.5 lg:py-5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Rewards</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Earn points, unlock more</p>
          </div>

          {/* Center tagline — desktop only */}
          <div className="hidden lg:flex flex-col items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <p className="text-sm font-black text-foreground tracking-tight">
              Trade more. <span className="text-primary">Earn more. Redeem anything.</span>
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
              <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-primary" /> Points for every trade</span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> 5 tiers to unlock</span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1"><Gift className="w-3 h-3 text-primary" /> 20+ real rewards</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/15 transition-colors"
          >
            Join free
          </button>
        </div>
      </div>

      {/* ── MOBILE layout (< lg) ─────────────────────────────────────────────── */}
      <div className="lg:hidden max-w-2xl mx-auto w-full px-4 py-5 space-y-5 pb-16">

        {/* Hero card */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">Pexly Rewards</span>
            </div>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-black text-foreground leading-tight tracking-tight">
                  Trade more.<br /><span className="text-primary">Earn more.</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Every trade, referral, and login earns you points. Climb five tiers, unlock fee discounts, and redeem points for real-world rewards.
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                {["Diamond", "Gold", "Silver"].map((name, i) => (
                  <div key={name} className="flex items-center gap-1.5 bg-muted border border-border rounded-full pl-2 pr-3 py-1.5"
                    style={{ opacity: 1 - i * 0.2, transform: `scale(${1 - i * 0.06})` }}>
                    {TIERS.find(t => t.name === name)?.icon}
                    <span className={cn("text-xs font-bold", TIERS.find(t => t.name === name)?.textColor)}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { value: "5",   unit: "tiers",     label: "to climb",   bg: "bg-primary/8 border-primary/15", val: "text-primary"    },
                { value: "28%", unit: "fee off",   label: "at Diamond", bg: "bg-muted border-border",         val: "text-foreground" },
                { value: "3×",  unit: "pts boost", label: "top tier",   bg: "bg-muted border-border",         val: "text-foreground" },
              ].map((m) => (
                <div key={m.label} className={cn("rounded-2xl border px-3 py-3.5 text-center", m.bg)}>
                  <p className={cn("text-2xl font-black tabular-nums leading-none", m.val)}>
                    {m.value}<span className="text-xs font-bold ml-0.5 opacity-70">{m.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{m.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/signup")}
              className="w-full h-13 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
              Start earning — it's free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier cards */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">5 tiers to unlock</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className="flex-shrink-0 w-[160px] rounded-2xl border border-border bg-card overflow-hidden">
                <div className={cn("h-1.5 w-full bg-gradient-to-r", tier.gradient)} />
                <div className="p-4 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className={cn("absolute inset-0 rounded-full blur-xl opacity-40 bg-gradient-to-br", tier.gradient)} />
                    <TierCrystal name={tier.name} size={68} />
                  </div>
                  <p className={cn("text-base font-black", tier.textColor)}>{tier.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{tier.tagline}</p>
                  <div className="mt-3 w-full bg-muted rounded-lg px-2 py-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">From</p>
                    <p className="text-sm font-black text-foreground tabular-nums">
                      {tier.minPts === 0 ? "0" : tier.minPts.toLocaleString()} pts
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2.5 leading-snug px-1">{TIER_HERO_PERK[tier.name]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ways to earn */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">How to earn points</p>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {EARN_WAYS.map((w) => (
              <div key={w.label} className="flex items-center gap-4 px-5 py-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", w.color)}>
                  <w.icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">{w.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{w.pts}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-muted-foreground/25 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Redeem preview */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Redeem your points</p>
          <div className="grid grid-cols-3 gap-3">
            {REDEEM_PREVIEW.map((r) => (
              <div key={r.name} className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center text-center gap-3">
                <div className="rounded-xl overflow-hidden">{r.icon}</div>
                <p className="text-xs font-bold text-foreground leading-snug">{r.name}</p>
                <div className="bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                  <p className="text-xs font-bold text-primary">from {r.from}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">+ data bundles, Apple, Uber, Netflix &amp; more</p>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Frequently asked</p>
          <div className="rounded-2xl border border-border bg-card px-5 divide-y divide-border">
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-6 text-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/30">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Ready to start earning?</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Join Pexly free. Your first points are waiting — log in daily, make a trade, or refer a friend.
            </p>
            <button onClick={() => navigate("/signup")}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("/signin")}
              className="w-full mt-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>

      {/* ── DESKTOP layout (≥ lg) ─────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-1">
        <div className="max-w-7xl mx-auto px-8 py-10 pb-20 space-y-6">

          {/* ── HERO: full-width two-column ──────────────────────────────────── */}
          <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/3 to-transparent pointer-events-none" />

            <div className="relative flex items-center gap-16 p-12">
              {/* Left: text + CTA */}
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-6">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">Pexly Rewards</span>
                </div>
                <h2 className="text-5xl font-black text-foreground leading-tight tracking-tight mb-4">
                  Trade more.<br /><span className="text-primary">Earn more.</span>
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8">
                  Every trade, referral, and login earns you points. Climb five tiers, unlock fee discounts up to 28%, and redeem for real-world rewards.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate("/signup")}
                    className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
                    Start earning — it's free <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate("/signin")}
                    className="px-6 py-3.5 rounded-2xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    Sign in
                  </button>
                </div>
              </div>

              {/* Right: bento stats + tier stack */}
              <div className="flex-shrink-0 flex flex-col gap-4 w-[340px]">
                {/* Stat bento grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "5",   unit: "tiers",     label: "to climb",   bg: "bg-primary/8 border-primary/20", val: "text-primary"    },
                    { value: "28%", unit: "fee off",   label: "at Diamond", bg: "bg-muted border-border",         val: "text-foreground" },
                    { value: "3×",  unit: "pts boost", label: "top tier",   bg: "bg-muted border-border",         val: "text-foreground" },
                  ].map((m) => (
                    <div key={m.label} className={cn("rounded-2xl border px-3 py-4 text-center", m.bg)}>
                      <p className={cn("text-2xl font-black tabular-nums leading-none", m.val)}>
                        {m.value}<span className="text-[10px] font-bold ml-0.5 opacity-70">{m.unit}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                {/* Tier pill stack */}
                <div className="flex flex-col gap-2">
                  {["Diamond", "Gold", "Silver", "Bronze"].map((name, i) => (
                    <div key={name} className="flex items-center gap-2.5 bg-muted/60 border border-border rounded-xl px-3 py-2.5"
                      style={{ opacity: 1 - i * 0.18 }}>
                      {TIERS.find(t => t.name === name)?.icon}
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm font-bold", TIERS.find(t => t.name === name)?.textColor)}>{name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{TIER_HERO_PERK[name]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── TIERS: 5-column grid ─────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">5 tiers to unlock</p>
            <div className="grid grid-cols-5 gap-4">
              {TIERS.map((tier) => (
                <div key={tier.name} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-border/80 hover:shadow-md transition-all">
                  <div className={cn("h-1.5 w-full bg-gradient-to-r", tier.gradient)} />
                  <div className="p-5 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <div className={cn("absolute inset-0 rounded-full blur-xl opacity-40 bg-gradient-to-br", tier.gradient)} />
                      <TierCrystal name={tier.name} size={72} />
                    </div>
                    <p className={cn("text-base font-black mb-1", tier.textColor)}>{tier.name}</p>
                    <p className="text-xs text-muted-foreground leading-snug mb-3">{tier.tagline}</p>
                    <div className="w-full bg-muted rounded-xl px-3 py-2.5 mb-2.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">From</p>
                      <p className="text-sm font-black text-foreground tabular-nums">
                        {tier.minPts === 0 ? "0" : tier.minPts.toLocaleString()} pts
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug px-1">{TIER_HERO_PERK[tier.name]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── EARN + REDEEM: side by side ──────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Ways to earn */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">How to earn points</p>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border h-full">
                {EARN_WAYS.map((w) => (
                  <div key={w.label} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", w.color)}>
                      <w.icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{w.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.pts}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground/25 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem preview */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Redeem your points</p>
              <div className="grid grid-cols-3 gap-3">
                {REDEEM_PREVIEW.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="rounded-xl overflow-hidden">{r.icon}</div>
                    <p className="text-xs font-bold text-foreground leading-snug">{r.name}</p>
                    <div className="bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                      <p className="text-xs font-bold text-primary">from {r.from}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* More rewards bento */}
              <div className="mt-3 rounded-2xl border border-border bg-muted/40 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">+ 20 more rewards</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Apple, Uber, Netflix, Google Play &amp; more</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-primary">
                  Browse all <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* ── FAQ + CTA: side by side ──────────────────────────────────────── */}
          <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* FAQ */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Frequently asked</p>
              <div className="rounded-2xl border border-border bg-card px-6 divide-y divide-border">
                {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>

            {/* CTA card */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-7 flex flex-col justify-center self-start sticky top-8">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary mb-5 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Coins className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Ready to start earning?</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Join Pexly free. Your first points are waiting — log in daily, make a trade, or refer a friend.
                </p>
                <button onClick={() => navigate("/signup")}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
                  Create free account <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate("/signin")}
                  className="w-full mt-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}

// ─── Logged-in view ───────────────────────────────────────────────────────────

function RewardsLoggedInPage() {
  const { data: profile } = useRewardsProfile();
  const { data: completions } = useTaskCompletions();
  const completeTask   = useCompleteTask();
  const claimLogin     = useClaimDailyLogin();
  const redeemReward   = useRedeemReward();
  const applyPromo     = useApplyPromo();

  const balance      = profile?.balance        ?? 0;
  const streak       = profile?.currentStreak  ?? 0;
  const weeklyPts    = profile?.weeklyPts      ?? 0;
  const rank         = profile?.rank           ?? 1;
  const referralCode = profile?.referralCode   ?? "";
  const dailyIds     = completions?.daily      ?? [];
  const permanentIds = completions?.permanent  ?? [];
  const todayUTC     = new Date().toISOString().split("T")[0];
  const loginClaimed = profile?.lastLoginDate  === todayUTC;

  const currentTierIndex = TIERS.reduce((acc, t, i) => (balance >= t.minPts ? i : acc), 0);
  const currentTier = TIERS[currentTierIndex];
  const nextTier    = TIERS[currentTierIndex + 1] ?? currentTier;
  const progressPct = currentTierIndex < TIERS.length - 1
    ? Math.min(100, ((balance - currentTier.minPts) / (nextTier.minPts - currentTier.minPts)) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header (illustrated, matches guest page) ──────────────────────────── */}
      <div className="relative border-b border-border bg-background overflow-hidden">
        {/* Gift card illustration — desktop only, right edge */}
        <img
          aria-hidden="true"
          src="/assets/svg-image-1-2.svg"
          alt=""
          className="hidden lg:block absolute right-[-24px] top-1/2 -translate-y-1/2 w-[460px] h-auto pointer-events-none select-none"
        />
        {/* Faint mirror on left — desktop only */}
        <img
          aria-hidden="true"
          src="/assets/svg-image-1-2.svg"
          alt=""
          className="hidden lg:block absolute pointer-events-none select-none opacity-[0.16]"
          style={{ left: "-110px", top: "50%", transform: "scaleX(-1) translateY(-50%)", width: "360px" }}
        />

        <div className="relative max-w-2xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-3.5 lg:py-5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Rewards</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earn points, redeem rewards</p>
          </div>

          {/* Center: tier progress — desktop only */}
          <div className="hidden lg:flex flex-col items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2">
              <div className={cn("w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br text-white text-xs", currentTier.gradient)}>
                {currentTier.emoji}
              </div>
              <span className={cn("text-sm font-black", currentTier.textColor)}>{currentTier.name}</span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm font-black text-foreground tabular-nums">{balance.toLocaleString()} pts</span>
              {currentTierIndex < TIERS.length - 1 && (
                <span className="text-xs text-muted-foreground">
                  · <span className="text-primary font-semibold">{(nextTier.minPts - balance).toLocaleString()} pts</span> to {nextTier.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 w-56">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#7ECB0C]"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(progressPct)}%</span>
            </div>
          </div>

          {/* Right: points badge */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums text-foreground">{balance.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        </div>
      </div>

      {/* ── MOBILE layout (< lg) ──────────────────────────────────────────────── */}
      <div className="lg:hidden flex-1 max-w-2xl mx-auto w-full px-4 pb-8 space-y-5 pt-5">
        <RewardsHeroSection
          balance={balance} streak={streak} weeklyPts={weeklyPts} rank={rank}
          onClaimLogin={() => claimLogin.mutate()} loginClaimed={loginClaimed}
        />
        <RewardsTiersSection userPts={balance} />
        <RewardsEngagementSection
          balance={balance} completedDailyIds={dailyIds} completedPermanentIds={permanentIds}
          referralCode={referralCode} onCompleteTask={(id) => completeTask.mutate(id)}
          onRedeem={(id) => redeemReward.mutate(id)} onApplyPromo={(code) => applyPromo.mutate(code)}
          isCompletingTask={completeTask.isPending} isRedeeming={redeemReward.isPending}
          isApplyingPromo={applyPromo.isPending}
        />
      </div>

      {/* ── DESKTOP layout (≥ lg) ─────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-1">
        <div className="max-w-7xl mx-auto px-8 py-8 pb-20">

          {/* ── Top stats bento row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Balance */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">Total Points</p>
              <p className="text-3xl font-black tabular-nums text-foreground leading-none">
                {balance.toLocaleString()}
                <span className="text-sm font-medium text-muted-foreground ml-1">pts</span>
              </p>
            </div>

            {/* Current tier */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Current Tier</p>
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0", currentTier.gradient)}>
                  {currentTier.emoji}
                </div>
                <div>
                  <p className={cn("text-lg font-black leading-none", currentTier.textColor)}>{currentTier.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{currentTier.tagline}</p>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Login Streak</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black tabular-nums text-orange-500 leading-none">{streak}</p>
                <p className="text-sm text-muted-foreground mb-0.5">days 🔥</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">+{weeklyPts} pts this week</p>
            </div>

            {/* Rank */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Global Rank</p>
              <p className="text-3xl font-black tabular-nums text-foreground leading-none">
                #{rank.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{TIER_HERO_PERK[currentTier.name]}</p>
            </div>
          </div>

          {/* ── Two-column main area ──────────────────────────────────────────── */}
          <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

            {/* LEFT: engagement (tasks / redeem / badges) */}
            <div>
              <RewardsEngagementSection
                balance={balance} completedDailyIds={dailyIds} completedPermanentIds={permanentIds}
                referralCode={referralCode} onCompleteTask={(id) => completeTask.mutate(id)}
                onRedeem={(id) => redeemReward.mutate(id)} onApplyPromo={(code) => applyPromo.mutate(code)}
                isCompletingTask={completeTask.isPending} isRedeeming={redeemReward.isPending}
                isApplyingPromo={applyPromo.isPending}
              />
            </div>

            {/* RIGHT sidebar: hero stats + tiers */}
            <div className="space-y-5 sticky top-6">
              <RewardsHeroSection
                balance={balance} streak={streak} weeklyPts={weeklyPts} rank={rank}
                onClaimLogin={() => claimLogin.mutate()} loginClaimed={loginClaimed}
              />
              <RewardsTiersSection userPts={balance} />
            </div>

          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!user) return <RewardsGuestPage />;
  return <RewardsLoggedInPage />;
}
