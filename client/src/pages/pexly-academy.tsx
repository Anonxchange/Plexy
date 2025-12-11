import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useSchema, academyPageSchema } from "@/hooks/use-schema";

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readTime: string;
  imageUrl: string;
  link?: string;
}

const articles: Record<string, Article[]> = {
  "p2p": [
    {
      id: "p2p-1",
      title: "How to Avoid P2P Crypto Scams and Fraud",
      description: "Like any growing industry with lucrative returns, the crypto space attracts scammers. Learn how to protect yourself from common P2P scams.",
      category: "Security",
      difficulty: "Beginner",
      readTime: "10 min read",
      imageUrl: "/assets/IMG_1804.jpeg",
    },
    {
      id: "p2p-2",
      title: "Becoming a P2P Advertiser on Pexly",
      description: "Learn how to become a Pexly P2P Advertiser, post offers, and start earning from crypto trading.",
      category: "Trading",
      difficulty: "Intermediate",
      readTime: "9 min read",
      imageUrl: "/assets/IMG_1807.jpeg",
    },
    {
      id: "p2p-3",
      title: "P2P Trading: Everything You Need to Know",
      description: "P2P on Pexly is an easy and secure way to buy and sell crypto directly from other users at the best prices.",
      category: "Getting Started",
      difficulty: "Beginner",
      readTime: "7 min read",
      imageUrl: "/assets/IMG_1750.jpeg",
    },
    {
      id: "p2p-4",
      title: "How to Sell Coins via Pexly's P2P Platform",
      description: "Looking to start selling crypto? Explore the easy step-by-step process to sell cryptocurrency on Pexly P2P.",
      category: "Trading",
      difficulty: "Beginner",
      readTime: "3 min read", 
      imageUrl: "/assets/IMG_1809.jpeg",
    },
    {
      id: "p2p-5",
      title: "How to Buy Coins on Pexly's P2P Platform",
      description: "Learn the easy step-by-step process to buy cryptocurrency safely and securely via P2P trading.",
      category: "Trading",
      difficulty: "Beginner",
      readTime: "3 min read",
      imageUrl: "/assets/IMG_1809_1761669025651.jpeg",
    },
    {
      id: "p2p-6",
      title: "P2P for Sellers: Your Key to Smooth Trading",
      description: "Discover key strategies for P2P crypto sellers on Pexly. Maximize your profits and minimize risks.",
      category: "Advanced Trading",
      difficulty: "Intermediate",
      readTime: "7 min read",
      imageUrl: "/assets/IMG_1754.jpeg",
    },
    {
      id: "p2p-7",
      title: "How to Earn Money With P2P Trading on Pexly",
      description: "Some of the ways to make money with P2P trading include arbitrage, becoming a merchant, and referral programs.",
      category: "Earning",
      difficulty: "Intermediate",
      readTime: "8 min read",
      imageUrl: "/assets/IMG_1755.jpeg",
    },
    {
      id: "p2p-8",
      title: "How Does Pexly's P2P Platform Work?",
      description: "Let's get down to the mechanics of Pexly's P2P trading platform and how it connects buyers and sellers.",
      category: "Getting Started",
      difficulty: "Beginner",
      readTime: "4 min read",
      imageUrl: "/assets/IMG_1811.jpeg",
    },
    {
      id: "p2p-9",
      title: "Advanced P2P Trading Strategies",
      description: "Master advanced techniques for P2P trading including arbitrage opportunities, risk management, and maximizing profits.",
      category: "Advanced Trading",
      difficulty: "Advanced",
      readTime: "12 min read",
      imageUrl: "/assets/IMG_1808.jpeg",
    },
  ],
  "crypto": [
    {
      id: "crypto-1",
      title: "Best Ways to Buy Crypto With Cash in 2024",
      description: "There are five different ways to buy crypto with cash: P2P platforms, Bitcoin ATMs, peer-to-peer marketplaces, and more.",
      category: "Buying",
      difficulty: "Beginner",
      readTime: "10 min read",
      imageUrl: "/assets/IMG_1810_1761669025651.jpeg",
    },
    {
      id: "crypto-2",
      title: "Understanding Blockchain Technology",
      description: "Wondering what's behind P2P crypto exchanges and decentralized finance? Learn the fundamentals of blockchain.",
      category: "Education",
      difficulty: "Beginner",
      readTime: "13 min read",
      imageUrl: "/assets/IMG_1804_1761669025650.jpeg",
    },
    {
      id: "crypto-3",
      title: "How to Buy Crypto With P2P via Pexly Wallet",
      description: "Excited to kickstart your crypto journey with Pexly? Learn how to buy cryptocurrency using your Pexly wallet.",
      category: "Getting Started",
      difficulty: "Beginner",
      readTime: "8 min read",
      imageUrl: "/assets/IMG_1807_1761669025651.jpeg",
    },
    {
      id: "crypto-4",
      title: "What is Bitcoin? A Complete Beginner's Guide",
      description: "Bitcoin is the world's first cryptocurrency. Learn what Bitcoin is, how it works, and why it matters.",
      category: "Education",
      difficulty: "Beginner",
      readTime: "12 min read",
      imageUrl: "/assets/IMG_1754_1761669025651.jpeg",
    },
    {
      id: "crypto-5",
      title: "Understanding Ethereum and Smart Contracts",
      description: "Ethereum revolutionized blockchain with smart contracts. Discover how this platform powers DeFi and NFTs.",
      category: "Education",
      difficulty: "Intermediate",
      readTime: "15 min read",
      imageUrl: "/assets/IMG_1755_1761669025651.jpeg",
    },
  ],
  "platform": [
    {
      id: "platform-1",
      title: "5 Best P2P Crypto Exchanges for Minimal Fees",
      description: "Desire more anonymity and lesser fees when buying or selling crypto? Explore the best P2P exchanges.",
      category: "Comparison",
      difficulty: "Beginner",
      readTime: "11 min read",
      imageUrl: "/assets/IMG_1809_1761669025651.jpeg",
    },
    {
      id: "platform-2",
      title: "Getting Started with Pexly: Complete Guide",
      description: "New to Pexly? This comprehensive guide walks you through account creation, verification, and your first trade.",
      category: "Getting Started",
      difficulty: "Beginner",
      readTime: "6 min read",
      imageUrl: "/assets/IMG_1805_1761669025651.jpeg",
    },
    {
      id: "platform-3",
      title: "Pexly Security: How We Keep Your Funds Safe",
      description: "Learn about Pexly's escrow system, verification levels, and security measures that protect your trades.",
      category: "Security",
      difficulty: "Intermediate",
      readTime: "9 min read",
      imageUrl: "/assets/IMG_1811_1761669025651.jpeg",
    },
    {
      id: "platform-4",
      title: "Understanding Pexly's Verification Levels",
      description: "Increase your trading limits and unlock premium features by completing verification levels on Pexly.",
      category: "Account",
      difficulty: "Beginner",
      readTime: "5 min read",
      imageUrl: "/assets/IMG_1750_1761669025651.jpeg",
    },
  ],
  "wallet": [
    {
      id: "wallet-1",
      title: "How to Secure Your Crypto Wallet",
      description: "Best practices for keeping your cryptocurrency safe, from 2FA to cold storage solutions.",
      category: "Security",
      difficulty: "Beginner",
      readTime: "8 min read",
      imageUrl: "/assets/IMG_1810_1761669025651.jpeg",
    },
    {
      id: "wallet-2",
      title: "Understanding Pexly Wallet Features",
      description: "Explore all the features of your Pexly wallet, from sending and receiving to advanced options.",
      category: "Getting Started",
      difficulty: "Beginner",
      readTime: "7 min read",
      imageUrl: "/assets/IMG_1804_1761669025650.jpeg",
    },
    {
      id: "wallet-3",
      title: "What Are Hardware Wallets?",
      description: "Learn about hardware wallets and why they're considered the most secure way to store cryptocurrency.",
      category: "Security",
      difficulty: "Intermediate",
      readTime: "10 min read",
      imageUrl: "/assets/IMG_1807_1761669025651.jpeg",
    },
  ],
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "Intermediate":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "Advanced":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export function PexlyAcademy() {
  useSchema(academyPageSchema, "academy-page-schema");
  const [activeCategory, setActiveCategory] = useState("p2p");
  // Placeholder for selected article state, assuming it will be used elsewhere or for future features
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 pb-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold">Pexly LEARN</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Master everything you need to know about P2P trading, cryptocurrency, and the Pexly platform. 
              From beginner guides to advanced strategies.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
          <div className="max-w-4xl mx-auto px-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-0 gap-0 overflow-x-auto flex-nowrap">
                <TabsTrigger 
                  value="p2p" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 whitespace-nowrap"
                >
                  P2P Guide
                </TabsTrigger>
                <TabsTrigger 
                  value="crypto" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 whitespace-nowrap"
                >
                  Crypto Basics
                </TabsTrigger>
                <TabsTrigger 
                  value="platform" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 whitespace-nowrap"
                >
                  Platform Guide
                </TabsTrigger>
                <TabsTrigger 
                  value="wallet" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 whitespace-nowrap"
                >
                  Wallet & Security
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Tabs value={activeCategory} className="w-full">
            {Object.entries(articles).map(([category, categoryArticles]) => (
              <TabsContent key={category} value={category} className="mt-0 space-y-6">
                {/* Category Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {category === "p2p" && "P2P Guide"}
                    {category === "crypto" && "Crypto Basics"}
                    {category === "platform" && "Platform Guide"}
                    {category === "wallet" && "Wallet & Security"}
                  </h2>
                  <p className="text-muted-foreground">
                    {category === "p2p" && "Pexly P2P features a secure and easy-to-use interface for users to buy and sell crypto via fiat upon the agreed price between sellers and buyers. Let us help to master everything you need to buy crypto via fiat fast, easy, and secure today."}
                    {category === "crypto" && "Learn the fundamentals of cryptocurrency, blockchain technology, and how digital assets are revolutionizing finance."}
                    {category === "platform" && "Everything you need to know about using Pexly, from getting started to advanced features and security."}
                    {category === "wallet" && "Protect your digital assets with best practices for wallet security and management."}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Articles ({categoryArticles.length})</p>
                  </div>
                </div>

                {/* Articles Grid */}
                <div className="space-y-8">
                  {categoryArticles.map((article, index) => {
                    const articleImages = [
                      "/assets/academy-crypto-wallet.jpeg",
                      "/assets/academy-p2p-earn.jpeg",
                      "/assets/academy-trading-basics.jpeg",
                      "/assets/academy-security.jpeg",
                      "/assets/academy-defi.jpeg",
                      "/assets/academy-market-analysis.jpeg",
                      "/assets/academy-advanced.jpeg",
                      "/assets/academy-blockchain.jpeg",
                      "/assets/academy-nft.jpeg"
                    ];

                    return (
                    <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-0">
                        <Link href={`/academy/${article.id}`}>
                          <div className="w-full">
                            <img 
                              src={article.imageUrl || articleImages[index % articleImages.length]} 
                              alt={article.title}
                              className="w-full h-auto object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-48 flex items-center justify-center bg-gradient-to-br from-orange-200 via-orange-100 to-yellow-100"><svg class="h-16 w-16 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>';
                                }
                              }}
                            />
                          </div>
                          <div className="p-6">
                            <div className="text-xs text-muted-foreground mb-2 uppercase font-semibold">PEXLY LEARN</div>
                            <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                            <p className="text-muted-foreground mb-3">
                              {article.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <button className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                                Read More <ArrowRight className="h-3 w-3" />
                              </button>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{article.readTime}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  )})}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-2 pt-6">
                  <Button variant="outline" size="sm" disabled>
                    1
                  </Button>
                  <Button variant="ghost" size="sm">
                    2
                  </Button>
                  <Button variant="ghost" size="sm">
                    →
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-2">Ready to Start Trading?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Put your knowledge into practice. Start trading on Pexly P2P with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/p2p">
                    Start Trading on P2P
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/signup">
                    Create Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default PexlyAcademy;