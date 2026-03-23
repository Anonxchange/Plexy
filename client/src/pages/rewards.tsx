import { Coins } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import { USER_PTS } from "@/components/rewards/rewards-data";
import { RewardsHeroSection } from "@/components/rewards/rewards-hero-section";
import { RewardsTiersSection } from "@/components/rewards/rewards-tiers-section";
import { RewardsEngagementSection } from "@/components/rewards/rewards-engagement-section";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="border-b border-border bg-background">
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

        {/* Section 1: Hero Points Card + Daily Streak */}
        <RewardsHeroSection />

        {/* Section 2: Level Roadmap + Tier Benefits */}
        <RewardsTiersSection userPts={USER_PTS} />

        {/* Section 3: Tabs (Earn/Redeem/Badges) + Referral + Promo + Lucky Draw + More Ways */}
        <RewardsEngagementSection />

      </div>

      <PexlyFooter />
    </div>
  );
}
