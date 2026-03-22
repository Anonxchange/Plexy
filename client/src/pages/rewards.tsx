import { useState, useEffect, useRef } from "react";
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
  category: "trade" | "identity" | "social" | "deposit";
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
  color: string;
  gradient: string;
  glow: string;
  icon: React.ReactNode;
  perks: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS: Tier[] = [
  {
    name: "Newcomer",
    minXP: 0,
    maxXP: 999,
    color: "text-slate-400",
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-slate-500/20",
    icon: <Star className="w-5 h-5" />,
    perks: ["Basic trading access", "Standard fees"],
  },
  {
    name: "Bronze",
    minXP: 1000,
    maxXP: 4999,
    color: "text-amber-500",
    gradient: "from-amber-600 to-orange-500",
    glow: "shadow-amber-500/30",
    icon: <Medal className="w-5 h-5" />,
    perks: ["5% fee discount", "Priority support", "Bronze badge"],
  },
  {
    name: "Silver",
    minXP: 5000,
    maxXP: 14999,
    color: "text-slate-300",
    gradient: "from-slate-400 to-slate-500",
    glow: "shadow-slate-400/30",
    icon: <Shield className="w-5 h-5" />,
    perks: ["10% fee discount", "Silver badge", "Lucky Draw entry"],
  },
  {
    name: "Gold",
    minXP: 15000,
    maxXP: 49999,
    color: "text-yellow-400",
    gradient: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-400/40",
    icon: <Trophy className="w-5 h-5" />,
    perks: ["20% fee discount", "Gold badge", "VIP events", "2× XP boost"],
  },
  {
    name: "Diamond",
    minXP: 50000,
    maxXP: Infinity,
    color: "text-cyan-400",
    gradient: "from-cyan-400 to-indigo-500",
    glow: "shadow-cyan-400/40",
    icon: <Sparkles className="w-5 h-5" />,
    perks: ["30% fee discount", "Diamond badge", "Personal manager", "5× XP boost"],
  },
];

const TASKS: Task[] = [
  {
    id: "verify",
    icon: <BadgeCheck className="w-5 h-5 text-emerald-400" />,
    title: "Verify your identity",
    description: "Complete KYC to unlock full trading",
    xp: 500,
    done: false,
    cta: "Verify now",
    category: "identity",
  },
  {
    id: "first-trade",
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    title: "Complete your first trade",
    description: "Buy or sell any crypto on Pexly",
    xp: 200,
    done: false,
    cta: "Start trading",
    category: "trade",
  },
  {
    id: "deposit",
    icon: <Wallet className="w-5 h-5 text-purple-400" />,
    title: "Make a crypto deposit",
    description: "Deposit any supported cryptocurrency",
    xp: 150,
    done: false,
    cta: "Deposit",
    category: "deposit",
  },
  {
    id: "five-trades",
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    title: "Complete 5 trades",
    description: "Trade consistently and grow your XP",
    xp: 1000,
    done: false,
    cta: "View offers",
    category: "trade",
  },
  {
    id: "refer",
    icon: <Users className="w-5 h-5 text-pink-400" />,
    title: "Refer a friend",
    description: "Earn XP for every friend who signs up",
    xp: 300,
    done: false,
    cta: "Invite friends",
    category: "social",
  },
  {
    id: "hundred",
    icon: <ArrowUpRight className="w-5 h-5 text-lime-400" />,
    title: "Trade $100 or more",
    description: "Complete a single trade worth $100+",
    xp: 400,
    done: false,
    cta: "Start trading",
    category: "trade",
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
  { id: "whale", icon: "🐋", name: "Crypto Whale", description: "Trade $10,000+ total volume", unlocked: false, rarity: "legendary" },
];

// ─── XP Ring ──────────────────────────────────────────────────────────────────

function XPRing({ xp, nextLevelXP, size = 140 }: { xp: number; nextLevelXP: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(xp / nextLevelXP, 1);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#xpGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animated)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B4F22E" />
            <stop offset="100%" stopColor="#7ECB0C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Zap className="w-4 h-4 text-[#B4F22E] mb-0.5" />
        <span className="text-2xl font-bold text-white tabular-nums leading-none">
          {xp.toLocaleString()}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">XP</span>
      </div>
    </div>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({ tier, active, current }: { tier: Tier; active: boolean; current: boolean }) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 w-44 rounded-2xl p-4 border transition-all duration-300",
        current
          ? "border-white/20 bg-white/5 shadow-xl " + tier.glow
          : active
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.02] opacity-50"
      )}
    >
      {current && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-bold bg-[#B4F22E] text-black px-2.5 py-0.5 rounded-full tracking-wide uppercase">
            Current
          </span>
        </div>
      )}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br text-white",
        tier.gradient
      )}>
        {tier.icon}
      </div>
      <p className={cn("text-sm font-bold mb-0.5", tier.color)}>{tier.name}</p>
      <p className="text-[10px] text-white/30 mb-3 tabular-nums">
        {tier.maxXP === Infinity ? `${tier.minXP.toLocaleString()}+ XP` : `${tier.minXP.toLocaleString()} XP`}
      </p>
      <div className="space-y-1">
        {tier.perks.slice(0, 2).map((perk, i) => (
          <p key={i} className="text-[10px] text-white/50 flex items-center gap-1">
            <span className="text-[#B4F22E] text-[8px]">✦</span> {perk}
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
      "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
      task.done
        ? "border-[#B4F22E]/20 bg-[#B4F22E]/5"
        : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        task.done ? "bg-[#B4F22E]/15" : "bg-white/5"
      )}>
        {task.done ? <CheckCircle2 className="w-5 h-5 text-[#B4F22E]" /> : task.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold leading-tight", task.done ? "text-white/40 line-through" : "text-white")}>
          {task.title}
        </p>
        <p className="text-[11px] text-white/35 mt-0.5 leading-tight">{task.description}</p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[11px] font-bold text-[#B4F22E] bg-[#B4F22E]/10 px-2 py-0.5 rounded-full tabular-nums">
          +{task.xp.toLocaleString()} XP
        </span>
        {!task.done && (
          <button className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-0.5 transition-colors">
            {task.cta} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

const rarityStyles = {
  common: "border-white/10 bg-white/[0.03]",
  rare: "border-blue-500/20 bg-blue-500/[0.05]",
  epic: "border-purple-500/25 bg-purple-500/[0.07]",
  legendary: "border-yellow-400/30 bg-yellow-400/[0.06]",
};

const rarityLabel = {
  common: "text-white/30",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={cn(
      "relative rounded-2xl p-4 border flex flex-col items-center text-center gap-2 transition-all",
      badge.unlocked ? rarityStyles[badge.rarity] : "border-white/5 bg-white/[0.02] opacity-40"
    )}>
      {!badge.unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <Lock className="w-4 h-4 text-white/20" />
        </div>
      )}
      <span className={cn("text-3xl", !badge.unlocked && "grayscale opacity-30")}>{badge.icon}</span>
      <div>
        <p className="text-xs font-semibold text-white/80 leading-tight">{badge.name}</p>
        <p className={cn("text-[9px] font-medium uppercase tracking-wider mt-0.5", rarityLabel[badge.rarity])}>
          {badge.rarity}
        </p>
      </div>
      <p className="text-[10px] text-white/30 leading-tight">{badge.description}</p>
    </div>
  );
}

// ─── Streak Day ───────────────────────────────────────────────────────────────

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
              "w-full aspect-square rounded-xl flex items-center justify-center text-sm transition-all",
              isToday
                ? "bg-[#B4F22E] shadow-lg shadow-[#B4F22E]/30"
                : isFilled
                ? "bg-[#B4F22E]/20 border border-[#B4F22E]/30"
                : "bg-white/5 border border-white/8"
            )}>
              {isToday ? (
                <Flame className="w-4 h-4 text-black" />
              ) : isFilled ? (
                <CheckCircle2 className="w-4 h-4 text-[#B4F22E]" />
              ) : (
                <span className="text-white/20 text-[10px]">○</span>
              )}
            </div>
            <span className={cn(
              "text-[9px] font-medium uppercase tracking-wider",
              isToday ? "text-[#B4F22E]" : isFilled ? "text-white/40" : "text-white/20"
            )}>
              {day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const USER_XP = 1_247;
const CURRENT_TIER = TIERS[1];
const NEXT_TIER = TIERS[2];
const STREAK = 5;

export default function RewardsPage() {
  const [promoCode, setPromoCode] = useState("");
  const [tab, setTab] = useState<"tasks" | "badges">("tasks");
  const [copied, setCopied] = useState(false);
  const referralCode = "PEXLY-X7Q2";

  const xpToNext = NEXT_TIER.minXP - USER_XP;
  const progressInTier = USER_XP - CURRENT_TIER.minXP;
  const tierRange = NEXT_TIER.minXP - CURRENT_TIER.minXP;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 border-b border-white/6 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white">XP Rewards</h1>
            <p className="text-[11px] text-white/35 mt-0.5">Level up, earn more</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full">
            <Zap className="w-3.5 h-3.5 text-[#B4F22E]" />
            <span className="text-sm font-bold tabular-nums text-white">{USER_XP.toLocaleString()}</span>
            <span className="text-[10px] text-white/30">XP</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8 space-y-6 pt-5">

        {/* ── Hero XP Card ── */}
        <div className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-[#111118] via-[#0f0f1a] to-[#0a0a0f]">
          {/* Background glow */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#B4F22E]/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
                    CURRENT_TIER.gradient
                  )}>
                    {CURRENT_TIER.icon}
                  </div>
                  <span className={cn("text-sm font-bold", CURRENT_TIER.color)}>{CURRENT_TIER.name}</span>
                </div>
                <p className="text-2xl font-bold text-white leading-tight">
                  {USER_XP.toLocaleString()} <span className="text-white/30 text-lg font-medium">XP</span>
                </p>
                <p className="text-[11px] text-white/35 mt-1">
                  <span className="text-[#B4F22E] font-semibold tabular-nums">{xpToNext.toLocaleString()} XP</span> to {NEXT_TIER.name}
                </p>
              </div>
              <XPRing xp={progressInTier} nextLevelXP={tierRange} size={120} />
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-white/30 font-medium uppercase tracking-wider">
                <span>{CURRENT_TIER.name}</span>
                <span>{NEXT_TIER.name}</span>
              </div>
              <div className="relative h-2 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#B4F22E] to-[#7ECB0C]"
                  style={{
                    width: `${Math.min((progressInTier / tierRange) * 100, 100)}%`,
                    transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-white/25 tabular-nums">
                <span>{CURRENT_TIER.minXP.toLocaleString()} XP</span>
                <span>{NEXT_TIER.minXP.toLocaleString()} XP</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/6">
              {[
                { label: "This week", value: "+320", color: "text-[#B4F22E]" },
                { label: "Streak", value: `${STREAK}d 🔥`, color: "text-orange-400" },
                { label: "Rank", value: "#4,821", color: "text-white" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={cn("text-sm font-bold tabular-nums", stat.color)}>{stat.value}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Daily Streak ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Daily Streak</p>
                <p className="text-[10px] text-white/35">Log in every day to earn XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-400 tabular-nums">{STREAK}</p>
              <p className="text-[10px] text-white/30">days</p>
            </div>
          </div>
          <StreakDays streak={STREAK} />
          <div className="mt-4 flex items-center justify-between bg-white/3 rounded-xl px-4 py-2.5">
            <p className="text-[11px] text-white/40">Today's reward</p>
            <p className="text-[11px] font-bold text-[#B4F22E]">+50 XP · Claim now</p>
          </div>
        </div>

        {/* ── Tier Journey ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Tier Journey</h2>
            <button className="text-[11px] text-white/35 hover:text-white/60 transition-colors flex items-center gap-1">
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

        {/* ── Tasks & Badges Tabs ── */}
        <div>
          <div className="flex gap-0.5 p-1 bg-white/4 border border-white/8 rounded-xl mb-4">
            {(["tasks", "badges"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize",
                  tab === t
                    ? "bg-white/10 text-white shadow"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                {t === "tasks" ? "Earn XP" : "Badges"}
              </button>
            ))}
          </div>

          {tab === "tasks" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium">
                  {TASKS.filter(t => !t.done).length} tasks remaining
                </p>
                <p className="text-[11px] text-[#B4F22E] font-semibold">
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
              <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium px-1 mb-3">
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

        {/* ── Referral Card ── */}
        <div className="rounded-2xl border border-[#B4F22E]/15 bg-[#B4F22E]/5 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#B4F22E]/15 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#B4F22E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Refer & Earn</p>
              <p className="text-[11px] text-white/40 mt-0.5">Get <span className="text-[#B4F22E] font-semibold">300 XP</span> for every friend who joins and trades</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <span className="text-xs font-mono font-bold text-white tracking-widest">{referralCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                copied
                  ? "bg-[#B4F22E]/20 text-[#B4F22E] border border-[#B4F22E]/30"
                  : "bg-[#B4F22E] text-black hover:bg-[#c9f53a]"
              )}
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── Promo Code ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <p className="text-sm font-bold text-white mb-1">Promo Code</p>
          <p className="text-[11px] text-white/35 mb-3">Have a code? Enter it below to claim bonus XP.</p>
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code e.g. PEXLY2025"
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-10 text-sm focus:border-[#B4F22E]/40 focus:ring-0"
            />
            <Button
              disabled={!promoCode.trim()}
              className="bg-[#B4F22E] text-black hover:bg-[#c9f53a] font-bold rounded-xl h-10 px-5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Apply
            </Button>
          </div>
        </div>

        {/* ── Lucky Draw Section ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Lucky Draw</h2>
            <span className="text-[10px] text-white/30 bg-white/5 border border-white/8 px-2 py-1 rounded-full">
              0 chances
            </span>
          </div>
          <div className="space-y-2">
            {[
              { title: "Convert $100 or more", chances: 1, xp: 100 },
              { title: "Convert $1,000 or more", chances: 2, xp: 200 },
              { title: "Convert $5,000 or more", chances: 2, xp: 500 },
              { title: "Convert $15,000 or more", chances: 2, xp: 1500 },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">+{item.chances} draw chance{item.chances > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#B4F22E] bg-[#B4F22E]/10 px-2 py-0.5 rounded-full">
                    +{item.xp} XP
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-semibold border-white/10 text-white/60 hover:bg-white/5 hover:text-white rounded-lg bg-transparent"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Earn More Grid ── */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3">Earn More</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Lucky Spins", desc: "Spin to win XP & prizes", icon: "🎰", color: "from-purple-500/20 to-indigo-500/10", border: "border-purple-500/15" },
              { label: "Loyalty Badges", desc: "Complete challenges for badges", icon: "🏅", color: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/15" },
              { label: "Crypto Deposit", desc: "Earn XP on every deposit", icon: "💰", color: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/15" },
              { label: "Cashback", desc: "Get cashback vouchers on trades", icon: "🎁", color: "from-pink-500/20 to-rose-500/10", border: "border-pink-500/15" },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border p-4 bg-gradient-to-br flex flex-col gap-3 cursor-pointer group transition-all hover:scale-[1.02]",
                  item.color, item.border
                )}
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{item.desc}</p>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-semibold text-[#B4F22E] mt-auto group-hover:gap-2 transition-all">
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
