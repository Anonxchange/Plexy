import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Zap, Flame, Shield, Star, Gift, ChevronRight, CheckCircle2,
  Lock, Trophy, Users, ArrowUpRight, Sparkles, Medal, Copy,
  TrendingUp, Wallet, BadgeCheck,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  xp: number;
  done: boolean;
  cta: string;
}

interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface Tier {
  name: string;
  minXP: number;
  maxXP: number;
  textColor: string;
  gradient: string;
  ringGlow: string;
  icon: React.ReactNode;
  perks: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS: Tier[] = [
  {
    name: "Newcomer",
    minXP: 0,
    maxXP: 999,
    textColor: "text-slate-500",
    gradient: "from-slate-500 to-slate-600",
    ringGlow: "",
    icon: <Star className="w-4 h-4" />,
    perks: ["Basic trading access", "Standard fees"],
  },
  {
    name: "Bronze",
    minXP: 1000,
    maxXP: 4999,
    textColor: "text-amber-600 dark:text-amber-500",
    gradient: "from-amber-600 to-orange-500",
    ringGlow: "ring-1 ring-amber-500/30",
    icon: <Medal className="w-4 h-4" />,
    perks: ["5% fee discount", "Priority support", "Bronze badge"],
  },
  {
    name: "Silver",
    minXP: 5000,
    maxXP: 14999,
    textColor: "text-slate-500 dark:text-slate-300",
    gradient: "from-slate-400 to-slate-500",
    ringGlow: "ring-1 ring-slate-400/30",
    icon: <Shield className="w-4 h-4" />,
    perks: ["10% fee discount", "Silver badge", "Lucky Draw entry"],
  },
  {
    name: "Gold",
    minXP: 15000,
    maxXP: 49999,
    textColor: "text-yellow-600 dark:text-yellow-400",
    gradient: "from-yellow-400 to-amber-500",
    ringGlow: "ring-1 ring-yellow-400/40",
    icon: <Trophy className="w-4 h-4" />,
    perks: ["20% fee discount", "Gold badge", "VIP events", "2× XP boost"],
  },
  {
    name: "Diamond",
    minXP: 50000,
    maxXP: Infinity,
    textColor: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-400 to-indigo-500",
    ringGlow: "ring-1 ring-cyan-400/40",
    icon: <Sparkles className="w-4 h-4" />,
    perks: ["30% fee discount", "Diamond badge", "Personal manager", "5× XP boost"],
  },
];

const TASKS: Task[] = [
  {
    id: "verify",
    icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />,
    title: "Verify your identity",
    description: "Complete KYC to unlock full trading",
    xp: 500,
    done: false,
    cta: "Verify now",
  },
  {
    id: "first-trade",
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    title: "Complete your first trade",
    description: "Buy or sell any crypto on Pexly",
    xp: 200,
    done: false,
    cta: "Start trading",
  },
  {
    id: "deposit",
    icon: <Wallet className="w-5 h-5 text-purple-500" />,
    title: "Make a crypto deposit",
    description: "Deposit any supported cryptocurrency",
    xp: 150,
    done: false,
    cta: "Deposit",
  },
  {
    id: "five-trades",
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    title: "Complete 5 trades",
    description: "Trade consistently and grow your XP",
    xp: 1000,
    done: false,
    cta: "View offers",
  },
  {
    id: "refer",
    icon: <Users className="w-5 h-5 text-pink-500" />,
    title: "Refer a friend",
    description: "Earn XP for every friend who signs up",
    xp: 300,
    done: false,
    cta: "Invite friends",
  },
  {
    id: "hundred",
    icon: <ArrowUpRight className="w-5 h-5 text-[#B4F22E]" />,
    title: "Trade $100 or more",
    description: "Complete a single trade worth $100+",
    xp: 400,
    done: false,
    cta: "Start trading",
  },
];

const BADGES: Badge[] = [
  { id: "first-trade", icon: "⚡", name: "First Spark", description: "Complete your first trade", unlocked: false, rarity: "common" },
  { id: "verified", icon: "✅", name: "Verified", description: "Complete identity verification", unlocked: false, rarity: "common" },
  { id: "streak-7", icon: "🔥", name: "On Fire", description: "7-day login streak", unlocked: false, rarity: "rare" },
  { id: "social", icon: "🤝", name: "Community", description: "Refer 5 friends to Pexly", unlocked: false, rarity: "rare" },
  { id: "power", icon: "💎", name: "Power Trader", description: "Complete 50 trades", unlocked: false, rarity: "epic" },
  { id: "diamond", icon: "👑", name: "Diamond Hands", description: "Reach Diamond tier", unlocked: false, rarity: "legendary" },
  { id: "streak-30", icon: "🌟", name: "Streak Master", description: "30-day login streak", unlocked: false, rarity: "epic" },
  { id: "whale", icon: "🐋", name: "Crypto Whale", description: "$10,000+ total volume", unlocked: false, rarity: "legendary" },
];

// ─── XP Ring ─────────────────────────────────────────────────────────────────

function XPRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnim(Math.min(progress, 1)), 300);
    return () => clearTimeout(t);
  }, [progress]);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="url(#xpG)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - anim)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <defs>
          <linearGradient id="xpG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B4F22E" />
            <stop offset="100%" stopColor="#7ECB0C" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Zap className="w-3.5 h-3.5 text-primary mb-0.5" />
        <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">XP</span>
      </div>
    </div>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({ tier, active, current }: { tier: Tier; active: boolean; current: boolean }) {
  return (
    <div className={cn(
      "relative flex-shrink-0 w-40 rounded-2xl p-4 border transition-all",
      current
        ? "border-primary/30 bg-primary/5 shadow-md " + tier.ringGlow
        : active
        ? "border-border bg-card"
        : "border-border bg-card opacity-50"
    )}>
      {current && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full tracking-wide uppercase whitespace-nowrap">
            Current
          </span>
        </div>
      )}
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br text-white text-sm",
        tier.gradient
      )}>
        {tier.icon}
      </div>
      <p className={cn("text-sm font-bold mb-0.5", tier.textColor)}>{tier.name}</p>
      <p className="text-[10px] text-muted-foreground mb-3 tabular-nums">
        {tier.maxXP === Infinity ? `${tier.minXP.toLocaleString()}+ XP` : `${tier.minXP.toLocaleString()} XP`}
      </p>
      <div className="space-y-1">
        {tier.perks.slice(0, 2).map((perk, i) => (
          <p key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="text-primary text-[8px]">✦</span> {perk}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
      task.done
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-card hover:bg-muted/50"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        task.done ? "bg-primary/15" : "bg-muted"
      )}>
        {task.done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : task.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-tight", task.done ? "text-muted-foreground line-through" : "text-foreground")}>
          {task.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{task.description}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
          +{task.xp.toLocaleString()} XP
        </span>
        {!task.done && (
          <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
            {task.cta} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

const rarityBorder = {
  common: "border-border",
  rare: "border-blue-500/25 dark:border-blue-500/20",
  epic: "border-purple-500/30 dark:border-purple-500/25",
  legendary: "border-yellow-500/35 dark:border-yellow-400/30",
};

const rarityBg = {
  common: "bg-card",
  rare: "bg-blue-50 dark:bg-blue-500/[0.05]",
  epic: "bg-purple-50 dark:bg-purple-500/[0.07]",
  legendary: "bg-yellow-50 dark:bg-yellow-400/[0.06]",
};

const rarityText = {
  common: "text-muted-foreground",
  rare: "text-blue-600 dark:text-blue-400",
  epic: "text-purple-600 dark:text-purple-400",
  legendary: "text-yellow-600 dark:text-yellow-400",
};

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={cn(
      "relative rounded-2xl p-3 border flex flex-col items-center text-center gap-1.5 transition-all",
      badge.unlocked
        ? cn(rarityBorder[badge.rarity], rarityBg[badge.rarity])
        : "border-border bg-muted/30 opacity-50"
    )}>
      {!badge.unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <Lock className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
      <span className={cn("text-2xl", !badge.unlocked && "grayscale opacity-40")}>{badge.icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-foreground leading-tight">{badge.name}</p>
        <p className={cn("text-[9px] font-semibold uppercase tracking-wider mt-0.5", rarityText[badge.rarity])}>
          {badge.rarity}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
    </div>
  );
}

// ─── Streak Days ──────────────────────────────────────────────────────────────

function StreakDays({ streak }: { streak: number }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay();
  const adjustedToday = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((day, i) => {
        const isPast = i < adjustedToday;
        const isToday = i === adjustedToday;
        const isFilled = isPast || isToday;
        return (
          <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
            <div className={cn(
              "w-full aspect-square rounded-xl flex items-center justify-center transition-all",
              isToday
                ? "bg-primary shadow-md shadow-primary/20"
                : isFilled
                ? "bg-primary/15 border border-primary/30"
                : "bg-muted border border-border"
            )}>
              {isToday ? (
                <Flame className="w-4 h-4 text-primary-foreground" />
              ) : isFilled ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <span className="text-muted-foreground/40 text-[10px]">○</span>
              )}
            </div>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isToday ? "text-primary" : isFilled ? "text-muted-foreground" : "text-muted-foreground/50"
            )}>
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_XP = 1_247;
const CURRENT_TIER = TIERS[1];
const NEXT_TIER = TIERS[2];
const STREAK = 5;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [promoCode, setPromoCode] = useState("");
  const [tab, setTab] = useState<"tasks" | "badges">("tasks");
  const [copied, setCopied] = useState(false);
  const referralCode = "PEXLY-X7Q2";

  const progressInTier = USER_XP - CURRENT_TIER.minXP;
  const tierRange = NEXT_TIER.minXP - CURRENT_TIER.minXP;
  const xpToNext = NEXT_TIER.minXP - USER_XP;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sticky Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">XP Rewards</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Level up, earn more</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums text-foreground">{USER_XP.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">XP</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8 space-y-5 pt-5">

        {/* ── Hero XP Card ───────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
          {/* Subtle lime glow — only in dark mode */}
          <div className="absolute -top-14 -right-14 w-48 h-48 bg-primary/5 dark:bg-primary/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/3 dark:bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6">
            {/* Top row: tier info + ring */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                {/* Tier badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0",
                    CURRENT_TIER.gradient
                  )}>
                    {CURRENT_TIER.icon}
                  </div>
                  <span className={cn("text-sm font-bold", CURRENT_TIER.textColor)}>{CURRENT_TIER.name}</span>
                </div>
                {/* XP count */}
                <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
                  {USER_XP.toLocaleString()}
                  <span className="text-lg font-medium text-muted-foreground ml-1.5">XP</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  <span className="text-primary font-semibold tabular-nums">{xpToNext.toLocaleString()} XP</span>
                  {" "}until {NEXT_TIER.name}
                </p>
              </div>
              <XPRing progress={progressInTier / tierRange} size={110} />
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                <span>{CURRENT_TIER.name}</span>
                <span>{NEXT_TIER.name}</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[#7ECB0C]"
                  style={{
                    width: `${Math.min((progressInTier / tierRange) * 100, 100)}%`,
                    transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>{CURRENT_TIER.minXP.toLocaleString()} XP</span>
                <span>{NEXT_TIER.minXP.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
              {[
                { label: "This week", value: "+320 XP", color: "text-primary" },
                { label: "Streak",     value: `${STREAK}d 🔥`,  color: "text-orange-500" },
                { label: "Rank",       value: "#4,821",          color: "text-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={cn("text-sm font-bold tabular-nums", stat.color)}>{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Daily Streak ────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Daily Streak</p>
                <p className="text-[10px] text-muted-foreground">Log in every day to earn XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-orange-500 tabular-nums">{STREAK}</p>
              <p className="text-[10px] text-muted-foreground">days</p>
            </div>
          </div>
          <StreakDays streak={STREAK} />
          <div className="mt-4 flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground">Today's reward</p>
            <p className="text-[11px] font-bold text-primary">+50 XP · Claim now</p>
          </div>
        </div>

        {/* ── Tier Journey ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Tier Journey</h2>
            <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All benefits <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {TIERS.map((tier) => (
              <TierCard
                key={tier.name}
                tier={tier}
                active={USER_XP >= tier.minXP}
                current={CURRENT_TIER.name === tier.name}
              />
            ))}
          </div>
        </div>

        {/* ── Tasks / Badges Tabs ─────────────────────────────── */}
        <div>
          <div className="flex gap-0.5 p-1 bg-muted border border-border rounded-xl mb-4">
            {(["tasks", "badges"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize",
                  tab === t
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "tasks" ? "Earn XP" : "Badges"}
              </button>
            ))}
          </div>

          {tab === "tasks" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                  {TASKS.filter(t => !t.done).length} tasks remaining
                </p>
                <p className="text-[11px] text-primary font-semibold">
                  +{TASKS.filter(t => !t.done).reduce((s, t) => s + t.xp, 0).toLocaleString()} XP available
                </p>
              </div>
              {TASKS.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}

          {tab === "badges" && (
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-1 mb-3">
                {BADGES.filter(b => b.unlocked).length}/{BADGES.length} unlocked
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {BADGES.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Referral Card ───────────────────────────────────── */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Refer & Earn</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Get <span className="text-primary font-semibold">300 XP</span> for every friend who joins and trades
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 py-2.5">
              <span className="text-xs font-mono font-bold text-foreground tracking-widest">{referralCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                copied
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── Promo Code ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-bold text-foreground mb-1">Promo Code</p>
          <p className="text-[11px] text-muted-foreground mb-3">Have a code? Enter it below to claim bonus XP.</p>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code e.g. PEXLY2025"
              className="flex-1 rounded-xl h-10 text-sm"
            />
            <Button
              disabled={!promoCode.trim()}
              className="bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl h-10 px-5 disabled:opacity-30"
            >
              Apply
            </Button>
          </div>
        </div>

        {/* ── Lucky Draw ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Lucky Draw</h2>
            <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">
              0 chances
            </span>
          </div>
          <div className="space-y-2">
            {[
              { title: "Convert $100 or more",    chances: 1, xp: 100  },
              { title: "Convert $1,000 or more",  chances: 2, xp: 200  },
              { title: "Convert $5,000 or more",  chances: 2, xp: 500  },
              { title: "Convert $15,000 or more", chances: 2, xp: 1500 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      +{item.chances} draw chance{item.chances > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
                    +{item.xp} XP
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-semibold rounded-lg"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Earn More Grid ──────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Earn More</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Lucky Spins",
                desc: "Spin to win XP & prizes",
                icon: "🎰",
                bg: "bg-purple-50 dark:bg-purple-500/10",
                border: "border-purple-200 dark:border-purple-500/20",
                btn: "text-purple-700 dark:text-purple-400",
              },
              {
                label: "Loyalty Badges",
                desc: "Complete challenges for badges",
                icon: "🏅",
                bg: "bg-amber-50 dark:bg-amber-500/10",
                border: "border-amber-200 dark:border-amber-500/20",
                btn: "text-amber-700 dark:text-amber-400",
              },
              {
                label: "Crypto Deposit",
                desc: "Earn XP on every deposit",
                icon: "💰",
                bg: "bg-emerald-50 dark:bg-emerald-500/10",
                border: "border-emerald-200 dark:border-emerald-500/20",
                btn: "text-emerald-700 dark:text-emerald-400",
              },
              {
                label: "Cashback",
                desc: "Get cashback on your trades",
                icon: "🎁",
                bg: "bg-pink-50 dark:bg-pink-500/10",
                border: "border-pink-200 dark:border-pink-500/20",
                btn: "text-pink-700 dark:text-pink-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.02]",
                  item.bg, item.border
                )}
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
                </div>
                <button className={cn("flex items-center gap-1 text-[10px] font-semibold mt-auto transition-all hover:gap-2", item.btn)}>
                  Explore <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <PexlyFooter />
    </div>
  );
}
