import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Gift, Volume2, Tag } from "lucide-react";
import { PexlyFooter } from "@/components/pexly-footer";
import rewardsHeroImage from "@assets/IMG_2671.png";
import loyaltyBadgeImage from "@assets/IMG_1764.png";
import cryptoDepositImage from "@assets/IMG_1765.png";

export default function RewardsPage() {
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
        <div className="bg-gradient-to-b from-purple-100 to-background dark:from-purple-950/20 dark:to-background py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* 3D Gift Illustration Image */}
              <div className="relative w-full max-w-sm flex items-center justify-center">
                <img 
                  src={rewardsHeroImage}
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
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none px-0 mr-6"
                >
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value="expired"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-foreground rounded-none px-0"
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
              <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                Apply
              </Button>
            </div>

            <TabsContent value="latest">
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center">
                      <Gift className="h-12 w-12 text-muted-foreground" />
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
                    <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center">
                      <Gift className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No expired rewards</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Lucky Draw Section */}
          <Card className="overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground text-center relative">
              {/* Background decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Lucky Draw</h2>
                <p className="text-primary-foreground/80 mb-6">You have 1 FREE chance</p>

                {/* Wheel illustration placeholder */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-full"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="text-4xl font-bold text-white">%</div>
                  </div>
                  {/* Decorative dots */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                </div>

                <Button className="bg-background text-foreground hover:bg-muted font-semibold px-8">
                  Spin Now
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Earn More Rewards Section */}
        <div className="container mx-auto px-4 py-8 max-w-2xl pb-8">
          <h2 className="text-xl font-bold mb-6">Earn more rewards</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Lucky Spins */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/attached_assets/IMG_1766.png" 
                    alt="Lucky wheel"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Lucky spins</h3>
                <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Loyalty Badges */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src={loyaltyBadgeImage}
                    alt="Loyalty badges"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Loyalty badges</h3>
                <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Crypto Deposit Rewards */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src={cryptoDepositImage}
                    alt="Crypto deposit rewards"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Crypto Deposit Rewards</h3>
                <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">
                  Hunt for rewards
                </Button>
              </CardContent>
            </Card>

            {/* Cashback Vouchers */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <img 
                    src="/attached_assets/IMG_1767.jpeg" 
                    alt="Cashback voucher"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-lg">Cashback vouchers</h3>
                <Button variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">
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
