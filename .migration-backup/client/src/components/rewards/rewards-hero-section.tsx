import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Coins, Flame, CheckCircle2 } from "lucide-react";
import { TIERS } from "./rewards-data";

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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#xpG)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - anim)}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        <defs>
          <linearGradient id="xpG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B4F22E" />
            <stop offset="100%" stopColor="#7ECB0C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Coins className="w-3.5 h-3.5 text-primary mb-0.5" />
        <span className="text-[11px] font-bold text-foreground uppercase tracking-widest">PTS</span>
      </div>
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
              isToday ? "bg-primary shadow-md shadow-primary/20" : isFilled ? "bg-primary/15 border border-primary/30" : "bg-muted border border-border"
            )}>
              {isToday ? <Flame className="w-4 h-4 text-primary-foreground" /> : isFilled ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <span className="text-muted-foreground/40 text-[10px]">○</span>}
            </div>
            <span className={cn("text-[9px] font-medium uppercase tracking-wider", isToday ? "text-primary" : isFilled ? "text-muted-foreground" : "text-muted-foreground/50")}>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RewardsHeroSectionProps {
  balance: number;
  streak: number;
  weeklyPts: number;
  rank: number;
  onClaimLogin?: () => void;
  loginClaimed?: boolean;
}

// ─── Rewards Hero Section ─────────────────────────────────────────────────────

export function RewardsHeroSection({
  balance,
  streak,
  weeklyPts,
  rank,
  onClaimLogin,
  loginClaimed,
}: RewardsHeroSectionProps) {
  const currentTierIndex = TIERS.reduce((acc, t, i) => (balance >= t.minPts ? i : acc), 0);
  const CURRENT_TIER = TIERS[currentTierIndex];
  const NEXT_TIER = TIERS[currentTierIndex + 1] ?? CURRENT_TIER;
  const progressInTier = balance - CURRENT_TIER.minPts;
  const tierRange = NEXT_TIER.minPts - CURRENT_TIER.minPts || 1;
  const ptsToNext = NEXT_TIER.minPts - balance;

  return (
    <>
      {/* ── Hero Points Card ───────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
        <div className="absolute -top-14 -right-14 w-48 h-48 bg-primary/5 dark:bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/3 dark:bg-indigo-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0", CURRENT_TIER.gradient)}>
                  {CURRENT_TIER.emoji}
                </div>
                <span className={cn("text-sm font-bold", CURRENT_TIER.textColor)}>{CURRENT_TIER.name}</span>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
                {balance.toLocaleString()}
                <span className="text-lg font-medium text-muted-foreground ml-1.5">pts</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {currentTierIndex < TIERS.length - 1 ? (
                  <>
                    <span className="text-primary font-semibold tabular-nums">{ptsToNext.toLocaleString()} pts</span>
                    {" "}until {NEXT_TIER.name}
                  </>
                ) : (
                  <span className="text-primary font-semibold">Diamond — Elite tier</span>
                )}
              </p>
            </div>
            <XPRing progress={progressInTier / tierRange} size={110} />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <span>{CURRENT_TIER.name}</span>
              <span>{NEXT_TIER.name}</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-[#7ECB0C]"
                style={{ width: `${Math.min((progressInTier / tierRange) * 100, 100)}%`, transition: "width 1.2s cubic-bezier(0.4,0,0.2,1) 0.3s" }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
              <span>{CURRENT_TIER.minPts.toLocaleString()} pts</span>
              <span>{currentTierIndex < TIERS.length - 1 ? `${NEXT_TIER.minPts.toLocaleString()} pts` : "Max"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { label: "This week", value: `+${weeklyPts} pts`, color: "text-primary" },
              { label: "Streak",    value: `${streak}d 🔥`,     color: "text-orange-500" },
              { label: "Rank",      value: `#${rank.toLocaleString()}`, color: "text-foreground" },
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
              <p className="text-[10px] text-muted-foreground">Log in every day to earn points</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-500 tabular-nums">{streak}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
        </div>
        <StreakDays streak={streak} />
        <button
          onClick={onClaimLogin}
          disabled={loginClaimed}
          className={cn(
            "mt-4 w-full flex items-center justify-between rounded-xl px-4 py-2.5 transition-all",
            loginClaimed
              ? "bg-muted text-muted-foreground cursor-default"
              : "bg-primary/10 hover:bg-primary/15 cursor-pointer"
          )}
        >
          <p className="text-[11px] text-muted-foreground">Today's login reward</p>
          <p className={cn("text-[11px] font-bold", loginClaimed ? "text-muted-foreground" : "text-primary")}>
            {loginClaimed ? "Claimed ✓" : "+3 pts · Claim now"}
          </p>
        </button>
      </div>
    </>
  );
}
