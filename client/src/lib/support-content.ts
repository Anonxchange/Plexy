export interface SupportStep {
  title: string;
  description: string;
}

export interface SupportSection {
  heading: string;
  content: string;
  steps?: SupportStep[];
}

export interface SupportArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  readTime: string;
  sections: SupportSection[];
  related?: string[]; // slugs
}

export interface SupportCategory {
  slug: string;
  title: string;
  description: string;
  articleSlugs: string[];
}

// ─── Articles ──────────────────────────────────────────────────────────────

export const supportArticles: Record<string, SupportArticle> = {
  "get-started-with-pexly": {
    slug: "get-started-with-pexly",
    title: "Get started with Pexly",
    description: "Learn the basics of Pexly — what it is, what you can do, and how to set up your account.",
    category: "Get started",
    categorySlug: "get-started",
    readTime: "3 min read",
    sections: [
      {
        heading: "What is Pexly?",
        content:
          "Pexly is a non-custodial, decentralized software platform that lets you swap crypto, earn staking yield, buy gift cards, pay utility bills, top up mobile credit, and explore on-chain data — all without giving up custody of your assets. Your keys, your assets.",
      },
      {
        heading: "What can I do on Pexly?",
        content: "Here's a quick overview of the main features available to you:",
        steps: [
          {
            title: "Spot & Perpetual Trading",
            description: "Trade crypto on spot markets or open leveraged perpetual positions across major pairs.",
          },
          {
            title: "Buy Crypto",
            description: "Purchase crypto instantly using a debit/credit card or bank transfer — funds land in your wallet in minutes.",
          },
          {
            title: "Swap",
            description: "Instantly swap any token for another at real-time rates with minimal fees, directly from your wallet.",
          },
          {
            title: "Earn with Staking",
            description: "Put your crypto to work by staking assets and earning passive yield.",
          },
          {
            title: "Predictions",
            description: "Take positions on price predictions and earn rewards when your calls are correct.",
          },
          {
            title: "Gift Cards & Bills",
            description: "Spend your crypto on gift cards from 1,000+ brands or pay utility bills worldwide.",
          },
          {
            title: "Explore On-chain Data",
            description: "Use the built-in blockchain explorer to verify transactions, check addresses, and audit smart contracts.",
          },
        ],
      },
      {
        heading: "Is Pexly safe?",
        content:
          "Pexly is non-custodial — we never hold your funds. Your private keys stay on your device, and every transaction is verifiable on-chain. We recommend enabling two-factor authentication (2FA) and backing up your recovery phrase immediately after creating your wallet.",
      },
    ],
    related: ["create-wallet", "receive-tokens", "get-help"],
  },

  "create-wallet": {
    slug: "create-wallet",
    title: "Create a new Pexly wallet",
    description: "Step-by-step guide to creating your first Pexly wallet and securing your recovery phrase.",
    category: "Get started",
    categorySlug: "get-started",
    readTime: "4 min read",
    sections: [
      {
        heading: "Before you start",
        content:
          "Make sure you're on the official Pexly website (pexly.app) and that you have a private, secure place to write down your recovery phrase. Never store your recovery phrase digitally or share it with anyone.",
      },
      {
        heading: "Creating your wallet",
        content: "Follow these steps to create a new wallet:",
        steps: [
          {
            title: "Click 'Get Started'",
            description: "From the homepage, click the 'Get Started' button in the top-right corner.",
          },
          {
            title: "Choose 'Create new wallet'",
            description: "Select the option to create a brand new wallet. If you already have a wallet, choose 'Import wallet' instead.",
          },
          {
            title: "Set a strong password",
            description: "Create a password with at least 12 characters, mixing uppercase, lowercase, numbers, and symbols. This encrypts your wallet locally.",
          },
          {
            title: "Back up your recovery phrase",
            description: "You'll be shown a 12 or 24-word recovery phrase. Write every word down in order on paper and store it somewhere safe and offline. This is the only way to recover your wallet if you lose access.",
          },
          {
            title: "Confirm your recovery phrase",
            description: "Verify you've written it correctly by re-entering the words in the correct order when prompted.",
          },
          {
            title: "Your wallet is ready",
            description: "You'll be taken to your dashboard. Your wallet address is shown at the top — you can now receive funds.",
          },
        ],
      },
      {
        heading: "Keep your recovery phrase safe",
        content:
          "Your recovery phrase is the master key to your wallet. Anyone who has it can access all your funds from any device. Store it offline (on paper or a metal backup), never in photos, cloud storage, or messaging apps. Pexly support will never ask for your recovery phrase.",
      },
    ],
    related: ["receive-tokens", "send-tokens", "get-started-with-pexly"],
  },

  "receive-tokens": {
    slug: "receive-tokens",
    title: "Receive tokens in Pexly",
    description: "How to find your wallet address and receive crypto from any exchange or wallet.",
    category: "Get started",
    categorySlug: "get-started",
    readTime: "2 min read",
    sections: [
      {
        heading: "Finding your receive address",
        content: "Each blockchain network has its own address in your Pexly wallet. Make sure you use the correct address for the correct network.",
        steps: [
          {
            title: "Open your Wallet",
            description: "Navigate to the Wallet section from the main navigation.",
          },
          {
            title: "Select the token you want to receive",
            description: "Tap the token (e.g. Bitcoin, Ethereum, USDT) you want to receive a deposit for.",
          },
          {
            title: "Tap 'Receive'",
            description: "Your wallet address and QR code will appear. Double-check the network shown matches the network you're sending from.",
          },
          {
            title: "Copy the address or scan the QR code",
            description: "Share your address with the sender or scan it from the sending wallet. Funds typically arrive within a few minutes depending on network congestion.",
          },
        ],
      },
      {
        heading: "Important: Network compatibility",
        content:
          "Always match the network. If someone sends ETH on the Ethereum network, use your Ethereum address — not your BNB Chain or Polygon address. Sending to the wrong network address can result in permanent loss of funds.",
      },
      {
        heading: "How long does it take?",
        content:
          "Bitcoin transactions typically need 1–3 confirmations (10–30 minutes). Ethereum and EVM chains are usually faster (under 2 minutes). Solana is nearly instant. If a deposit is delayed, check the transaction hash on our blockchain explorer.",
      },
    ],
    related: ["send-tokens", "create-wallet", "buy-tokens"],
  },

  "shop-guide": {
    slug: "shop-guide",
    title: "How to buy in the Pexly Shop",
    description: "Browse and buy products from sellers worldwide, paying entirely with crypto.",
    category: "Shop",
    categorySlug: "shop",
    readTime: "3 min read",
    sections: [
      {
        heading: "What is the Pexly Shop?",
        content:
          "The Pexly Shop is a crypto-native marketplace where you can discover and purchase products and services from sellers around the world — all paid directly with cryptocurrency from your wallet. No credit card required.",
      },
      {
        heading: "How to buy from the Shop",
        content: "",
        steps: [
          {
            title: "Open Shop from the navigation",
            description: "Click or tap 'Shop' in the main menu to browse the marketplace.",
          },
          {
            title: "Browse or search for a product",
            description: "Use the search bar or filter by category to find what you're looking for. Each listing shows the price in crypto.",
          },
          {
            title: "View the product detail",
            description: "Tap a listing to see the full description, seller information, and payment options.",
          },
          {
            title: "Proceed to checkout",
            description: "Click 'Buy Now' and confirm the payment from your Pexly wallet. The transaction is instant and on-chain.",
          },
          {
            title: "Track your order",
            description: "After purchase, you'll receive a confirmation. Contact the seller through the listing if you have delivery questions.",
          },
        ],
      },
      {
        heading: "Buyer protection",
        content:
          "Crypto transactions are irreversible on-chain, so review listings carefully before purchasing. If you believe a seller misrepresented their product, contact support at support@pexly.app with your transaction hash and we'll investigate.",
      },
    ],
    related: ["sell-on-pexly", "buy-tokens", "send-tokens"],
  },

  "sell-on-pexly": {
    slug: "sell-on-pexly",
    title: "Sell on Pexly — post a listing",
    description: "List your products or services in the Pexly Shop and accept crypto payments.",
    category: "Shop",
    categorySlug: "shop",
    readTime: "4 min read",
    sections: [
      {
        heading: "Who can sell on Pexly?",
        content:
          "Any verified Pexly user can post listings in the Shop. You'll need to be signed in and have completed at least Level 2 identity verification before your first listing goes live.",
      },
      {
        heading: "Creating a listing",
        content: "",
        steps: [
          {
            title: "Go to Shop > Post an Ad",
            description: "Open the Shop and click 'Post an Ad' (or navigate directly to /shop/post).",
          },
          {
            title: "Choose your listing type",
            description: "Select Fixed Price for a set sale amount, or Auction to let buyers bid. Fixed price is recommended for standard products.",
          },
          {
            title: "Add a title and description",
            description: "Write a clear, detailed title and description. Include condition, specifications, and any shipping or delivery info.",
          },
          {
            title: "Set your price",
            description: "Enter the price in your preferred cryptocurrency. The listing will show the equivalent in major currencies for buyers.",
          },
          {
            title: "Upload photos",
            description: "Add clear photos of your product. Good images significantly improve conversion.",
          },
          {
            title: "Submit for review",
            description: "Your listing will be reviewed and published. Most listings go live within a few minutes.",
          },
        ],
      },
      {
        heading: "Receiving payment",
        content:
          "When a buyer completes a purchase, the crypto payment is sent directly to your Pexly wallet. There's no holding period — the funds are available immediately once confirmed on-chain.",
      },
      {
        heading: "Listing rules",
        content:
          "Listings must comply with Pexly's Terms of Service. Prohibited items include anything illegal, counterfeit goods, financial instruments, and adult content. Violating listings will be removed and repeated violations may result in account suspension.",
      },
    ],
    related: ["shop-guide", "send-tokens", "security-tips"],
  },

  "send-tokens": {
    slug: "send-tokens",
    title: "Send tokens from Pexly",
    description: "How to safely send crypto from your Pexly wallet to another address or exchange.",
    category: "Get started",
    categorySlug: "get-started",
    readTime: "3 min read",
    sections: [
      {
        heading: "How to send tokens",
        content: "Sending crypto is straightforward, but always double-check the address and network before confirming.",
        steps: [
          {
            title: "Open your Wallet",
            description: "Go to Wallet from the navigation menu.",
          },
          {
            title: "Select the token to send",
            description: "Tap the token you want to send (e.g. BTC, ETH, USDT).",
          },
          {
            title: "Tap 'Send'",
            description: "Enter the recipient's wallet address. You can paste it or scan a QR code.",
          },
          {
            title: "Choose the network",
            description: "Select the blockchain network. Make sure it matches the network the recipient expects.",
          },
          {
            title: "Enter the amount",
            description: "Type the amount you want to send. You'll see the estimated network fee before confirming.",
          },
          {
            title: "Review and confirm",
            description: "Check every detail — address, network, amount, and fee. Once sent, crypto transactions cannot be reversed.",
          },
        ],
      },
      {
        heading: "Network fees",
        content:
          "Every on-chain transaction requires a small network fee paid to validators. Fees vary by network and congestion. Pexly shows the estimated fee before you confirm. You can sometimes choose between 'Standard' and 'Fast' speeds.",
      },
      {
        heading: "Transaction not arriving?",
        content:
          "Use the transaction hash (TXID) provided after sending to track your transfer on the blockchain explorer. If it's confirmed on-chain but not showing in the destination wallet, contact that wallet's support team — the issue is on their end.",
      },
    ],
    related: ["receive-tokens", "buy-tokens", "scam-recovery"],
  },

  "buy-tokens": {
    slug: "buy-tokens",
    title: "Buy tokens in Pexly",
    description: "Different ways to buy cryptocurrency on Pexly — on-ramp with card or bank, and instant swap.",
    category: "Buy and sell tokens",
    categorySlug: "buy-sell",
    readTime: "3 min read",
    sections: [
      {
        heading: "Ways to buy on Pexly",
        content: "Pexly offers two straightforward methods for acquiring crypto — pick the one that suits you.",
        steps: [
          {
            title: "Card or Bank On-ramp",
            description: "Buy crypto instantly using a debit/credit card or bank transfer through our integrated on-ramp partners. Fastest option — funds arrive in your wallet within minutes. Go to Buy Crypto from the main menu to get started.",
          },
          {
            title: "Swap",
            description: "Already have one token and want another? Use Swap to exchange tokens directly in your wallet at real-time rates with minimal fees. No sign-up required beyond your existing wallet.",
          },
        ],
      },
      {
        heading: "What if a purchase fails?",
        content:
          "For card or bank purchases, funds are typically returned to your original payment method within 3–5 business days if a transaction fails. If you're charged but no crypto arrived, contact support at support@pexly.app with your transaction reference.",
      },
      {
        heading: "Withdrawal and sell",
        content:
          "To convert crypto back to fiat, use the off-ramp option in the Buy Crypto section. Select your currency, enter the amount, and follow the steps to withdraw to your bank account. Processing times vary by bank (typically 1–3 business days).",
      },
    ],
    related: ["send-tokens", "receive-tokens", "swap-guide"],
  },

  "get-help": {
    slug: "get-help",
    title: "Get help from Pexly",
    description: "All the ways you can reach the Pexly support team and what to expect.",
    category: "Get started",
    categorySlug: "get-started",
    readTime: "2 min read",
    sections: [
      {
        heading: "How to contact support",
        content: "There are several ways to get help from our team:",
        steps: [
          {
            title: "Submit a support request",
            description: "Use the Contact page to submit a detailed request. Include your email, a clear subject, and as much detail as possible — transaction IDs, screenshots, and timestamps all help speed up resolution.",
          },
          {
            title: "Email us directly",
            description: "Send us an email at support@pexly.app for urgent issues. Our team monitors this inbox 7 days a week.",
          },
          {
            title: "Search the Help Center",
            description: "Many common questions are answered right here. Use the search bar at the top of the Help Center to find instant answers without waiting for a reply.",
          },
        ],
      },
      {
        heading: "Response times",
        content:
          "We aim to respond to all support requests within 24–48 hours on business days. Complex disputes or verification issues may take longer. You'll always receive an email confirmation when your request is received.",
      },
      {
        heading: "What we will never ask you",
        content:
          "Pexly support will never ask for your password, recovery phrase, or private keys — by any channel. If anyone claiming to be Pexly support asks for these, it is a scam. Report it immediately.",
      },
    ],
    related: ["scam-recovery", "get-started-with-pexly", "create-wallet"],
  },

  "scam-recovery": {
    slug: "scam-recovery",
    title: "What to do if I was scammed?",
    description: "If you believe you've been the victim of a scam, here's what to do immediately.",
    category: "Security",
    categorySlug: "security",
    readTime: "5 min read",
    sections: [
      {
        heading: "Act immediately",
        content:
          "Time matters. If you've been scammed or suspect fraud, take these steps right now:",
        steps: [
          {
            title: "Stop all communication with the scammer",
            description: "Do not send any more funds, do not click links they send, and do not share any more personal information.",
          },
          {
            title: "Secure your account",
            description: "Change your Pexly password immediately and enable 2FA if you haven't already. If you shared your recovery phrase, create a completely new wallet and move your remaining funds now.",
          },
          {
            title: "Document everything",
            description: "Take screenshots of all conversations, transaction IDs, wallet addresses involved, and any payment confirmations. This evidence is critical for dispute resolution.",
          },
          {
            title: "Report to Pexly support",
            description: "Contact us at support@pexly.app with all the evidence you've gathered. Include wallet addresses, transaction hashes, and any usernames involved.",
          },
          {
            title: "Report to authorities",
            description: "File a report with your local financial crimes authority and your bank or payment provider. In some cases, banks can reverse payments made by bank transfer.",
          },
        ],
      },
      {
        heading: "Common crypto scams to recognise",
        content: "Understanding how scams work helps you avoid them in future:",
        steps: [
          {
            title: "Fake payment proof",
            description: "Scammers show doctored screenshots of payments. Always verify in your actual bank app — never release crypto based on a screenshot alone.",
          },
          {
            title: "Impersonation",
            description: "Scammers pose as Pexly support, famous traders, or government officials. Pexly support never contacts you first via DM or asks for funds.",
          },
          {
            title: "Too-good-to-be-true returns",
            description: "Any investment promising guaranteed returns of 10%+/month is almost certainly a scam. Walk away.",
          },
          {
            title: "Recovery scams",
            description: "After being scammed, victims are targeted again by 'recovery services' who claim they can get funds back — for an upfront fee. This is always another scam.",
          },
        ],
      },
      {
        heading: "Can stolen crypto be recovered?",
        content:
          "Blockchain transactions are irreversible. Once confirmed on-chain, Pexly cannot reverse or freeze transfers. However, reporting the scammer's wallet address helps our team flag it, and authorities may be able to freeze connected exchange accounts. The sooner you report, the better the chances of any recovery.",
      },
    ],
    related: ["get-help", "security-tips", "get-started-with-pexly"],
  },

  "security-tips": {
    slug: "security-tips",
    title: "How to keep your wallet secure",
    description: "Essential security practices every Pexly user should follow to protect their funds.",
    category: "Security",
    categorySlug: "security",
    readTime: "4 min read",
    sections: [
      {
        heading: "The golden rules",
        content: "Following these rules protects the vast majority of users from losing funds:",
        steps: [
          {
            title: "Never share your recovery phrase",
            description: "Your 12 or 24-word recovery phrase gives complete control of your wallet to whoever has it. Pexly will never ask for it. No legitimate service ever will.",
          },
          {
            title: "Enable 2FA",
            description: "Two-factor authentication adds a second layer of protection. Use an authenticator app (Google Authenticator, Authy) rather than SMS where possible.",
          },
          {
            title: "Use a strong, unique password",
            description: "Use a password manager to generate and store a unique password for Pexly. Never reuse passwords across sites.",
          },
          {
            title: "Verify URLs before logging in",
            description: "Always check you're on pexly.app — scammers create near-identical phishing sites. Bookmark the real URL.",
          },
          {
            title: "Keep your devices clean",
            description: "Use up-to-date antivirus software and avoid installing apps from unknown sources. Malware can steal clipboard contents and replace addresses when you paste.",
          },
        ],
      },
      {
        heading: "Recognising phishing attempts",
        content:
          "Phishing emails look like official Pexly communications but contain links to fake websites. Check: Does the sender's email end in @pexly.app? Does the link go to pexly.app? If in doubt, go directly to the site by typing the URL yourself — never click email links.",
      },
    ],
    related: ["scam-recovery", "get-help", "create-wallet"],
  },

  "two-factor-authentication": {
    slug: "two-factor-authentication",
    title: "Setting up two-factor authentication (2FA)",
    description: "How to enable and manage 2FA on your Pexly account for maximum security.",
    category: "Security",
    categorySlug: "security",
    readTime: "3 min read",
    sections: [
      {
        heading: "Why enable 2FA?",
        content:
          "2FA requires a second verification step every time you log in — even if someone steals your password, they can't access your account without the second factor. It's one of the single most effective security steps you can take.",
      },
      {
        heading: "Enabling 2FA",
        content: "Here's how to set it up:",
        steps: [
          {
            title: "Go to Account Settings > Security",
            description: "Open the Settings menu and navigate to the Security tab.",
          },
          {
            title: "Tap 'Enable 2FA'",
            description: "Choose 'Authenticator App' for the strongest security.",
          },
          {
            title: "Scan the QR code",
            description: "Open Google Authenticator or Authy on your phone and scan the QR code shown on screen.",
          },
          {
            title: "Enter the 6-digit code",
            description: "Type the current code shown in your authenticator app to confirm the setup.",
          },
          {
            title: "Save your backup codes",
            description: "You'll receive backup codes. Store these safely offline — they're your only recovery option if you lose access to your authenticator.",
          },
        ],
      },
      {
        heading: "Lost access to your 2FA?",
        content:
          "If you've lost your authenticator device and don't have backup codes, contact support at support@pexly.app with your account email, a selfie with ID, and as much account verification as possible. Recovery may take 5–7 business days.",
      },
    ],
    related: ["security-tips", "scam-recovery", "get-help"],
  },

  "staking-guide": {
    slug: "staking-guide",
    title: "How staking works on Pexly",
    description: "Earn passive yield by staking your crypto. Here's how it works and what to expect.",
    category: "Staking",
    categorySlug: "staking",
    readTime: "5 min read",
    sections: [
      {
        heading: "What is staking?",
        content:
          "Staking means locking up your crypto to help secure a blockchain network. In return, you earn rewards — typically a percentage of your staked amount, paid out regularly. Pexly offers both liquid staking (keep your tokens accessible) and native staking (higher yields, locked period).",
      },
      {
        heading: "Liquid staking vs native staking",
        content: "",
        steps: [
          {
            title: "Liquid Staking",
            description: "Stake your SOL and receive pSOL (liquid staking token) in return. pSOL earns staking rewards automatically and can be traded, swapped, or used in DeFi any time — no lock-up period.",
          },
          {
            title: "Native Staking",
            description: "Delegate SOL directly to a validator. Higher APY than liquid staking, but your SOL is locked for a defined epoch period (typically 2–3 days to unstake).",
          },
        ],
      },
      {
        heading: "How to start staking",
        content: "",
        steps: [
          {
            title: "Open Wallet > Stake",
            description: "Go to the Staking section from your wallet.",
          },
          {
            title: "Choose your staking type",
            description: "Select Liquid Staking or Native Staking based on your preference.",
          },
          {
            title: "Enter the amount",
            description: "Enter how much SOL you want to stake. There's no minimum for liquid staking.",
          },
          {
            title: "Confirm and stake",
            description: "Review the estimated APY and confirm. Your rewards start accruing immediately.",
          },
        ],
      },
      {
        heading: "Staking risks",
        content:
          "Staking is generally low-risk compared to trading, but not risk-free. Smart contract risk exists with liquid staking protocols. Validator risk exists with native staking (choose reputable validators). Market risk: the value of staked tokens can go up or down. Always only stake what you can afford to hold long-term.",
      },
    ],
    related: ["buy-tokens", "get-started-with-pexly", "security-tips"],
  },

  "swap-guide": {
    slug: "swap-guide",
    title: "How to swap tokens on Pexly",
    description: "Swap any token for another instantly at real-time rates. Here's how.",
    category: "Trading",
    categorySlug: "trading",
    readTime: "3 min read",
    sections: [
      {
        heading: "What is a swap?",
        content:
          "A swap exchanges one token for another directly in your wallet — no need to use an exchange or go through KYC. Pexly aggregates liquidity from multiple DEXs to give you the best rate available.",
      },
      {
        heading: "How to swap",
        content: "",
        steps: [
          {
            title: "Open the Swap page",
            description: "Navigate to Trade > Swap from the main menu.",
          },
          {
            title: "Select tokens",
            description: "Choose the token you're swapping FROM and the token you're swapping TO.",
          },
          {
            title: "Enter the amount",
            description: "Type the amount to swap. You'll see the estimated output and the exchange rate.",
          },
          {
            title: "Check slippage",
            description: "Slippage is the maximum price movement you'll accept. Default is 0.5%. Increase it for volatile tokens if the swap keeps failing.",
          },
          {
            title: "Confirm the swap",
            description: "Review the details and confirm. The swap completes in seconds for most token pairs.",
          },
        ],
      },
      {
        heading: "Understanding price impact and slippage",
        content:
          "For large swaps, the trade itself can move the market price. Pexly shows you the estimated price impact before you confirm. If price impact is above 3%, consider splitting your swap into smaller trades.",
      },
    ],
    related: ["buy-tokens", "send-tokens", "staking-guide"],
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export const supportCategories: Record<string, SupportCategory> = {
  "get-started": {
    slug: "get-started",
    title: "Get started",
    description: "Create your Pexly wallet, customize your accounts, and learn about the key features.",
    articleSlugs: [
      "get-started-with-pexly",
      "create-wallet",
      "receive-tokens",
      "send-tokens",
      "get-help",
    ],
  },
  "shop": {
    slug: "shop",
    title: "Shop",
    description: "Buy products with crypto or sell your own items in the Pexly marketplace.",
    articleSlugs: ["shop-guide", "sell-on-pexly", "buy-tokens", "send-tokens"],
  },
  "account-settings": {
    slug: "account-settings",
    title: "Account and settings",
    description: "Manage your wallets, account names, recovery phrases, privacy, and device settings.",
    articleSlugs: ["two-factor-authentication", "security-tips", "get-help"],
  },
  "buy-sell": {
    slug: "buy-sell",
    title: "Buy and sell tokens",
    description: "Use on-ramps and off-ramps to buy, sell, or withdraw tokens — and fix common purchase issues.",
    articleSlugs: ["buy-tokens", "send-tokens", "receive-tokens", "swap-guide"],
  },
  "apps": {
    slug: "apps",
    title: "Apps",
    description: "Connect Pexly to apps, manage your connection settings, and troubleshoot connections.",
    articleSlugs: ["get-started-with-pexly", "security-tips"],
  },
  "security": {
    slug: "security",
    title: "Security",
    description: "Protect your wallet from scams, phishing, and hacks — plus tips on staying safe.",
    articleSlugs: ["scam-recovery", "security-tips", "two-factor-authentication"],
  },
  "staking": {
    slug: "staking",
    title: "Staking",
    description: "Use liquid staking with PSOL or stake SOL natively to earn rewards.",
    articleSlugs: ["staking-guide", "get-started-with-pexly"],
  },
  "trading": {
    slug: "trading",
    title: "Trading",
    description: "Swap, bridge, or trade tokens — plus understand gas, slippage, and trade execution.",
    articleSlugs: ["swap-guide", "buy-tokens", "send-tokens"],
  },
};

export const promotedArticleSlugs = [
  "get-started-with-pexly",
  "create-wallet",
  "receive-tokens",
  "shop-guide",
  "send-tokens",
  "buy-tokens",
  "get-help",
  "scam-recovery",
];
