// ─── Filter pill icons (no background, currentColor) ─────────────────────────

export function FilterAllIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* gift box body */}
      <rect x="1.5" y="7" width="13" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      {/* lid */}
      <rect x="1" y="4.5" width="14" height="2.8" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* vertical ribbon */}
      <line x1="8" y1="4.5" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.5" />
      {/* bow left */}
      <path d="M8 4.5 C6.5 3 4.5 2.5 4.5 4 C4.5 5 6.5 5 8 4.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      {/* bow right */}
      <path d="M8 4.5 C9.5 3 11.5 2.5 11.5 4 C11.5 5 9.5 5 8 4.5Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function FilterGiftCardIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* card outline */}
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {/* magnetic stripe */}
      <rect x="1" y="6" width="14" height="2.2" fill="currentColor" opacity="0.35" />
      {/* chip */}
      <rect x="3" y="9.5" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function FilterAirtimeIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* phone body */}
      <rect x="4" y="1" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {/* speaker slot */}
      <line x1="6.5" y1="3" x2="9.5" y2="3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* home button */}
      <circle cx="8" cy="12.5" r="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function FilterDataIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* three wifi arcs */}
      <path d="M2 8 Q8 2.5 14 8"   stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.45" />
      <path d="M4 10.5 Q8 6.5 12 10.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M6 13 Q8 11 10 13"  stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* dot */}
      <circle cx="8" cy="15" r="1.1" fill="currentColor" />
    </svg>
  );
}

// ─── Airtime / Phone ──────────────────────────────────────────────────────────

export function PhoneIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0ea5e9" />
      <rect x="10" y="5" width="12" height="22" rx="3" fill="white" opacity="0.15" />
      <rect x="10" y="5" width="12" height="22" rx="3" stroke="white" strokeWidth="1.8" />
      <rect x="13" y="7" width="6" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <circle cx="16" cy="23" r="1.3" fill="white" opacity="0.7" />
      <rect x="12.5" y="9.5" width="7" height="11" rx="1" fill="white" opacity="0.25" />
    </svg>
  );
}

// ─── Data / Wifi ──────────────────────────────────────────────────────────────

export function WifiIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366f1" />
      <path d="M6 13.5 Q16 6 26 13.5" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M9 17.5 Q16 12 23 17.5" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d="M12 21.5 Q16 18 20 21.5" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="25.5" r="2" fill="white" />
    </svg>
  );
}

// ─── Amazon ───────────────────────────────────────────────────────────────────

export function AmazonIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF9900" />
      {/* Shopping bag */}
      <path
        d="M10 13 L10 24 Q10 25 11 25 L21 25 Q22 25 22 24 L22 13 Z"
        stroke="white" strokeWidth="1.8" fill="none" strokeLinejoin="round"
      />
      <path
        d="M13 13 L13 10.5 Q13 8 16 8 Q19 8 19 10.5 L19 13"
        stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"
      />
      {/* Smile arrow */}
      <path d="M8.5 28 Q16 32.5 23.5 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M21.5 26.5 L23.5 28 L21.5 29.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Google Play ──────────────────────────────────────────────────────────────

export function GooglePlayIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="white" />
      {/* 4-colour play triangle — each quadrant is a distinct triangle */}
      {/* Outer triangle: apex (27,16), base (5,3)→(5,29)
          Mid-left x=5 y=16; top diagonal at x=16 → y=9.5; bottom diagonal at x=16 → y=22.5 */}
      <path d="M5,3 L5,16 L16,9.5 Z"  fill="#4285F4" />   {/* blue   top-left  */}
      <path d="M5,16 L5,29 L16,22.5 Z" fill="#34A853" />  {/* green  bot-left  */}
      <path d="M16,9.5 L27,16 L16,16 Z" fill="#FBBC05" /> {/* yellow top-right */}
      <path d="M16,16 L27,16 L16,22.5 Z" fill="#EA4335" />{/* red   bot-right  */}
    </svg>
  );
}

// ─── Apple ────────────────────────────────────────────────────────────────────

export function AppleIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1d1d1f" />
      {/* Leaf */}
      <path d="M16 8 Q19 4 22 5.5 Q19 5.5 16 8 Z" fill="white" />
      {/* Apple body — two lobes at top, tapers to base */}
      <path
        d="M16 8
           C 12 8, 8 11, 8 16
           C 8 22, 11 27, 14 27
           C 15 27, 15.5 26, 16 26
           C 16.5 26, 17 27, 18 27
           C 21 27, 24 22, 24 16
           C 24 11, 20 8, 16 8 Z"
        fill="white"
      />
      {/* Right-side bite */}
      <ellipse cx="23.5" cy="13.5" rx="3.5" ry="4" fill="#1d1d1f" />
    </svg>
  );
}

// ─── Uber ─────────────────────────────────────────────────────────────────────

export function UberIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#000000" />
      {/* U glyph — two vertical legs + curved base */}
      <path
        d="M10 8 L10 19 Q10 25 16 25 Q22 25 22 19 L22 8 L18.5 8 L18.5 19 Q18.5 21.5 16 21.5 Q13.5 21.5 13.5 19 L13.5 8 Z"
        fill="white"
      />
    </svg>
  );
}

// ─── Spotify ──────────────────────────────────────────────────────────────────

export function SpotifyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1DB954" />
      {/* Three concentric sound-wave arcs */}
      <path d="M8 12.5 Q16 8.5 24 12.5"   stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M9.5 17.5 Q16 13.5 22.5 17.5" stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <path d="M11 22.5 Q16 19 21 22.5"   stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Steam ────────────────────────────────────────────────────────────────────

export function SteamIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1B2838" />
      {/* Outer ring */}
      <circle cx="16" cy="13" r="8.5" stroke="#C6D4DF" strokeWidth="2.2" fill="none" />
      {/* Inner filled circle */}
      <circle cx="16" cy="13" r="3.5" fill="#C6D4DF" />
      {/* Steam pipe flowing down-left */}
      <path
        d="M10 20 Q7 25 8 29"
        stroke="#C6D4DF" strokeWidth="3.5" fill="none" strokeLinecap="round"
      />
      {/* Gear teeth — 6 evenly spaced radial ticks outside the ring */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r1 = deg * (Math.PI / 180);
        const x1 = 16 + 8.5 * Math.cos(r1);
        const y1 = 13 + 8.5 * Math.sin(r1);
        const x2 = 16 + 11.5 * Math.cos(r1);
        const y2 = 13 + 11.5 * Math.sin(r1);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#C6D4DF" strokeWidth="2.2" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

// ─── Netflix ──────────────────────────────────────────────────────────────────

export function NetflixIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#E50914" />
      {/*
        Netflix N:  two vertical bars joined by a diagonal slash.
        Left bar:  x 8→12,  y 5→27
        Right bar: x 20→24, y 5→27
        Diagonal:  (12,5)→(20,27) (top of left bar to bottom of right bar)
        Path visits the 8 outer vertices of the N in clockwise order.
      */}
      <path d="M8,5 L12,5 L20,27 L24,27 L24,5 L20,5 L12,27 L8,27 Z" fill="white" />
    </svg>
  );
}
