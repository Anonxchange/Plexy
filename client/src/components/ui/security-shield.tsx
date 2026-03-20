interface SecurityShieldProps {
  level: 'low' | 'medium' | 'high';
  size?: number;
  className?: string;
}

export function SecurityShieldIcon({ level, size = 40, className }: SecurityShieldProps) {
  const id = level;

  const palette = {
    low: {
      grad0: '#ff6b6b',
      grad1: '#ef4444',
      grad2: '#b91c1c',
      rim: '#fca5a5',
      glow: '#ef444455',
    },
    medium: {
      grad0: '#fde047',
      grad1: '#eab308',
      grad2: '#854d0e',
      rim: '#fef08a',
      glow: '#eab30855',
    },
    high: {
      grad0: '#86efac',
      grad1: '#22c55e',
      grad2: '#14532d',
      rim: '#bbf7d0',
      glow: '#22c55e55',
    },
  }[level];

  const h = Math.round(size * 1.18);

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 56 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`Security level: ${level}`}
    >
      <defs>
        {/* Main body gradient — top-lit, darker at bottom */}
        <linearGradient id={`${id}-body`} x1="28" y1="2" x2="28" y2="63" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.grad0} />
          <stop offset="48%" stopColor={palette.grad1} />
          <stop offset="100%" stopColor={palette.grad2} />
        </linearGradient>

        {/* Edge bevel — slightly lighter left half */}
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="55%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="black" stopOpacity="0.14" />
        </linearGradient>

        {/* Top shine */}
        <linearGradient id={`${id}-shine`} x1="28" y1="2" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.38" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Rim glow filter */}
        <filter id={`${id}-glow`} x="-25%" y="-15%" width="150%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor={palette.glow} floodOpacity="1" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={palette.grad1} floodOpacity="0.3" />
        </filter>

        {/* Clip to shield shape */}
        <clipPath id={`${id}-clip`}>
          <path d="M28 2L5 11V31C5 44 15.5 55 28 61C40.5 55 51 44 51 31V11L28 2Z" />
        </clipPath>
      </defs>

      {/* ── Outer rim / glow layer ─────────────────────────────── */}
      <path
        d="M28 2L5 11V31C5 44 15.5 55 28 61C40.5 55 51 44 51 31V11L28 2Z"
        fill={palette.grad1}
        filter={`url(#${id}-glow)`}
        opacity="0.55"
      />

      {/* ── Main shield body ───────────────────────────────────── */}
      <path
        d="M28 2L5 11V31C5 44 15.5 55 28 61C40.5 55 51 44 51 31V11L28 2Z"
        fill={`url(#${id}-body)`}
      />

      {/* ── Bevel overlay (left/right depth) ──────────────────── */}
      <path
        d="M28 2L5 11V31C5 44 15.5 55 28 61C40.5 55 51 44 51 31V11L28 2Z"
        fill={`url(#${id}-bevel)`}
      />

      {/* ── Inner frame line ──────────────────────────────────── */}
      <path
        d="M28 7L10 14.5V31C10 41.5 18 51 28 56C38 51 46 41.5 46 31V14.5L28 7Z"
        fill="none"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1"
      />

      {/* ── Decorative horizontal band ────────────────────────── */}
      <rect x="10" y="24" width="36" height="1" fill="white" fillOpacity="0.12" />

      {/* ── Top shine ─────────────────────────────────────────── */}
      <path
        d="M28 2L5 11V31C5 44 15.5 55 28 61C40.5 55 51 44 51 31V11L28 2Z"
        fill={`url(#${id}-shine)`}
        clipPath={`url(#${id}-clip)`}
      />

      {/* ── Rim highlight stroke ──────────────────────────────── */}
      <path
        d="M28 4.5L7 12.5V31C7 43 16.5 53 28 58.5C39.5 53 49 43 49 31V12.5L28 4.5Z"
        fill="none"
        stroke={palette.rim}
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />

      {/* ── Emblem / symbol ───────────────────────────────────── */}
      {level === 'high' && (
        /* Bold checkmark */
        <path
          d="M17 32L24 39.5L39 22"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
      )}

      {level === 'medium' && (
        /* Padlock — shackle open / partial */
        <g>
          <rect x="20" y="31" width="16" height="12" rx="2.5" fill="white" fillOpacity="0.88" />
          {/* partial shackle — open right side */}
          <path
            d="M23 31V27.5C23 25.0 24.3 23 28 23C30.5 23 32 24.5 32 26.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeOpacity="0.88"
            fill="none"
          />
          <circle cx="28" cy="37" r="2.5" fill={palette.grad2} opacity="0.8" />
          <line x1="28" y1="39.5" x2="28" y2="41.5" stroke={palette.grad2} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
      )}

      {level === 'low' && (
        /* Alert exclamation in a circle */
        <g>
          <circle cx="28" cy="34" r="10" fill="white" fillOpacity="0.12" />
          <circle cx="28" cy="34" r="9" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
          <line x1="28" y1="28" x2="28" y2="36" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.92" />
          <circle cx="28" cy="40" r="1.8" fill="white" opacity="0.92" />
        </g>
      )}

      {/* ── Bottom rivet detail ───────────────────────────────── */}
      <ellipse cx="28" cy="60.5" rx="3.5" ry="1.4" fill="white" fillOpacity="0.18" />
    </svg>
  );
}
