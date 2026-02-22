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
  Home as HomeIcon,
  Phone,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { useState } from "react";
import { FloatingHelpButton } from "../components/floating-help-button";
import { Link } from "wouter";

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
      <section className="relative min-h-[400px] overflow-hidden bg-gradient-to-br from-primary to-primary/80">
        {/* Decorative curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left curve */}
          <div 
            className="absolute -left-32 top-1/2 w-[500px] h-[500px] animate-curve-float"
            style={{
              background: "#4F46E5",
              borderRadius: "50%",
              transform: "translate(-60%, -30%)",
            }}
          />
          {/* Right curve */}
          <div 
            className="absolute -right-32 top-1/2 w-[500px] h-[500px] animate-curve-float-reverse"
            style={{
              background: "#4F46E5",
              borderRadius: "50%",
              transform: "translate(60%, -20%)",
            }}
          />
          
          {/* Decorative sparkles */}
          <Sparkles className="absolute top-20 left-[15%] w-4 h-4 text-lime animate-sparkle" />
          <Sparkles className="absolute top-32 right-[20%] w-3 h-3 text-lime animate-sparkle-delay-1" />
          <Sparkles className="absolute bottom-24 left-[25%] w-3 h-3 text-lime animate-sparkle-delay-2" />
          <Sparkles className="absolute bottom-32 right-[15%] w-4 h-4 text-lime animate-sparkle" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-14 pb-4">
            <Link href="/">
              <a className="text-black font-bold text-2xl tracking-tight hover:opacity-80 transition-opacity">
                Pexly<span style={{ color: "#4F46E5" }}>P2P</span>
              </a>
            </Link>
            <div className="relative">
              <button 
                className="text-black p-2 hover:bg-black/5 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="w-8 h-8" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <Link href="/">
                    <a className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                      <HomeIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Home</span>
                    </a>
                  </Link>
                  <Link href="/contact">
                    <a className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">Contact</span>
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Hero content */}
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8">
              How can we help you?
            </h1>
            
            {/* Search bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ask a question, press Enter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-14 pr-6 rounded-full bg-white text-gray-900 placeholder:text-muted-foreground focus:outline-none text-lg shadow-lg"
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
          Pexly Support will NEVER DM you or ask for your Secret Recovery Phrase!
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
