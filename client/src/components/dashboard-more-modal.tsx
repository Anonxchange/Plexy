import { X, Users, Store, MessageSquare, Zap, TrendingUp, Gift, CreditCard, Wallet, ArrowRightLeft, BadgeCheck, Lightbulb, BarChart3, Settings } from "lucide-react";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardMoreModal = ({ isOpen, onClose }: MoreModalProps) => {
  const services = [
    { icon: Users, label: "P2P Trading", badge: "HOT" },
    { icon: Store, label: "My offers and status", badge: "NEW" },
    { icon: MessageSquare, label: "Contact Support", badge: null },
    { icon: Wallet, label: "Wallet", badge: null },
    { icon: ArrowRightLeft, label: "Swap", badge: null },
    { icon: Gift, label: "Gift Card Store", badge: null },
    { icon: CreditCard, label: "Buy Crypto", badge: null },
    { icon: Zap, label: "Quick Trade", badge: null },
    { icon: BadgeCheck, label: "KYC Verification", badge: null },
    { icon: TrendingUp, label: "Trading View", badge: null },
    { icon: Lightbulb, label: "Learn", badge: null },
    { icon: Settings, label: "Settings", badge: null },
  ];

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
          className={`bg-card w-full lg:max-w-lg rounded-t-3xl lg:rounded-2xl border-t lg:border border-border shadow-2xl transform transition-all duration-300 pointer-events-auto ${
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

          {/* Services Grid */}
          <div className="p-5 overflow-y-auto max-h-[80vh] lg:max-h-auto">
            <div className="grid grid-cols-3 gap-4">
              {services.map((service) => (
                <button
                  key={service.label}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/40 hover:bg-muted/60 active:scale-95 transition-all relative group"
                >
                  {/* Badge */}
                  {service.badge && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                      {service.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>

                  {/* Label */}
                  <span className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2">
                    {service.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
