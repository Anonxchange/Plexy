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
  Zap
} from "lucide-react";

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

// Wave divider component
const WaveDivider = () => (
  <svg 
    className="w-full h-auto"
    viewBox="0 0 1200 80" 
    preserveAspectRatio="none"
    style={{ display: 'block', minHeight: '80px' }}
  >
    <path 
      d="M0,0 Q300,60 600,40 T1200,0 L1200,40 Q900,60 600,40 T0,40 Z" 
      fill="#ef4444"
    />
  </svg>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section with Header */}
        <section className="bg-gradient-to-r from-lime-400 to-red-500 pt-6 pb-0 px-6 relative overflow-hidden">
          {/* Header merged into hero */}
          <div className="max-w-6xl mx-auto flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-gray-900" strokeWidth={3} />
              <span className="text-gray-900 text-2xl font-bold tracking-tight">
                Pexly
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-900/80 hover:text-gray-900 transition-colors text-sm font-medium">
                Shop
              </a>
              <a 
                href="#" 
                className="text-gray-900 border border-gray-900/50 rounded-full px-4 py-2 text-sm hover:bg-black/10 transition-colors font-medium"
              >
                Submit a request
              </a>
              <a href="#" className="text-gray-900/80 hover:text-gray-900 transition-colors text-sm font-medium">
                Sign in
              </a>
            </nav>
            
            {/* Mobile Menu */}
            <button className="md:hidden text-gray-900 border border-gray-900/50 p-2 hover:bg-black/10 rounded-full transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Hero Content */}
          <div className="max-w-2xl mx-auto text-center relative z-10 pb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              How can we help you?
            </h1>
            
            <div className="relative max-w-lg mx-auto mb-4">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-14 pr-6 py-3 rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
              />
            </div>
            
            <p className="text-white/70 text-sm md:text-lg">
              Search for answers or browse our knowledge base.
            </p>
          </div>
          
          {/* Wave Divider */}
          <div className="w-full">
            <WaveDivider />
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-gray-50 pt-16 pb-16 px-6 relative">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative z-10">
              <div className="grid md:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <div key={category.title} className="text-center group cursor-pointer border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:bg-gray-50/50 transition-all">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <category.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{category.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Promoted Articles */}
        <section className="bg-white py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-foreground mb-8">Promoted articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <div key={article} className="group cursor-pointer border border-gray-200 rounded-lg p-6 hover:border-primary hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <span className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{article}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">Frequently asked questions</p>
            
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="w-5 h-5" />
                <span>English (US)</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Bubble */}
      <button className="chat-bubble" aria-label="Open chat">
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>
    </div>
  );
};

export default Index;
