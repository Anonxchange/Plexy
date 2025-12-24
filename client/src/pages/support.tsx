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

const HelpCenter = () => {
  return (
    <div className="min-h-screen flex flex-col bg-hero-bg">
      <main className="flex-1">
        {/* Hero Section with Header */}
        <section className="bg-hero-bg pt-6 pb-0 px-6 relative">
          {/* Header */}
          <div className="max-w-6xl mx-auto flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-foreground" strokeWidth={3} />
              <span className="text-foreground text-2xl font-bold tracking-tight">
                Pexly<span className="text-primary">P2P</span>
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 border border-foreground/30 rounded-full px-6 py-3">
              <a href="#" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                Shop
              </a>
              <a 
                href="#" 
                className="text-foreground border border-foreground/30 rounded-full px-4 py-2 text-sm hover:bg-foreground/10 transition-colors font-medium"
              >
                Submit a request
              </a>
              <a href="#" className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium">
                Sign in
              </a>
            </nav>
            
            {/* Mobile Menu */}
            <button className="md:hidden text-foreground p-2 hover:bg-foreground/10 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Hero Content */}
          <div className="max-w-2xl mx-auto text-center relative z-10 pb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-10 leading-tight">
              How can we help you?
            </h1>
            
            <div className="relative max-w-lg mx-auto mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-14 pr-6 py-4 rounded-full bg-card text-card-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg text-lg"
              />
            </div>
            
            <p className="text-foreground/60 text-base md:text-lg">
              Search for answers or browse our knowledge base.
            </p>
          </div>
        </section>

        {/* Curved Wave Transition */}
        <div className="relative">
          {/* Primary background behind the curve */}
          <div className="absolute inset-0 bg-hero-curve" />
          <svg 
            className="w-full h-auto relative z-10"
            viewBox="0 0 1440 120" 
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <path 
              d="M0,0 L0,60 Q360,120 720,80 Q1080,40 1440,80 L1440,0 Z" 
              className="fill-hero-bg"
            />
          </svg>
        </div>
          
        {/* Primary visible strip */}
        <div className="bg-hero-curve h-32 md:h-40"></div>

        {/* White background section with card overlapping */}
        <div className="bg-card px-6 relative">
          <div className="container mx-auto max-w-5xl relative -mt-16 md:-mt-20">
            {/* Categories Card */}
            <div className="bg-card rounded-3xl shadow-2xl p-8 md:p-12 relative z-20">
              <div className="grid md:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <div key={category.title} className="text-center group cursor-pointer p-6 hover:bg-muted rounded-2xl transition-all">
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:bg-lime group-hover:shadow-xl transition-all">
                        <category.icon className="w-8 h-8 text-primary-foreground group-hover:text-foreground" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-lime transition-colors">{category.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promoted Articles */}
        <section className="bg-card py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold text-card-foreground mb-8">Promoted articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {articles.map((article) => (
                <div key={article} className="group cursor-pointer bg-muted border border-border rounded-xl p-5 hover:border-primary hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-base font-medium text-card-foreground group-hover:text-primary transition-colors">{article}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-8 border-t border-border">
        <div className="container mx-auto max-w-6xl px-6">
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
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Bubble */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors" aria-label="Open chat">
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>
    </div>
  );
};

export default HelpCenter;
