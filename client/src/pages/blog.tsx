import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

const categories = [
  "Latest news",
  "Announcement",
  "Promotion",
  "Series",
  "Knowledge",
  "Forum"
];

const featuredPosts = [
  {
    id: 1,
    title: "Pexly Will Soon Launch A New Look, Now Opening An Early Beta Access For Users",
    category: "Announcement",
    image: "/featured-1.jpg",
    gradient: "from-[#B4F22E]/80 via-[#8BC34A]/60 to-[#4CAF50]/80"
  },
  {
    id: 2,
    title: "The Role of Bug Bounties in Strengthening Pexly's Security",
    category: "Security",
    image: "/featured-2.jpg",
    gradient: "from-[#B4F22E]/70 via-[#9FD624]/60 to-[#7CB342]/80"
  },
  {
    id: 3,
    title: "How to Earn Crypto Without Trading: The Smart Guide for Beginners",
    category: "Knowledge",
    image: "/featured-3.jpg",
    gradient: "from-[#8BC34A]/80 via-[#B4F22E]/60 to-[#CDDC39]/80"
  },
  {
    id: 4,
    title: "More Friends, More Coins - Earn Up to $130 With Referrals",
    category: "Promotion",
    image: "/featured-4.jpg",
    gradient: "from-[#B4F22E]/90 via-[#9FD624]/70 to-[#8BC34A]/80"
  },
  {
    id: 5,
    title: "Understanding P2P Trading: Complete Guide for 2025",
    category: "Knowledge",
    image: "/featured-5.jpg",
    gradient: "from-[#7CB342]/80 via-[#B4F22E]/60 to-[#9FD624]/80"
  }
];

const blogPosts = [
  {
    id: 1,
    title: "How to Earn Crypto Without Trading: The Smart Guide for Beginners",
    category: "Knowledge",
    date: "2025/11/28",
    gradient: "from-[#B4F22E] via-[#9FD624] to-[#8BC34A]",
    hasCoins: true
  },
  {
    id: 2,
    title: "More Friends, More Coins - Earn Up to $130 With Referrals",
    category: "Promotion",
    date: "2025/11/25",
    gradient: "from-[#8BC34A] via-[#B4F22E] to-[#CDDC39]",
    promo: "$130"
  },
  {
    id: 3,
    title: "The Role of Bug Bounties in Strengthening Pexly's Security",
    category: "Security",
    date: "2025/11/22",
    gradient: "from-[#B4F22E]/90 via-[#7CB342] to-[#558B2F]"
  },
  {
    id: 4,
    title: "10 Essential Security Tips for Crypto Traders",
    category: "Security",
    date: "2025/11/20",
    gradient: "from-[#9FD624] via-[#B4F22E] to-[#C6FF00]"
  },
  {
    id: 5,
    title: "Pexly Introduces Lightning Network Support",
    category: "Announcement",
    date: "2025/11/18",
    gradient: "from-[#8BC34A] via-[#9FD624] to-[#B4F22E]"
  },
  {
    id: 6,
    title: "Understanding Payment Methods in P2P Trading",
    category: "Knowledge",
    date: "2025/11/15",
    gradient: "from-[#B4F22E] via-[#8BC34A] to-[#689F38]"
  },
  {
    id: 7,
    title: "Bitcoin Price Analysis: What's Driving the Market?",
    category: "Latest news",
    date: "2025/11/12",
    gradient: "from-[#9FD624] via-[#B4F22E] to-[#CDDC39]"
  },
  {
    id: 8,
    title: "Top 5 Trading Strategies for 2025",
    category: "Knowledge",
    date: "2025/11/10",
    gradient: "from-[#7CB342] via-[#B4F22E] to-[#9FD624]"
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("Latest news");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "Latest news" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Featured Carousel */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            {/* Carousel Container */}
            <div className="relative overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredPosts.map((post) => (
                  <div key={post.id} className="w-full flex-shrink-0">
                    <div className={`relative h-56 md:h-72 bg-gradient-to-br ${post.gradient} rounded-2xl overflow-hidden`}>
                      {/* Pexly Logo */}
                      <div className="absolute top-4 left-4">
                        <span className="text-white/90 font-bold text-lg">Pexly</span>
                      </div>
                      
                      {/* Decorative Elements */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Abstract shapes */}
                          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/20 rounded-lg transform rotate-12"></div>
                          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/15 rounded-full"></div>
                          <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-white/10 rounded-lg transform -rotate-12"></div>
                          
                          {/* Content hint */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-xl p-3 w-32 md:w-40">
                            <div className="space-y-2">
                              <div className="h-2 bg-white/40 rounded w-full"></div>
                              <div className="h-2 bg-white/30 rounded w-3/4"></div>
                              <div className="h-2 bg-white/20 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white text-xs font-medium">#{post.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Featured Title */}
            <div className="mt-4 px-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground text-center leading-tight">
                {featuredPosts[currentSlide].title}
              </h2>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {featuredPosts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? "bg-[#B4F22E]" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="px-4 py-4 border-b">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap text-sm font-medium pb-2 border-b-2 transition-colors ${
                  selectedCategory === category
                    ? "text-[#B4F22E] border-[#B4F22E]"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-12 h-12 rounded-full border-2 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto space-y-6">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No articles found. Try adjusting your search.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {/* Article Banner */}
                <div className={`relative h-48 md:h-56 bg-gradient-to-br ${post.gradient} overflow-hidden`}>
                  {/* Pexly Logo */}
                  <div className="absolute top-4 right-4">
                    <span className="text-white/90 font-bold text-lg">Pexly</span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-center">
                    {post.hasCoins && (
                      <>
                        {/* Decorative coins */}
                        <div className="absolute left-6 top-1/2 -translate-y-1/2">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-bold text-white">₿</span>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full"></div>
                            <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="ml-auto mr-4 text-right text-white">
                          <p className="text-2xl md:text-3xl font-bold">How to</p>
                          <p className="text-2xl md:text-3xl font-bold">Earn Crypto</p>
                          <p className="text-2xl md:text-3xl font-bold">without Trading</p>
                          <p className="text-sm mt-2 text-white/80">The Smart Guide for Beginners</p>
                        </div>
                      </>
                    )}
                    
                    {post.promo && (
                      <>
                        <div className="text-white">
                          <p className="text-sm font-bold uppercase tracking-wider text-yellow-300">More Friends, More Coins</p>
                          <p className="text-5xl md:text-6xl font-bold mt-2">{post.promo}</p>
                        </div>
                      </>
                    )}

                    {!post.hasCoins && !post.promo && (
                      <div className="text-white text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📰</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category badge */}
                  <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-xs font-medium">#{post.category}</span>
                  </div>
                </div>

                {/* Article Info */}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#B4F22E] text-sm font-medium">{post.category}</span>
                    <span className="text-muted-foreground text-sm">•</span>
                    <span className="text-muted-foreground text-sm">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {post.title}
                  </h3>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}
