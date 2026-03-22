import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Flame, Shield, Star, Gift, ChevronRight, CheckCircle2,
  Lock, Trophy, Users, ArrowUpRight, Sparkles, Medal, Copy,
  TrendingUp, Wallet, BadgeCheck, BarChart2, Repeat2, Activity,
  Clock, Ticket, Coins, Percent, HeadphonesIcon, TicketCheck,
  Bolt, Crown, Gem, PartyPopper, Smartphone, Wifi, Tag,
} from "lucide-react";
import {
  IconLightning, IconShieldCheck, IconFlame, IconCrystalEye,
  IconHandshake, IconSwapArrows, IconDiamond, IconChartTrend,
  IconStarBurst, IconWave, IconCrown, IconGiftBox,
  TierIconNewcomer, TierIconBronze, TierIconSilver, TierIconGold, TierIconDiamond,
} from "@/components/reward-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  pts: number;
  done: boolean;
  cta: string;
  daily?: boolean;
  drawChances?: number;
  category: "daily" | "one-time" | "milestone";
}

interface Badge {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface TierBenefit {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

interface Tier {
  name: string;
  minPts: number;
  maxPts: number;
  emoji: string;
  textColor: string;
  gradient: string;
  pillBg: string;
  pillText: string;
  ringGlow: string;
  icon: React.ReactNode;
  tagline: string;
  benefits: TierBenefit[];
}

interface RedeemItem {
  id: string;
  icon: string;
  name: string;
  description: string;
  cost: number;
  category: "gift-card" | "airtime" | "data";
  badge?: string;
}

// ─── Tier Data ────────────────────────────────────────────────────────────────

const TIERS: Tier[] = [
  {
    name: "Newcomer",
    minPts: 0,
    maxPts: 249,
    emoji: "🌱",
    textColor: "text-slate-500",
    gradient: "from-slate-500 to-slate-600",
    pillBg: "bg-slate-100 dark:bg-slate-500/15",
    pillText: "text-slate-600 dark:text-slate-400",
    ringGlow: "",
    icon: <TierIconNewcomer size={16} />,
    tagline: "Start your journey",
    benefits: [
      { icon: <TrendingUp className="w-4 h-4" />, label: "Trading fee", value: "1.0% (standard rate)" },
      { icon: <Tag className="w-4 h-4" />, label: "Active offers", value: "Up to 5 offers at once" },
      { icon: <ArrowUpRight className="w-4 h-4" />, label: "Daily withdrawal", value: "$500 limit" },
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Email only" },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1× base rate" },
    ],
  },
  {
    name: "Bronze",
    minPts: 250,
    maxPts: 999,
    emoji: "🥉",
    textColor: "text-amber-600 dark:text-amber-500",
    gradient: "from-amber-600 to-orange-500",
    pillBg: "bg-amber-100 dark:bg-amber-500/15",
    pillText: "text-amber-700 dark:text-amber-400",
    ringGlow: "ring-1 ring-amber-500/30",
    icon: <TierIconBronze size={16} />,
    tagline: "You're on the board",
    benefits: [
      { icon: <Percent className="w-4 h-4" />, label: "Trading fee", value: "3% discount → 0.97%", highlight: true },
      { icon: <Tag className="w-4 h-4" />, label: "Active offers", value: "Up to 15 offers at once" },
      { icon: <ArrowUpRight className="w-4 h-4" />, label: "Daily withdrawal", value: "$1,500 limit", highlight: true },
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Priority email" },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1.2× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "Not included" },
      { icon: <Medal className="w-4 h-4" />, label: "Profile badge", value: "Bronze badge" },
    ],
  },
  {
    name: "Silver",
    minPts: 1000,
    maxPts: 4999,
    emoji: "🥈",
    textColor: "text-slate-500 dark:text-slate-300",
    gradient: "from-slate-400 to-slate-500",
    pillBg: "bg-slate-100 dark:bg-slate-400/15",
    pillText: "text-slate-600 dark:text-slate-300",
    ringGlow: "ring-1 ring-slate-400/30",
    icon: <TierIconSilver size={16} />,
    tagline: "Building real momentum",
    benefits: [
      { icon: <Percent className="w-4 h-4" />, label: "Trading fee", value: "8% discount → 0.92%", highlight: true },
      { icon: <Tag className="w-4 h-4" />, label: "Active offers", value: "Up to 50 offers at once" },
      { icon: <ArrowUpRight className="w-4 h-4" />, label: "Daily withdrawal", value: "$5,000 limit", highlight: true },
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Priority live chat", highlight: true },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1.5× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "1 free entry / month" },
      { icon: <Shield className="w-4 h-4" />, label: "Profile badge", value: "Silver badge" },
    ],
  },
  {
    name: "Gold",
    minPts: 5000,
    maxPts: 19999,
    emoji: "🥇",
    textColor: "text-yellow-600 dark:text-yellow-400",
    gradient: "from-yellow-400 to-amber-500",
    pillBg: "bg-yellow-100 dark:bg-yellow-500/15",
    pillText: "text-yellow-700 dark:text-yellow-400",
    ringGlow: "ring-1 ring-yellow-400/40",
    icon: <TierIconGold size={16} />,
    tagline: "Serious trader territory",
    benefits: [
      { icon: <Percent className="w-4 h-4" />, label: "Trading fee", value: "18% discount → 0.82%", highlight: true },
      { icon: <Tag className="w-4 h-4" />, label: "Active offers", value: "Unlimited offers" },
      { icon: <ArrowUpRight className="w-4 h-4" />, label: "Daily withdrawal", value: "$15,000 limit", highlight: true },
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Dedicated account agent", highlight: true },
      { icon: <Bolt className="w-4 h-4" />, label: "Point earn rate", value: "2× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "3 free entries / month" },
      { icon: <PartyPopper className="w-4 h-4" />, label: "VIP events", value: "Exclusive quarterly events" },
      { icon: <Trophy className="w-4 h-4" />, label: "Profile badge", value: "Gold badge" },
    ],
  },
  {
    name: "Diamond",
    minPts: 20000,
    maxPts: Infinity,
    emoji: "💎",
    textColor: "text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-400 to-indigo-500",
    pillBg: "bg-cyan-100 dark:bg-cyan-500/15",
    pillText: "text-cyan-700 dark:text-cyan-400",
    ringGlow: "ring-1 ring-cyan-400/40",
    icon: <TierIconDiamond size={16} />,
    tagline: "Elite — fewer than 1% reach this",
    benefits: [
      { icon: <Percent className="w-4 h-4" />, label: "Trading fee", value: "28% discount → 0.72%", highlight: true },
      { icon: <Tag className="w-4 h-4" />, label: "Active offers", value: "Unlimited + Featured placement" },
      { icon: <ArrowUpRight className="w-4 h-4" />, label: "Daily withdrawal", value: "$100,000 limit", highlight: true },
      { icon: <Crown className="w-4 h-4" />, label: "Support", value: "Personal account manager", highlight: true },
      { icon: <Bolt className="w-4 h-4" />, label: "Point earn rate", value: "5× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "10 free entries / month" },
      { icon: <PartyPopper className="w-4 h-4" />, label: "VIP events", value: "All events + private meetups" },
      { icon: <Sparkles className="w-4 h-4" />, label: "Profile badge", value: "Diamond badge" },
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Hotline", value: "24/7 priority phone support" },
    ],
  },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

const DAILY_TASKS: Task[] = [
  {
    id: "daily-prediction",
    icon: <Activity className="w-5 h-5 text-purple-500" />,
    title: "Make a price prediction",
    description: "Predict BTC, ETH or XRP price for today",
    pts: 10, done: false, cta: "Predict now", daily: true, category: "daily",
  },
  {
    id: "daily-swap",
    icon: <Repeat2 className="w-5 h-5 text-blue-500" />,
    title: "Complete a swap",
    description: "Swap any crypto pair on Pexly",
    pts: 10, done: false, cta: "Swap now", daily: true, category: "daily",
  },
  {
    id: "daily-spot",
    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    title: "Spot trade",
    description: "Place a spot buy or sell order",
    pts: 10, done: true, cta: "Trade", daily: true, category: "daily",
  },
  {
    id: "daily-perpetual",
    icon: <BarChart2 className="w-5 h-5 text-orange-500" />,
    title: "Perpetual trade",
    description: "Open or close a perpetual position",
    pts: 10, done: false, cta: "Trade perps", daily: true, category: "daily",
  },
  {
    id: "daily-giftcard",
    icon: <Gift className="w-5 h-5 text-pink-500" />,
    title: "Purchase a gift card",
    description: "Buy any gift card from the Pexly store",
    pts: 10, done: false, cta: "Buy gift card", daily: true, category: "daily",
  },
];

const ONE_TIME_TASKS: Task[] = [
  { id: "verify", icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />, title: "Verify your identity", description: "Complete KYC to unlock full trading", pts: 100, done: false, cta: "Verify now", category: "one-time" },
  { id: "enable-2fa", icon: <Shield className="w-5 h-5 text-blue-500" />, title: "Enable two-factor auth", description: "Secure your account with 2FA", pts: 50, done: false, cta: "Enable 2FA", category: "one-time" },
  { id: "first-trade", icon: <TrendingUp className="w-5 h-5 text-blue-500" />, title: "Complete your first trade", description: "Buy or sell any crypto on Pexly", pts: 50, done: false, cta: "Start trading", category: "one-time" },
  { id: "first-swap", icon: <Repeat2 className="w-5 h-5 text-cyan-500" />, title: "Complete your first swap", description: "Swap any two crypto assets", pts: 30, done: false, cta: "Swap", category: "one-time" },
  { id: "deposit", icon: <Wallet className="w-5 h-5 text-purple-500" />, title: "Make a crypto deposit", description: "Deposit any supported cryptocurrency", pts: 40, done: false, cta: "Deposit", category: "one-time" },
  { id: "first-giftcard", icon: <Gift className="w-5 h-5 text-pink-500" />, title: "Buy your first gift card", description: "Purchase a gift card from Pexly", pts: 30, done: false, cta: "Buy card", category: "one-time" },
  { id: "refer", icon: <Users className="w-5 h-5 text-pink-500" />, title: "Refer a friend", description: "Earn points for every friend who joins and trades", pts: 75, done: false, cta: "Invite friends", category: "one-time" },
  { id: "complete-profile", icon: <BadgeCheck className="w-5 h-5 text-yellow-500" />, title: "Complete your profile", description: "Add a photo, bio and country", pts: 20, done: false, cta: "Edit profile", category: "one-time" },
];

const MILESTONE_TASKS: Task[] = [
  { id: "five-trades",   icon: <TrendingUp className="w-5 h-5 text-blue-500" />,   title: "Complete 5 spot trades",          description: "Build your spot trading history on Pexly",         pts: 60,  drawChances: 0, done: false, cta: "Spot trade",    category: "milestone" },
  { id: "swap-100",      icon: <Repeat2 className="w-5 h-5 text-cyan-500" />,       title: "Swap $100 or more",               description: "Swap at least $100 in a single transaction",         pts: 50,  drawChances: 1, done: false, cta: "Swap now",      category: "milestone" },
  { id: "spot-1000",     icon: <TrendingUp className="w-5 h-5 text-primary" />,     title: "Spot trade $1,000 or more",       description: "Place a spot order worth $1,000 or more",            pts: 100, drawChances: 2, done: false, cta: "Spot trade",    category: "milestone" },
  { id: "swap-5000",     icon: <Repeat2 className="w-5 h-5 text-cyan-500" />,       title: "Swap $5,000 or more",             description: "Swap at least $5,000 in a single transaction",       pts: 200, drawChances: 2, done: false, cta: "Swap now",      category: "milestone" },
  { id: "perp-15000",    icon: <BarChart2 className="w-5 h-5 text-orange-500" />,   title: "Perpetual trade $15,000+",        description: "Open or close a perpetual position worth $15,000+",  pts: 200, drawChances: 2, done: false, cta: "Trade perps",   category: "milestone" },
  { id: "streak-7",      icon: <Flame className="w-5 h-5 text-orange-500" />,       title: "7-day login streak",              description: "Log in 7 days in a row",                             pts: 70,  drawChances: 0, done: false, cta: "Keep going",    category: "milestone" },
  { id: "streak-30",     icon: <Flame className="w-5 h-5 text-red-500" />,          title: "30-day login streak",             description: "Log in 30 days in a row",                            pts: 300, drawChances: 0, done: false, cta: "Keep going",    category: "milestone" },
  { id: "refer-5",       icon: <Users className="w-5 h-5 text-pink-500" />,         title: "Refer 5 friends",                 description: "Get 5 friends trading on Pexly",                     pts: 400, drawChances: 0, done: false, cta: "Invite friends", category: "milestone" },
];

const BADGES: Badge[] = [
  { id: "first-trade", icon: <IconLightning size={26} />, name: "First Spark", description: "Complete your first trade", unlocked: false, rarity: "common" },
  { id: "verified", icon: <IconShieldCheck size={26} />, name: "Verified", description: "Complete identity verification", unlocked: false, rarity: "common" },
  { id: "streak-7", icon: <IconFlame size={26} />, name: "On Fire", description: "7-day login streak", unlocked: false, rarity: "rare" },
  { id: "predictor", icon: <IconCrystalEye size={26} />, name: "Oracle", description: "Make 10 correct price predictions", unlocked: false, rarity: "rare" },
  { id: "social", icon: <IconHandshake size={26} />, name: "Community", description: "Refer 5 friends to Pexly", unlocked: false, rarity: "rare" },
  { id: "swapper", icon: <IconSwapArrows size={26} />, name: "Swap Pro", description: "Complete 20 swaps", unlocked: false, rarity: "rare" },
  { id: "power", icon: <IconDiamond size={26} />, name: "Power Trader", description: "Complete 50 trades", unlocked: false, rarity: "epic" },
  { id: "perp-king", icon: <IconChartTrend size={26} />, name: "Perp King", description: "Close 10 profitable perp trades", unlocked: false, rarity: "epic" },
  { id: "streak-30", icon: <IconStarBurst size={26} />, name: "Streak Master", description: "30-day login streak", unlocked: false, rarity: "epic" },
  { id: "whale", icon: <IconWave size={26} />, name: "Crypto Whale", description: "$10,000+ total volume", unlocked: false, rarity: "legendary" },
  { id: "diamond", icon: <IconCrown size={26} />, name: "Diamond Hands", description: "Reach Diamond tier", unlocked: false, rarity: "legendary" },
  { id: "gift-guru", icon: <IconGiftBox size={26} />, name: "Gift Guru", description: "Buy 10 gift cards", unlocked: false, rarity: "epic" },
];

const REDEEM_ITEMS: RedeemItem[] = [
  { id: "airtime-1",      icon: "📱", name: "$1 Mobile Airtime",        description: "Any network, any country",   cost: 280,  category: "airtime",    badge: "Best value" },
  { id: "airtime-2",      icon: "📱", name: "$2 Mobile Airtime",        description: "Any network, any country",   cost: 520,  category: "airtime" },
  { id: "airtime-5",      icon: "📱", name: "$5 Mobile Airtime",        description: "Any network, any country",   cost: 1200, category: "airtime" },
  { id: "airtime-10",     icon: "📱", name: "$10 Mobile Airtime",       description: "Any network, any country",   cost: 2200, category: "airtime" },
  { id: "data-1gb",       icon: "📡", name: "1 GB Data Bundle",         description: "Mobile data, any carrier",   cost: 400,  category: "data" },
  { id: "data-3gb",       icon: "📡", name: "3 GB Data Bundle",         description: "Mobile data, any carrier",   cost: 1050, category: "data" },
  { id: "data-10gb",      icon: "📡", name: "10 GB Data Bundle",        description: "Mobile data, any carrier",   cost: 3000, category: "data" },
  { id: "data-unlimited", icon: "📡", name: "Unlimited Data (7 days)",  description: "Truly unlimited mobile data", cost: 6500, category: "data",     badge: "Popular" },
  { id: "amazon-5",       icon: "🛒", name: "Amazon $5 Gift Card",      description: "Shop anything on Amazon",    cost: 1400, category: "gift-card" },
  { id: "amazon-10",      icon: "🛒", name: "Amazon $10 Gift Card",     description: "Shop anything on Amazon",    cost: 2600, category: "gift-card", badge: "Hot" },
  { id: "google-5",       icon: "🎮", name: "Google Play $5",           description: "Apps, games & content",      cost: 1400, category: "gift-card" },
  { id: "apple-10",       icon: "🍎", name: "Apple $10 Gift Card",      description: "App Store & iTunes",         cost: 2600, category: "gift-card" },
  { id: "uber-5",         icon: "🚗", name: "Uber $5 Credit",           description: "Rides and Uber Eats",        cost: 1400, category: "gift-card" },
  { id: "spotify-1m",     icon: "🎵", name: "Spotify Premium 1 Month",  description: "Ad-free music streaming",    cost: 2600, category: "gift-card" },
  { id: "steam-10",       icon: "🎮", name: "Steam $10 Gift Card",      description: "PC games & DLC",             cost: 2600, category: "gift-card" },
  { id: "netflix-1m",     icon: "🎬", name: "Netflix 1 Month",          description: "Stream unlimited movies",    cost: 4200, category: "gift-card", badge: "Most popular" },
];

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

// ─── NEW: Level Roadmap ───────────────────────────────────────────────────────

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

// ─── NEW: Tier Benefits Panel ─────────────────────────────────────────────────

function TierBenefitsPanel({ userPts }: { userPts: number }) {
  const currentTierIndex = TIERS.reduce((acc, t, i) => (userPts >= t.minPts ? i : acc), 0);
  const [selected, setSelected] = useState(currentTierIndex);
  const tier = TIERS[selected];
  const isOwned = userPts >= tier.minPts;
  const ptsNeeded = Math.max(0, tier.minPts - userPts);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Gem className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-bold text-foreground">Tier Benefits</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">Trading perks that grow with your tier</p>
      </div>

      {/* Tier selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 px-5 scrollbar-hide">
        {TIERS.map((t, i) => {
          const owned = userPts >= t.minPts;
          return (
            <button
              key={t.name}
              onClick={() => setSelected(i)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all",
                selected === i
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border bg-muted/30 hover:bg-muted/60"
              )}
            >
              <span className={cn(!owned && "opacity-40")}><TierSvgIcon name={t.name} size={22} /></span>
              <span className={cn(
                "text-[10px] font-bold whitespace-nowrap",
                selected === i ? tier.textColor : "text-muted-foreground"
              )}>{t.name}</span>
              {owned && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected tier detail */}
      <div className="px-5 pb-5 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br flex-shrink-0", tier.gradient)}>
            <TierSvgIcon name={tier.name} size={30} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={cn("text-base font-bold", tier.textColor)}>{tier.name}</p>
              {isOwned ? (
                <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Unlocked
                </span>
              ) : (
                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5", tier.pillBg, tier.pillText)}>
                  <Lock className="w-2.5 h-2.5" /> {ptsNeeded.toLocaleString()} pts away
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{tier.tagline}</p>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="space-y-2">
          {tier.benefits.map((b, i) => (
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

        {/* CTA if not owned */}
        {!isOwned && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            <Coins className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">You need {ptsNeeded.toLocaleString()} more points</p>
              <p className="text-[10px] text-muted-foreground">Complete daily tasks to reach {tier.name}</p>
            </div>
            <button className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg flex-shrink-0">
              Earn now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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

// ─── Streak Days ──────────────────────────────────────────────────────────────

function StreakDays() {
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
      <span className="text-2xl">{item.icon}</span>
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

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_PTS = 72;
const STREAK = 5;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [promoCode, setPromoCode] = useState("");
  const [tab, setTab] = useState<"earn" | "redeem" | "badges">("earn");
  const [redeemFilter, setRedeemFilter] = useState<"all" | "gift-card" | "airtime" | "data">("all");
  const [earnSection, setEarnSection] = useState<"daily" | "one-time" | "milestone">("daily");
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const referralCode = "PEXLY-X7Q2";

  const currentTierIndex = TIERS.reduce((acc, t, i) => (USER_PTS >= t.minPts ? i : acc), 0);
  const CURRENT_TIER = TIERS[currentTierIndex];
  const NEXT_TIER = TIERS[currentTierIndex + 1] ?? CURRENT_TIER;
  const progressInTier = USER_PTS - CURRENT_TIER.minPts;
  const tierRange = NEXT_TIER.minPts - CURRENT_TIER.minPts || 1;
  const ptsToNext = NEXT_TIER.minPts - USER_PTS;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dailyDone = DAILY_TASKS.filter(t => t.done).length;
  const filteredRedeem = redeemFilter === "all" ? REDEEM_ITEMS : REDEEM_ITEMS.filter(i => i.category === redeemFilter);
  const currentTasks = earnSection === "daily" ? DAILY_TASKS : earnSection === "one-time" ? ONE_TIME_TASKS : MILESTONE_TASKS;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Sticky Header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">Rewards</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">Earn points, redeem rewards</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold tabular-nums text-foreground">{USER_PTS.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground">pts</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pb-8 space-y-5 pt-5">

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
                  {USER_PTS.toLocaleString()}
                  <span className="text-lg font-medium text-muted-foreground ml-1.5">pts</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  <span className="text-primary font-semibold tabular-nums">{ptsToNext.toLocaleString()} pts</span>
                  {" "}until {NEXT_TIER.name}
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
                <span>{NEXT_TIER.minPts.toLocaleString()} pts</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
              {[
                { label: "This week", value: "+30 pts", color: "text-primary" },
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
                <p className="text-[10px] text-muted-foreground">Log in every day to earn points</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-orange-500 tabular-nums">{STREAK}</p>
              <p className="text-[10px] text-muted-foreground">days</p>
            </div>
          </div>
          <StreakDays />
          <div className="mt-4 flex items-center justify-between bg-muted rounded-xl px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground">Today's login reward</p>
            <p className="text-[11px] font-bold text-primary">+5 pts · Claim now</p>
          </div>
        </div>

        {/* ── NEW: Level Roadmap ──────────────────────────────── */}
        <LevelRoadmap userPts={USER_PTS} />

        {/* ── NEW: Tier Benefits Panel ─────────────────────────── */}
        <TierBenefitsPanel userPts={USER_PTS} />

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
                {BADGES.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
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
              { title: "Convert $100 or more",    chances: 1, pts: 50 },
              { title: "Convert $1,000 or more",  chances: 2, pts: 100 },
              { title: "Convert $5,000 or more",  chances: 2, pts: 200 },
              { title: "Convert $15,000 or more", chances: 2, pts: 500 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">+{item.chances} draw chance{item.chances > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tabular-nums">+{item.pts} pts</span>
                  <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-semibold rounded-lg">Accept</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Earn More Grid ──────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">More Ways to Earn</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Lucky Spins", desc: "Spin to win pts & prizes", icon: "🎰", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/20", btn: "text-purple-700 dark:text-purple-400" },
              { label: "Price Predictions", desc: "Predict crypto prices, earn pts", icon: "🔮", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20", btn: "text-blue-700 dark:text-blue-400" },
              { label: "Crypto Deposit", desc: "Earn pts on every deposit", icon: "💰", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20", btn: "text-emerald-700 dark:text-emerald-400" },
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

      </div>

      <PexlyFooter />
    </div>
  );
}
