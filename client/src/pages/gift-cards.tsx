import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, ChevronDown, LayoutGrid, Coffee, MoreHorizontal, Gamepad2, ShoppingBag, Music, Bitcoin, Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currencies } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { useState } from "react";

const categories = [
  { icon: LayoutGrid, label: "All categories", active: true },
  { icon: Coffee, label: "Food" },
  { icon: Gamepad2, label: "Gaming" },
  { icon: ShoppingBag, label: "Shopping" },
  { icon: Music, label: "Entertainment" },
  { icon: MoreHorizontal, label: "More" },
];

const giftCards = [
  {
    id: 1,
    name: "iTunes Gift Card",
    brand: "Apple",
    priceRange: "$5 - $200",
    cryptoRange: "4.97 USDT - 198.85 USDT",
    discount: "-0.58%",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
    gradient: "from-gray-100 to-white",
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
  const [currency, setCurrency] = useState("USD");
  const [openCurrency, setOpenCurrency] = useState(false);

  const selectedCurrency = currencies.find((c) => c.code === currency);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background py-6 px-4">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/30 dark:bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/20 dark:bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 animate-fade-in">
            Buy gift cards with up to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-extrabold">20% discount</span>
          </h1>

          {/* Crypto Banner - Glass */}
          <div className="mt-4 backdrop-blur-xl bg-white/50 dark:bg-white/10 rounded-2xl p-3 border border-white/60 dark:border-white/20 shadow-lg flex items-center gap-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="w-10 h-10 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Bitcoin className="h-5 w-5 text-primary" />
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
                className="pl-10 bg-white/70 dark:bg-white/10 border-white/80 dark:border-white/30 h-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
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
                  className="bg-white/70 dark:bg-white/10 border-white/80 dark:border-white/30 h-10 text-foreground placeholder:text-muted-foreground focus:border-primary"
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
                      className="w-full justify-between h-10 font-normal bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/30 text-foreground hover:bg-white/90 dark:hover:bg-white/20"
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
              <Button variant="ghost" className="h-10 font-medium bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/30 text-foreground hover:bg-white/90 dark:hover:bg-white/20">
                Advanced
              </Button>
              <Button className="h-10 font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {giftCards.map((card, index) => (
            <div
              key={card.id}
              className="bg-card rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-card-hover transition-all duration-300 cursor-pointer group animate-slide-up"
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
                <p className="text-sm text-muted-foreground">
                  {card.priceRange}{" "}
                  <span className="text-muted-foreground/70">({card.cryptoRange})</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

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
    </div>
  );
}
