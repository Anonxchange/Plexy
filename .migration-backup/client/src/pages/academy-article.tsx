
import { useEffect, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { PexlyFooter } from "@/components/pexly-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Eye, Share2, BookOpen, ChevronRight } from "lucide-react";

interface ArticleContent {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  readTime: string;
  imageUrl: string;
  views: string;
  publishDate: string;
  breadcrumbs: string[];
  sections: {
    heading: string;
    content: string;
    steps?: {
      title: string;
      description: string;
      image?: string;
    }[];
  }[];
}

// Full article content database
const articleContents: Record<string, ArticleContent> = {
  "p2p-1": {
    id: "p2p-1",
    title: "How to Avoid P2P Crypto Scams and Fraud",
    description: "Like any growing industry with lucrative returns, the crypto space attracts scammers. Learn how to protect yourself from common P2P scams.",
    category: "Security",
    difficulty: "Beginner",
    readTime: "10 min read",
    imageUrl: "/assets/IMG_1804_1761669025650.jpeg",
    views: "12,543",
    publishDate: "Jan 15, 2024",
    breadcrumbs: ["Guides", "All About P2P Platforms", "Current Page"],
    sections: [
      {
        heading: "What Is P2P Crypto Trading?",
        content: "P2P crypto trading is a decentralized method of buying and selling cryptocurrencies directly between users without intermediaries. While this offers more privacy and flexibility, it also requires extra vigilance to avoid scams.",
      },
      {
        heading: "Common P2P Scams to Watch Out For",
        content: "Understanding the most prevalent scams is your first line of defense. Here are the main types of fraud in P2P trading:",
        steps: [
          {
            title: "Fake Payment Proof",
            description: "Scammers send fake payment screenshots or receipts claiming they've paid. Always verify payments in your actual bank account or payment platform before releasing crypto.",
          },
          {
            title: "Chargeback Fraud",
            description: "After receiving crypto, fraudsters reverse the payment through their bank or payment provider. Use irreversible payment methods when possible.",
          },
          {
            title: "Phishing Attempts",
            description: "Fraudsters create fake websites or send malicious links to steal your login credentials. Always verify URLs and never click suspicious links.",
          },
          {
            title: "Identity Theft",
            description: "Scammers use stolen identities to trade. Verify the trader's reputation and history before engaging in large transactions.",
          },
        ],
      },
      {
        heading: "How to Stay Safe on Pexly P2P",
        content: "Follow these best practices to protect yourself while trading on Pexly:",
        steps: [
          {
            title: "Step 1: Verify Payment Before Release",
            description: "Always check your bank account or payment app to confirm funds have arrived before releasing cryptocurrency from escrow.",
          },
          {
            title: "Step 2: Trade with Verified Users",
            description: "Look for traders with high completion rates, positive reviews, and verified badges on their profiles.",
          },
          {
            title: "Step 3: Use Escrow Protection",
            description: "Pexly's escrow system holds crypto until payment is confirmed. Never agree to trade outside the platform.",
          },
          {
            title: "Step 4: Read Terms Carefully",
            description: "Review the seller's terms and conditions before initiating a trade. Watch for unusual requirements or red flags.",
          },
          {
            title: "Step 5: Keep Communication On-Platform",
            description: "Never move conversations to external messaging apps where there's no record of the transaction.",
          },
        ],
      },
      {
        heading: "Red Flags to Watch For",
        content: "Be immediately suspicious if a trader: Asks you to trade outside the platform • Requests payment to a different account than listed • Pressures you to release crypto before payment confirmation • Has very few completed trades or negative reviews • Offers prices significantly better than market rate",
      },
      {
        heading: "What to Do If You Encounter a Scammer",
        content: "If you suspect fraud: 1) Do NOT release the cryptocurrency 2) Take screenshots of all communication 3) Report the user immediately through Pexly's reporting system 4) Contact Pexly support with evidence 5) If money was stolen, report to local authorities and your bank",
      },
    ],
  },
  "p2p-2": {
    id: "p2p-2",
    title: "Becoming a P2P Advertiser on Pexly",
    description: "Learn how to become a Pexly P2P Advertiser, post offers, and start earning from crypto trading.",
    category: "Trading",
    difficulty: "Intermediate",
    readTime: "9 min read",
    imageUrl: "/assets/IMG_1807_1761669025651.jpeg",
    views: "8,921",
    publishDate: "Jan 18, 2024",
    breadcrumbs: ["Guides", "All About P2P Platforms", "Current Page"],
    sections: [
      {
        heading: "What Is a P2P Advertiser?",
        content: "A P2P advertiser is a user who posts buy or sell offers on the Pexly platform. As an advertiser, you set your own prices, payment methods, and trading conditions, allowing you to profit from the spread between buying and selling prices.",
      },
      {
        heading: "Requirements to Become an Advertiser",
        content: "Before you can start posting offers, you need to meet these requirements:",
        steps: [
          {
            title: "Complete KYC Verification",
            description: "You must complete at least Level 2 identity verification to become an advertiser on Pexly.",
          },
          {
            title: "Maintain Good Trading History",
            description: "Have at least 10 successful trades as a buyer or seller with a 95%+ completion rate.",
          },
          {
            title: "Sufficient Balance",
            description: "Keep enough cryptocurrency in your Pexly wallet to fulfill sell orders, or sufficient fiat for buy orders.",
          },
        ],
      },
      {
        heading: "Creating Your First Offer",
        content: "Follow these steps to post your first P2P offer on Pexly:",
        steps: [
          {
            title: "Step 1: Navigate to P2P Trading",
            description: "Click on 'P2P Trading' in the main navigation menu, then select 'Post New Offer' or 'My Offers'.",
          },
          {
            title: "Step 2: Choose Offer Type",
            description: "Select whether you want to post a 'Buy' offer (you're buying crypto) or 'Sell' offer (you're selling crypto).",
          },
          {
            title: "Step 3: Set Your Price",
            description: "Choose between Fixed Price or Floating Price. Floating prices adjust automatically based on market rates with your chosen margin.",
          },
          {
            title: "Step 4: Configure Payment Methods",
            description: "Add the payment methods you accept. You can add multiple methods to attract more traders.",
          },
          {
            title: "Step 5: Set Trading Limits",
            description: "Define minimum and maximum transaction amounts. This helps filter traders and manage your liquidity.",
          },
          {
            title: "Step 6: Add Terms and Auto-Reply",
            description: "Write clear terms and conditions. Set up automatic messages to guide traders through your process.",
          },
        ],
      },
      {
        heading: "Pricing Strategies for Success",
        content: "Smart pricing is key to being a successful advertiser. Consider these strategies: • Market Rate + Small Margin: Set your price 0.5-2% above/below market rate • Competitive Analysis: Check what other advertisers are offering • Volume vs. Margin: Lower margins can lead to higher volume • Peak Hours Pricing: Adjust prices during high-demand periods",
      },
      {
        heading: "Managing Your Offers",
        content: "As an advertiser, you need to actively manage your offers: Enable/disable offers based on your availability • Update prices to stay competitive • Respond quickly to trade requests (response time affects your rating) • Maintain sufficient balance to fulfill orders • Review and update your terms regularly",
      },
    ],
  },
  "p2p-8": {
    id: "p2p-8",
    title: "How Does Pexly's P2P Platform Work?",
    description: "Let's get down to the mechanics of Pexly's P2P trading platform and how it connects buyers and sellers.",
    category: "Getting Started",
    difficulty: "Beginner",
    readTime: "4 min read",
    imageUrl: "/assets/IMG_1750_1761669025651.jpeg",
    views: "4,799",
    publishDate: "Jan 21, 2024",
    breadcrumbs: ["Guides", "All About P2P Platforms", "Current Page"],
    sections: [
      {
        heading: "What Is P2P on Pexly Trading?",
        content: "Pexly's P2P trading service is an easy and secure peer-to-peer market that facilitates the buying and selling of two users' holdings at an optimal, agreed-upon price. Please note that Pexly does not provide the buy and sell offers on the P2P page.",
      },
      {
        heading: "Adding a Payment Method",
        content: "Here's how you can easily add a payment method:",
        steps: [
          {
            title: "Step 1: Navigate to P2P Trading",
            description: "Please click on Buy Crypto -> P2P Trading on the left side of the navigation bar to enter the P2P trading page.",
            image: "/assets/IMG_1750.jpeg",
          },
          {
            title: "Step 2: Access User Center",
            description: "Click on P2P User Center in the upper right corner to enter your profile.",
            image: "/assets/IMG_1754.jpeg",
          },
          {
            title: "Step 3: Add Payment Method",
            description: "In your user center, navigate to 'Payment Methods' and click 'Add New Method'. Fill in your payment details carefully.",
          },
          {
            title: "Step 4: Verify and Save",
            description: "Verify all information is correct, then save your payment method. It will now appear in your available payment options.",
          },
        ],
      },
      {
        heading: "Reasons to Trade P2P on Pexly",
        content: "P2P on Pexly allows you to convert fiat currencies to coins — and vice versa — for free. You can list advertisements — Buy or Sell — to trade with other buyers and sellers, with more than 80 available payment methods to choose from, including debit cards, credit cards, in-person cash payments, and more.",
      },
      {
        heading: "How the Escrow System Works",
        content: "When you place an order: 1) The seller's cryptocurrency is locked in Pexly's escrow 2) You make payment directly to the seller via your chosen method 3) Once you mark payment as complete, the seller verifies receipt 4) Upon confirmation, escrow automatically releases crypto to you 5) If there's a dispute, Pexly support team intervenes with evidence",
      },
      {
        heading: "Understanding Order Status",
        content: "Pending: Order created, awaiting buyer payment • Payment Sent: Buyer marked payment complete, seller verifying • Completed: Crypto released to buyer, trade successful • Cancelled: Either party cancelled before payment • Disputed: Requires Pexly support intervention",
      },
    ],
  },
};

export function AcademyArticle() {
  const [, params] = useRoute("/academy/:articleId");
  const [, setLocation] = useLocation();
  const [article, setArticle] = useState<ArticleContent | null>(null);

  useEffect(() => {
    if (params?.articleId) {
      const foundArticle = articleContents[params.articleId];
      if (foundArticle) {
        setArticle(foundArticle);
        window.scrollTo(0, 0);
      }
    }
  }, [params?.articleId]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Button asChild>
              <Link href="/academy">Back to Academy</Link>
            </Button>
          </div>
        </main>
        <PexlyFooter />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        {/* Breadcrumbs */}
        <div className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {article.breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4" />}
                  <span className={index === article.breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                    {crumb}
                  </span>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Article Header */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-6 -ml-2"
            onClick={() => setLocation("/academy")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Academy
          </Button>

          <h1 className="text-4xl font-bold mb-6">{article.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="outline" className="text-sm">
              {article.difficulty}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {article.category}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span>{article.publishDate}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{article.views}</span>
            </div>
          </div>

          {/* Share Button */}
          <div className="flex gap-3 mb-8">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* AI Summary Card */}
          <Card className="mb-8 border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">AI Summary</h3>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Quickly grasp the article's content and gauge market sentiment in just 30 seconds!
              </p>
            </CardContent>
          </Card>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {article.sections.map((section, index) => (
              <div key={index} className="mb-10">
                <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {section.content}
                </p>

                {section.steps && (
                  <div className="space-y-6 mt-6">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="border-l-4 border-primary/20 pl-6 py-2">
                        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        {step.image && (
                          <div className="mt-4 rounded-lg overflow-hidden border">
                            <img
                              src={step.image}
                              alt={step.title}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Trading?</h3>
              <p className="text-muted-foreground mb-6">
                Put your knowledge into practice on Pexly P2P
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href="/p2p">Start Trading Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/academy">More Articles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PexlyFooter />
    </div>
  );
}
