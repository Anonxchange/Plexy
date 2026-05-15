import { X } from "lucide-react";
import { useLocation } from "wouter";
import type { ReactElement } from "react";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceItem {
  icon: string;
  label: string;
  badge?: string;
  color: string;
  href?: string;
}

const ServiceIcon = ({ icon, color }: { icon: string; color: string }) => {
  const icons: Record<string, ReactElement> = {
    wallet: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="10" y="18" width="44" height="28" rx="3" fill={color} />
        <rect x="12" y="20" width="40" height="24" rx="2" fill="white" opacity="0.2" />
        <rect x="42" y="28" width="10" height="8" rx="1" fill="white" opacity="0.9" />
        <circle cx="46" cy="32" r="2" fill={color} />
      </svg>
    ),
    buy: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="26" fill={color} />
        <path d="M38 28c0.6-4-2.4-6.2-6.5-7.6l1.3-5.4-3.2-0.8-1.3 5.2c-0.8-0.2-1.7-0.4-2.6-0.6l1.3-5.3-3.2-0.8-1.3 5.4c-0.7-0.2-1.4-0.3-2.1-0.5l-4.4-1.1-0.8 3.5s2.4 0.6 2.3 0.6c1.3 0.3 1.5 1.2 1.5 1.9l-3.5 14c-0.2 0.5-0.7 1.1-1.7 0.8 0 0.1-2.3-0.6-2.3-0.6l-1.5 3.8 4.2 1c0.8 0.2 1.5 0.4 2.3 0.5l-1.3 5.4 3.2 0.8 1.3-5.4c0.9 0.2 1.7 0.5 2.6 0.6l-1.3 5.3 3.2 0.8 1.3-5.4c5.5 1 9.6 0.6 11.4-4.4 1.4-4.1 0-6.4-3-7.9 2.1-0.5 3.7-1.9 4.1-4.8zm-7.4 10.5c-1 4-7.8 1.8-10 1.2l1.8-7.1c2.2 0.6 9.3 1.7 8.2 5.9zm1-10.6c-0.9 3.6-6.6 1.8-8.5 1.3l1.6-6.5c1.9 0.5 7.8 1.4 6.9 5.2z" fill="white" />
      </svg>
    ),
    swap: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="24" fill={color} opacity="0.2" />
        <path d="M40 22l8 8-8 8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 30h32" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M24 42l-8-8 8-8" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M48 34H16" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    card: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="10" y="20" width="44" height="24" rx="3" fill={color} />
        <rect x="10" y="26" width="44" height="4" fill="#333333" opacity="0.5" />
        <rect x="14" y="34" width="24" height="3" rx="1" fill="white" opacity="0.8" />
        <rect x="14" y="39" width="16" height="2" rx="1" fill="white" opacity="0.6" />
        <circle cx="48" cy="38" r="3" fill="#FFD700" />
      </svg>
    ),
    mobile: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="20" y="10" width="24" height="44" rx="3" fill={color} />
        <rect x="22" y="14" width="20" height="32" rx="1" fill="white" opacity="0.9" />
        <circle cx="32" cy="50" r="2" fill="white" opacity="0.9" />
      </svg>
    ),
    otc: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="20" width="40" height="6" rx="2" fill={color} />
        <rect x="16" y="26" width="32" height="24" rx="2" fill={color} opacity="0.8" />
        <rect x="22" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="34" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="18" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
        <rect x="40" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
      </svg>
    ),
    shop: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path d="M12 16h40l-4 16H16z" fill={color} opacity="0.9" />
        <rect x="14" y="32" width="36" height="18" rx="2" fill={color} />
        <rect x="20" y="38" width="10" height="10" rx="1" fill="white" opacity="0.8" />
        <path d="M24 16c0-4 4-8 8-8s8 4 8 8" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    giftcard: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="14" y="28" width="36" height="20" rx="2" fill={color} />
        <rect x="12" y="22" width="40" height="6" rx="1" fill={color} opacity="0.7" />
        <rect x="31" y="22" width="2" height="26" fill="#FFD700" />
        <path d="M24 22c0-4 3-6 6-6s4 2 4 6" fill="#FFD700" />
        <path d="M40 22c0-4-3-6-6-6s-4 2-4 6" fill="#FFD700" />
      </svg>
    ),
    perpetual: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="10" y="36" width="6" height="16" rx="1" fill={color} opacity="0.5" />
        <rect x="20" y="28" width="6" height="24" rx="1" fill={color} opacity="0.65" />
        <rect x="30" y="18" width="6" height="34" rx="1" fill={color} opacity="0.8" />
        <rect x="40" y="24" width="6" height="28" rx="1" fill={color} />
        <path d="M12 22l10-8 10 10 10-12" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="42" cy="10" r="3" fill="#FFD700" />
      </svg>
    ),
    spot: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill={color} opacity="0.15" />
        <path d="M18 42l8-14 8 6 8-16" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="26" cy="28" r="3" fill={color} />
        <circle cx="34" cy="34" r="3" fill={color} />
        <circle cx="42" cy="18" r="3" fill={color} />
        <path d="M38 14h8v8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    utility: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="14" y="12" width="36" height="40" rx="3" fill={color} opacity="0.2" />
        <rect x="18" y="16" width="28" height="32" rx="2" fill={color} opacity="0.5" />
        <path d="M24 26h16M24 32h12M24 38h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="48" cy="48" r="10" fill={color} />
        <path d="M44 48l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    prediction: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill={color} opacity="0.2" />
        <path d="M32 14v4M32 46v4M14 32h4M46 32h4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="32" r="10" fill={color} />
        <circle cx="32" cy="32" r="4" fill="white" opacity="0.9" />
        <path d="M40 24l4-4M20 44l4-4M24 24l-4-4M44 44l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
    fees: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill={color} opacity="0.2" />
        <circle cx="32" cy="32" r="16" fill={color} opacity="0.4" />
        <path d="M24 40l16-16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="26" cy="26" r="3" fill="white" opacity="0.9" />
        <circle cx="38" cy="38" r="3" fill="white" opacity="0.9" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="8" fill={color} />
        <circle cx="32" cy="32" r="4" fill="white" opacity="0.8" />
        <circle cx="32" cy="16" r="3" fill={color} opacity="0.6" />
        <circle cx="32" cy="48" r="3" fill={color} opacity="0.6" />
        <circle cx="16" cy="32" r="3" fill={color} opacity="0.6" />
        <circle cx="48" cy="32" r="3" fill={color} opacity="0.6" />
      </svg>
    ),
    security: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path d="M32 8l16 8v12c0 12-16 16-16 16s-16-4-16-16v-12z" fill={color} />
        <circle cx="32" cy="32" r="6" fill="white" opacity="0.8" />
        <path d="M32 28v8" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      </svg>
    ),
    history: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill={color} opacity="0.3" />
        <circle cx="32" cy="32" r="18" fill="none" stroke={color} strokeWidth="2" />
        <path d="M32 20v12l8 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    support: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="28" r="8" fill={color} />
        <path d="M18 42c0-4 6-8 14-8s14 4 14 8" fill={color} opacity="0.8" />
        <circle cx="20" cy="18" r="4" fill={color} opacity="0.6" />
        <circle cx="44" cy="18" r="4" fill={color} opacity="0.6" />
      </svg>
    ),
    academy: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path d="M8 26l24-14 24 14v6H8z" fill={color} />
        <rect x="12" y="32" width="40" height="22" rx="2" fill={color} opacity="0.8" />
        <rect x="18" y="38" width="8" height="6" fill="white" opacity="0.8" />
        <rect x="30" y="38" width="8" height="6" fill="white" opacity="0.8" />
        <rect x="42" y="38" width="8" height="6" fill="white" opacity="0.8" />
      </svg>
    ),
    discord: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="26" fill={color} />
        <circle cx="22" cy="28" r="3" fill="white" opacity="0.9" />
        <circle cx="42" cy="28" r="3" fill="white" opacity="0.9" />
        <path d="M20 40c2 2 4 3 12 3s10-1 12-3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
      </svg>
    ),
    invite: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="24" cy="26" r="8" fill={color} />
        <path d="M12 40c0-4 6-6 12-6s12 2 12 6" fill={color} opacity="0.8" />
        <circle cx="44" cy="22" r="8" fill={color} opacity="0.7" />
        <path d="M32 36c0-4 6-6 12-6s12 2 12 6" fill={color} opacity="0.6" />
        <path d="M48 18l4 4m0-4l-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    medals: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="22" r="10" fill={color} />
        <rect x="20" y="34" width="24" height="18" rx="2" fill={color} opacity="0.8" />
        <rect x="26" y="40" width="12" height="6" fill="white" opacity="0.8" />
        <path d="M20 32l-6 8l6 4" stroke={color} strokeWidth="2" fill="none" />
        <path d="M44 32l6 8l-6 4" stroke={color} strokeWidth="2" fill="none" />
      </svg>
    ),
    markets: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="40" width="8" height="12" rx="1" fill={color} opacity="0.5" />
        <rect x="24" y="30" width="8" height="22" rx="1" fill={color} opacity="0.7" />
        <rect x="36" y="20" width="8" height="32" rx="1" fill={color} />
        <rect x="48" y="28" width="8" height="24" rx="1" fill={color} opacity="0.8" />
        <path d="M10 36l10-10 12 8 12-16 10 6" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    shophistory: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path d="M14 18h36l-4 14H18z" fill={color} opacity="0.8" />
        <rect x="16" y="32" width="32" height="16" rx="2" fill={color} opacity="0.5" />
        <circle cx="22" cy="52" r="3" fill={color} />
        <circle cx="42" cy="52" r="3" fill={color} />
        <circle cx="44" cy="44" r="10" fill={color} />
        <path d="M44 39v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    profile: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="24" r="12" fill={color} />
        <path d="M12 52c0-10 9-18 20-18s20 8 20 18" fill={color} opacity="0.7" />
      </svg>
    ),
    localization: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill="none" stroke={color} strokeWidth="2.5" />
        <ellipse cx="32" cy="32" rx="10" ry="22" fill="none" stroke={color} strokeWidth="2" />
        <path d="M10 32h44M10 22h44M10 42h44" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path d="M32 10c-10 0-18 8-18 18v12l-4 6h44l-4-6V28c0-10-8-18-18-18z" fill={color} />
        <path d="M26 48c0 3.3 2.7 6 6 6s6-2.7 6-6" fill={color} opacity="0.6" />
        <circle cx="44" cy="16" r="6" fill="#EF4444" />
      </svg>
    ),
    verification: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="32" cy="32" r="22" fill={color} opacity="0.2" />
        <path d="M32 10l16 8v12c0 12-16 16-16 16s-16-4-16-16V18z" fill={color} />
        <path d="M24 32l6 6 10-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    connected: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="16" cy="32" r="8" fill={color} />
        <circle cx="48" cy="18" r="8" fill={color} opacity="0.8" />
        <circle cx="48" cy="46" r="8" fill={color} opacity="0.6" />
        <path d="M24 32l16-14M24 32l16 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[icon] || icons.wallet;
};

export const DashboardMoreModal = ({ isOpen, onClose }: MoreModalProps) => {
  const [, setLocation] = useLocation();

  const pexlyServices: ServiceItem[] = [
    { icon: "wallet",     label: "Wallet",           color: "#A855F7",  href: "/wallet" },
    { icon: "buy",        label: "Buy Crypto",        color: "#F59E0B",  href: "/wallet/buy-crypto" },
    { icon: "swap",       label: "Swap",              color: "#4FACFE",  href: "/swap" },
    { icon: "card",       label: "Visa Card",   badge: "NEW", color: "#3B82F6", href: "/visa-card" },
    { icon: "mobile",     label: "Mobile Top-up",     color: "#10B981",  href: "/utility-bills" },
    { icon: "otc",        label: "OTC Desk",           color: "#EC4899",  href: "/p2p" },
    { icon: "shop",       label: "Shop",              color: "#FF6B6B",  href: "/shop" },
    { icon: "giftcard",   label: "Gift Cards",        color: "#FFA500",  href: "/gift-cards" },
    { icon: "perpetual",  label: "Perpetual Trade",   color: "#6366F1",  href: "/trade" },
    { icon: "spot",       label: "Spot Trade",        color: "#0EA5E9",  href: "/trade" },
    { icon: "utility",    label: "Utility",           color: "#14B8A6",  href: "/utility-bills" },
    { icon: "prediction", label: "Prediction",        color: "#8B5CF6",  href: "/prediction" },
    { icon: "fees",       label: "Fees",              color: "#F97316",  href: "/fees" },
  ];

  const accountSettings: ServiceItem[] = [
    { icon: "profile",       label: "Profile",                   color: "#6366F1", href: "/profile" },
    { icon: "localization",  label: "Localization",              color: "#0EA5E9", href: "/account-settings" },
    { icon: "notifications", label: "Notifications",             color: "#F59E0B", href: "/notification-settings" },
    { icon: "security",      label: "Security",                  color: "#EF4444", href: "/account-settings" },
    { icon: "mobile",        label: "Devices",                   color: "#14B8A6", href: "/devices" },
    { icon: "verification",  label: "Verification",              color: "#10B981", href: "/verification" },
    { icon: "connected",     label: "Connected Apps",            color: "#8B5CF6", href: "/account-settings" },
    { icon: "shophistory",   label: "Shop History",              color: "#FF6B6B", href: "/shop" },
    { icon: "support",       label: "Support",                   color: "#EC4899", href: "/support" },
    { icon: "markets",       label: "Markets",                   color: "#F97316", href: "/markets" },
    { icon: "history",       label: "Trade History",             color: "#8B5CF6", href: "/trade-history" },
    { icon: "academy",       label: "Blog",                      color: "#FFA500", href: "/blog" },
    { icon: "discord",       label: "Discord",                   color: "#5865F2" },
    { icon: "invite",        label: "Invite & Earn",             color: "#10B981", href: "/referral" },
    { icon: "medals",        label: "Medals",                    color: "#F59E0B", href: "/medals" },
  ];

  const handleServiceClick = (service: ServiceItem) => {
    if (service.href) {
      setLocation(service.href);
      onClose();
    }
  };

  const ServiceButton = ({ service }: { service: ServiceItem }) => (
    <button
      onClick={() => handleServiceClick(service)}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 hover:shadow-lg hover:shadow-primary/20 relative"
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10" />
      </div>

      {service.badge && (
        <div className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
          {service.badge}
        </div>
      )}

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 z-10 relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))`,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <ServiceIcon icon={service.icon} color={service.color} />
      </div>

      <span className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2 z-10 relative">
        {service.label}
      </span>
    </button>
  );

  return (
    <>
      {/* Backdrop — shown on all screen sizes when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Modal — only interactive when open; invisible+non-interactive when closed */}
      <div
        className={`fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center lg:p-4 pointer-events-none`}
      >
        <div
          className={`bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-2xl border-t lg:border border-border shadow-2xl transform transition-all duration-300 ${
            isOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full lg:translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-3xl lg:rounded-t-2xl">
            <h2 className="text-lg font-bold text-foreground">Pexly Services</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto max-h-[80vh] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Pexly Services
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {pexlyServices.map((service) => (
                  <ServiceButton key={service.label} service={service} />
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Account & Settings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {accountSettings.map((service) => (
                  <ServiceButton key={service.label} service={service} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
