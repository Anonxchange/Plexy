import { useState } from "react";
import {
  Search,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PexlyFooter } from "@/components/pexly-footer";
import { FloatingHelpButton } from "@/components/floating-help-button";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelpCenter, setShowHelpCenter] = useState(false);

  const helpCategories = [
    {
      title: "Get Started",
      description: "Get started with secure trading",
      icon: "🚀",
    },
    {
      title: "Account - Security & Privacy",
      description: "Your privacy. Our priority.",
      icon: "🔒",
    },
    {
      title: "Wallet & Bank Transfer",
      description: "Manage your wallet and transfers",
      icon: "💳",
    },
    {
      title: "Swap - Buy & Sell Crypto",
      description: "Buy & sell crypto instantly with Swap",
      icon: "🔄",
    },
    {
      title: "P2P Trading Guide",
      description: "Learn P2P trading on Pexly",
      icon: "👥",
    },
    {
      title: "Gift Cards & Rewards",
      description: "Earn rewards with Pexly",
      icon: "🎁",
    },
    {
      title: "Affiliate & Referral Program",
      description: "Earn crypto by inviting friends",
      icon: "🤝",
    },
    {
      title: "Other Knowledge",
      description: "Explore crypto & blockchain tips",
      icon: "📚",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600/80 to-purple-700/60 text-white px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Hi</h1>
              <p className="text-lg opacity-90">How can we help you today?</p>
            </div>
            <button
              onClick={() => setShowHelpCenter(false)}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Search for help"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-4 pr-12 text-base rounded-lg bg-white/20 text-white placeholder:text-white/60 border-0"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Help Center Content */}
      <section className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Ask a Question Card */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6 flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-[#B4F22E] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ask a question</h3>
              <p className="text-sm text-muted-foreground">We are here to help.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          </CardContent>
        </Card>

        {/* Help Categories */}
        <div className="space-y-3">
          {helpCategories.map((category, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-start gap-4">
                <span className="text-2xl">{category.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#B4F22E] flex-shrink-0 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom Navigation (for mobile-like experience) */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
              <span className="text-sm">🏠</span>
            </div>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Messages</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#B4F22E]">
            <span className="text-lg">❓</span>
            <span className="text-xs">Help</span>
          </button>
        </div>
      </div>

      {/* Messages Section Modal (hidden by default) */}
      {showHelpCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-96">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <button onClick={() => setShowHelpCenter(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Tabs defaultValue="open" className="w-full">
                <TabsList className="w-full bg-transparent p-0 border-b">
                  <TabsTrigger
                    value="open"
                    className="flex-1 border-b-2 border-transparent data-[state=active]:border-[#B4F22E] data-[state=active]:bg-transparent rounded-none"
                  >
                    Open
                  </TabsTrigger>
                  <TabsTrigger
                    value="done"
                    className="flex-1 border-b-2 border-transparent data-[state=active]:border-[#B4F22E] data-[state=active]:bg-transparent rounded-none"
                  >
                    Done
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="open" className="mt-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Messages</h3>
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold">
                    Send us a message
                  </Button>
                </TabsContent>

                <TabsContent value="done" className="mt-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Messages</h3>
                    <p className="text-sm text-muted-foreground">No completed messages</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      <PexlyFooter />
      <FloatingHelpButton />
    </div>
  );
}
