import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronRight, CheckCircle2, Clock, Ticket, Coins,
  Repeat2, TrendingUp, BarChart2, Lock, Users, Copy,
} from "lucide-react";
import {
  DAILY_TASKS, ONE_TIME_TASKS, MILESTONE_TASKS,
  BADGES, REDEEM_ITEMS, USER_PTS,
  type Task, type Badge, type RedeemItem,
} from "./rewards-data";

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
      task.done ? "border-primary/20 bg-primary/5" : "border-border bg-card hover:bg-muted/50"
    )}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", task.done ? "bg-primary/15" : "bg-muted")}>
        {task.done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : task.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={cn("text-sm font-semibold leading-tight", task.done ? "text-muted-foreground line-through" : "text-foreground")}>
            {task.title}
          </p>
          {task.daily && (
            <span className="flex-shrink-0 text-[9px] font-bold bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> Daily
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight">{task.description}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">
          +{task.pts} pts
        </span>
        {!!task.drawChances && task.drawChances > 0 && (
          <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Ticket className="w-2.5 h-2.5" />
            +{task.drawChances} draw {task.drawChances === 1 ? "chance" : "chances"}
          </span>
        )}
        {!task.done && (
          <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors mt-0.5">
            {task.cta} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Badge Card ───────────────────────────────────────────────────────────────

const rarityBorder = { common: "border-border", rare: "border-blue-500/30 dark:border-blue-500/25", epic: "border-purple-500/35 dark:border-purple-500/30", legendary: "border-yellow-500/40 dark:border-yellow-400/35" };
const rarityBg    = { common: "bg-card", rare: "bg-blue-50 dark:bg-blue-500/[0.06]", epic: "bg-purple-50 dark:bg-purple-500/[0.08]", legendary: "bg-yellow-50 dark:bg-yellow-400/[0.07]" };
const rarityText  = { common: "text-slate-500 dark:text-slate-400", rare: "text-blue-600 dark:text-blue-400", epic: "text-purple-600 dark:text-purple-400", legendary: "text-yellow-600 dark:text-yellow-400" };
const rarityGlow  = { common: "", rare: "shadow-blue-500/10", epic: "shadow-purple-500/10", legendary: "shadow-yellow-400/15" };
const rarityIconBg = { common: "bg-muted", rare: "bg-blue-100 dark:bg-blue-500/15", epic: "bg-purple-100 dark:bg-purple-500/15", legendary: "bg-yellow-100 dark:bg-yellow-400/15" };

function BadgeCard({ badge, expanded, onToggle }: { badge: Badge; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative flex-shrink-0 w-36 rounded-2xl border p-3.5 flex flex-col items-center text-center gap-2 transition-all shadow-sm text-left",
        badge.unlocked
          ? cn(rarityBorder[badge.rarity], rarityBg[badge.rarity], rarityGlow[badge.rarity], expanded && "ring-2 ring-primary/30")
          : "border-border bg-muted/30 opacity-55"
      )}
    >
      {!badge.unlocked && (
        <Lock className="absolute top-2.5 right-2.5 w-3 h-3 text-muted-foreground/40" />
      )}

      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
        rarityIconBg[badge.rarity],
        !badge.unlocked && "opacity-30"
      )}>
        {badge.icon}
      </div>

      {/* Name + rarity */}
      <div className="w-full">
        <p className="text-[12px] font-bold text-foreground leading-tight text-center">{badge.name}</p>
        <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5 text-center", rarityText[badge.rarity])}>
          {badge.rarity}
        </p>
      </div>

      {/* Description — only visible when expanded */}
      {expanded && (
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center border-t border-border pt-2 w-full">
          {badge.description}
        </p>
      )}
    </button>
  );
}

// ─── Redeem Card ──────────────────────────────────────────────────────────────

function RedeemCard({ item, userPts }: { item: RedeemItem; userPts: number }) {
  const canAfford = userPts >= item.cost;
  return (
    <div className={cn(
      "relative rounded-2xl border p-4 flex flex-col gap-3 transition-all",
      canAfford ? "border-border bg-card hover:bg-muted/40" : "border-border bg-card opacity-60"
    )}>
      {item.badge && (
        <span className={cn(
          "absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full",
          item.badge === "Most popular" ? "bg-primary/15 text-primary"
            : item.badge === "Popular" ? "bg-primary/15 text-primary"
            : item.badge === "Hot" ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
            : item.badge === "Best value" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400"
        )}>{item.badge}</span>
      )}
      <div className="w-8 h-8 flex-shrink-0 rounded-lg overflow-hidden">{item.icon}</div>
      <div className="flex-1">
        <p className="text-xs font-bold text-foreground leading-tight pr-10">{item.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.description}</p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1">
          <Coins className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold tabular-nums text-foreground">{item.cost.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">pts</span>
        </div>
        <button className={cn(
          "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
          canAfford ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
        )}>
          {canAfford ? "Redeem" : `Need ${(item.cost - userPts).toLocaleString()} more`}
        </button>
      </div>
    </div>
  );
}

// ─── Rewards Engagement Section ───────────────────────────────────────────────

export function RewardsEngagementSection() {
  const [promoCode, setPromoCode] = useState("");
  const [tab, setTab] = useState<"earn" | "redeem" | "badges">("earn");
  const [redeemFilter, setRedeemFilter] = useState<"all" | "gift-card" | "airtime" | "data">("all");
  const [earnSection, setEarnSection] = useState<"daily" | "one-time" | "milestone">("daily");
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const referralCode = "PEXLY-X7Q2";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dailyDone = DAILY_TASKS.filter(t => t.done).length;
  const filteredRedeem = redeemFilter === "all" ? REDEEM_ITEMS : REDEEM_ITEMS.filter(i => i.category === redeemFilter);
  const currentTasks = earnSection === "daily" ? DAILY_TASKS : earnSection === "one-time" ? ONE_TIME_TASKS : MILESTONE_TASKS;

  return (
    <>
      {/* ── Main Tabs ───────────────────────────────────────── */}
      <div>
        <div className="flex gap-0.5 p-1 bg-muted border border-border rounded-xl mb-4">
          {(["earn", "redeem", "badges"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize",
                tab === t ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              )}>
              {t === "earn" ? "Earn Points" : t === "redeem" ? "Redeem" : "Badges"}
            </button>
          ))}
        </div>

        {/* ── EARN TAB ──────────────────────────────────────── */}
        {tab === "earn" && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(["daily", "one-time", "milestone"] as const).map((s) => (
                <button key={s} onClick={() => setEarnSection(s)}
                  className={cn(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                    earnSection === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}>
                  {s === "daily" ? `Daily (${dailyDone}/${DAILY_TASKS.length})` : s === "one-time" ? "One-time" : "Milestones"}
                </button>
              ))}
            </div>

            {earnSection === "daily" && (
              <div className="rounded-2xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Daily tasks reset at midnight UTC</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Complete all 5 for <span className="text-primary font-semibold">50 pts/day</span>. Each activity earns <span className="text-primary font-semibold">10 pts</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                {currentTasks.filter(t => !t.done).length} remaining
              </p>
              <p className="text-[11px] text-primary font-semibold">
                +{currentTasks.filter(t => !t.done).reduce((s, t) => s + t.pts, 0).toLocaleString()} pts available
              </p>
            </div>

            <div className="space-y-2">
              {currentTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {/* ── REDEEM TAB ────────────────────────────────────── */}
        {tab === "redeem" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/60 rounded-xl px-4 py-3 border border-border">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold tabular-nums text-foreground">{USER_PTS.toLocaleString()} pts</span>
                <span className="text-[11px] text-muted-foreground">available</span>
              </div>
              <button className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                Earn more <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-start gap-2.5">
              <Coins className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No tier requirement — spend your points on anything, anytime.
                Every reward shows its exact point cost. The more you trade and engage, the faster you earn.
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {([
                { key: "all", label: "All", icon: "🎁" },
                { key: "gift-card", label: "Gift Cards", icon: "🛒" },
                { key: "airtime", label: "Airtime", icon: "📱" },
                { key: "data", label: "Data", icon: "📡" },
              ] as const).map((f) => (
                <button key={f.key} onClick={() => setRedeemFilter(f.key)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                    redeemFilter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
                  )}>
                  <span>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredRedeem.map((item) => <RedeemCard key={item.id} item={item} userPts={USER_PTS} />)}
            </div>
          </div>
        )}

        {/* ── BADGES TAB ────────────────────────────────────── */}
        {tab === "badges" && (
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium px-1 mb-3">
              {BADGES.filter(b => b.unlocked).length}/{BADGES.length} unlocked
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {BADGES.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  expanded={expandedBadge === badge.id}
                  onToggle={() => setExpandedBadge(expandedBadge === badge.id ? null : badge.id)}
                />
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
              Get <span className="text-primary font-semibold">75 pts</span> for every friend who joins and completes a trade
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-background border border-border rounded-xl px-3 py-2.5">
            <span className="text-xs font-mono font-bold text-foreground tracking-widest">{referralCode}</span>
          </div>
          <button onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
              copied ? "bg-primary/20 text-primary border border-primary/30" : "bg-primary text-primary-foreground hover:opacity-90"
            )}>
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── Promo Code ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-bold text-foreground mb-1">Promo Code</p>
        <p className="text-[11px] text-muted-foreground mb-3">Have a code? Enter it below to claim bonus points.</p>
        <div className="flex gap-2">
          <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter code e.g. PEXLY2025" className="flex-1 rounded-xl h-10 text-sm" />
          <Button disabled={!promoCode.trim()} className="bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl h-10 px-5 disabled:opacity-30">
            Apply
          </Button>
        </div>
      </div>

      {/* ── Lucky Draw ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Lucky Draw</h2>
          <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-1 rounded-full">0 chances</span>
        </div>
        <div className="space-y-2">
          {[
            { title: "Swap $100 or more",              type: "Swap",       chances: 1, pts: 50  },
            { title: "Spot trade $500 or more",        type: "Spot",       chances: 1, pts: 75  },
            { title: "Perpetual trade $1,000 or more", type: "Perpetual",  chances: 2, pts: 100 },
            { title: "Swap $5,000 or more",            type: "Swap",       chances: 2, pts: 200 },
            { title: "Spot trade $10,000 or more",     type: "Spot",       chances: 2, pts: 300 },
            { title: "Perpetual trade $15,000 or more",type: "Perpetual",  chances: 2, pts: 500 },
          ].map((item, i) => {
            const typeColors: Record<string, string> = {
              Swap:      "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
              Spot:      "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
              Perpetual: "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400",
            };
            const typeIcons: Record<string, JSX.Element> = {
              Swap:      <Repeat2 className="w-4 h-4" />,
              Spot:      <TrendingUp className="w-4 h-4" />,
              Perpetual: <BarChart2 className="w-4 h-4" />,
            };
            return (
              <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", typeColors[item.type])}>
                    {typeIcons[item.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", typeColors[item.type])}>{item.type}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+{item.chances} draw chance{item.chances > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">+{item.pts} pts</span>
                  <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-semibold rounded-lg">Accept</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Earn More Grid ──────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">More Ways to Earn</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Lucky Spins", desc: "Spin to win pts & prizes", icon: "🎰", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", btn: "text-purple-700 dark:text-purple-400" },
            { label: "Price Predictions", desc: "Predict crypto prices, earn pts", icon: "🔮", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", btn: "text-blue-700 dark:text-blue-400" },
            { label: "Swap & Earn", desc: "Pts on every crypto swap", icon: "🔄", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20", btn: "text-cyan-700 dark:text-cyan-400" },
            { label: "Loyalty Badges", desc: "Complete challenges for badges", icon: "🏅", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20", btn: "text-amber-700 dark:text-amber-400" },
            { label: "Cashback", desc: "Get cashback on your trades", icon: "🎁", bg: "bg-pink-50 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-500/20", btn: "text-pink-700 dark:text-pink-400" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-2xl border p-4 flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.02]", item.bg, item.border)}>
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
    </>
  );
}
