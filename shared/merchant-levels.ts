
export const MERCHANT_LEVELS = {
  NONE: {
    status: "none",
    name: "Regular User",
    description: "Can create up to 5 offers with standard trading fees",
    depositRequired: 0,
    benefits: [
      "Create up to 5 active offers",
      "Standard trading fees (1.0%)",
    ],
    restrictions: ["Limited to 5 active offers", "Higher trading fees"],
    maxActiveOffers: 5,
    feePercentage: 1.0,
    priorityLevel: 0,
  },
  VERIFIED_MERCHANT: {
    status: "verified_merchant",
    name: "Verified Merchant",
    description: "Standard merchant with ability to create and publish offers",
    depositRequired: 200,
    benefits: [
      "Create and publish unlimited offers",
      "Set custom prices and margins",
      "Access to all payment methods",
      "Merchant badge on profile and offers",
      "Priority support",
      "Lower trading fees (0.5%)",
    ],
    restrictions: [],
    maxActiveOffers: 50,
    feePercentage: 0.5,
    priorityLevel: 1,
  },
  BLOCK_MERCHANT: {
    status: "block_merchant",
    name: "Block Merchant",
    description: "Premium merchant with exclusive features and higher visibility",
    depositRequired: 500,
    benefits: [
      "All Verified Merchant benefits",
      "Exclusive Block Merchant badge",
      "Top placement in offer listings",
      "Create unlimited offers",
      "No trading fees (0%)",
      "Featured merchant status",
      "Early access to new features",
      "Dedicated account manager",
      "Higher withdrawal limits",
      "Custom branding options",
    ],
    restrictions: [],
    maxActiveOffers: null,
    feePercentage: 0,
    priorityLevel: 2,
    exclusiveFeatures: [
      "top_placement",
      "zero_fees",
      "featured_badge",
      "custom_branding",
    ],
  },
} as const;

export type MerchantStatus = "none" | "pending" | "verified_merchant" | "block_merchant" | "rejected";

export function getMerchantLevel(status: string) {
  if (status === "verified_merchant") return MERCHANT_LEVELS.VERIFIED_MERCHANT;
  if (status === "block_merchant") return MERCHANT_LEVELS.BLOCK_MERCHANT;
  return MERCHANT_LEVELS.NONE;
}

export function canApplyForMerchant(verificationLevel: number, totalTrades: number = 0) {
  if (verificationLevel < 2) {
    return {
      allowed: false,
      reason: "You must complete Level 2 verification (ID + liveness check) before applying for merchant status",
    };
  }

  if (totalTrades < 5) {
    return {
      allowed: false,
      reason: `You need at least 5 completed trades to apply for merchant status. Current trades: ${totalTrades}`,
    };
  }

  return { allowed: true };
}

export function getMerchantRequirements(merchantType: "verified_merchant" | "block_merchant") {
  const config = getMerchantLevel(merchantType);
  
  return {
    depositAmount: config.depositRequired,
    minimumVerificationLevel: 2,
    minimumTrades: 5,
    minimumCompletionRate: 95,
    description: config.description,
    benefits: config.benefits,
  };
}

export function calculateMerchantFee(amount: number, merchantStatus: string): number {
  const level = getMerchantLevel(merchantStatus);
  return (amount * level.feePercentage) / 100;
}

export function isMerchant(merchantStatus: string): boolean {
  return merchantStatus === "verified_merchant" || merchantStatus === "block_merchant";
}

export function isBlockMerchant(merchantStatus: string): boolean {
  return merchantStatus === "block_merchant";
}
