import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  ThumbsUp, 
  MessageCircle,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Check,
  ChevronDown
} from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";


const ratingBreakdown = [
  { stars: 5, count: 2847, percentage: 78 },
  { stars: 4, count: 542, percentage: 15 },
  { stars: 3, count: 182, percentage: 5 },
  { stars: 2, count: 36, percentage: 1 },
  { stars: 1, count: 36, percentage: 1 }
];

const reviews = [
  {
    id: 1,
    author: "Michael Chen",
    location: "Singapore",
    rating: 5,
    date: "2025-01-10",
    verified: true,
    title: "Best P2P Platform I've Used",
    content: "I've been trading on Pexly for over a year now and it's been fantastic. The escrow system gives me peace of mind, and I've never had any issues with payments. Customer support is quick to respond when needed.",
    helpful: 156,
    trades: 237
  },
  {
    id: 2,
    author: "Sarah Johnson",
    location: "United Kingdom",
    rating: 5,
    date: "2025-01-08",
    verified: true,
    title: "Fast and Secure Transactions",
    content: "The platform is very user-friendly and transactions are lightning fast. I especially love the variety of payment methods available. Sold my first Bitcoin here and the whole process was seamless.",
    helpful: 142,
    trades: 89
  },
  {
    id: 3,
    author: "Carlos Rodriguez",
    location: "Spain",
    rating: 5,
    date: "2025-01-05",
    verified: true,
    title: "Excellent Platform for Beginners",
    content: "As someone new to crypto trading, Pexly made it really easy to get started. The verification process was straightforward and the interface is intuitive. Highly recommend for anyone looking to buy or sell crypto!",
    helpful: 98,
    trades: 34
  },
  {
    id: 4,
    author: "Aisha Mohammed",
    location: "United Arab Emirates",
    rating: 4,
    date: "2025-01-03",
    verified: true,
    title: "Great Experience Overall",
    content: "Very satisfied with Pexly. The only minor issue is that sometimes finding offers with my preferred payment method takes a bit of time, but once I do, everything works perfectly. Customer service is excellent.",
    helpful: 87,
    trades: 156
  },
  {
    id: 5,
    author: "James Wilson",
    location: "United States",
    rating: 5,
    date: "2025-01-01",
    verified: true,
    title: "Trustworthy and Reliable",
    content: "I've completed over 200 trades on Pexly without a single problem. The reputation system works well and helps identify trusted traders. The fees are competitive and the platform is secure. 5 stars!",
    helpful: 203,
    trades: 421
  },
  {
    id: 6,
    author: "Yuki Tanaka",
    location: "Japan",
    rating: 5,
    date: "2024-12-28",
    verified: true,
    title: "Perfect for International Trading",
    content: "Being able to trade with people from all over the world using different payment methods is amazing. Pexly has made cryptocurrency accessible to me in ways other platforms haven't. Excellent service!",
    helpful: 134,
    trades: 178
  }
];

const trustBadges = [
  { icon: Shield, title: "Bank-Grade Security", description: "Your funds are protected 24/7" },
  { icon: Users, title: "5M+ Users", description: "Trusted by millions worldwide" },
  { icon: Clock, title: "24/7 Support", description: "Always here when you need us" },
  { icon: TrendingUp, title: "$2B+ Traded", description: "Proven track record" }
];

export default function Reviews() {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const totalReviews = ratingBreakdown.reduce((sum, item) => sum + item.count, 0);
  const averageRating = (
    ratingBreakdown.reduce((sum, item) => sum + (item.stars * item.count), 0) / totalReviews
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-6xl">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-8 w-8 fill-primary text-primary" />
              ))}
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Trusted by <span className="text-primary">Millions</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              See why thousands of users choose Pexly for their cryptocurrency trading needs
            </p>
          </div>
        </div>
      </section>

      {/* Overall Rating Section */}
      <section className="py-12 lg:py-16 border-b">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Rating Summary */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-end gap-4 mb-6">
                <div className="text-6xl lg:text-7xl font-bold">{averageRating}</div>
                <div className="text-left pb-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Based on {totalReviews.toLocaleString()} reviews
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Recommend Us</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-primary">4.8/5</div>
                  <div className="text-sm text-muted-foreground">Avg. Rating</div>
                </div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-3">
              {ratingBreakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{item.stars}</span>
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  </div>
                  <Progress value={item.percentage} className="flex-1 h-3" />
                  <div className="text-sm text-muted-foreground w-16 text-right">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <badge.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{badge.title}</h3>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Reviews */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our Users Say</h2>
          
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{review.author}</h3>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{review.location}</span>
                        <span>•</span>
                        <span>{review.trades} trades</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-2">{review.title}</h4>
                  <p className="text-muted-foreground mb-4">{review.content}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>Reply</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!showAllReviews && reviews.length > 3 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowAllReviews(true)}
              >
                Show More Reviews
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Ready to Experience Pexly?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join millions of satisfied users and start trading cryptocurrency with confidence today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
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
