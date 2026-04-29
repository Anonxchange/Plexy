// Custom SVG icon components for the Rewards page.
// All icons are hand-crafted to match Pexly's clean, modern design language.

interface IconProps {
  className?: string;
  size?: number;
}

// ─── Badge Icons ─────────────────────────────────────────────────────────────

export function IconLightning({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <polygon
        points="16,2 6,16 13,16 12,26 22,12 15,12"
        fill="url(#lgLightning)"
        stroke="url(#lgLightningStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="lgLightning" x1="6" y1="2" x2="22" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="lgLightningStroke" x1="6" y1="2" x2="22" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconShieldCheck({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M14 2L4 6v8c0 5.5 4.3 10.6 10 12 5.7-1.4 10-6.5 10-12V6L14 2z"
        fill="url(#lgShield)"
        stroke="url(#lgShieldStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polyline
        points="9,14 12.5,17.5 19,11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="lgShield" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="lgShieldStroke" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconFlame({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M14 2c0 0 6 5 6 10a6 6 0 01-12 0c0-2 1-3.5 1-3.5S10 11 12 11c0 0-3-3-1-7 0 0 1 3 3 3 0-3 0-5 0-5z"
        fill="url(#lgFlame)"
        stroke="url(#lgFlameStroke)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <ellipse cx="14" cy="22" rx="4" ry="1.5" fill="#F97316" opacity="0.25" />
      <defs>
        <linearGradient id="lgFlame" x1="8" y1="2" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="lgFlameStroke" x1="8" y1="2" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconCrystalEye({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M3 14c0 0 4-7 11-7s11 7 11 7-4 7-11 7S3 14 3 14z"
        fill="url(#lgEye)"
        stroke="url(#lgEyeStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="3.5" fill="url(#lgPupil)" />
      <circle cx="15.2" cy="12.8" r="1.1" fill="white" opacity="0.7" />
      <circle cx="5" cy="9" r="0.8" fill="#C084FC" opacity="0.8" />
      <circle cx="22" cy="8" r="0.6" fill="#E879F9" opacity="0.8" />
      <circle cx="24" cy="18" r="0.5" fill="#A855F7" opacity="0.7" />
      <defs>
        <linearGradient id="lgEye" x1="3" y1="7" x2="25" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="lgEyeStroke" x1="3" y1="7" x2="25" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <radialGradient id="lgPupil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function IconHandshake({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M2 10l5 4 3-2 4 3 4-3 3 2 5-4"
        stroke="url(#lgShake)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7 14l-4 5h4l4-3"
        stroke="url(#lgShakeL)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M21 14l4 5h-4l-4-3"
        stroke="url(#lgShakeR)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="10" cy="12" r="1.2" fill="#F472B6" />
      <circle cx="14" cy="15" r="1.2" fill="#EC4899" />
      <circle cx="18" cy="12" r="1.2" fill="#F472B6" />
      <defs>
        <linearGradient id="lgShake" x1="2" y1="10" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id="lgShakeL" x1="3" y1="14" x2="11" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="lgShakeR" x1="17" y1="14" x2="25" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconSwapArrows({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M5 10a9 9 0 0116.6-3"
        stroke="url(#lgSwap1)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <polyline points="19,4 21.6,7 18,8.5" stroke="url(#lgSwap1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path
        d="M23 18a9 9 0 01-16.6 3"
        stroke="url(#lgSwap2)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <polyline points="9,24 6.4,21 10,19.5" stroke="url(#lgSwap2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="lgSwap1" x1="5" y1="7" x2="22" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id="lgSwap2" x1="6" y1="18" x2="23" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconDiamond({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <polygon
        points="14,3 24,10 20,25 8,25 4,10"
        fill="url(#lgDiamond)"
        stroke="url(#lgDiamondStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon points="14,3 24,10 14,10 4,10" fill="url(#lgDiamondTop)" opacity="0.8" />
      <polygon points="4,10 14,10 8,25" fill="url(#lgDiamondLeft)" opacity="0.5" />
      <polygon points="24,10 20,25 14,10" fill="url(#lgDiamondRight)" opacity="0.35" />
      <line x1="4" y1="10" x2="24" y2="10" stroke="white" strokeWidth="0.5" opacity="0.4" />
      <circle cx="8" cy="6" r="0.8" fill="white" opacity="0.6" />
      <defs>
        <linearGradient id="lgDiamond" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="lgDiamondStroke" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="lgDiamondTop" x1="4" y1="3" x2="24" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="lgDiamondLeft" x1="4" y1="10" x2="14" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="lgDiamondRight" x1="14" y1="10" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconChartTrend({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="16" width="4" height="9" rx="1.5" fill="url(#lgBar1)" />
      <rect x="9" y="11" width="4" height="14" rx="1.5" fill="url(#lgBar2)" />
      <rect x="15" y="7" width="4" height="18" rx="1.5" fill="url(#lgBar3)" />
      <rect x="21" y="3" width="4" height="22" rx="1.5" fill="url(#lgBar4)" />
      <polyline
        points="5,15 11,10 17,6 23,2"
        stroke="url(#lgTrend)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="2" r="2" fill="#B4F22E" />
      <defs>
        <linearGradient id="lgBar1" x1="3" y1="16" x2="7" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="lgBar2" x1="9" y1="11" x2="13" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="lgBar3" x1="15" y1="7" x2="19" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
        <linearGradient id="lgBar4" x1="21" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B4F22E" />
          <stop offset="100%" stopColor="#4D7C0F" />
        </linearGradient>
        <linearGradient id="lgTrend" x1="5" y1="15" x2="23" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#B4F22E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconStarBurst({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <polygon
        points="14,1 16.9,10.1 26.4,10.1 18.8,15.9 21.6,25 14,19.2 6.4,25 9.2,15.9 1.6,10.1 11.1,10.1"
        fill="url(#lgStar)"
        stroke="url(#lgStarStroke)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="13" r="2.5" fill="white" opacity="0.3" />
      <defs>
        <linearGradient id="lgStar" x1="1.6" y1="1" x2="26.4" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="lgStarStroke" x1="1.6" y1="1" x2="26.4" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconWave({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M2 18c3-5 5-5 7 0s5 5 7 0 5-5 7 0"
        stroke="url(#lgWave1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 22c3-4 5-4 7 0s5 4 7 0 5-4 7 0"
        stroke="url(#lgWave2)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M8 14c1-6 4-9 8-10 2 1 4 5 3 10"
        fill="url(#lgFin)"
        stroke="url(#lgFinStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="lgWave1" x1="2" y1="18" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="lgWave2" x1="2" y1="22" x2="26" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="lgFin" x1="8" y1="4" x2="19" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
        <linearGradient id="lgFinStroke" x1="8" y1="4" x2="19" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconCrown({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M3 20L6 10l5 6 3-9 3 9 5-6 3 10z"
        fill="url(#lgCrown)"
        stroke="url(#lgCrownStroke)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="3" y="20" width="22" height="4" rx="1.5" fill="url(#lgCrownBase)" />
      <circle cx="6" cy="10" r="1.5" fill="#FDE68A" />
      <circle cx="14" cy="7" r="1.5" fill="#FDE68A" />
      <circle cx="22" cy="10" r="1.5" fill="#FDE68A" />
      <circle cx="9" cy="22" r="1" fill="#FCD34D" opacity="0.8" />
      <circle cx="14" cy="22" r="1" fill="#FDE68A" opacity="0.8" />
      <circle cx="19" cy="22" r="1" fill="#FCD34D" opacity="0.8" />
      <defs>
        <linearGradient id="lgCrown" x1="3" y1="7" x2="25" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="lgCrownStroke" x1="3" y1="7" x2="25" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="lgCrownBase" x1="3" y1="20" x2="25" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconGiftBox({ className, size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="4" y="13" width="20" height="12" rx="1.5" fill="url(#lgGiftBox)" />
      <rect x="3" y="9" width="22" height="5" rx="1.5" fill="url(#lgGiftLid)" />
      <line x1="14" y1="9" x2="14" y2="25" stroke="url(#lgGiftRibbon)" strokeWidth="2.5" />
      <path d="M14 9c0 0-3-3-3-5 0-1 1-1.5 2-1 1 .5 2 2.5 1 6" fill="url(#lgGiftBow1)" />
      <path d="M14 9c0 0 3-3 3-5 0-1-1-1.5-2-1-1 .5-2 2.5-1 6" fill="url(#lgGiftBow2)" />
      <defs>
        <linearGradient id="lgGiftBox" x1="4" y1="13" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id="lgGiftLid" x1="3" y1="9" x2="25" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="lgGiftRibbon" x1="14" y1="9" x2="14" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="lgGiftBow1" x1="11" y1="3" x2="14" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="lgGiftBow2" x1="14" y1="3" x2="17" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Tier Icons ───────────────────────────────────────────────────────────────

export function TierIconNewcomer({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M11 19V10" stroke="url(#lgStem)" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 14c0 0-4-2-4-6 0-3 2-4 4-4s4 1 4 4c0 4-4 6-4 6z" fill="url(#lgLeaf)" stroke="url(#lgLeafStroke)" strokeWidth="0.6" strokeLinejoin="round" />
      <path d="M11 12c0 0 2-1.5 4-4" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="11" cy="19.5" rx="3" ry="1" fill="#64748B" opacity="0.25" />
      <defs>
        <linearGradient id="lgStem" x1="11" y1="10" x2="11" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="lgLeaf" x1="7" y1="4" x2="15" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="lgLeafStroke" x1="7" y1="4" x2="15" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TierIconBronze({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="9" r="6" fill="url(#lgBronzeCircle)" stroke="url(#lgBronzeStroke)" strokeWidth="0.8" />
      <text x="11" y="13" textAnchor="middle" fontSize="7" fontWeight="bold" fill="white" opacity="0.9">1st</text>
      <rect x="8" y="15" width="6" height="3" rx="0.5" fill="url(#lgBronzeBar)" />
      <path d="M7 15l-2 4h3l3-4" fill="url(#lgBronzeL)" />
      <path d="M15 15l2 4h-3l-3-4" fill="url(#lgBronzeR)" />
      <defs>
        <radialGradient id="lgBronzeCircle" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FDE8CC" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <linearGradient id="lgBronzeStroke" x1="5" y1="3" x2="17" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="lgBronzeBar" x1="8" y1="15" x2="14" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="lgBronzeL" x1="5" y1="15" x2="10" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="lgBronzeR" x1="12" y1="15" x2="17" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TierIconSilver({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M11 2L3 5.5v6c0 4.5 3.5 8.7 8 10 4.5-1.3 8-5.5 8-10v-6L11 2z"
        fill="url(#lgSilver)" stroke="url(#lgSilverStroke)" strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M11 5L5.5 7.5v4.5c0 3 2.3 5.8 5.5 6.8 3.2-1 5.5-3.8 5.5-6.8V7.5L11 5z"
        fill="url(#lgSilverInner)" opacity="0.4" />
      <polyline points="8,11.5 10.5,14 14.5,9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="lgSilver" x1="3" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="lgSilverStroke" x1="3" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="lgSilverInner" x1="5.5" y1="5" x2="16.5" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TierIconGold({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path d="M5 7l6 13 6-13" fill="url(#lgTrophyBody)" stroke="url(#lgTrophyStroke)" strokeWidth="0.7" strokeLinejoin="round" />
      <path d="M5 7c-3 0-3 4 0 4" stroke="url(#lgHandle)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 7c3 0 3 4 0 4" stroke="url(#lgHandle)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="8.5" y="19.5" width="5" height="1.5" rx="0.5" fill="url(#lgBase)" />
      <rect x="10" y="18.5" width="2" height="1.5" fill="url(#lgStem2)" />
      <circle cx="11" cy="10" r="2" fill="url(#lgStar2)" opacity="0.9" />
      <defs>
        <linearGradient id="lgTrophyBody" x1="5" y1="7" x2="17" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="lgTrophyStroke" x1="5" y1="7" x2="17" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="lgHandle" x1="0" y1="7" x2="0" y2="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="lgBase" x1="8.5" y1="19.5" x2="13.5" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="lgStem2" x1="10" y1="18.5" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <radialGradient id="lgStar2" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FBBF24" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function TierIconDiamond({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <polygon points="11,2 19,8 16,20 6,20 3,8"
        fill="url(#lgDiam)" stroke="url(#lgDiamStroke)" strokeWidth="0.7" strokeLinejoin="round" />
      <polygon points="11,2 19,8 11,8 3,8" fill="url(#lgDiamTop)" opacity="0.7" />
      <polygon points="3,8 11,8 6,20" fill="url(#lgDiamLeft)" opacity="0.45" />
      <polygon points="19,8 16,20 11,8" fill="url(#lgDiamRight)" opacity="0.3" />
      <line x1="3" y1="8" x2="19" y2="8" stroke="white" strokeWidth="0.5" opacity="0.45" />
      <circle cx="7" cy="5" r="0.7" fill="white" opacity="0.7" />
      <circle cx="15" cy="4" r="0.5" fill="white" opacity="0.5" />
      <defs>
        <linearGradient id="lgDiam" x1="3" y1="2" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
        <linearGradient id="lgDiamStroke" x1="3" y1="2" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#155E75" />
        </linearGradient>
        <linearGradient id="lgDiamTop" x1="3" y1="2" x2="19" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="lgDiamLeft" x1="3" y1="8" x2="11" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
        <linearGradient id="lgDiamRight" x1="11" y1="8" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#164E63" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Tier Crystal Card Illustrations ─────────────────────────────────────────
// Large low-poly 3D crystal SVGs used in the tier benefit carousel cards.

export function TierCrystalNewcomer({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.27);
  return (
    <svg width={size} height={h} viewBox="0 0 110 140" fill="none">
      <ellipse cx="55" cy="132" rx="20" ry="5" fill="rgba(0,0,0,0.32)" />
      {/* chips */}
      <polygon points="76,42 81,35 87,42 81,49" fill="#34D399" stroke="#022C22" strokeWidth="0.8" opacity="0.85" />
      <polygon points="27,54 32,47 37,54 32,61" fill="#6EE7B7" stroke="#022C22" strokeWidth="0.7" opacity="0.75" />
      {/* top tip */}
      <polygon points="55,18 64,42 55,46 46,42" fill="#A7F3D0" stroke="#022C22" strokeWidth="0.9" />
      {/* left face */}
      <polygon points="46,42 55,46 55,108 30,92" fill="#065F46" stroke="#022C22" strokeWidth="0.9" />
      {/* right face */}
      <polygon points="64,42 55,46 55,108 80,92" fill="#059669" stroke="#022C22" strokeWidth="0.9" />
      {/* bottom taper */}
      <polygon points="30,92 55,108 80,92 55,122" fill="#047857" stroke="#022C22" strokeWidth="0.9" />
      {/* glint */}
      <polygon points="55,18 62,36 55,33" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

export function TierCrystalBronze({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.27);
  return (
    <svg width={size} height={h} viewBox="0 0 110 140" fill="none">
      <ellipse cx="54" cy="130" rx="24" ry="5.5" fill="rgba(0,0,0,0.36)" />
      {/* chips */}
      <polygon points="74,28 80,21 86,28 80,35" fill="#D97706" stroke="#1C0A00" strokeWidth="0.8" opacity="0.9" />
      <polygon points="28,46 33,39 39,46 33,53" fill="#FDBA74" stroke="#1C0A00" strokeWidth="0.7" opacity="0.8" />
      <polygon points="82,52 86,46 91,52 86,58" fill="#92400E" stroke="#1C0A00" strokeWidth="0.7" opacity="0.7" />
      {/* top face */}
      <polygon points="54,44 78,57 54,65 30,57" fill="#FDBA74" stroke="#1C0A00" strokeWidth="1" />
      {/* left face */}
      <polygon points="30,57 54,65 54,108 30,94" fill="#78350F" stroke="#1C0A00" strokeWidth="1" />
      {/* right face */}
      <polygon points="78,57 54,65 54,108 78,94" fill="#B45309" stroke="#1C0A00" strokeWidth="1" />
      {/* bottom */}
      <polygon points="30,94 54,108 78,94 54,120" fill="#92400E" stroke="#1C0A00" strokeWidth="1" />
      {/* glint */}
      <polygon points="54,44 64,52 54,49" fill="rgba(255,255,255,0.24)" />
    </svg>
  );
}

export function TierCrystalSilver({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.27);
  return (
    <svg width={size} height={h} viewBox="0 0 110 140" fill="none">
      <ellipse cx="52" cy="132" rx="28" ry="6" fill="rgba(0,0,0,0.36)" />
      {/* chips */}
      <polygon points="80,17 86,10 92,17 86,24" fill="#94A3B8" stroke="#0F172A" strokeWidth="0.8" opacity="0.9" />
      <polygon points="20,32 26,24 32,32 26,40" fill="#CBD5E1" stroke="#0F172A" strokeWidth="0.7" opacity="0.8" />
      <polygon points="86,42 91,35 96,42 91,49" fill="#475569" stroke="#0F172A" strokeWidth="0.7" opacity="0.7" />
      <polygon points="16,58 21,51 26,58 21,65" fill="#94A3B8" stroke="#0F172A" strokeWidth="0.6" opacity="0.65" />
      {/* main tall shard — front-left face (bright) */}
      <polygon points="40,16 27,96 50,118 62,28" fill="#CBD5E1" stroke="#0F172A" strokeWidth="1" />
      {/* front-right face */}
      <polygon points="62,28 50,118 76,112 74,54" fill="#94A3B8" stroke="#0F172A" strokeWidth="1" />
      {/* back right face */}
      <polygon points="74,54 76,112 84,88 80,48" fill="#334155" stroke="#0F172A" strokeWidth="1" />
      {/* top cap */}
      <polygon points="40,16 62,28 50,20" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1" />
      {/* glint */}
      <polygon points="40,16 47,28 43,50 38,34" fill="rgba(255,255,255,0.2)" />
      {/* secondary mini-shard */}
      <polygon points="80,48 84,88 92,78 88,44" fill="#475569" stroke="#0F172A" strokeWidth="0.8" />
      <polygon points="88,44 92,78 97,66 93,38" fill="#64748B" stroke="#0F172A" strokeWidth="0.8" />
    </svg>
  );
}

export function TierCrystalGold({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.27);
  return (
    <svg width={size} height={h} viewBox="0 0 110 140" fill="none">
      <ellipse cx="55" cy="133" rx="36" ry="7" fill="rgba(0,0,0,0.42)" />
      {/* chips — many */}
      <polygon points="83,12 89,5 95,12 89,19" fill="#F59E0B" stroke="#1C0800" strokeWidth="0.8" opacity="0.95" />
      <polygon points="68,4 74,0 79,4 74,9"  fill="#FDE68A" stroke="#1C0800" strokeWidth="0.7" opacity="0.85" />
      <polygon points="23,20 29,13 35,20 29,27" fill="#D97706" stroke="#1C0800" strokeWidth="0.7" opacity="0.8" />
      <polygon points="90,33 95,27 100,33 95,39" fill="#92400E" stroke="#1C0800" strokeWidth="0.7" opacity="0.75" />
      <polygon points="14,44 19,37 24,44 19,51" fill="#F59E0B" stroke="#1C0800" strokeWidth="0.7" opacity="0.7" />
      <polygon points="94,56 99,50 104,56 99,62" fill="#FDE68A" stroke="#1C0800" strokeWidth="0.6" opacity="0.6" />
      {/* main left crystal */}
      <polygon points="36,16 18,100 46,122 60,26" fill="#FDE68A" stroke="#1C0800" strokeWidth="1.1" />
      <polygon points="36,16 18,100 12,82 28,16" fill="#78350F"  stroke="#1C0800" strokeWidth="1.1" />
      <polygon points="60,26 46,122 56,114 64,40" fill="#B45309" stroke="#1C0800" strokeWidth="1.1" />
      <polygon points="36,16 46,24 40,20" fill="rgba(255,255,255,0.32)" />
      {/* secondary right crystal */}
      <polygon points="64,34 56,110 76,120 84,50" fill="#F59E0B" stroke="#1C0800" strokeWidth="1" />
      <polygon points="84,50 76,120 90,112 92,65" fill="#92400E" stroke="#1C0800" strokeWidth="1" />
      <polygon points="64,34 75,44 68,38" fill="rgba(255,255,255,0.26)" />
      {/* base cluster */}
      <polygon points="12,100 18,122 46,122 64,114 76,120 92,112 92,100 64,90 40,90" fill="#78350F" stroke="#1C0800" strokeWidth="1" />
      <polygon points="12,100 40,90 64,90 92,100 68,86 36,86" fill="#B45309" stroke="#1C0800" strokeWidth="1" />
    </svg>
  );
}

export function TierCrystalDiamond({ size = 110 }: { size?: number }) {
  const h = Math.round(size * 1.27);
  return (
    <svg width={size} height={h} viewBox="0 0 110 140" fill="none">
      <ellipse cx="55" cy="132" rx="30" ry="6.5" fill="rgba(0,0,0,0.36)" />
      {/* chips */}
      <polygon points="82,20 88,13 94,20 88,27" fill="#38BDF8" stroke="#082F49" strokeWidth="0.8" opacity="0.9" />
      <polygon points="18,27 24,20 30,27 24,34" fill="#BAE6FD" stroke="#082F49" strokeWidth="0.7" opacity="0.8" />
      <polygon points="89,46 94,39 99,46 94,53" fill="#0EA5E9" stroke="#082F49" strokeWidth="0.7" opacity="0.7" />
      <polygon points="14,52 19,45 24,52 19,59" fill="#38BDF8" stroke="#082F49" strokeWidth="0.6" opacity="0.65" />
      <polygon points="78,8 83,2 88,8 83,14"  fill="#7DD3FC" stroke="#082F49" strokeWidth="0.6" opacity="0.75" />
      {/* crown */}
      <polygon points="36,38 74,38 82,56 28,56" fill="#BAE6FD" stroke="#082F49" strokeWidth="1" />
      <polygon points="36,38 28,56 16,48 28,32" fill="#38BDF8"  stroke="#082F49" strokeWidth="1" />
      <polygon points="74,38 82,56 94,48 82,32" fill="#0EA5E9"  stroke="#082F49" strokeWidth="1" />
      <polygon points="28,32 36,38 55,30 42,20" fill="#7DD3FC"  stroke="#082F49" strokeWidth="1" />
      <polygon points="82,32 74,38 55,30 68,20" fill="#38BDF8"  stroke="#082F49" strokeWidth="1" />
      <polygon points="42,20 55,30 68,20 55,13" fill="#BAE6FD"  stroke="#082F49" strokeWidth="1" />
      {/* pavilion */}
      <polygon points="28,56 16,48 36,96 55,118" fill="#0369A1" stroke="#082F49" strokeWidth="1" />
      <polygon points="28,56 55,118 55,66"       fill="#0EA5E9" stroke="#082F49" strokeWidth="1" />
      <polygon points="82,56 55,118 55,66"       fill="#0284C7" stroke="#082F49" strokeWidth="1" />
      <polygon points="82,56 94,48 74,96 55,118" fill="#075985" stroke="#082F49" strokeWidth="1" />
      {/* glint */}
      <polygon points="42,20 50,28 44,22" fill="rgba(255,255,255,0.38)" />
    </svg>
  );
}
