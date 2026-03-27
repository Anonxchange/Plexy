/**
 * Pexly Marketplace — Seller Verification Tiers
 *
 * This is a non-custodial marketplace. Pexly does not hold or control
 * user funds, so there are no imposed financial limits. Verification
 * exists purely to establish seller trust and unlock shop posting,
 * modelled after real marketplaces (Etsy, Amazon, eBay).
 *
 * Level 0  – Buyer         : Browse + purchase — no KYC needed to buy
 * Level 1  – Buyer         : Email + Phone + DOB (18+) — can purchase
 * Level 2  – Verified Seller: Gov ID + Liveness check — can post listings (up to 10)
 * Level 3  – Pro Seller    : Address proof — unlimited listings + Pro badge
 */

export const VERIFICATION_LEVELS = {
  LEVEL_0: {
    level: 0,
    name: "Buyer",
    description: "Browse and purchase freely — no KYC required to buy",
    requirements: ["Email verification"],
    permissions: [
      "Browse all listings",
      "Purchase any listing",
      "Message sellers",
    ],
    restrictions: [
      "Cannot post listings",
    ],
    maxListings: 0,
    sellerBadge: null,
  },
  LEVEL_1: {
    level: 1,
    name: "Verified Buyer",
    description: "Enhanced buyer account — leave reviews and receive crypto",
    requirements: [
      "Email verified",
      "Phone number verified",
      "Date of birth (must be 18+)",
    ],
    permissions: [
      "Everything in Level 0",
      "Leave verified reviews",
      "Receive crypto payments",
    ],
    restrictions: [
      "Cannot post listings",
    ],
    maxListings: 0,
    sellerBadge: null,
  },
  LEVEL_2: {
    level: 2,
    name: "Verified Seller",
    description: "Post listings in the shop and start selling",
    requirements: [
      "All Level 1 requirements",
      "Government-issued photo ID (front + back)",
      "Liveness check (selfie / face match)",
    ],
    permissions: [
      "Post up to 10 active listings",
      "Accept crypto payments",
      "Verified Seller badge on profile",
      "Access seller dashboard",
    ],
    restrictions: [],
    maxListings: 10,
    sellerBadge: "Verified Seller",
  },
  LEVEL_3: {
    level: 3,
    name: "Pro Seller",
    description: "Unlimited listings, priority placement, and Pro badge",
    requirements: [
      "All Level 2 requirements",
      "Proof of address (utility bill or bank statement, dated within 90 days)",
    ],
    permissions: [
      "Unlimited active listings",
      "Priority placement in search results",
      "Pro Seller badge on profile",
      "Priority customer support",
      "Access to promotional features",
    ],
    restrictions: [],
    maxListings: null,
    sellerBadge: "Pro Seller",
  },
} as const;

export type VerificationLevel = 0 | 1 | 2 | 3;

export function getVerificationLevel(level: number) {
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

/**
 * Check if a user can purchase listings.
 * Purchasing is open to all signed-in users — no KYC required to buy.
 * KYC is only required to post listings (see canCreateOffer).
 */
export function canTrade(_level: number) {
  return { allowed: true };
}

/**
 * Check if a user can post listings in the shop.
 * Requires Level 2 (Verified Seller) or above.
 */
export function canCreateOffer(level: number, merchantStatus?: string): {
  allowed: boolean;
  maxListings: number | null;
  reason?: string;
} {
  if (level < 2) {
    return {
      allowed: false,
      maxListings: 0,
      reason: "You must complete Level 2 verification (Gov ID + liveness check) to post listings in the shop.",
    };
  }

  if (merchantStatus === "block_merchant") {
    return {
      allowed: false,
      maxListings: 0,
      reason: "Your selling privileges have been suspended. Please contact support.",
    };
  }

  if (level >= 3) {
    return {
      allowed: true,
      maxListings: null,
    };
  }

  // Level 2 — Verified Seller
  return {
    allowed: true,
    maxListings: 10,
  };
}

/**
 * Returns what the user needs to do to reach the next level,
 * phrased around marketplace seller benefits.
 */
export function getVerificationRequirements(currentLevel: number) {
  if (currentLevel === 0) {
    return {
      nextLevel: 1,
      description: "Verify your phone and age to leave reviews and receive crypto",
      requirements: [
        "Verify your phone number",
        "Confirm your date of birth (must be 18+)",
      ],
      benefits: [
        "Leave verified reviews on purchases",
        "Receive crypto payments",
      ],
    };
  }
  if (currentLevel === 1) {
    return {
      nextLevel: 2,
      description: "Become a Verified Seller and start posting listings",
      requirements: [
        "Government-issued photo ID (front + back)",
        "Liveness check (selfie to match your ID)",
      ],
      benefits: [
        "Post up to 10 listings in the shop",
        "Accept crypto payments",
        "Verified Seller badge on your profile",
      ],
    };
  }
  if (currentLevel === 2) {
    return {
      nextLevel: 3,
      description: "Upgrade to Pro Seller for unlimited listings and priority placement",
      requirements: [
        "Proof of address (utility bill or bank statement dated within 90 days)",
      ],
      benefits: [
        "Unlimited active listings",
        "Priority placement in search results",
        "Pro Seller badge",
        "Priority support",
      ],
    };
  }
  return null;
}
