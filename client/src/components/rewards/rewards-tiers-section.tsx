import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Trophy, CheckCircle2, Coins, Gem } from "lucide-react";
import {
  TierIconNewcomer, TierIconBronze, TierIconSilver, TierIconGold, TierIconDiamond,
  TierCrystalNewcomer, TierCrystalBronze, TierCrystalSilver, TierCrystalGold, TierCrystalDiamond,
} from "@/components/reward-icons";
import { TIERS } from "./rewards-data";

// ─── Tier SVG helper ─────────────────────────────────────────────────────────

function TierSvgIcon({ name, size }: { name: string; size: number }) {
  switch (name) {
    case "Newcomer": return <TierIconNewcomer size={size} />;
    case "Bronze":   return <TierIconBronze   size={size} />;
    case "Silver":   return <TierIconSilver   size={size} />;
    case "Gold":     return <TierIconGold     size={size} />;
    case "Diamond":  return <TierIconDiamond  size={size} />;
    default:         return null;
  }
}

// ─── Tier crystal SVG lookup ──────────────────────────────────────────────────

function TierCrystalSvg({ name, owned }: { name: string; owned: boolean }) {
  const style: React.CSSProperties = owned ? {} : { filter: "grayscale(0.55) brightness(0.65)" };
  const s = 88;
  const map: Record<string, JSX.Element> = {
    Newcomer: <TierCrystalNewcomer size={s} />,
    Bronze:   <TierCrystalBronze   size={s} />,
    Silver:   <TierCrystalSilver   size={s} />,
    Gold:     <TierCrystalGold     size={s} />,
    Diamond:  <TierCrystalDiamond  size={s} />,
  };
  return <div style={style}>{map[name] ?? null}</div>;
}

// ─── Level Roadmap ────────────────────────────────────────────────────────────

function LevelRoadmap({ userPts }: { userPts: number }) {
  const currentTierIndex = TIERS.reduce((acc, t, i) => (userPts >= t.minPts ? i : acc), 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Level Roadmap</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">Every tier you still need to conquer</p>
      </div>

      <div className="px-5 pb-5 pt-3 space-y-0">
        {TIERS.map((tier, i) => {
          const isUnlocked = userPts >= tier.minPts;
          const isCurrent = i === currentTierIndex;
          const ptsAway = Math.max(0, tier.minPts - userPts);
          const progressPct = isCurrent && TIERS[i + 1]
            ? Math.min(100, ((userPts - tier.minPts) / (TIERS[i + 1].minPts - tier.minPts)) * 100)
            : isUnlocked ? 100 : 0;
          const isLast = i === TIERS.length - 1;

          return (
            <div key={tier.name} className="flex gap-4">
              {/* Left: connector line + dot */}
              <div className="flex flex-col items-center w-8 flex-shrink-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10",
                  isCurrent
                    ? "bg-primary shadow-md shadow-primary/30 ring-2 ring-primary/30"
                    : isUnlocked
                    ? "bg-gradient-to-br " + tier.gradient + " shadow-sm"
                    : "bg-muted border border-border"
                )}>
                  {isUnlocked ? (
                    <TierSvgIcon name={tier.name} size={18} />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                  )}
                </div>
                {!isLast && (
                  <div className={cn(
                    "w-0.5 flex-1 my-1 rounded-full min-h-[32px]",
                    isUnlocked ? "bg-primary/40" : "bg-border"
                  )} />
                )}
              </div>

              {/* Right: content */}
              <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-sm font-bold", isCurrent ? "text-primary" : isUnlocked ? tier.textColor : "text-muted-foreground")}>
                      {tier.name}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                        You are here
                      </span>
                    )}
                    {isUnlocked && !isCurrent && (
                      <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Done
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground flex-shrink-0">
                    {tier.minPts.toLocaleString()} pts
                  </span>
                </div>

                {isCurrent && TIERS[i + 1] && (
                  <div className="mt-2 mb-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{tier.tagline}</span>
                      <span className="tabular-nums font-semibold text-primary">{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[#7ECB0C]"
                        style={{ width: `${progressPct}%`, transition: "width 1s ease" }}
                      />
                    </div>
                  </div>
                )}

                {!isUnlocked && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold", tier.pillBg, tier.pillText)}>
                      <Coins className="w-3 h-3" />
                      {ptsAway.toLocaleString()} pts to unlock
                    </div>
                  </div>
                )}

                {/* Top 2 perks preview */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tier.benefits.filter(b => b.highlight).slice(0, 2).map((b, bi) => (
                    <span key={bi} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                      {b.label}: <span className="font-semibold text-foreground">{b.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tier Benefits Panel ──────────────────────────────────────────────────────

function TierBenefitsPanel({ userPts }: { userPts: number }) {
  const currentTierIndex = TIERS.reduce((acc, t, i) => (userPts >= t.minPts ? i : acc), 0);
  const [selected, setSelected] = useState<number | null>(null);

  const activeTier   = selected !== null ? TIERS[selected] : null;
  const isOwned      = activeTier ? userPts >= activeTier.minPts : false;
  const ptsNeeded    = activeTier ? Math.max(0, activeTier.minPts - userPts) : 0;

  function toggle(i: number) {
    setSelected(prev => (prev === i ? null : i));
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Gem className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Tier Benefits</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">Tap a tier to reveal its perks</p>
      </div>

      {/* Horizontally scrollable tier cards */}
      <div className="flex gap-3 overflow-x-auto pb-4 px-5 scrollbar-hide">
        {TIERS.map((t, i) => {
          const owned    = userPts >= t.minPts;
          const isCurr   = i === currentTierIndex;
          const isActive = selected === i;

          const statusLabel = isCurr ? "Current" : owned ? "Unlocked" : "Not started";
          const statusCls   = isCurr
            ? "bg-primary text-primary-foreground"
            : owned
            ? "bg-emerald-500/25 text-emerald-300"
            : "bg-white/10 text-white/60";

          return (
            <button
              key={t.name}
              onClick={() => toggle(i)}
              className={cn(
                "relative flex-shrink-0 w-56 h-36 rounded-2xl overflow-hidden transition-all duration-200",
                "bg-[#1c1c1e]",
                isActive
                  ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "ring-1 ring-white/8 hover:ring-white/20"
              )}
            >
              {/* Status badge */}
              <span className={cn(
                "absolute top-2.5 right-2.5 z-10 text-[9px] font-bold px-2.5 py-1 rounded-xl",
                statusCls
              )}>
                {statusLabel}
              </span>

              {/* Crystal SVG illustration */}
              <div className="absolute left-0 bottom-0 w-28 h-full flex items-end justify-center pointer-events-none pb-1">
                <TierCrystalSvg name={t.name} owned={owned} />
              </div>

              {/* Name + sub */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-right">
                <p className="text-2xl font-bold text-white leading-tight">{t.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {owned ? t.tagline : "Level up now"}
                </p>
              </div>

              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/20 pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Expanded benefits panel */}
      {activeTier && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <p className={cn("text-sm font-bold", activeTier.textColor)}>{activeTier.name} perks</p>
            {isOwned ? (
              <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Unlocked
              </span>
            ) : (
              <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5", activeTier.pillBg, activeTier.pillText)}>
                <Lock className="w-2.5 h-2.5" /> {ptsNeeded.toLocaleString()} pts away
              </span>
            )}
          </div>

          <div className="space-y-2">
            {activeTier.benefits.map((b, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                  b.highlight && isOwned
                    ? "border-primary/20 bg-primary/5"
                    : b.highlight && !isOwned
                    ? "border-dashed border-border bg-muted/30 opacity-70"
                    : "border-border bg-muted/20"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  b.highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{b.label}</p>
                  <p className={cn("text-xs font-semibold", b.highlight ? "text-foreground" : "text-foreground/80")}>{b.value}</p>
                </div>
                {b.highlight && (
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">Key perk</span>
                )}
              </div>
            ))}
          </div>

          {!isOwned && (
            <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <Coins className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">Need {ptsNeeded.toLocaleString()} more points</p>
                <p className="text-[10px] text-muted-foreground">Complete daily tasks to reach {activeTier.name}</p>
              </div>
              <button className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex-shrink-0">
                Earn now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Rewards Tiers Section ────────────────────────────────────────────────────

export function RewardsTiersSection({ userPts }: { userPts: number }) {
  return (
    <>
      {/* ── Level Roadmap ──────────────────────────────────── */}
      <LevelRoadmap userPts={userPts} />

      {/* ── Tier Benefits Panel ─────────────────────────────── */}
      <TierBenefitsPanel userPts={userPts} />
    </>
  );
}
