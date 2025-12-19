import { X } from "lucide-react";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceItem {
  icon: string;
  label: string;
  badge?: string;
  color: string;
}

const ServiceIcon = ({ icon, color }: { icon: string; color: string }) => {
  const icons: Record<string, JSX.Element> = {
    p2p: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <circle cx="22" cy="32" r="12" fill={color} />
        <circle cx="42" cy="32" r="12" fill={color} opacity="0.7" />
        <path d="M34 28l8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M30 36l8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
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
    bank: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="14" y="16" width="22" height="36" rx="2" fill={color} />
        <rect x="38" y="26" width="12" height="26" rx="1" fill={color} opacity="0.7" />
        <rect x="18" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="26" y="20" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="18" y="28" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="26" y="28" width="4" height="4" rx="0.5" fill="white" opacity="0.8" />
        <rect x="42" y="30" width="4" height="4" rx="0.5" fill="white" opacity="0.7" />
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
    shop: (
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <rect x="12" y="20" width="40" height="6" rx="2" fill={color} />
        <rect x="16" y="26" width="32" height="24" rx="2" fill={color} opacity="0.8" />
        <rect x="22" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="34" y="34" width="8" height="12" fill="white" opacity="0.9" />
        <rect x="18" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
        <rect x="40" y="30" width="6" height="4" rx="1" fill="white" opacity="0.7" />
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
  };

  return icons[icon] || icons.wallet;
};

export const DashboardMoreModal = ({ isOpen, onClose }: MoreModalProps) => {
  const pexlyServices: ServiceItem[] = [
    { icon: "p2p", label: "P2P Trading", badge: "HOT", color: "#4FACFE" },
    { icon: "wallet", label: "Wallet", color: "#A855F7" },
    { icon: "buy", label: "Buy Crypto", color: "#F59E0B" },
    { icon: "swap", label: "Swap", color: "#4FACFE" },
    { icon: "bank", label: "Crypto to Bank", color: "#8B5CF6" },
    { icon: "card", label: "Visa Card", badge: "NEW", color: "#3B82F6" },
    { icon: "mobile", label: "Mobile Top-up", color: "#10B981" },
    { icon: "shop", label: "OTC Desk", color: "#EC4899" },
    { icon: "shop", label: "Shop", color: "#FF6B6B" },
    { icon: "giftcard", label: "Gift Card Store", color: "#FFA500" },
    { icon: "giftcard", label: "Pexly Gift Card", color: "#06B6D4" },
    { icon: "giftcard", label: "Gift Card Checker", color: "#14B8A6" },
    { icon: "settings", label: "Fees", color: "#F97316" },
  ];

  const accountSettings: ServiceItem[] = [
    { icon: "settings", label: "Account Settings", color: "#6366F1" },
    { icon: "settings", label: "Trader Settings", color: "#8B5CF6" },
    { icon: "card", label: "Payment Accounts", color: "#3B82F6" },
    { icon: "mobile", label: "Devices", color: "#14B8A6" },
    { icon: "security", label: "Security", color: "#EF4444" },
    { icon: "shop", label: "Status", color: "#10B981" },
    { icon: "history", label: "My Offers", color: "#F59E0B" },
    { icon: "history", label: "Trade History", color: "#8B5CF6" },
    { icon: "settings", label: "Import Feedback", color: "#4FACFE" },
    { icon: "support", label: "Contact Support", color: "#FF6B6B" },
    { icon: "academy", label: "Pexly Academy", color: "#FFA500" },
    { icon: "discord", label: "Discord", color: "#5865F2" },
    { icon: "invite", label: "Invite & Earn", color: "#10B981" },
    { icon: "medals", label: "Medals", color: "#F59E0B" },
  ];

  const ServiceButton = ({ service }: { service: ServiceItem }) => (
    <button className="group flex flex-col items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 hover:shadow-lg hover:shadow-primary/20 relative">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10" />
      </div>

      {/* Badge */}
      {service.badge && (
        <div className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
          {service.badge}
        </div>
      )}

      {/* Icon with glassmorphism */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 z-10 relative overflow-hidden flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))`,
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <ServiceIcon icon={service.icon} color={service.color} />
      </div>

      {/* Label */}
      <span className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2 z-10 relative">
        {service.label}
      </span>
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Modal Container */}
      <div
        className={`fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center lg:p-4 pointer-events-none ${
          isOpen ? "pointer-events-auto" : ""
        }`}
      >
        <div
          className={`bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-2xl border-t lg:border border-border shadow-2xl transform transition-all duration-300 pointer-events-auto ${
            isOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full lg:translate-y-0 opacity-0"
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
          <div className="p-5 overflow-y-auto max-h-[80vh] lg:max-h-auto space-y-6">
            {/* Pexly Services Section */}
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

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Account & Settings Section */}
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
