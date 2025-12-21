import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, ChevronDown, LayoutGrid, Coffee, MoreHorizontal, Gamepad2, ShoppingBag, Music, Check, ChevronsUpDown, UtensilsCrossed, Zap, Home, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currencies } from "@/lib/currencies";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { PexlyFooter } from "@/components/pexly-footer";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";

const categories = [
  { icon: LayoutGrid, label: "All categories", active: true },
  { icon: Coffee, label: "Food" },
  { icon: Gamepad2, label: "Games" },
  { icon: Zap, label: "Health" },
  { icon: Home, label: "Restaurants" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Globe, label: "Travel" },
];

const allCategories = [
  { icon: LayoutGrid, label: "All categories" },
  { icon: UtensilsCrossed, label: "Food" },
  { icon: Gamepad2, label: "Games" },
  { icon: Zap, label: "Health" },
  { icon: Home, label: "Restaurants" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Globe, label: "Travel" },
];

const defaultGiftCards = [
  {
    id: 1,
    name: "iTunes Gift Card",
    brand: "Apple",
    priceRange: "$5 - $200",
    cryptoRange: "4.97 USDT - 198.85 USDT",
    discount: "-0.58%",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
    gradient: "from-gray-100 to-white",
    description: "Get access to millions of songs, movies, TV shows, and more with an iTunes Gift Card. Use it to download from the Apple App Store, iTunes Store, or buy Apple Music.",
    minValue: 5,
    maxValue: 200,
    available: 999,
  },
  {
    id: 2,
    name: "PlayStation Store",
    brand: "Sony",
    priceRange: "$10 - $100",
    cryptoRange: "9.95 USDT - 99.50 USDT",
    discount: "-0.50%",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
    gradient: "from-blue-600 to-blue-800",
    description: "Add funds to your PlayStation Network wallet. Buy games, in-game currency, subscriptions, and more from the PlayStation Store.",
    minValue: 10,
    maxValue: 100,
    available: 850,
  },
  {
    id: 3,
    name: "Amazon Gift Card",
    brand: "Amazon",
    priceRange: "$25 - $500",
    cryptoRange: "24.75 USDT - 495.00 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=300&fit=crop",
    gradient: "from-orange-400 to-yellow-500",
    description: "Shop millions of products at Amazon with an Amazon Gift Card. Use it for everything from electronics to clothing, delivered to your door.",
    minValue: 25,
    maxValue: 500,
    available: 750,
  },
  {
    id: 4,
    name: "Netflix Gift Card",
    brand: "Netflix",
    priceRange: "$15 - $100",
    cryptoRange: "14.85 USDT - 99.00 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&h=300&fit=crop",
    gradient: "from-red-600 to-red-800",
    description: "Enjoy unlimited streaming of TV shows, movies, and more. A Netflix Gift Card is the perfect gift for entertainment lovers.",
    minValue: 15,
    maxValue: 100,
    available: 999,
  },
  {
    id: 5,
    name: "Spotify Premium",
    brand: "Spotify",
    priceRange: "$10 - $60",
    cryptoRange: "9.90 USDT - 59.40 USDT",
    discount: "-1.00%",
    image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=300&fit=crop",
    gradient: "from-green-500 to-green-700",
    description: "Enjoy millions of songs ad-free with Spotify Premium. Create playlists, download offline, and enjoy high-quality audio.",
    minValue: 10,
    maxValue: 60,
    available: 500,
  },
  {
    id: 6,
    name: "Steam Wallet",
    brand: "Valve",
    priceRange: "$20 - $100",
    cryptoRange: "19.60 USDT - 98.00 USDT",
    discount: "-2.00%",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
    gradient: "from-slate-700 to-slate-900",
    description: "Add funds to your Steam account. Purchase games, in-game items, and digital content from the world's largest PC gaming platform.",
    minValue: 20,
    maxValue: 100,
    available: 1200,
  },
];

const faqs = [
  {
    question: "What payment options do you accept?",
    answer: "We accept cryptocurrency payments including Bitcoin (BTC), Ethereum (ETH), and USDT. This ensures fast, secure, and private transactions."
  },
  {
    question: "Do I need to create an account to purchase a gift card?",
    answer: "No! You can purchase gift cards without creating an account. Simply select your card, pay with crypto, and receive your gift card code via email."
  },
  {
    question: "How long does it take to receive my purchased gift card?",
    answer: "Most gift cards are delivered instantly via email after your cryptocurrency payment is confirmed. Delivery typically takes 5-15 minutes depending on network congestion."
  },
  {
    question: "Who determines the price when buying or selling a gift card?",
    answer: "Prices are determined by individual sellers in our P2P marketplace. You can browse multiple offers and choose the best rate that suits your needs."
  },
  {
    question: "Is it safe to sell a gift card on Pexly?",
    answer: "Yes! We use an escrow system that holds the cryptocurrency until both parties confirm the transaction is complete. This protects both buyers and sellers."
  },
  {
    question: "Is ID verification required to sell a gift card?",
    answer: "For small transactions, ID verification is not required. However, higher transaction limits require identity verification to ensure platform security and compliance."
  }
];

export function GiftCards() {
  const [, setLocation] = useLocation();
  const [currency, setCurrency] = useState("USD");
  const [openCurrency, setOpenCurrency] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All categories");
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // If Supabase is not configured, use default data
      if (!supabaseUrl || !supabaseKey) {
        console.log('Supabase not configured, using default gift cards');
        setGiftCards(defaultGiftCards);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Add timeout for the request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await Promise.race([
        supabase
          .from('gift_cards')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Fetch timeout'));
          });
        })
      ]) as any;

      clearTimeout(timeout);

      if (error) {
        console.error('Error fetching gift cards:', error);
        setGiftCards(defaultGiftCards);
      } else if (data && data.length > 0) {
        console.log('Fetched gift cards from Supabase:', data);
        setGiftCards(data.map((card: any) => ({
          id: card.id,
          name: card.name,
          brand: card.brand,
          priceRange: `$${card.min_value} - $${card.max_value}`,
          cryptoRange: `${(card.min_value * 0.99).toFixed(2)} USDT - ${(card.max_value * 0.99).toFixed(2)} USDT`,
          discount: card.discount || "-0.58%",
          image: card.image_url || "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
          gradient: "from-gray-100 to-white",
          description: card.description || "",
          minValue: card.min_value,
          maxValue: card.max_value,
          available: card.available,
        })));
      } else {
        console.log('No gift cards found in Supabase, using defaults');
        setGiftCards(defaultGiftCards);
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      setGiftCards(defaultGiftCards);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <div className="min-h-screen bg-background">
      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background rounded-3xl p-6 border border-border/50 h-fit lg:sticky lg:top-6">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/20 dark:bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 animate-fade-in">
              Buy gift cards with up to{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-extrabold">20% discount</span>
            </h1>

            {/* Crypto Banner - Glass */}
            <div className="mt-4 backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-2xl p-3 border border-white/60 dark:border-white/20 shadow-lg flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-10 h-10 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <img src={cryptoIconUrls.USDT} alt="USDT" className="h-6 w-6 rounded-full" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Pay with crypto for instant transactions
              </p>
            </div>

            {/* Search Section - Glass */}
            <div className="mt-4 backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-2xl p-4 border border-white/60 dark:border-white/20 shadow-xl animate-slide-up" style={{ animationDelay: "0.15s" }}>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for gift cards"
                  className="pl-10 bg-white/70 dark:bg-white/10 border border-gray-300 dark:border-white/30 h-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Define card value
                    <span className="text-muted-foreground ml-1">(optional)</span>
                  </label>
                  <Input
                    placeholder="Enter amount"
                    className="bg-white/70 dark:bg-white/10 border border-gray-300 dark:border-white/30 h-10 text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Currency
                  </label>
                  <Popover open={openCurrency} onOpenChange={setOpenCurrency}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        role="combobox"
                        aria-expanded={openCurrency}
                        className="w-full justify-between h-10 font-normal bg-white/70 dark:bg-white/10 border border-gray-300 dark:border-white/30 text-foreground hover:bg-white/90 dark:hover:bg-white/20"
                      >
                        {selectedCurrency ? (
                          <span>
                            {selectedCurrency.flag} {selectedCurrency.code}
                          </span>
                        ) : (
                          "Select currency..."
                        )}
                        <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search currency..." />
                        <CommandList>
                          <CommandEmpty>No currency found.</CommandEmpty>
                          <CommandGroup>
                            {currencies.map((c) => (
                              <CommandItem
                                key={c.code}
                                value={c.code}
                                onSelect={() => {
                                  setCurrency(c.code);
                                  setOpenCurrency(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    currency === c.code ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="mr-2">{c.flag}</span>
                                <span>{c.code}</span>
                                <span className="ml-auto text-muted-foreground text-xs">{c.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="ghost" className="h-10 font-medium bg-white/70 dark:bg-white/10 border border-gray-300 dark:border-white/30 text-foreground hover:bg-white/90 dark:hover:bg-white/20">
                  Advanced
                </Button>
                <Button className="h-10 font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column - Gift Cards */}
        <main className="py-0">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide animate-fade-in">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant={category.active ? "default" : "secondary"}
                className={`flex-shrink-0 gap-2 px-4 h-10 rounded-xl ${
                  category.active
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-card border border-border hover:bg-secondary"
                }`}
                onClick={() => setShowCategoryModal(true)}
              >
                <category.icon className="h-4 w-4" />
                <span className="font-medium">{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Gift Cards Section */}
          <h2 className="text-lg font-semibold text-foreground mb-4 mt-2">
            All categories
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading gift cards...</p>
            </div>
          ) : (
          <div className="space-y-4 pb-8">
            {giftCards && giftCards.length > 0 ? giftCards.map((card, index) => (
              <div
                key={card.id}
                className="bg-card rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-card-hover transition-all duration-300 cursor-pointer group animate-slide-up"
                onClick={() => setLocation(`/gift-cards/${card.id}`)}
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className={`h-40 bg-gradient-to-br ${card.gradient} relative overflow-hidden`}>
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-lg leading-tight">
                      {card.name}
                    </h3>
                    <span className="text-xs font-semibold text-destructive bg-discount-bg px-2 py-1 rounded-md flex-shrink-0 ml-2">
                      {card.discount}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {card.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {card.priceRange}{" "}
                    <span className="text-muted-foreground/70">({card.cryptoRange})</span>
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No gift cards available yet</p>
              </div>
            )}
          </div>
          )}
        </main>
      </div>

      {/* FAQ Section */}
      <section className="py-16 px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">Frequently asked questions</h2>
          <p className="text-muted-foreground text-center mb-8">
            Find answers to the most popular questions asked by our users
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Category Modal Sheet */}
      <Sheet open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">Gift card categories</SheetTitle>
          </SheetHeader>

          <div className="space-y-2 mb-6">
            {allCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(category.label);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  selectedCategory === category.label
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <category.icon className="h-5 w-5" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          <Button
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={() => setShowCategoryModal(false)}
          >
            Confirm
          </Button>
        </SheetContent>
      </Sheet>

      <PexlyFooter />
    </div>
  );
}
