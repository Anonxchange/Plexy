import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Gift, TrendingUp, Calendar, Zap, Users, BadgeCheck, Wallet, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-background border-b">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <Gift className="h-24 w-24 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Limited-time new user perks</p>
              <h1 className="text-4xl md:text-5xl font-bold">Get up to 6,200 USDT</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="welcome" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="welcome">Welcome pack</TabsTrigger>
            <TabsTrigger value="deposit">Deposit challenge</TabsTrigger>
            <TabsTrigger value="new-earn">New Earn</TabsTrigger>
            <TabsTrigger value="daily">Daily tasks</TabsTrigger>
            <TabsTrigger value="limited">Limited-time</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">New user BTC reward</h2>
              <p className="text-sm text-muted-foreground mb-6">Complete any of the tasks below to unlock rewards</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border hover:border-primary transition-colors">
                  <div className="flex gap-4 flex-1">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-primary">200</span>
                      <span className="text-xs text-muted-foreground">USDT</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">BTC USDT-M Futures position boost voucher</h3>
                      <p className="text-sm text-muted-foreground">
                        Requirement: You must invest 10 USDT of your own funds to use this voucher
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">Refer to sign up</h3>
                      <p className="text-sm text-muted-foreground">
                        Refer 1 friends to sign up and complete identity verification.
                      </p>
                    </div>
                    <Button>Invite</Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Check in for 3 days</h3>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">0/3</span>
                      </div>
                    </div>
                    <Button variant="outline">Check-in</Button>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Deposit & trading challenge</h2>
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Complete net deposit and futures trading tasks to get up to 6,000 USDT
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { amount: "50 USDT", locked: false },
                  { amount: "400 USDT", locked: true },
                  { amount: "6,000 USDT", locked: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-muted/50 rounded-lg border text-center flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">{item.amount}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Net deposit ≥ 1,000 USDT</h3>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">0/1,000</span>
                      </div>
                    </div>
                    <Button>Deposit</Button>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Futures trading volume ≥ 100,000 USDT</h3>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">0/100,000</span>
                      </div>
                    </div>
                    <Button>Trade</Button>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/30 rounded text-xs text-muted-foreground space-y-1">
                <p>Data is updated every 10 minutes.</p>
                <p>
                  A 3-day monitoring period begins once the promotion ends. After this period, users must manually claim their rewards within two days in the Rewards Center; otherwise, the rewards will expire.
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="deposit" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Deposit & trading challenge</h2>
                <BadgeCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Complete net deposit and futures trading tasks to get up to 6,000 USDT
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { amount: "50 USDT", locked: false },
                  { amount: "400 USDT", locked: true },
                  { amount: "6,000 USDT", locked: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-muted/50 rounded-lg border text-center flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">{item.amount}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Net deposit ≥ 1,000 USDT</h3>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">0/1,000</span>
                      </div>
                    </div>
                    <Button>Deposit</Button>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Futures trading volume ≥ 100,000 USDT</h3>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">0/100,000</span>
                      </div>
                    </div>
                    <Button>Trade</Button>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="new-earn" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">New Earn users only</h2>
              <p className="text-sm text-muted-foreground mb-6">First investment ≥ 1,000 USDT</p>

              <div className="p-6 bg-muted/50 rounded-lg border text-center space-y-4">
                <div>
                  <span className="text-4xl font-bold text-primary">50</span>
                  <span className="text-sm text-muted-foreground ml-2">Points</span>
                </div>
                <div className="text-lg">80% 3-day APR: USDT</div>
                <Button className="w-full">Subscribe</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant="default" size="sm">Daily tasks</Button>
              <Button variant="ghost" size="sm">Limited-time tasks</Button>
            </div>

            <div className="grid gap-2">
              <Button variant="ghost" className="justify-start h-auto py-0 px-0">
                <div className="w-full">
                  <div className="flex items-center text-sm text-muted-foreground border-b pb-2">
                    <span className="flex-1">Trading task</span>
                    <span className="text-primary">Insights task</span>
                  </div>
                </div>
              </Button>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily futures trade</h3>
                  <p className="text-sm text-muted-foreground mb-2">Reach 200 USDT in futures trading volume.</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/200</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">20</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Trade</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily deposit</h3>
                  <p className="text-sm text-muted-foreground mb-2">Complete a valid deposit of any amount.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Deposit</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily net assets</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    The net asset in your account reaches at least 5000 USDT and no withdrawals are performed on that day.
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/5000</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">100</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4" variant="outline">Pending</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily spot trade</h3>
                  <p className="text-sm text-muted-foreground mb-2">Complete a spot trade of at least 20 USDT</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/20</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Trade</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily copy trade</h3>
                  <p className="text-sm text-muted-foreground mb-2">Reach 50 USDT in daily copy trading volume.</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/50</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Trade</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily spot margin trade</h3>
                  <p className="text-sm text-muted-foreground mb-2">Reach 50 USDT in spot margin trading volume.</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/50</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Trade</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily trading bot</h3>
                  <p className="text-sm text-muted-foreground mb-2">Reach 50 USDT in trading bot volume.</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0/50</span>
                  </div>
                  <Progress value={0} className="h-2 mb-3" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Trade</Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Daily referral</h3>
                  <p className="text-sm text-muted-foreground mb-2">Invite 1 friend to sign up on Pexly.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">10</span>
                    <span className="text-xs text-muted-foreground">Points</span>
                  </div>
                </div>
                <Button className="ml-4">Invite</Button>
              </div>
            </Card>

            <div className="text-center text-xs text-muted-foreground py-4">
              Tasks are reset at 12:00 AM (UTC+8) every day.
            </div>
          </TabsContent>

          <TabsContent value="limited" className="space-y-4">
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Zap className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No limited-time tasks available</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Check back later for special limited-time rewards and challenges.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
