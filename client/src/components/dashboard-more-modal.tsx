import {
  X,
  Users,
  Wallet,
  ShoppingCart,
  ArrowRightLeft,
  Building,
  CreditCard,
  Smartphone,
  BarChart3,
  Store,
  Gift,
  CheckCircle2,
  DollarSign,
  Settings,
  Sliders,
  Lock,
  Activity,
  FileText,
  Clock,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Share2,
  Trophy,
  Landmark,
  Ticket,
} from "lucide-react";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceItem {
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

export const DashboardMoreModal = ({ isOpen, onClose }: MoreModalProps) => {
  const pexlyServices: ServiceItem[] = [
    { icon: <Users className="h-6 w-6" />, label: "P2P Trading", badge: "HOT" },
    { icon: <Wallet className="h-6 w-6" />, label: "Wallet" },
    { icon: <ShoppingCart className="h-6 w-6" />, label: "Buy Crypto" },
    { icon: <ArrowRightLeft className="h-6 w-6" />, label: "Swap" },
    { icon: <Landmark className="h-6 w-6" />, label: "Crypto to Bank" },
    { icon: <CreditCard className="h-6 w-6" />, label: "Visa Card", badge: "NEW" },
    { icon: <Smartphone className="h-6 w-6" />, label: "Mobile Top-up" },
    { icon: <BarChart3 className="h-6 w-6" />, label: "OTC Desk" },
    { icon: <Store className="h-6 w-6" />, label: "Shop" },
    { icon: <Gift className="h-6 w-6" />, label: "Gift Card Store" },
    { icon: <Ticket className="h-6 w-6" />, label: "Pexly Gift Card" },
    { icon: <CheckCircle2 className="h-6 w-6" />, label: "Gift Card Checker" },
    { icon: <DollarSign className="h-6 w-6" />, label: "Fees" },
  ];

  const accountSettings: ServiceItem[] = [
    { icon: <Settings className="h-6 w-6" />, label: "Account Settings" },
    { icon: <Sliders className="h-6 w-6" />, label: "Trader Settings" },
    { icon: <CreditCard className="h-6 w-6" />, label: "Payment Accounts" },
    { icon: <Smartphone className="h-6 w-6" />, label: "Devices" },
    { icon: <Lock className="h-6 w-6" />, label: "Security" },
    { icon: <Activity className="h-6 w-6" />, label: "Status" },
    { icon: <FileText className="h-6 w-6" />, label: "My Offers" },
    { icon: <Clock className="h-6 w-6" />, label: "Trade History" },
    { icon: <MessageSquare className="h-6 w-6" />, label: "Import Feedback" },
    { icon: <HelpCircle className="h-6 w-6" />, label: "Contact Support" },
    { icon: <BookOpen className="h-6 w-6" />, label: "Pexly Academy" },
    { icon: <MessageSquare className="h-6 w-6" />, label: "Discord" },
    { icon: <Share2 className="h-6 w-6" />, label: "Invite & Earn" },
    { icon: <Trophy className="h-6 w-6" />, label: "Medals" },
  ];

  const ServiceButton = ({ service }: { service: ServiceItem }) => (
    <button className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/40 hover:bg-muted/60 active:scale-95 transition-all relative group">
      {/* Badge */}
      {service.badge && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
          {service.badge}
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors text-primary">
        {service.icon}
      </div>

      {/* Label */}
      <span className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2">
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
