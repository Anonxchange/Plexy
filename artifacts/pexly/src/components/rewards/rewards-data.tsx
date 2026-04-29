import {
  TrendingUp, Tag, HeadphonesIcon, Coins, Percent, TicketCheck, Medal,
  Shield, Bolt, PartyPopper, Trophy, Sparkles, Crown,
  Activity, Repeat2, BarChart2, Gift, BadgeCheck, Users, Flame,
} from "lucide-react";
import {
  IconLightning, IconShieldCheck, IconFlame, IconCrystalEye,
  IconHandshake, IconSwapArrows, IconDiamond, IconChartTrend,
  IconStarBurst, IconWave, IconCrown, IconGiftBox,
  TierIconNewcomer, TierIconBronze, TierIconSilver, TierIconGold, TierIconDiamond,
} from "@/components/reward-icons";
import {
  PhoneIcon, WifiIcon, AmazonIcon, GooglePlayIcon,
  AppleIcon, UberIcon, SpotifyIcon, SteamIcon, NetflixIcon,
} from "@/components/rewards/reward-brand-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Task {
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

export interface Badge {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface TierBenefit {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

export interface Tier {
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

export interface RedeemItem {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  cost: number;
  category: "gift-card" | "airtime" | "data";
  badge?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Hardcoded constants removed — live data comes from useRewardsProfile() hook

// ─── Tier Data ────────────────────────────────────────────────────────────────

export const TIERS: Tier[] = [
  {
    name: "Newcomer",
    minPts: 0,
    maxPts: 599,
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
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Email only" },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1× base rate" },
    ],
  },
  {
    name: "Bronze",
    minPts: 600,
    maxPts: 2_499,
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
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Priority email" },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1.2× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "Not included" },
      { icon: <Medal className="w-4 h-4" />, label: "Profile badge", value: "Bronze badge" },
    ],
  },
  {
    name: "Silver",
    minPts: 2_500,
    maxPts: 9_999,
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
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Priority live chat", highlight: true },
      { icon: <Coins className="w-4 h-4" />, label: "Point earn rate", value: "1.5× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "1 free entry / month" },
      { icon: <Shield className="w-4 h-4" />, label: "Profile badge", value: "Silver badge" },
    ],
  },
  {
    name: "Gold",
    minPts: 10_000,
    maxPts: 44_999,
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
      { icon: <HeadphonesIcon className="w-4 h-4" />, label: "Support", value: "Dedicated account agent", highlight: true },
      { icon: <Bolt className="w-4 h-4" />, label: "Point earn rate", value: "2× boost", highlight: true },
      { icon: <TicketCheck className="w-4 h-4" />, label: "Lucky Draw", value: "3 free entries / month" },
      { icon: <PartyPopper className="w-4 h-4" />, label: "VIP events", value: "Exclusive quarterly events" },
      { icon: <Trophy className="w-4 h-4" />, label: "Profile badge", value: "Gold badge" },
    ],
  },
  {
    name: "Diamond",
    minPts: 45_000,
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

export const DAILY_TASKS: Task[] = [
  {
    id: "daily-prediction",
    icon: <Activity className="w-5 h-5 text-purple-500" />,
    title: "Make a price prediction",
    description: "Predict BTC, ETH or XRP price for today",
    pts: 5, done: false, cta: "Predict now", daily: true, category: "daily",
  },
  {
    id: "daily-swap",
    icon: <Repeat2 className="w-5 h-5 text-blue-500" />,
    title: "Complete a swap",
    description: "Swap any crypto pair on Pexly",
    pts: 5, done: false, cta: "Swap now", daily: true, category: "daily",
  },
  {
    id: "daily-spot",
    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    title: "Spot trade",
    description: "Place a spot buy or sell order",
    pts: 5, done: false, cta: "Trade", daily: true, category: "daily",
  },
  {
    id: "daily-perpetual",
    icon: <BarChart2 className="w-5 h-5 text-orange-500" />,
    title: "Perpetual trade",
    description: "Open or close a perpetual position",
    pts: 5, done: false, cta: "Trade perps", daily: true, category: "daily",
  },
  {
    id: "daily-giftcard",
    icon: <Gift className="w-5 h-5 text-pink-500" />,
    title: "Purchase a gift card",
    description: "Buy any gift card from the Pexly store",
    pts: 5, done: false, cta: "Buy gift card", daily: true, category: "daily",
  },
];

export const ONE_TIME_TASKS: Task[] = [
  { id: "verify", icon: <BadgeCheck className="w-5 h-5 text-emerald-500" />, title: "Verify your identity", description: "Complete KYC to unlock full trading", pts: 100, done: false, cta: "Verify now", category: "one-time" },
  { id: "enable-2fa", icon: <Shield className="w-5 h-5 text-blue-500" />, title: "Enable two-factor auth", description: "Secure your account with 2FA", pts: 50, done: false, cta: "Enable 2FA", category: "one-time" },
  { id: "first-trade", icon: <TrendingUp className="w-5 h-5 text-blue-500" />, title: "Complete your first trade", description: "Buy or sell any crypto on Pexly", pts: 50, done: false, cta: "Start trading", category: "one-time" },
  { id: "first-swap", icon: <Repeat2 className="w-5 h-5 text-cyan-500" />, title: "Complete your first swap", description: "Swap any two crypto assets", pts: 30, done: false, cta: "Swap", category: "one-time" },
  { id: "first-giftcard", icon: <Gift className="w-5 h-5 text-pink-500" />, title: "Buy your first gift card", description: "Purchase a gift card from Pexly", pts: 30, done: false, cta: "Buy card", category: "one-time" },
  { id: "refer", icon: <Users className="w-5 h-5 text-pink-500" />, title: "Refer a friend", description: "Earn points for every friend who joins and trades", pts: 75, done: false, cta: "Invite friends", category: "one-time" },
  { id: "complete-profile", icon: <BadgeCheck className="w-5 h-5 text-yellow-500" />, title: "Complete your profile", description: "Add a photo, bio and country", pts: 20, done: false, cta: "Edit profile", category: "one-time" },
];

export const MILESTONE_TASKS: Task[] = [
  { id: "five-trades",   icon: <TrendingUp className="w-5 h-5 text-blue-500" />,   title: "Complete 5 spot trades",          description: "Build your spot trading history on Pexly",         pts: 60,  drawChances: 0, done: false, cta: "Spot trade",    category: "milestone" },
  { id: "swap-100",      icon: <Repeat2 className="w-5 h-5 text-cyan-500" />,       title: "Swap $100 or more",               description: "Swap at least $100 in a single transaction",         pts: 50,  drawChances: 1, done: false, cta: "Swap now",      category: "milestone" },
  { id: "spot-1000",     icon: <TrendingUp className="w-5 h-5 text-primary" />,     title: "Spot trade $1,000 or more",       description: "Place a spot order worth $1,000 or more",            pts: 100, drawChances: 2, done: false, cta: "Spot trade",    category: "milestone" },
  { id: "swap-5000",     icon: <Repeat2 className="w-5 h-5 text-cyan-500" />,       title: "Swap $5,000 or more",             description: "Swap at least $5,000 in a single transaction",       pts: 200, drawChances: 2, done: false, cta: "Swap now",      category: "milestone" },
  { id: "perp-15000",    icon: <BarChart2 className="w-5 h-5 text-orange-500" />,   title: "Perpetual trade $15,000+",        description: "Open or close a perpetual position worth $15,000+",  pts: 200, drawChances: 2, done: false, cta: "Trade perps",   category: "milestone" },
  { id: "streak-7",      icon: <Flame className="w-5 h-5 text-orange-500" />,       title: "7-day login streak",              description: "Log in 7 days in a row",                             pts: 70,  drawChances: 0, done: false, cta: "Keep going",    category: "milestone" },
  { id: "streak-30",     icon: <Flame className="w-5 h-5 text-red-500" />,          title: "30-day login streak",             description: "Log in 30 days in a row",                            pts: 300, drawChances: 0, done: false, cta: "Keep going",    category: "milestone" },
  { id: "refer-5",       icon: <Users className="w-5 h-5 text-pink-500" />,         title: "Refer 5 friends",                 description: "Get 5 friends trading on Pexly",                     pts: 400, drawChances: 0, done: false, cta: "Invite friends", category: "milestone" },
];

export const BADGES: Badge[] = [
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

export const REDEEM_ITEMS: RedeemItem[] = [
  { id: "airtime-1",      icon: <PhoneIcon />,      name: "$1 Mobile Airtime",        description: "Any network, any country",    cost: 800,    category: "airtime",    badge: "Best value" },
  { id: "airtime-2",      icon: <PhoneIcon />,      name: "$2 Mobile Airtime",        description: "Any network, any country",    cost: 1_500,  category: "airtime" },
  { id: "airtime-5",      icon: <PhoneIcon />,      name: "$5 Mobile Airtime",        description: "Any network, any country",    cost: 3_500,  category: "airtime" },
  { id: "airtime-10",     icon: <PhoneIcon />,      name: "$10 Mobile Airtime",       description: "Any network, any country",    cost: 6_500,  category: "airtime" },
  { id: "data-1gb",       icon: <WifiIcon />,       name: "1 GB Data Bundle",         description: "Mobile data, any carrier",    cost: 900,    category: "data" },
  { id: "data-3gb",       icon: <WifiIcon />,       name: "3 GB Data Bundle",         description: "Mobile data, any carrier",    cost: 2_500,  category: "data" },
  { id: "data-10gb",      icon: <WifiIcon />,       name: "10 GB Data Bundle",        description: "Mobile data, any carrier",    cost: 7_000,  category: "data" },
  { id: "data-unlimited", icon: <WifiIcon />,       name: "Unlimited Data (7 days)",  description: "Truly unlimited mobile data", cost: 14_000, category: "data",     badge: "Popular" },
  { id: "amazon-5",       icon: <AmazonIcon />,     name: "Amazon $5 Gift Card",      description: "Shop anything on Amazon",     cost: 4_500,  category: "gift-card" },
  { id: "amazon-10",      icon: <AmazonIcon />,     name: "Amazon $10 Gift Card",     description: "Shop anything on Amazon",     cost: 8_500,  category: "gift-card", badge: "Hot" },
  { id: "google-5",       icon: <GooglePlayIcon />, name: "Google Play $5",           description: "Apps, games & content",       cost: 4_500,  category: "gift-card" },
  { id: "apple-10",       icon: <AppleIcon />,      name: "Apple $10 Gift Card",      description: "App Store & iTunes",          cost: 8_500,  category: "gift-card" },
  { id: "uber-5",         icon: <UberIcon />,       name: "Uber $5 Credit",           description: "Rides and Uber Eats",         cost: 4_500,  category: "gift-card" },
  { id: "spotify-1m",     icon: <SpotifyIcon />,    name: "Spotify Premium 1 Month",  description: "Ad-free music streaming",     cost: 8_500,  category: "gift-card" },
  { id: "steam-10",       icon: <SteamIcon />,      name: "Steam $10 Gift Card",      description: "PC games & DLC",              cost: 8_500,  category: "gift-card" },
  { id: "netflix-1m",     icon: <NetflixIcon />,    name: "Netflix 1 Month",          description: "Stream unlimited movies",     cost: 15_000, category: "gift-card", badge: "Most popular" },
];
