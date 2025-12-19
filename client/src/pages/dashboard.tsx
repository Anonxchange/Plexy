import { useState } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  MoreHorizontal,
  ArrowRight,
  Gift,
  Star,
  ChevronRight,
} from "lucide-react";

// 👇 keep your existing header + footer imports
// import { Header } from "@/components/header";
// import { PexlyFooter } from "@/components/pexly-footer";

const tabs = ["Hot", "New", "Gainers", "Losers", "Turnover"];

const markets = [
  { symbol: "BTC", pair: "USDT", price: "85,451.2", change: -0.79, icon: "₿", color: "bg-amber-500" },
  { symbol: "SOL", pair: "USDT", price: "119.38", change: -3.11, icon: "◐", color: "bg-gradient-to-r from-purple-500 to-cyan-400" },
  { symbol: "MNT", pair: "USDT", price: "1.1489", change: -4.96, icon: "◎", color: "bg-teal-500" },
  { symbol: "ETH", pair: "USDT", price: "2,826.06", change: -0.13, icon: "Ξ", color: "bg-slate-600" },
  { symbol: "USDC", pair: "USDT", price: "1.0004", change: 0.02, icon: "$", color: "bg-blue-500" },
  { symbol: "VOOI", pair: "USDT", price: "0.04949", change: 64.97, icon: "◉", color: "bg-amber-400" },
];

const actions = [
  { icon: Users, label: "P2P Trading", color: "bg-primary/10 text-primary" },
  { icon: Calendar, label: "Daily Delight", color: "bg-secondary text-secondary-foreground" },
  { icon: Zap, label: "7UpBybit", color: "bg-accent text-accent-foreground" },
  { icon: MoreHorizontal, label: "More", color: "bg-muted text-muted-foreground" },
];

const rewards = [
  { chances: 1, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 2, type: "Lucky Draw" },
  { chances: 1, type: "Lucky Draw" },
];

export default function Dashboard() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("Hot");

  return (
    <>
      {/* <Header /> */}

      <div className="min-h-screen bg-background pb-8">
        <div className="max-w-7xl mx-auto">
          {/* ===== ASSET CARD ===== */}
          <div className="bg-card rounded-2xl p-5 mx-4 mt-4 border border-border">
            <div className="flex justify-between mb-4">
              <span className="text-muted-foreground text-sm">Total Assets</span>
              <button onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? <Eye /> : <EyeOff />}
              </button>
            </div>

            <div className="text-4xl font-bold">
              {showBalance ? "1,250.39 USD" : "••••••"}
            </div>
          </div>

          {/* ===== QUICK ACTIONS ===== */}
          <div className="grid grid-cols-4 gap-3 px-4 mt-6">
            {actions.map((a) => (
              <button key={a.label} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.color}`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-xs">{a.label}</span>
              </button>
            ))}
          </div>

          {/* ===== MARKETS ===== */}
          <div className="px-4 mt-8">
            <h2 className="text-xl font-bold mb-3">Markets</h2>

            <div className="flex gap-6 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={activeTab === tab ? "font-bold" : "text-muted-foreground"}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="divide-y">
              {markets.map((m) => (
                <div key={m.symbol} className="flex justify-between py-4">
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${m.color}`}>
                      {m.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{m.symbol}/USDT</div>
                    </div>
                  </div>

                  <div className={m.change >= 0 ? "text-primary" : "text-destructive"}>
                    {m.price} ({m.change}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== REWARDS ===== */}
          <div className="px-4 mt-10">
            <h2 className="text-xl font-bold mb-4">My Rewards</h2>
            {rewards.map((r, i) => (
              <div key={i} className="flex gap-4 p-4 bg-muted rounded-xl mb-3">
                <Star />
                <div>
                  <div className="font-bold">{r.chances} Chance(s)</div>
                  <div className="text-sm text-muted-foreground">{r.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* <PexlyFooter /> */}
    </>
  );
}