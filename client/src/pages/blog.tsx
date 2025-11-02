import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight,
  TrendingUp,
  BookOpen,
  Newspaper,
  Trophy
} from "lucide-react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";

const categories = ["All", "News", "Guides", "Trading Tips", "Security", "Product Updates", "Market Analysis"];

const featuredPost = {
  id: 1,
  title: "The Future of P2P Cryptocurrency Trading in 2025",
  excerpt: "Explore how decentralized trading is reshaping the financial landscape and what it means for everyday users around the world.",
  category: "Market Analysis",
  author: "Sarah Chen",
  date: "2025-01-15",
  readTime: "8 min read",
  image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=500&fit=crop"
};

const blogPosts = [
  {
    id: 2,
    title: "10 Essential Security Tips for Crypto Traders",
    excerpt: "Protect your digital assets with these proven security practices that every cryptocurrency trader should follow.",
    category: "Security",
    author: "Michael Rodriguez",
    date: "2025-01-12",
    readTime: "6 min read",
    featured: false
  },
  {
    id: 3,
    title: "How to Start Trading Cryptocurrency: A Beginner's Guide",
    excerpt: "New to crypto trading? This comprehensive guide covers everything you need to know to get started safely.",
    category: "Guides",
    author: "Emma Thompson",
    date: "2025-01-10",
    readTime: "10 min read",
    featured: false
  },
  {
    id: 4,
    title: "Pexly Introduces Lightning Network Support",
    excerpt: "We're excited to announce support for Bitcoin's Lightning Network, enabling instant, low-fee transactions.",
    category: "Product Updates",
    author: "Pexly Team",
    date: "2025-01-08",
    readTime: "4 min read",
    featured: false
  },
  {
    id: 5,
    title: "Understanding Payment Methods in P2P Trading",
    excerpt: "A deep dive into the 500+ payment methods available on Pexly and how to choose the right one for your needs.",
    category: "Guides",
    author: "David Park",
    date: "2025-01-05",
    readTime: "7 min read",
    featured: false
  },
  {
    id: 6,
    title: "Bitcoin Price Analysis: What's Driving the Market?",
    excerpt: "Our expert analysis of recent Bitcoin price movements and what factors are influencing the cryptocurrency market.",
    category: "Market Analysis",
    author: "Jennifer Liu",
    date: "2025-01-03",
    readTime: "9 min read",
    featured: false
  },
  {
    id: 7,
    title: "Top 5 Trading Strategies for 2025",
    excerpt: "Learn the most effective cryptocurrency trading strategies that professionals use to maximize their returns.",
    category: "Trading Tips",
    author: "Alex Kumar",
    date: "2025-01-01",
    readTime: "8 min read",
    featured: false
  },
  {
    id: 8,
    title: "Pexly Reaches 5 Million Users Milestone",
    excerpt: "Celebrating a major milestone as we welcome our 5 millionth user to the Pexly platform.",
    category: "News",
    author: "Pexly Team",
    date: "2024-12-28",
    readTime: "3 min read",
    featured: false
  },
  {
    id: 9,
    title: "How to Avoid Common Scams in Crypto Trading",
    excerpt: "Stay safe with our comprehensive guide to identifying and avoiding the most common cryptocurrency scams.",
    category: "Security",
    author: "Rachel Green",
    date: "2024-12-25",
    readTime: "11 min read",
    featured: false
  },
  {
    id: 10,
    title: "The Rise of Stablecoins in P2P Trading",
    excerpt: "Exploring why stablecoins are becoming increasingly popular in peer-to-peer cryptocurrency transactions.",
    category: "Market Analysis",
    author: "Tom Wilson",
    date: "2024-12-22",
    readTime: "6 min read",
    featured: false
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-6xl">
          <div className="text-center space-y-6">
            <Badge className="mb-4" variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              Pexly Blog
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Insights & <span className="text-primary">Stories</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest news, guides, and insights from the world of cryptocurrency trading.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Featured Article</h2>
          </div>
          <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative h-64 lg:h-auto bg-muted">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Newspaper className="h-24 w-24 text-primary/20" />
                </div>
              </div>
              <CardContent className="p-8 lg:p-10 flex flex-col justify-center">
                <Badge className="w-fit mb-4">{featuredPost.category}</Badge>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">{featuredPost.title}</h3>
                <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button>
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 border-y bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="space-y-4">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No articles found. Try adjusting your search.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative h-48 bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent group-hover:from-primary/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {post.category === "News" && <Newspaper className="h-16 w-16 text-primary/20" />}
                      {post.category === "Guides" && <BookOpen className="h-16 w-16 text-primary/20" />}
                      {post.category === "Market Analysis" && <TrendingUp className="h-16 w-16 text-primary/20" />}
                      {!["News", "Guides", "Market Analysis"].includes(post.category) && <Newspaper className="h-16 w-16 text-primary/20" />}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {filteredPosts.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Get the latest articles, trading tips, and market insights delivered directly to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12"
                />
                <Button size="lg" className="sm:w-auto">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PexlyFooter />
    </div>
  );
}