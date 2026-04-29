import { sanitizeText } from "@/lib/sanitize";
import { isValidAmount, isValidNumber } from "@/lib/validators";
import type { RewardsProfile } from "@/lib/rewards-api";

export function mapRewardsProfile(raw: unknown): RewardsProfile {
  const r = raw as Record<string, unknown>;
  return {
    balance: isValidAmount(r.balance) ? r.balance : 0,
    lifetimeEarned: isValidAmount(r.lifetimeEarned) ? r.lifetimeEarned : 0,
    currentStreak: isValidNumber(r.currentStreak)
      ? Math.max(0, Math.floor(r.currentStreak))
      : 0,
    longestStreak: isValidNumber(r.longestStreak)
      ? Math.max(0, Math.floor(r.longestStreak))
      : 0,
    weeklyPts: isValidAmount(r.weeklyPts) ? r.weeklyPts : 0,
    rank: isValidNumber(r.rank) ? Math.max(1, Math.floor(r.rank)) : 1,
    lastLoginDate:
      typeof r.lastLoginDate === "string" && r.lastLoginDate
        ? sanitizeText(r.lastLoginDate).slice(0, 10)
        : null,
    referralCode:
      typeof r.referralCode === "string" && r.referralCode
        ? sanitizeText(r.referralCode).slice(0, 32)
        : undefined,
  };
}
