export const MulticolorIcons = {
  Bitcoin: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <circle cx="24" cy="24" r="22" fill="#F7931A"/>
      <path d="M32.5 21.5c.5-3.3-2-5-5.5-6.2l1.1-4.5-2.7-.7-1.1 4.3c-.7-.2-1.5-.3-2.2-.5l1.1-4.4-2.7-.7-1.1 4.5c-.6-.1-1.2-.2-1.7-.4l-3.7-.9-.7 2.9s2 .5 1.9.5c1.1.3 1.3 1 1.2 1.6l-2.9 11.6c-.2.4-.5.9-1.4.7.1.1-1.9-.5-1.9-.5l-1.3 3.1 3.5.9c.6.2 1.3.3 1.9.4l-1.1 4.5 2.7.7 1.1-4.5c.7.2 1.5.4 2.2.5l-1.1 4.4 2.7.7 1.1-4.5c4.6.9 8 .5 9.5-3.7 1.2-3.4 0-5.3-2.5-6.6 1.8-.4 3.1-1.6 3.5-4zm-6.2 8.7c-.8 3.3-6.5 1.5-8.3 1.1l1.5-5.9c1.8.4 7.7 1.3 6.8 4.8zm.8-8.8c-.8 3-5.5 1.5-7.1 1.1l1.3-5.4c1.6.4 6.5 1.2 5.8 4.3z" fill="white"/>
    </svg>
  ),
  
  Wallet: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <rect x="6" y="12" width="36" height="26" rx="3" fill="url(#walletGrad)"/>
      <rect x="8" y="14" width="32" height="22" rx="2" fill="#f8f9fa" opacity="0.2"/>
      <rect x="32" y="20" width="8" height="10" rx="1" fill="#ffffff" opacity="0.9"/>
      <circle cx="36" cy="25" r="2" fill="#667eea"/>
      <rect x="10" y="18" width="16" height="2" rx="1" fill="#ffffff" opacity="0.6"/>
      <rect x="10" y="22" width="12" height="2" rx="1" fill="#ffffff" opacity="0.4"/>
    </svg>
  ),
  
  Store: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f093fb"/>
          <stop offset="100%" stopColor="#f5576c"/>
        </linearGradient>
      </defs>
      <path d="M8 18L12 8h24l4 10v3H8z" fill="url(#storeGrad)"/>
      <rect x="10" y="21" width="28" height="18" rx="2" fill="#ff6b6b"/>
      <rect x="18" y="28" width="12" height="11" fill="#ffffff" opacity="0.9"/>
      <rect x="12" y="24" width="8" height="6" rx="1" fill="#ffffff" opacity="0.7"/>
      <rect x="28" y="24" width="8" height="6" rx="1" fill="#ffffff" opacity="0.7"/>
      <circle cx="24" cy="33" r="1.5" fill="#ff6b6b"/>
    </svg>
  ),
  
  Swap: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="swapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#swapGrad)" opacity="0.2"/>
      <path d="M30 16l6 6-6 6" stroke="#4facfe" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M12 22h24" stroke="#4facfe" strokeWidth="3" strokeLinecap="round"/>
      <path d="M18 32l-6-6 6-6" stroke="#00d4ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M36 26H12" stroke="#00d4ff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  
  CreditCard: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd89b"/>
          <stop offset="100%" stopColor="#ff6b95"/>
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="36" height="22" rx="3" fill="url(#cardGrad)"/>
      <rect x="6" y="18" width="36" height="4" fill="#333333" opacity="0.5"/>
      <rect x="10" y="26" width="20" height="3" rx="1" fill="#ffffff" opacity="0.8"/>
      <rect x="10" y="31" width="12" height="2" rx="1" fill="#ffffff" opacity="0.6"/>
      <circle cx="36" cy="32" r="3" fill="#ffd700"/>
    </svg>
  ),
  
  Gift: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="giftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f093fb"/>
          <stop offset="100%" stopColor="#f5576c"/>
        </linearGradient>
      </defs>
      <rect x="12" y="24" width="24" height="16" rx="2" fill="url(#giftGrad)"/>
      <rect x="10" y="18" width="28" height="6" rx="1" fill="#ff6b9d"/>
      <rect x="23" y="18" width="2" height="22" fill="#ffd700"/>
      <path d="M18 18c0-3 2-5 4-5s3 2 3 5" fill="#ffd700"/>
      <path d="M30 18c0-3-2-5-4-5s-3 2-3 5" fill="#ffd700"/>
    </svg>
  ),
  
  Mobile: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="mobileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <rect x="14" y="6" width="20" height="36" rx="3" fill="url(#mobileGrad)"/>
      <rect x="16" y="10" width="16" height="24" rx="1" fill="#ffffff" opacity="0.9"/>
      <circle cx="24" cy="38" r="2" fill="#ffffff" opacity="0.9"/>
    </svg>
  ),
  
  TrendingUp: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#11998e"/>
          <stop offset="100%" stopColor="#38ef7d"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#trendGrad)" opacity="0.2"/>
      <path d="M12 32l8-8 6 6 10-14" stroke="#11998e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M36 16v7h-7" stroke="#11998e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  
  Building: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <rect x="10" y="12" width="18" height="28" rx="2" fill="url(#buildingGrad)"/>
      <rect x="30" y="20" width="10" height="20" rx="1" fill="#4facfe"/>
      <rect x="14" y="16" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="20" y="16" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="14" y="22" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="20" y="22" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="14" y="28" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="20" y="28" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="33" y="24" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
      <rect x="33" y="30" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.8"/>
    </svg>
  ),
  
  BarChart: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="chartGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
        <linearGradient id="chartGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f093fb"/>
          <stop offset="100%" stopColor="#f5576c"/>
        </linearGradient>
        <linearGradient id="chartGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <rect x="10" y="20" width="6" height="18" rx="1" fill="url(#chartGrad1)"/>
      <rect x="21" y="14" width="6" height="24" rx="1" fill="url(#chartGrad2)"/>
      <rect x="32" y="26" width="6" height="12" rx="1" fill="url(#chartGrad3)"/>
    </svg>
  ),
  
  Award: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="awardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd89b"/>
          <stop offset="100%" stopColor="#ff6b95"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="18" r="12" fill="url(#awardGrad)"/>
      <circle cx="24" cy="18" r="8" fill="#ffd700"/>
      <path d="M18 24l-4 16 10-4 10 4-4-16" fill="#ff6b95"/>
      <circle cx="24" cy="18" r="4" fill="#ff8c00"/>
    </svg>
  ),
  
  Rocket: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <ellipse cx="18" cy="38" rx="6" ry="3" fill="#ff6b6b" opacity="0.6"/>
      <ellipse cx="30" cy="38" rx="6" ry="3" fill="#ff6b6b" opacity="0.6"/>
      <path d="M20 36c0-12 4-26 4-26s4 14 4 26" fill="url(#rocketGrad)"/>
      <circle cx="24" cy="18" r="4" fill="#ffffff" opacity="0.9"/>
      <circle cx="24" cy="18" r="2" fill="#667eea"/>
      <path d="M16 30l-4 8 4-2v-6z" fill="#ff6b6b"/>
      <path d="M32 30l4 8-4-2v-6z" fill="#ff6b6b"/>
    </svg>
  ),
  
  Users: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="usersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <circle cx="18" cy="16" r="6" fill="url(#usersGrad)"/>
      <path d="M8 36c0-6 4-10 10-10s10 4 10 10" fill="url(#usersGrad)" opacity="0.7"/>
      <circle cx="32" cy="18" r="5" fill="#00d4ff"/>
      <path d="M24 36c0-5 3-8 8-8s8 3 8 8" fill="#00d4ff" opacity="0.7"/>
    </svg>
  ),
  
  Settings: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="settingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="8" fill="url(#settingsGrad)"/>
      <circle cx="24" cy="24" r="4" fill="#ffffff" opacity="0.9"/>
      <circle cx="24" cy="10" r="3" fill="#667eea"/>
      <circle cx="24" cy="38" r="3" fill="#667eea"/>
      <circle cx="10" cy="24" r="3" fill="#764ba2"/>
      <circle cx="38" cy="24" r="3" fill="#764ba2"/>
      <circle cx="15" cy="15" r="2" fill="#667eea" opacity="0.7"/>
      <circle cx="33" cy="33" r="2" fill="#667eea" opacity="0.7"/>
      <circle cx="33" cy="15" r="2" fill="#764ba2" opacity="0.7"/>
      <circle cx="15" cy="33" r="2" fill="#764ba2" opacity="0.7"/>
    </svg>
  ),
  
  Shield: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#11998e"/>
          <stop offset="100%" stopColor="#38ef7d"/>
        </linearGradient>
      </defs>
      <path d="M24 6l-12 6v12c0 8 5 14 12 18 7-4 12-10 12-18V12z" fill="url(#shieldGrad)"/>
      <path d="M20 24l4 4 8-8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  
  FileText: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="fileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd89b"/>
          <stop offset="100%" stopColor="#ff6b95"/>
        </linearGradient>
      </defs>
      <path d="M14 6h14l8 8v26a2 2 0 01-2 2H14a2 2 0 01-2-2V8a2 2 0 012-2z" fill="url(#fileGrad)"/>
      <path d="M28 6v8h8" fill="#ffffff" opacity="0.5"/>
      <rect x="18" y="20" width="12" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
      <rect x="18" y="26" width="12" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
      <rect x="18" y="32" width="8" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
    </svg>
  ),
  
  GraduationCap: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="gradGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <path d="M24 12L6 20l18 8 18-8z" fill="url(#gradGrad)"/>
      <path d="M10 24v8c0 4 6 6 14 6s14-2 14-6v-8" fill="#764ba2"/>
      <rect x="38" y="20" width="2" height="12" rx="1" fill="#ffd700"/>
      <circle cx="39" cy="34" r="2" fill="#ffd700"/>
    </svg>
  ),
  
  HelpCircle: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="helpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#helpGrad)"/>
      <path d="M20 18c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4v2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="24" cy="32" r="1.5" fill="#ffffff"/>
    </svg>
  ),
  
  User: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f093fb"/>
          <stop offset="100%" stopColor="#f5576c"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="18" r="8" fill="url(#userGrad)"/>
      <path d="M10 40c0-8 6-12 14-12s14 4 14 12" fill="url(#userGrad)" opacity="0.8"/>
    </svg>
  ),
  
  Bell: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd89b"/>
          <stop offset="100%" stopColor="#ff6b95"/>
        </linearGradient>
      </defs>
      <path d="M24 8c-6 0-10 4-10 10v8l-4 4h28l-4-4v-8c0-6-4-10-10-10z" fill="url(#bellGrad)"/>
      <path d="M20 30c0 2.2 1.8 4 4 4s4-1.8 4-4" fill="#ff6b95"/>
      <circle cx="32" cy="14" r="4" fill="#ff3838"/>
    </svg>
  ),
  
  MessageSquare: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="messageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <rect x="8" y="10" width="32" height="24" rx="3" fill="url(#messageGrad)"/>
      <path d="M16 34l8-8h-8z" fill="url(#messageGrad)"/>
      <rect x="14" y="18" width="20" height="2" rx="1" fill="#ffffff" opacity="0.8"/>
      <rect x="14" y="24" width="14" height="2" rx="1" fill="#ffffff" opacity="0.6"/>
    </svg>
  ),
  
  Dashboard: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe"/>
          <stop offset="100%" stopColor="#00f2fe"/>
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="14" height="14" rx="2" fill="url(#dashGrad)"/>
      <rect x="26" y="8" width="14" height="14" rx="2" fill="#4facfe"/>
      <rect x="8" y="26" width="14" height="14" rx="2" fill="#00d4ff"/>
      <rect x="26" y="26" width="14" height="14" rx="2" fill="url(#dashGrad)"/>
    </svg>
  ),
  
  DollarSign: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="dollarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#11998e"/>
          <stop offset="100%" stopColor="#38ef7d"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="url(#dollarGrad)"/>
      <path d="M24 10v28M18 16h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-8c-2.2 0-4 1.8-4 4s1.8 4 4 4h8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  
  Scan: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="24" height="24" rx="2" fill="url(#scanGrad)" opacity="0.2"/>
      <path d="M12 12h6v2h-6z" fill="#667eea"/>
      <path d="M12 12v6h2v-6z" fill="#667eea"/>
      <path d="M30 12h6v6h-2v-4h-4z" fill="#667eea"/>
      <path d="M12 36h6v-2h-4v-4h-2z" fill="#764ba2"/>
      <path d="M36 36h-6v-2h4v-4h2z" fill="#764ba2"/>
      <rect x="8" y="23" width="32" height="2" fill="#ff6b6b" opacity="0.8"/>
    </svg>
  ),
  
  Trophy: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd700"/>
          <stop offset="100%" stopColor="#ff8c00"/>
        </linearGradient>
      </defs>
      <path d="M16 10h16v10c0 4.4-3.6 8-8 8s-8-3.6-8-8z" fill="url(#trophyGrad)"/>
      <path d="M10 10h6v4c-2.2 0-4-1.8-4-4zM32 10h6c0 2.2-1.8 4-4 4z" fill="#ffd700"/>
      <rect x="22" y="28" width="4" height="6" fill="#ff8c00"/>
      <rect x="16" y="34" width="16" height="4" rx="2" fill="url(#trophyGrad)"/>
      <circle cx="24" cy="16" r="2" fill="#ffffff" opacity="0.8"/>
    </svg>
  ),
};
