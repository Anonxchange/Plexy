import { 
  Menu, 
  Search, 
  Bitcoin, 
  User, 
  ShoppingCart, 
  CreditCard, 
  HelpCircle, 
  Headphones,
  FileText,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Zap,
  Sparkles,
  LucideIcon,
  ChevronRight,
  Star,
  Shield,
  Smartphone,
  RefreshCw,
  Layout,
  Coins,
  History,
  TrendingUp,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { useState } from "react";
import { FloatingHelpButton } from "../components/floating-help-button";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const CategoryCard = ({ icon: Icon, title, description, delay = 0 }: CategoryCardProps) => {
  return (
    <div
      className="group block bg-white border-b border-gray-100 last:border-0 p-6 hover:bg-gray-50 transition-colors cursor-pointer animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
            {title}
          </h3>
          <p className="text-[#555555] text-sm leading-relaxed pr-8">
            {description}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
};

const categories = [
  {
    icon: Sparkles,
    title: "Get started",
    description: "Create your Pexly wallet, customize your accounts, and learn about the key features.",
  },
  {
    icon: Coins,
    title: "Pexly Cash",
    description: "Use Pexly Cash like everyday money: add from bank or card, spend globally with your debit card, pay friends, and earn rewards.",
  },
  {
    icon: User,
    title: "Account and settings",
    description: "Manage your wallets, account names, recovery phrases, privacy, and device settings in Pexly.",
  },
  {
    icon: RefreshCw,
    title: "Buy and sell tokens",
    description: "Use on-ramps and off-ramps to buy, sell, or withdraw tokens —and fix common purchase issues.",
  },
  {
    icon: Layout,
    title: "Apps",
    description: "Connect Pexly to apps, manage your connection settings, and troubleshoot connections.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Protect your wallet from scams, phishing, and hacks—plus tips on staying safe.",
  },
  {
    icon: TrendingUp,
    title: "Staking",
    description: "Use liquid staking with PSOL or stake SOL natively to earn rewards.",
  },
  {
    icon: History,
    title: "Trading",
    description: "Swap, bridge, or trade tokens and perps—plus understand gas, slippage, and trade execution.",
  },
];

const promotedArticles = [
  "Get started with Pexly",
  "Create a new Pexly wallet",
  "Receive tokens in Pexly",
  "Get started with Pexly Cash",
  "Send tokens from Pexly",
  "Buy tokens in Pexly",
  "Get help from Pexly",
  "What to do if I was scammed?",
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const HeroSection = () => {
    return (
      <section className="relative min-h-[300px] overflow-hidden bg-primary">
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <div className="w-6 h-4 bg-primary rounded-full relative">
                  <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full" />
                  <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">pexly</span>
            </div>
            <button className="text-white">
              <Menu className="w-8 h-8" />
            </button>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-8">
              How can we help you?
            </h1>
            
            {/* Search bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="text"
                placeholder="Ask a question, press Enter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-12 pr-6 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/70 focus:outline-none text-lg backdrop-blur-sm"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9]">
      {/* Warning Banner */}
      <div className="bg-[#FF7A45] py-4 px-6 text-white text-center flex items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">!</div>
        <p className="text-sm md:text-base font-medium">
          Phantom Support will NEVER DM you or ask for your Secret Recovery Phrase!
        </p>
      </div>

      <main className="flex-1">
        <HeroSection />

        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Categories Grid Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
            {categories.map((category, index) => (
              <CategoryCard 
                key={category.title}
                icon={category.icon}
                title={category.title}
                description={category.description}
                delay={index * 0.05}
              />
            ))}
          </div>

          {/* Promoted Articles */}
          <section className="mb-4">
            <h2 className="text-xl font-semibold text-[#2D2D2D] mb-6 px-2">Promoted articles</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {promotedArticles.map((article, index) => (
                <div 
                  key={index} 
                  className="group flex items-center justify-between p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Star className="w-5 h-5 text-[#FF7A45] fill-[#FF7A45]" />
                    <span className="text-[#2D2D2D] font-medium">{article}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 border-t border-gray-100">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4">
            <p className="text-gray-500 text-sm">© Pexly Technologies, Inc.</p>
            
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity font-semibold">
          <MessageCircle className="w-6 h-6" />
          <span>Chat</span>
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;
