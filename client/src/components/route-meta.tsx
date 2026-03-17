import { useEffect } from "react";
import { useLocation } from "wouter";

const DEFAULT_DESCRIPTION =
  "Pexly — your all-in-one non-custodial decentralized market for crypto swaps, staking, gift cards, mobile top-ups, utility payments, and blockchain exploration.";

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/": "Pexly is your all-in-one decentralized market. Swap cryptocurrencies, earn yield through staking, buy gift cards, top up mobile credit, pay utility bills, shop with crypto, and explore blockchain data — all without giving up custody of your assets. Non-custodial, borderless, and built for everyone.",

  "/swap": "Instantly swap cryptocurrencies at competitive rates directly from your wallet — no intermediaries, no custody risk.",
  "/analysis": "Advanced on-chain and market analysis tools. Explore price trends and data-driven insights across major crypto assets.",
  "/markets": "Live cryptocurrency market data including real-time prices, trading volumes, and market caps.",
  "/prediction": "Forecast cryptocurrency price movements and compete with the community to track your prediction accuracy.",
  "/bitcoin-calculator": "Convert Bitcoin to fiat or other cryptocurrencies using live exchange rates.",

  "/explorer": "Search and verify blockchain transactions, blocks, and addresses across multiple networks in real time.",
  "/explorer/prices": "Real-time cryptocurrency price charts and historical market data.",
  "/explorer/blocks": "Browse recent blockchain blocks including height, timestamps, transaction counts, and miner info.",
  "/explorer/transactions": "Search and verify confirmed and pending blockchain transactions across multiple networks.",

  "/wallet": "Send, receive, swap, stake, pay bills, and manage all your crypto assets in one place.",
  "/wallet/visa-card": "Spend your crypto anywhere Visa is accepted with instant conversion at the point of sale.",
  "/wallet/visa-card/details": "View your Pexly Visa card balance, transaction history, and card settings.",
  "/wallet/mobile-topup": "Top up mobile phone credit for any number worldwide using cryptocurrency.",
  "/wallet/utility-bill": "Pay electricity, water, internet, and other utility bills directly from your crypto wallet.",
  "/wallet/stake": "Browse staking pools and earn yield on your cryptocurrency with live APY rates.",
  "/wallet/lightning": "Send and receive Bitcoin instantly with ultra-low fees using the Lightning Network.",
  "/utility": "Pay electricity, water, internet, and other utility bills directly from your crypto wallet.",

  "/buy-crypto": "Purchase digital assets using a wide range of payment options — fast, secure, and non-custodial.",
  "/gift-cards": "Buy digital gift cards from hundreds of brands worldwide and pay with cryptocurrency.",
  "/checkout": "Review and complete your purchase securely using your cryptocurrency wallet.",
  "/shop": "Discover products and services available for direct cryptocurrency purchase.",
  "/shop/post": "List a product or service in the Pexly shop and accept cryptocurrency payments.",

  "/dashboard": "An overview of your portfolio value, activity history, staking rewards, and account stats.",
  "/notifications": "All your platform notifications — swaps, payments, staking updates, and account alerts.",

  "/account-settings": "Update your security preferences, linked payment methods, and personal information.",
  "/notification-settings": "Choose how and when you receive notifications for platform activity.",
  "/devices": "Review and manage trusted devices that have access to your Pexly account.",
  "/verification": "Verify your identity to unlock enhanced features and higher account limits.",
  "/kyc/callback": "Your identity verification is being processed.",

  "/medals": "Your earned medals and activity milestones on the platform.",
  "/rewards": "Earn points and unlock benefits by completing challenges and engaging with the platform.",
  "/referral": "Share your referral link and earn rewards when your network joins Pexly.",

  "/academy": "Guides, tutorials, and courses on cryptocurrency and decentralized finance for all levels.",
  "/blog": "Cryptocurrency news, product updates, DeFi insights, and blockchain guides from the Pexly team.",
  "/reviews": "Honest user reviews of Pexly covering swaps, staking, gift cards, and the overall experience.",
  "/careers": "Open roles at Pexly — join the team building next-generation decentralized financial tools.",
  "/contact": "Reach the Pexly support team for help with your account or any platform questions.",
  "/support": "Browse support articles or contact our team for help with your account and platform features.",
  "/submit-idea": "Submit a feature request or idea to help shape the future of the Pexly platform.",
  "/developer": "API documentation, SDKs, and integration tools for building on the Pexly platform.",

  "/signup": "Create a free Pexly account and get access to crypto swaps, staking, gift cards, and more.",
  "/signin": "Sign in to access your Pexly wallet, swaps, staking, gift cards, and account features.",
  "/verify-email": "Verify your email address to complete your Pexly account setup.",

  "/about": "Learn about Pexly and our mission to build non-custodial decentralized financial tools.",
  "/affiliate": "Join the Pexly affiliate program and earn commissions by referring new users.",
  "/terms": "The terms of service governing your use of the Pexly platform.",
  "/privacy": "How Pexly collects, uses, and protects your personal data.",
  "/cookie-policy": "How Pexly uses cookies and similar technologies across our platform.",
  "/restricted-countries": "Countries where Pexly services are currently unavailable.",
  "/vip-terms": "Terms and eligibility requirements for the Pexly VIP program.",
};

function getDescription(pathname: string): string {
  if (ROUTE_DESCRIPTIONS[pathname]) return ROUTE_DESCRIPTIONS[pathname];

  const dynamicPrefixes: [string, string][] = [
    ["/profile/", "This user's activity history, reputation, and platform engagement on Pexly."],
    ["/explorer/address/", "Transaction history, balance, and on-chain activity for this blockchain address."],
    ["/explorer/transaction/", "Details for this blockchain transaction including status, amounts, and addresses."],
    ["/explorer/block/", "Details for this blockchain block including transactions and miner information."],
    ["/explorer/asset/", "Price history, market data, and on-chain metrics for this crypto asset."],
    ["/prediction/", "Community forecasts, current odds, and results for this Pexly market prediction."],
    ["/blog/", "Read this Pexly blog post for insights on cryptocurrency, blockchain, and decentralized finance."],
    ["/gift-cards/", "View and purchase this digital gift card with cryptocurrency. Instant delivery after payment."],
    ["/shop/product/", "View this product in the Pexly shop and complete your purchase using cryptocurrency."],
    ["/academy/", "Read this Pexly Academy article on cryptocurrency and decentralized finance."],
    ["/admin/", "Pexly administration panel. Restricted to authorized personnel only."],
  ];

  for (const [prefix, description] of dynamicPrefixes) {
    if (pathname.startsWith(prefix)) return description;
  }

  return DEFAULT_DESCRIPTION;
}

export function RouteMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const description = getDescription(location);
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      (tag as HTMLMetaElement).name = "description";
      document.head.appendChild(tag);
    }
    (tag as HTMLMetaElement).content = description;
  }, [location]);

  return null;
}
