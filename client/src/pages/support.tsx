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
  MessageCircle
} from "lucide-react";
import "../support.css";

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

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary px-6 py-4 flex items-center justify-between relative z-20">
        <div className="text-primary-foreground text-2xl font-bold tracking-tight">
          Pexly
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-sm">
            Shop
          </a>
          <a 
            href="#" 
            className="text-primary-foreground border border-primary-foreground/80 rounded-full px-4 py-2 text-sm hover:bg-primary-foreground/10 transition-colors"
          >
            Submit a request
          </a>
          <a href="#" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors text-sm">
            Sign in
          </a>
        </nav>
        
        {/* Mobile Menu */}
        <button className="md:hidden text-primary-foreground p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero-section pt-16 pb-40 px-6">
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-8 leading-tight">
              How can we help you?
            </h1>
            
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="search-input shadow-lg"
              />
            </div>
            
            <p className="text-primary-foreground/70 mt-6 text-lg">
              Search for answers or browse our knowledge base.
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-white pt-0 pb-16">
          <div className="container -mt-24 relative z-10">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {categories.map((category) => (
                  <div key={category.title} className="text-center p-6 border border-border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4">
                      <category.icon className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-3">{category.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Promoted Articles */}
        <section className="bg-background py-16 border-t border-border">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Promoted articles</h2>
            <div className="divide-y divide-border">
              {articles.map((article) => (
                <div key={article} className="article-item group">
                  <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                  <span className="text-base font-medium">{article}</span>
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

export default support;
