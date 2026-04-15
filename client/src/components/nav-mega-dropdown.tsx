import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

// ─── SVG Illustrations ─────────────────────────────────────────────────────────

const BuyIllustration = () => (
  <svg width="100" height="84" viewBox="0 0 100 84" fill="none" aria-hidden>
    <circle cx="68" cy="28" r="24" fill="white" fillOpacity="0.12" />
    <circle cx="68" cy="28" r="16" fill="white" fillOpacity="0.15" />
    <text x="68" y="34" textAnchor="middle" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">₿</text>
    <rect x="4" y="44" width="56" height="36" rx="8" fill="white" fillOpacity="0.12" />
    <rect x="10" y="50" width="20" height="3" rx="1.5" fill="white" fillOpacity="0.6" />
    <rect x="10" y="57" width="34" height="5" rx="2.5" fill="white" fillOpacity="0.9" />
    <rect x="10" y="66" width="14" height="3" rx="1.5" fill="white" fillOpacity="0.4" />
    <path d="M76 56 L82 48 L88 52 L94 42" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    <circle cx="94" cy="42" r="2.5" fill="white" opacity="0.9" />
  </svg>
);

const SpotIllustration = () => (
  <svg width="96" height="76" viewBox="0 0 96 76" fill="none" aria-hidden>
    <rect x="4" y="38" width="10" height="30" rx="2" fill="#ef4444" fillOpacity="0.8" />
    <rect x="4" y="34" width="10" height="6" rx="1" fill="#ef4444" fillOpacity="0.4" />
    <line x1="9" y1="30" x2="9" y2="38" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
    <rect x="22" y="22" width="10" height="46" rx="2" fill="#22c55e" fillOpacity="0.8" />
    <rect x="22" y="68" width="10" height="6" rx="1" fill="#22c55e" fillOpacity="0.4" />
    <line x1="27" y1="20" x2="27" y2="26" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
    <rect x="40" y="32" width="10" height="36" rx="2" fill="#22c55e" fillOpacity="0.8" />
    <rect x="40" y="28" width="10" height="6" rx="1" fill="#22c55e" fillOpacity="0.4" />
    <line x1="45" y1="24" x2="45" y2="32" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
    <rect x="58" y="14" width="10" height="54" rx="2" fill="#ef4444" fillOpacity="0.8" />
    <rect x="58" y="10" width="10" height="6" rx="1" fill="#ef4444" fillOpacity="0.4" />
    <line x1="63" y1="6" x2="63" y2="14" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
    <rect x="76" y="26" width="10" height="42" rx="2" fill="#22c55e" fillOpacity="0.8" />
    <rect x="76" y="22" width="10" height="6" rx="1" fill="#22c55e" fillOpacity="0.4" />
    <line x1="81" y1="18" x2="81" y2="26" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.6" />
    <path d="M4 6 Q28 2 48 10 Q64 18 92 4" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" fill="none" strokeDasharray="3 2" />
  </svg>
);

const PerpIllustration = () => (
  <svg width="92" height="80" viewBox="0 0 92 80" fill="none" aria-hidden>
    <rect x="4" y="28" width="84" height="32" rx="8" fill="white" fillOpacity="0.1" />
    <text x="46" y="50" textAnchor="middle" fontSize="22" fontWeight="900" fill="white" fontFamily="system-ui" letterSpacing="-1">100×</text>
    <path d="M22 18 L46 6 L70 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <circle cx="46" cy="6" r="3" fill="white" opacity="0.9" />
    <path d="M22 66 L46 78 L70 66" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    <circle cx="46" cy="78" r="3" fill="white" opacity="0.4" />
  </svg>
);

const SwapIllustration = () => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none" aria-hidden>
    <circle cx="26" cy="32" r="18" fill="white" fillOpacity="0.15" />
    <text x="26" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="white" fontFamily="system-ui">₿</text>
    <circle cx="70" cy="48" r="18" fill="white" fillOpacity="0.15" />
    <text x="70" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="white" fontFamily="system-ui" opacity="0.9">Ξ</text>
    <path d="M44 26 Q56 20 56 32 L52 28 M56 32 L60 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <path d="M52 54 Q40 60 40 48 L44 52 M40 48 L36 52" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
  </svg>
);

const PredictIllustration = () => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none" aria-hidden>
    <path d="M12 68 A36 36 0 0 1 84 68" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.2" fill="none" />
    <path d="M12 68 A36 36 0 0 1 48 32" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.9" fill="none" />
    <path d="M12 68 A36 36 0 0 1 62 36" stroke="white" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
    <line x1="48" y1="68" x2="30" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    <circle cx="48" cy="68" r="5" fill="white" opacity="0.9" />
    <rect x="34" y="58" width="24" height="14" rx="4" fill="white" fillOpacity="0.15" />
    <text x="46" y="69" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="system-ui">62%</text>
  </svg>
);

const AssetsIllustration = () => (
  <svg width="90" height="76" viewBox="0 0 90 76" fill="none" aria-hidden>
    <ellipse cx="45" cy="62" rx="30" ry="8" fill="white" fillOpacity="0.1" />
    <ellipse cx="45" cy="50" rx="30" ry="8" fill="white" fillOpacity="0.15" />
    <ellipse cx="45" cy="38" rx="30" ry="8" fill="white" fillOpacity="0.2" />
    <ellipse cx="45" cy="26" rx="30" ry="8" fill="white" fillOpacity="0.3" />
    <text x="45" y="30" textAnchor="middle" fontSize="8" fontWeight="700" fill="white" fontFamily="system-ui">PORTFOLIO</text>
    <rect x="8" y="8" width="40" height="10" rx="3" fill="white" fillOpacity="0.15" />
    <rect x="8" y="8" width="28" height="10" rx="3" fill="white" fillOpacity="0.3" />
    <text x="28" y="16" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="white" fontFamily="system-ui">$24,891.40</text>
  </svg>
);

const ReceiveIllustration = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
    <rect x="14" y="14" width="52" height="52" rx="6" fill="white" fillOpacity="0.12" />
    {/* QR code pattern */}
    <rect x="20" y="20" width="14" height="14" rx="2" fill="white" fillOpacity="0.5" />
    <rect x="22" y="22" width="10" height="10" rx="1" fill="white" fillOpacity="0.2" />
    <rect x="24" y="24" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.8" />
    <rect x="46" y="20" width="14" height="14" rx="2" fill="white" fillOpacity="0.5" />
    <rect x="48" y="22" width="10" height="10" rx="1" fill="white" fillOpacity="0.2" />
    <rect x="50" y="24" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.8" />
    <rect x="20" y="46" width="14" height="14" rx="2" fill="white" fillOpacity="0.5" />
    <rect x="22" y="48" width="10" height="10" rx="1" fill="white" fillOpacity="0.2" />
    <rect x="24" y="50" width="6" height="6" rx="0.5" fill="white" fillOpacity="0.8" />
    <rect x="46" y="46" width="6" height="6" rx="1" fill="white" fillOpacity="0.7" />
    <rect x="54" y="46" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
    <rect x="46" y="54" width="6" height="6" rx="1" fill="white" fillOpacity="0.4" />
    <rect x="54" y="54" width="6" height="6" rx="1" fill="white" fillOpacity="0.7" />
    {/* dots pattern middle */}
    <rect x="36" y="20" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
    <rect x="36" y="26" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.3" />
    <rect x="36" y="32" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
    <rect x="20" y="36" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.3" />
    <rect x="26" y="36" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
    <rect x="32" y="36" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.3" />
    <rect x="38" y="36" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
  </svg>
);

const CardIllustration = () => (
  <svg width="100" height="72" viewBox="0 0 100 72" fill="none" aria-hidden>
    <rect x="6" y="10" width="88" height="54" rx="10" fill="white" fillOpacity="0.12" />
    <rect x="6" y="10" width="88" height="16" rx="10" fill="white" fillOpacity="0.1" />
    {/* chip */}
    <rect x="16" y="28" width="16" height="12" rx="3" fill="white" fillOpacity="0.4" />
    <line x1="24" y1="28" x2="24" y2="40" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
    <line x1="16" y1="34" x2="32" y2="34" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
    {/* contactless */}
    <path d="M48 30 Q52 34 48 38" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M52 27 Q59 34 52 41" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    {/* card number dots */}
    <circle cx="16" cy="52" r="2" fill="white" fillOpacity="0.7" />
    <circle cx="22" cy="52" r="2" fill="white" fillOpacity="0.7" />
    <circle cx="28" cy="52" r="2" fill="white" fillOpacity="0.7" />
    <circle cx="34" cy="52" r="2" fill="white" fillOpacity="0.7" />
    <circle cx="44" cy="52" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="50" cy="52" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="56" cy="52" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="62" cy="52" r="2" fill="white" fillOpacity="0.5" />
    {/* Pexly logo circle */}
    <circle cx="84" cy="50" r="8" fill="white" fillOpacity="0.3" />
    <circle cx="78" cy="50" r="8" fill="white" fillOpacity="0.2" />
  </svg>
);

const LightningIllustration = () => (
  <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden>
    <circle cx="42" cy="42" r="32" fill="white" fillOpacity="0.1" />
    <path d="M46 14 L28 46 H40 L38 70 L58 36 H46 Z" fill="white" fillOpacity="0.9" />
    <path d="M46 14 L28 46 H40 L38 70 L58 36 H46 Z" fill="url(#zap-glow)" fillOpacity="0.4" />
    <defs>
      <radialGradient id="zap-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

const PhoneIllustration = () => (
  <svg width="72" height="88" viewBox="0 0 72 88" fill="none" aria-hidden>
    <rect x="16" y="6" width="40" height="76" rx="8" fill="white" fillOpacity="0.12" />
    <rect x="16" y="6" width="40" height="76" rx="8" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
    <rect x="24" y="2" width="24" height="6" rx="3" fill="white" fillOpacity="0.3" />
    <circle cx="36" cy="78" r="3" fill="white" fillOpacity="0.4" />
    {/* signal bars */}
    <rect x="22" y="54" width="5" height="10" rx="1.5" fill="white" fillOpacity="0.9" />
    <rect x="30" y="48" width="5" height="16" rx="1.5" fill="white" fillOpacity="0.7" />
    <rect x="38" y="40" width="5" height="24" rx="1.5" fill="white" fillOpacity="0.5" />
    <rect x="46" y="32" width="5" height="32" rx="1.5" fill="white" fillOpacity="0.25" />
    <text x="36" y="28" textAnchor="middle" fontSize="8" fontWeight="600" fill="white" fontFamily="system-ui" fillOpacity="0.7">TOPUP</text>
  </svg>
);

const UtilityIllustration = () => (
  <svg width="88" height="80" viewBox="0 0 88 80" fill="none" aria-hidden>
    <rect x="6" y="8" width="22" height="22" rx="6" fill="white" fillOpacity="0.25" />
    <rect x="34" y="8" width="22" height="22" rx="6" fill="white" fillOpacity="0.15" />
    <rect x="62" y="8" width="22" height="22" rx="6" fill="white" fillOpacity="0.2" />
    <rect x="6" y="36" width="22" height="22" rx="6" fill="white" fillOpacity="0.15" />
    <rect x="34" y="36" width="22" height="22" rx="6" fill="white" fillOpacity="0.25" />
    <rect x="62" y="36" width="22" height="22" rx="6" fill="white" fillOpacity="0.15" />
    <text x="17" y="23" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui">⚡</text>
    <text x="45" y="23" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui" fillOpacity="0.7">📺</text>
    <text x="73" y="23" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui" fillOpacity="0.8">💧</text>
    <text x="17" y="51" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui" fillOpacity="0.7">📶</text>
    <text x="45" y="51" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui">🏠</text>
    <text x="73" y="51" textAnchor="middle" fontSize="10" fill="white" fontFamily="system-ui" fillOpacity="0.7">🎫</text>
    <rect x="14" y="64" width="60" height="10" rx="3" fill="white" fillOpacity="0.1" />
    <rect x="14" y="64" width="38" height="10" rx="3" fill="white" fillOpacity="0.2" />
  </svg>
);

const StakeIllustration = () => (
  <svg width="96" height="78" viewBox="0 0 96 78" fill="none" aria-hidden>
    <rect x="6" y="34" width="84" height="36" rx="6" fill="white" fillOpacity="0.08" />
    <path d="M8 60 Q20 52 32 46 Q44 40 56 32 Q68 24 88 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
    <path d="M8 60 Q20 52 32 46 Q44 40 56 32 Q68 24 88 14 L88 70 L8 70 Z" fill="white" fillOpacity="0.06" />
    <circle cx="88" cy="14" r="4" fill="white" opacity="0.9" />
    <rect x="28" y="8" width="40" height="20" rx="6" fill="white" fillOpacity="0.15" />
    <text x="48" y="22" textAnchor="middle" fontSize="11" fontWeight="800" fill="white" fontFamily="system-ui">12% APY</text>
  </svg>
);

const ReferralIllustration = () => (
  <svg width="96" height="78" viewBox="0 0 96 78" fill="none" aria-hidden>
    <circle cx="48" cy="28" r="14" fill="white" fillOpacity="0.2" />
    <circle cx="48" cy="28" r="8" fill="white" fillOpacity="0.3" />
    <circle cx="18" cy="58" r="10" fill="white" fillOpacity="0.15" />
    <circle cx="78" cy="58" r="10" fill="white" fillOpacity="0.15" />
    <circle cx="48" cy="58" r="10" fill="white" fillOpacity="0.15" />
    <line x1="48" y1="42" x2="18" y2="48" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 2" />
    <line x1="48" y1="42" x2="78" y2="48" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 2" />
    <line x1="48" y1="42" x2="48" y2="48" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
    <text x="18" y="62" textAnchor="middle" fontSize="8" fill="white" fontFamily="system-ui">👤</text>
    <text x="48" y="62" textAnchor="middle" fontSize="8" fill="white" fontFamily="system-ui">👤</text>
    <text x="78" y="62" textAnchor="middle" fontSize="8" fill="white" fontFamily="system-ui">👤</text>
    <text x="48" y="32" textAnchor="middle" fontSize="9" fill="white" fontFamily="system-ui" fontWeight="700">YOU</text>
  </svg>
);

const RewardsIllustration = () => (
  <svg width="88" height="80" viewBox="0 0 88 80" fill="none" aria-hidden>
    <polygon points="44,8 52,30 76,30 57,44 64,66 44,52 24,66 31,44 12,30 36,30" fill="white" fillOpacity="0.25" />
    <polygon points="44,14 51,33 72,33 56,44 62,63 44,52 26,63 32,44 16,33 37,33" fill="white" fillOpacity="0.4" />
    <circle cx="44" cy="40" r="10" fill="white" fillOpacity="0.2" />
    <text x="44" y="45" textAnchor="middle" fontSize="12" fill="white" fontFamily="system-ui">🏆</text>
  </svg>
);

const ShopIllustration = () => (
  <svg width="90" height="78" viewBox="0 0 90 78" fill="none" aria-hidden>
    <rect x="8" y="28" width="74" height="44" rx="8" fill="white" fillOpacity="0.12" />
    <path d="M16 28 L22 8 L68 8 L74 28" stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none" strokeLinejoin="round" />
    <rect x="20" y="38" width="22" height="24" rx="4" fill="white" fillOpacity="0.2" />
    <rect x="48" y="38" width="22" height="12" rx="4" fill="white" fillOpacity="0.15" />
    <rect x="48" y="54" width="22" height="8" rx="4" fill="white" fillOpacity="0.1" />
    <circle cx="45" cy="28" r="5" fill="white" fillOpacity="0.8" />
    <text x="45" y="31" textAnchor="middle" fontSize="6" fill="#1a3300" fontFamily="system-ui" fontWeight="700">P2P</text>
  </svg>
);

const PostAdIllustration = () => (
  <svg width="84" height="78" viewBox="0 0 84 78" fill="none" aria-hidden>
    <rect x="8" y="14" width="68" height="54" rx="8" fill="white" fillOpacity="0.12" />
    <rect x="16" y="22" width="34" height="6" rx="3" fill="white" fillOpacity="0.5" />
    <rect x="16" y="32" width="50" height="3" rx="1.5" fill="white" fillOpacity="0.3" />
    <rect x="16" y="38" width="42" height="3" rx="1.5" fill="white" fillOpacity="0.3" />
    <rect x="16" y="44" width="46" height="3" rx="1.5" fill="white" fillOpacity="0.3" />
    <circle cx="60" cy="56" r="14" fill="white" fillOpacity="0.9" />
    <line x1="60" y1="50" x2="60" y2="62" stroke="#1e3a00" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="54" y1="56" x2="66" y2="56" stroke="#1e3a00" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const ContactIllustration = () => (
  <svg width="90" height="78" viewBox="0 0 90 78" fill="none" aria-hidden>
    <rect x="6" y="16" width="78" height="52" rx="10" fill="white" fillOpacity="0.12" />
    <path d="M6 26 L45 46 L84 26" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
    <circle cx="45" cy="46" r="5" fill="white" fillOpacity="0.4" />
    <circle cx="30" cy="62" r="5" fill="white" fillOpacity="0.6" />
    <circle cx="45" cy="66" r="5" fill="white" fillOpacity="0.4" />
    <circle cx="60" cy="62" r="5" fill="white" fillOpacity="0.6" />
    <rect x="20" y="58" width="50" height="8" rx="4" fill="white" fillOpacity="0.1" />
    <text x="45" y="65" textAnchor="middle" fontSize="6" fill="white" fontFamily="system-ui" fillOpacity="0.6">Live Chat • Email • Phone</text>
  </svg>
);

const HelpIllustration = () => (
  <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden>
    <circle cx="42" cy="42" r="32" fill="white" fillOpacity="0.1" />
    <text x="42" y="52" textAnchor="middle" fontSize="36" fill="white" fontFamily="system-ui" fillOpacity="0.8">?</text>
    <circle cx="42" cy="66" r="3" fill="white" fillOpacity="0.7" />
  </svg>
);

// ─── Shared types ──────────────────────────────────────────────────────────────
interface FeatureCard {
  label: string;
  sub: string;
  href: string;
  bg: string;              // gradient or solid bg class
  illustration: React.ReactNode;
  badge?: string;
  badgeClass?: string;
}

interface SideSection {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

interface MegaPanelProps {
  cards: FeatureCard[];
  cols?: 2 | 3;
  side?: SideSection[];
  onNavigate: (href: string) => void;
  onClose: () => void;
}

// ─── Feature card ──────────────────────────────────────────────────────────────
function Card({ card, onNavigate, onClose }: { card: FeatureCard; onNavigate: (h: string) => void; onClose: () => void }) {
  const isExternal = card.href.startsWith("http");
  return (
    <button
      onClick={() => {
        if (isExternal) window.open(card.href, "_blank");
        else onNavigate(card.href);
        onClose();
      }}
      className={`group relative overflow-hidden rounded-2xl text-left h-[136px] w-full transition-all duration-200 hover:scale-[1.025] hover:shadow-2xl focus:outline-none ${card.bg}`}
    >
      {/* Illustration — top-right */}
      <div className="absolute right-0 top-0 opacity-90 group-hover:scale-105 transition-transform duration-300 origin-top-right pointer-events-none select-none">
        {card.illustration}
      </div>

      {/* Bottom-left text */}
      <div className="absolute bottom-0 left-0 p-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-white font-bold text-[15px] leading-tight drop-shadow">{card.label}</span>
          {card.badge && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${card.badgeClass ?? "bg-white/20 text-white"}`}>
              {card.badge}
            </span>
          )}
        </div>
        <span className="text-white/65 text-[11px] leading-snug block">{card.sub}</span>
      </div>

      {/* Hover arrow */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowRight className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ring-1 ring-inset ring-white/20" />
    </button>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function MegaPanel({ cards, cols = 2, side, onNavigate, onClose }: MegaPanelProps) {
  const gridCols = cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className="flex gap-5">
      <div className={`grid ${gridCols} gap-2.5 flex-1`}>
        {cards.map((c) => (
          <Card key={c.href} card={c} onNavigate={onNavigate} onClose={onClose} />
        ))}
      </div>

      {side && side.length > 0 && (
        <div className="border-l border-border/40 pl-5 min-w-[148px] flex flex-col justify-between">
          <div className="flex flex-col gap-5">
            {side.map((sec) => (
              <div key={sec.heading}>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">{sec.heading}</p>
                <ul className="space-y-1.5">
                  {sec.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => {
                          if (link.external) window.open(link.href, "_blank");
                          else onNavigate(link.href);
                          onClose();
                        }}
                        className="text-[13px] font-medium text-foreground hover:text-primary transition-colors text-left w-full"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pre-built menus ───────────────────────────────────────────────────────────

export function TradeMegaMenu({ onNavigate, onClose }: { onNavigate: (h: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const cards: FeatureCard[] = [
    {
      label: t("trade.buy_crypto"),
      sub: "Buy instantly with low fees",
      href: "/buy-crypto",
      bg: "bg-gradient-to-br from-[#c2410c] to-[#f97316]",
      illustration: <BuyIllustration />,
      badge: "LOW FEES",
      badgeClass: "bg-white/25 text-white",
    },
    {
      label: t("trade.spot_trading"),
      sub: "Professional order-book trading",
      href: "/spot",
      bg: "bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8]",
      illustration: <SpotIllustration />,
    },
    {
      label: t("trade.perpetual"),
      sub: "Up to 100× leverage",
      href: "/perpetual",
      bg: "bg-gradient-to-br from-[#4c1d95] to-[#7c3aed]",
      illustration: <PerpIllustration />,
    },
    {
      label: t("trade.swap"),
      sub: "Instant token swaps",
      href: "/swap",
      bg: "bg-gradient-to-br from-[#1a3300] to-[#3a6600]",
      illustration: <SwapIllustration />,
    },
    {
      label: t("trade.prediction"),
      sub: "Trade real-world outcomes",
      href: "/prediction",
      bg: "bg-gradient-to-br from-[#134e4a] to-[#0d9488]",
      illustration: <PredictIllustration />,
    },
  ];

  const side: SideSection[] = [
    {
      heading: "Markets",
      links: [
        { label: "Live Prices", href: "/markets" },
        { label: "Explorer", href: "/explorer" },
        { label: "Analysis", href: "/analysis" },
      ],
    },
    {
      heading: "Learn",
      links: [
        { label: "Blog", href: "/blog" },
        { label: "Help Center", href: "https://help.pexly.app", external: true },
      ],
    },
  ];

  return <MegaPanel cards={cards} cols={2} side={side} onNavigate={onNavigate} onClose={onClose} />;
}

export function WalletMegaMenu({ onNavigate, onClose }: { onNavigate: (h: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const cards: FeatureCard[] = [
    {
      label: t("wallet.assets"),
      sub: t("wallet.assets_desc"),
      href: "/wallet",
      bg: "bg-gradient-to-br from-[#1e293b] to-[#334155]",
      illustration: <AssetsIllustration />,
    },
    {
      label: t("wallet.receive"),
      sub: t("wallet.receive_desc"),
      href: "/wallet/receive",
      bg: "bg-gradient-to-br from-[#14532d] to-[#16a34a]",
      illustration: <ReceiveIllustration />,
    },
    {
      label: t("wallet.visa_card"),
      sub: t("wallet.visa_card_desc"),
      href: "/wallet/visa-card",
      bg: "bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]",
      illustration: <CardIllustration />,
    },
    {
      label: t("wallet.lightning"),
      sub: t("wallet.lightning_desc"),
      href: "/wallet/lightning",
      bg: "bg-gradient-to-br from-[#78350f] to-[#d97706]",
      illustration: <LightningIllustration />,
    },
    {
      label: t("wallet.mobile_topup"),
      sub: t("wallet.mobile_topup_desc"),
      href: "/wallet/mobile-topup",
      bg: "bg-gradient-to-br from-[#3b0764] to-[#7e22ce]",
      illustration: <PhoneIllustration />,
    },
    {
      label: t("wallet.utility"),
      sub: t("wallet.utility_desc"),
      href: "/utility",
      bg: "bg-gradient-to-br from-[#1e293b] to-[#475569]",
      illustration: <UtilityIllustration />,
    },
  ];

  const side: SideSection[] = [
    {
      heading: "Quick Access",
      links: [
        { label: "Transaction History", href: "/wallet" },
        { label: "Security", href: "/settings" },
        { label: "Whitelist", href: "/settings" },
      ],
    },
  ];

  return <MegaPanel cards={cards} cols={2} side={side} onNavigate={onNavigate} onClose={onClose} />;
}

export function ShopMegaMenu({ onNavigate, onClose }: { onNavigate: (h: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const cards: FeatureCard[] = [
    {
      label: t("shop.listings"),
      sub: "Browse P2P crypto ads",
      href: "/shop",
      bg: "bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8]",
      illustration: <ShopIllustration />,
    },
    {
      label: t("shop.post_ad"),
      sub: "List your offer for free",
      href: "/shop/post",
      bg: "bg-gradient-to-br from-[#1a3300] to-[#3a6600]",
      illustration: <PostAdIllustration />,
      badge: "FREE",
      badgeClass: "bg-white/25 text-white",
    },
  ];

  return <MegaPanel cards={cards} cols={2} onNavigate={onNavigate} onClose={onClose} />;
}

export function EarnMegaMenu({ onNavigate, onClose }: { onNavigate: (h: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const cards: FeatureCard[] = [
    {
      label: t("earn.stake"),
      sub: "Earn yield on your crypto",
      href: "/wallet/stake",
      bg: "bg-gradient-to-br from-[#1a3300] to-[#365f00]",
      illustration: <StakeIllustration />,
      badge: "HOT",
      badgeClass: "bg-red-500 text-white",
    },
    {
      label: t("earn.referral_program"),
      sub: "Invite friends, earn together",
      href: "/referral",
      bg: "bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8]",
      illustration: <ReferralIllustration />,
    },
    {
      label: t("earn.rewards"),
      sub: "Daily rewards & bonuses",
      href: "/rewards",
      bg: "bg-gradient-to-br from-[#4c1d95] to-[#7c3aed]",
      illustration: <RewardsIllustration />,
    },
  ];

  return <MegaPanel cards={cards} cols={2} onNavigate={onNavigate} onClose={onClose} />;
}

export function SupportMegaMenu({ onNavigate, onClose }: { onNavigate: (h: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const cards: FeatureCard[] = [
    {
      label: t("support.contact_support"),
      sub: "Talk to our team 24/7",
      href: "/contact",
      bg: "bg-gradient-to-br from-[#1a3300] to-[#365f00]",
      illustration: <ContactIllustration />,
    },
    {
      label: t("support.help_center"),
      sub: "Browse FAQs and guides",
      href: "https://help.pexly.app",
      bg: "bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8]",
      illustration: <HelpIllustration />,
    },
  ];

  return <MegaPanel cards={cards} cols={2} onNavigate={onNavigate} onClose={onClose} />;
}
