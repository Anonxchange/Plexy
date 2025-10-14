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
    description: "Confirm your age to start trading",
    requirements: ["Date of birth verification"],
    permissions: [
      "Receive crypto",
      "Deposit funds",
      "Convert crypto",
      "Buy crypto",
      "Sell crypto",
    ],
    restrictions: ["Cannot create offers"],
    dailyLimit: 1000,
    lifetimeTradeLimit: 10000,
    lifetimeSendLimit: 5000,
    perTradeLimit: 1000,
  },
  LEVEL_1_PLUS: {
    level: 1.5,
    name: "Level 1 Plus - Flexible Verification",
    description: "Upload any valid document for flexible verification",
    requirements: ["Any valid government ID or document"],
    permissions: [
      "All Level 1 permissions",
      "Create and publish offers",
    ],
    restrictions: ["Same trading limits as Level 1"],
    dailyLimit: 1000,
    lifetimeTradeLimit: 10000,
    lifetimeSendLimit: 5000,
    perTradeLimit: 1000,
  },
  LEVEL_2: {
    level: 2,
    name: "Level 2 - Full Verification",
    description: "Complete ID verification for unlimited trading",
    requirements: ["Government-issued photo ID", "Selfie verification"],
    permissions: [
      "Remove daily limits",
      "Remove lifetime limits",
      "Access more payment methods",
      "Create and publish offers freely",
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

export type VerificationLevel = 0 | 1 | 1.5 | 2 | 3;

export function getVerificationLevel(level: number) {
  if (level === 0) return VERIFICATION_LEVELS.LEVEL_0;
  if (level === 1) return VERIFICATION_LEVELS.LEVEL_1;
  if (level === 1.5) return VERIFICATION_LEVELS.LEVEL_1_PLUS;
  if (level === 2) return VERIFICATION_LEVELS.LEVEL_2;
  if (level === 3) return VERIFICATION_LEVELS.LEVEL_3;
  return VERIFICATION_LEVELS.LEVEL_0;
}

export function getNextLevel(currentLevel: number) {
  if (currentLevel === 0) return VERIFICATION_LEVELS.LEVEL_1;
  if (currentLevel === 1) return VERIFICATION_LEVELS.LEVEL_1_PLUS;
  if (currentLevel === 1.5) return VERIFICATION_LEVELS.LEVEL_2;
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

export function canCreateOffer(level: number) {
  return level >= 1.5;
}

export function getVerificationRequirements(currentLevel: number) {
  if (currentLevel === 0) {
    return {
      nextLevel: 1,
      description: "Verify your age with date of birth to start trading",
      requirements: ["Date of birth confirmation", "Must be 18 years or older"],
      benefits: ["Start trading", "$1,000 daily limit", "$10,000 lifetime trade limit"]
    };
  }
  if (currentLevel === 1) {
    return {
      nextLevel: 1.5,
      description: "Upload any valid document for flexible verification",
      requirements: ["Any valid government-issued document"],
      benefits: ["Create and publish offers", "Same trading limits as Level 1"]
    };
  }
  if (currentLevel === 1.5) {
    return {
      nextLevel: 2,
      description: "Complete full ID verification to remove limits",
      requirements: ["Government-issued photo ID", "Identity verification"],
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
