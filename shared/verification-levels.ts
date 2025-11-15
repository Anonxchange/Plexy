export const VERIFICATION_LEVELS = {
  LEVEL_0: {
    level: 0,
    name: "Level 0 - Email Verified",
    description: "Sign up with email and get your unique referral ID",
    requirements: ["Email verification"],
    permissions: ["Invite friends with QR code", "Earn referral rewards"],
    restrictions: ["Cannot trade", "Cannot deposit or withdraw"],
    dailyLimit: 0,
    lifetimeTradeLimit: 0,
    lifetimeSendLimit: 0,
    perTradeLimit: 0,
  },
  LEVEL_1: {
    level: 1,
    name: "Level 1 - Basic",
    description: "Verify your identity to start trading",
    requirements: [
      "Full name",
      "Date of birth verification (must be 18+)",
      "Email OR phone verification (whichever wasn't used for signup)"
    ],
    permissions: [
      "Receive crypto",
      "Deposit funds",
      "Convert crypto",
      "Buy crypto",
      "Sell crypto",
      "Create and publish offers",
    ],
    restrictions: [],
    dailyLimit: 1000,
    lifetimeTradeLimit: 10000,
    lifetimeSendLimit: 5000,
    perTradeLimit: 1000,
  },
  LEVEL_2: {
    level: 2,
    name: "Level 2 - Full Verification",
    description: "Complete ID and live video verification for unlimited trading",
    requirements: [
      "Government-issued photo ID",
      "Live video verification (nod your head, turn head for liveness detection)"
    ],
    permissions: [
      "Remove daily limits",
      "Remove lifetime limits",
      "Access more payment methods",
      "Create and publish offers",
    ],
    restrictions: [],
    dailyLimit: null,
    lifetimeTradeLimit: null,
    lifetimeSendLimit: null,
    perTradeLimit: 100000,
  },
  LEVEL_3: {
    level: 3,
    name: "Level 3 - Enhanced Due Diligence",
    description: "Verify your address for maximum trading power",
    requirements: [
      "All Level 2 requirements",
      "Address verification (utility bill, bank statement)",
    ],
    permissions: [
      "All Level 2 permissions",
      "Highest per-trade limit",
      "Priority support",
    ],
    restrictions: [],
    dailyLimit: null,
    lifetimeTradeLimit: null,
    lifetimeSendLimit: null,
    perTradeLimit: 1000000,
  },
} as const;

export type VerificationLevel = 0 | 1 | 2 | 3;

export function getVerificationLevel(level: number) {
  if (level === 0) return VERIFICATION_LEVELS.LEVEL_0;
  if (level === 1) return VERIFICATION_LEVELS.LEVEL_1;
  if (level === 2) return VERIFICATION_LEVELS.LEVEL_2;
  if (level === 3) return VERIFICATION_LEVELS.LEVEL_3;
  return VERIFICATION_LEVELS.LEVEL_0;
}

export function getNextLevel(currentLevel: number) {
  if (currentLevel === 0) return VERIFICATION_LEVELS.LEVEL_1;
  if (currentLevel === 1) return VERIFICATION_LEVELS.LEVEL_2;
  if (currentLevel === 2) return VERIFICATION_LEVELS.LEVEL_3;
  return null;
}

export function canTrade(level: number, amount: number, lifetimeVolume: number = 0) {
  const levelConfig = getVerificationLevel(level);

  if (level === 0) return { allowed: false, reason: "Level 0 users cannot trade" };

  if (levelConfig.dailyLimit && amount > levelConfig.dailyLimit) {
    return { allowed: false, reason: `Daily limit is $${levelConfig.dailyLimit}` };
  }

  if (levelConfig.lifetimeTradeLimit && lifetimeVolume >= levelConfig.lifetimeTradeLimit) {
    return { allowed: false, reason: `Lifetime trade limit of $${levelConfig.lifetimeTradeLimit} reached` };
  }

  if (levelConfig.perTradeLimit && amount > levelConfig.perTradeLimit) {
    return { allowed: false, reason: `Per-trade limit is $${levelConfig.perTradeLimit}` };
  }

  return { allowed: true };
}

export function canCreateOffer(level: number, merchantStatus?: string) {
  // Only Level 2+ can create offers
  if (level < 2) {
    return {
      allowed: false,
      maxOffers: 0,
      feePercentage: 1.0,
      reason: "You must complete Level 2 verification (ID + liveness check) to create offers"
    };
  }

  // Level 2+ users can create offers (merchant status determines limits)
  if (merchantStatus === "block_merchant") {
    return {
      allowed: true,
      maxOffers: null,
      feePercentage: 0,
    };
  }

  if (merchantStatus === "verified_merchant") {
    return {
      allowed: true,
      maxOffers: 50,
      feePercentage: 0.5,
    };
  }

  // Regular Level 2+ users
  return {
    allowed: true,
    maxOffers: 5,
    feePercentage: 1.0,
  };
}

export function getVerificationRequirements(currentLevel: number) {
  if (currentLevel === 0) {
    return {
      nextLevel: 1,
      description: "Verify your identity to start trading",
      requirements: [
        "Full name",
        "Date of birth confirmation (must be 18+)",
        "Email OR phone verification"
      ],
      benefits: ["Start trading", "Create offers", "$1,000 daily limit", "$10,000 lifetime trade limit"]
    };
  }
  if (currentLevel === 1) {
    return {
      nextLevel: 2,
      description: "Complete ID and live video verification for unlimited trading",
      requirements: [
        "Government-issued photo ID",
        "Live video verification (nod your head, turn head)"
      ],
      benefits: ["Remove daily/lifetime limits", "$100,000 per-trade limit", "More payment methods"]
    };
  }
  if (currentLevel === 2) {
    return {
      nextLevel: 3,
      description: "Enhanced due diligence for maximum trading power",
      requirements: ["Address verification", "Utility bill or bank statement"],
      benefits: ["$1,000,000 per-trade limit", "Priority support", "VIP status"]
    };
  }
  return null;
}