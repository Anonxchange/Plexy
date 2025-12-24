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
  LucideIcon
} from "lucide-react";
import { useState } from "react";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const CategoryCard = ({ icon: Icon, title, description, delay = 0 }: CategoryCardProps) => {
  return (
    <a
      href="#"
      className="group block bg-card rounded-2xl p-8 card-hover icon-hover border border-border/50 shadow-sm animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Icon circle */}
      <div 
        className="icon-circle w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-all duration-300"
        style={{
          backgroundColor: "#4F46E5",
        }}
      >
        <Icon 
          className="w-6 h-6 transition-colors group-hover:text-foreground" 
          style={{ color: "white" }}
        />
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2 transition-colors" style={{ color: "inherit" }}>
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </a>
  );
};

const categories = [
  {
    icon: Bitcoin,
    title: "Getting Started",
    description: "Get started by learning about our services and how you can get the most out of Pexly.",
  },
  {
    icon: User,
    title: "Pexly Account",
    description: "Learn everything you need to know about your Pexly Account: settings, 2-Factor-Authentication, preferences, and more.",
  },
  {
    icon: ShoppingCart,
    title: "Ordering / Payments",
    description: "Learn about our payment methods and the most common questions when making payments",
  },
  {
    icon: CreditCard,
    title: "Pexly Card",
    description: "Learn more about the Pexly Card.",
  },
  {
    icon: HelpCircle,
    title: "Troubleshooting",
    description: "Common issues and solutions for orders, payments, and account-related problems.",
  },
  {
    icon: Headphones,
    title: "Contact Us",
    description: "Get in touch with our support team for personalized assistance.",
  },
];

const articles = [
  "What is Pexly?",
  "How do I place an order?",
  "Do I need a Pexly Account?",
  "Can I log in using my Web 3 wallet (e.g., Metamask)?",
  "How to add store credit to my account?",
  "How to add store credit by paying with tokens from my wallet?",
  "Can I purchase gift cards using my favorite token?",
  "How do I use my Pexly USD or EUR store credit?",
  "How do I redeem my gift card?",
  "What payment methods are accepted?",
];

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const HeroSection = () => {
    return (
      <section className="relative bg-hero min-h-[400px] overflow-hidden">
        {/* Decorative curves */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left curve */}
          <div 
            className="absolute -left-32 top-1/2 w-[500px] h-[500px] animate-curve-float"
            style={{
              background: "hsl(var(--hero-curve))",
              borderRadius: "50%",
              transform: "translate(-60%, -30%)",
            }}
          />
          {/* Right curve */}
          <div 
            className="absolute -right-32 top-1/2 w-[500px] h-[500px] animate-curve-float-reverse"
            style={{
              background: "hsl(var(--hero-curve))",
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
          <nav className="flex items-center justify-between mb-14">
            <div className="text-foreground font-bold text-2xl tracking-tight">
              Pexly<span style={{ color: "#4F46E5" }}>P2P</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <a 
                href="#" 
                className="text-foreground/90 hover:text-foreground transition-colors text-sm font-medium"
              >
                Shop
              </a>
              <a 
                href="#" 
                className="px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity text-white"
                style={{ backgroundColor: "#4F46E5" }}
              >
                Submit a request
              </a>
              <a 
                href="#" 
                className="text-foreground/90 hover:text-foreground transition-colors text-sm font-medium"
              >
                Sign in
              </a>
            </div>
            <button className="md:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </nav>

          {/* Hero content */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in">
              How can we help you?
            </h1>
            
            {/* Search bar */}
            <div 
              className="relative search-input rounded-2xl bg-card shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 pl-14 pr-6 rounded-2xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
              />
            </div>
            
            <p 
              className="mt-4 text-foreground/70 text-sm animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Search for answers or browse our knowledge base.
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <HeroSection />

        {/* White background section with card overlapping */}
        <div className="bg-background px-6 relative">
          <div className="container mx-auto max-w-5xl relative -mt-8 md:-mt-12">
            {/* Categories Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <CategoryCard 
                  key={category.title}
                  icon={category.icon}
                  title={category.title}
                  description={category.description}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Promoted Articles */}
        <section className="bg-white py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Promoted articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <div key={article} className="group cursor-pointer bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-lime hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span className="text-base font-medium text-gray-900 group-hover:text-lime transition-colors">{article}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600">Frequently asked questions</p>
            
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Globe className="w-5 h-5" />
                <span>English (US)</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-600 hover:text-lime transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-lime transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-lime transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Bubble */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors" aria-label="Open chat">
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default HelpCenter;
