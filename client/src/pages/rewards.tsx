import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Gift, Volume2, Tag, ChevronRight } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";

export default function RewardsPage() {
  const luckyDrawTasks = [
    {
      title: "Convert & Lucky Draw: 100% to Win!",
      chances: "0",
      description: "Take a Chance",
      isHighlighted: true
    },
    {
      title: "Convert $1,000 or more",
      chances: "2",
      description: "Lucky Draw",
      action: "Accept"
    },
    {
      title: "Convert $5,000 or more",
      chances: "2",
      description: "Lucky Draw",
      action: "Accept"
    },
    {
      title: "Convert $15,000 or more",
      chances: "2",
      description: "Lucky Draw",
      action: "Accept"
    },
    {
      title: "Convert $100 or more",
      chances: "1",
      description: "Lucky Draw",
      action: "Accept"
    }
  ];

  const ongoingEvents = [
    {
      title: "Daily Treasure Hunt",
      image: "/assets/IMG_1803.jpeg",
      status: "Ongoing",
      endDate: "Ends on 2025-12-25"
    },
    {
      title: "#7UpBybit",
      image: "/assets/IMG_1804.jpeg",
      status: "Ongoing",
      endDate: "Ends on 2026-01-06"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">My gift</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Section with 3D Gift Illustration */}
        <div className="bg-gradient-to-b from-purple-500/20 via-purple-400/10 to-background dark:from-purple-950/40 dark:via-purple-900/20 dark:to-background py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* 3D Gift Illustration Image */}
              <div className="relative w-full max-w-sm flex items-center justify-center">
                <img 
                  src="/assets/IMG_2671.png"
                  alt="Rewards center illustration"
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Rewards center</h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Collect and manage valuable gifts from Pexly just for you. Join activities for a chance to receive more attractive rewards!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rewards Section */}
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Your rewards</h2>

          {/* Tabs for Latest/Expired */}
          <Tabs defaultValue="latest" className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="latest"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#B4F22E] rounded-none px-0 mr-6"
                >
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value="expired"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-[#B4F22E] rounded-none px-0"
                >
                  Expired
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Promotion Code Input */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Enter promotion code here"
                className="flex-1"
              />
              <Button className="bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                Apply
              </Button>
            </div>

            <TabsContent value="latest">
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <Gift className="h-12 w-12 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold">You have no reward!</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Complete tasks and challenges to earn rewards
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expired">
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <Gift className="h-12 w-12 text-purple-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">No expired rewards</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Day Counter Timeline */}
          <div className="flex items-center justify-center gap-3 my-8 overflow-x-auto pb-2">
            <div className="px-4 py-2 rounded-full border border-muted-foreground/30 text-muted-foreground text-sm whitespace-nowrap">
              Day 52
            </div>
            <div className="w-8 h-px bg-muted-foreground/20"></div>
            <div className="px-4 py-2 rounded-full border-2 border-[#B4F22E] bg-[#B4F22E]/20 text-[#B4F22E] font-semibold text-sm whitespace-nowrap">
              Today
            </div>
            <div className="w-8 h-px bg-muted-foreground/20"></div>
            <div className="px-4 py-2 rounded-full border border-muted-foreground/30 text-muted-foreground text-sm whitespace-nowrap">
              Day 54
            </div>
          </div>

          {/* Lucky Draw Tasks Section */}
          <div className="space-y-4 mb-8">
            {luckyDrawTasks.map((task, index) => (
              <Card 
                key={index}
                className={`overflow-hidden ${task.isHighlighted ? 'ring-2 ring-[#B4F22E]' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Chances */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center border border-purple-500/40">
                        <img 
                          src="/assets/IMG_2645.png" 
                          alt="Lucky draw icon"
                          className="w-7 h-7"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#B4F22E]">
                          {task.chances} Chance(s)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.description}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Task title and action */}
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold mb-3">{task.title}</h3>
                      {task.action ? (
                        <Button variant="outline" className="w-fit text-foreground border-muted-foreground hover:bg-muted">
                          {task.action}
                        </Button>
                      ) : (
                        <Button className="w-fit bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                          {task.description} <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ongoing Events Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Ongoing Events</h2>
            <div className="space-y-4">
              {ongoingEvents.map((event, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                        <img 
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[#B4F22E] font-medium">{event.status}</span>
                            <span className="text-muted-foreground">{event.endDate}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#B4F22E] flex-shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Earn More Rewards Section */}
        <div className="container mx-auto px-4 py-8 max-w-2xl pb-8">
          <h2 className="text-xl font-bold mb-6">Earn more rewards</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Lucky Spins */}
            <Card className="hover:shadow-lg transition-shadow border border-purple-500/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/assets/IMG_2672.png" 
                    alt="Lucky wheel"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Lucky spins</h3>
                <Button className="w-full bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Loyalty Badges */}
            <Card className="hover:shadow-lg transition-shadow border border-purple-500/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/assets/IMG_1764.png"
                    alt="Loyalty badges"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Loyalty badges</h3>
                <Button className="w-full bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Crypto Deposit Rewards */}
            <Card className="hover:shadow-lg transition-shadow border border-purple-500/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/assets/IMG_1765.png"
                    alt="Crypto deposit rewards"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Crypto Deposit Rewards</h3>
                <Button className="w-full bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Cashback Vouchers */}
            <Card className="hover:shadow-lg transition-shadow border border-purple-500/20">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/assets/IMG_2673.png" 
                    alt="Cashback voucher"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Cashback vouchers</h3>
                <Button className="w-full bg-[#B4F22E] text-black hover:bg-[#A8D61F] font-semibold">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pexly Footer */}
      <PexlyFooter />
    </div>
  );
}
