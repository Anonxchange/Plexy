import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  Smartphone,
  Eye,
  EyeOff,
  ChevronDown,
  MoreVertical,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

const cryptoAssets = [
  { symbol: "BTC", name: "Bitcoin", balance: 0.0000001, ngnValue: 17.99, icon: "₿", color: "text-orange-500" },
  { symbol: "ETH", name: "Ethereum", balance: 0, ngnValue: 0, icon: "Ξ", color: "text-blue-500" },
  { symbol: "SOL", name: "Solana", balance: 0, ngnValue: 0, icon: "◎", color: "text-purple-500" },
  { symbol: "TON", name: "Toncoin", balance: 0, ngnValue: 0, icon: "💎", color: "text-blue-400" },
  { symbol: "USDC", name: "USD Coin", balance: 0, ngnValue: 0, icon: "⊙", color: "text-blue-600" },
  { symbol: "USDT", name: "Tether", balance: 0.001259, ngnValue: 1.85, icon: "₮", color: "text-green-500" },
  { symbol: "XMR", name: "Monero", balance: 0, ngnValue: 0, icon: "ɱ", color: "text-orange-600" },
];

const spotPairs = [
  { symbol: "BTC", name: "Bitcoin", price: 122256.00, change: -0.58 },
  { symbol: "ETH", name: "Ethereum", price: 4362.20, change: -2.98 },
  { symbol: "BNB", name: "BNB", price: 1284.45, change: -2.19 },
  { symbol: "TRX", name: "Tron", price: 0.34, change: -0.12 },
  { symbol: "SOL", name: "Solana", price: 222.75, change: 0.58 },
  { symbol: "LTC", name: "Litecoin", price: 116.75, change: 0.15 },
];

export default function Wallet() {
  const [activeWalletTab, setActiveWalletTab] = useState("wallet");
  const [activeAssetTab, setActiveAssetTab] = useState("assets");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeSpotTab, setActiveSpotTab] = useState("hot");

  const totalBalance = 19.84;
  
  const filteredAssets = hideZeroBalance 
    ? cryptoAssets.filter(asset => asset.balance > 0)
    : cryptoAssets;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* My Assets Header */}
        <h1 className="text-2xl font-bold mb-4">My assets</h1>

        {/* Withdraw Limits Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Withdraw limits</span>
                <Badge variant="default" className="text-xs">Level 3</Badge>
                <span className="text-sm text-primary cursor-pointer hover:underline">Learn more</span>
              </div>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Wallet Type Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "wallet", label: "💳 Wallet" },
            { id: "spot", label: "📊 Spot" },
            { id: "card", label: "💳 Visa card" }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeWalletTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveWalletTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Wallet balance</span>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="h-8 w-8"
              >
                {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-4xl font-bold text-primary mb-6">
              {balanceVisible ? `${totalBalance.toFixed(2)} NGN` : "••••••"}
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowDownToLine className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Receive</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowUpFromLine className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Send</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Swap</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Mobile top-up</span>
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                🏦 Crypto to Bank
              </Button>
              <Button className="w-full">
                💰 Buy crypto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Asset Tabs */}
        <div className="flex gap-6 mb-4 border-b">
          {[
            { id: "assets", label: "Wallet assets" },
            { id: "activity", label: "Recent activity" },
            { id: "operations", label: "All operations" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAssetTab(tab.id)}
              className={`pb-3 font-medium text-sm transition-colors ${
                activeAssetTab === tab.id
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hide 0 Balance Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Switch 
            checked={hideZeroBalance}
            onCheckedChange={setHideZeroBalance}
          />
          <span className="text-sm text-muted-foreground">Hide 0 balance</span>
        </div>

        {/* Asset List Header */}
        <div className="grid grid-cols-3 gap-4 px-4 mb-2">
          <div className="text-xs text-muted-foreground">Asset</div>
          <div className="text-xs text-muted-foreground text-right">Balance</div>
          <div className="text-xs text-muted-foreground text-right">Action</div>
        </div>

        {/* Asset List */}
        <div className="space-y-2 mb-8">
          {filteredAssets.map((asset) => (
            <Card key={asset.symbol}>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl ${asset.color}`}>
                      {asset.icon}
                    </div>
                    <span className="font-medium">{asset.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{asset.balance.toFixed(7)}</div>
                    <div className="text-sm text-muted-foreground">{asset.ngnValue.toFixed(2)} NGN</div>
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Section */}
        <h2 className="text-xl font-bold mb-4">Recommended for you</h2>

        {/* P2P Trading Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">P2P Trading</h3>
              <Link href="/p2p">
                <span className="text-primary text-sm cursor-pointer flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">MKUU_</span>
                        <span className="text-xs">🇰🇪 🇳🇬</span>
                        <Badge variant="default" className="text-xs">EXPERT</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <span>👍</span>
                        <span>2929</span>
                      </div>
                    </div>
                  </div>
                  <Button>
                    Buy BTC ₿
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Payment</div>
                    <div className="font-medium">Bank Transfer</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground mb-1">Price</div>
                    <div className="font-medium">₿ KES 13,300,000.00</div>
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="text-muted-foreground">Range</div>
                  <div className="font-medium">KES 3,000.00 - KES 110,931.00</div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Spot Exchange Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Spot exchange</h3>
              <span className="text-primary text-sm cursor-pointer flex items-center gap-1 hover:underline">
                View all 50+ coins <ChevronRight className="h-4 w-4" />
              </span>
            </div>

            {/* Spot Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: "hot", label: "🔥 Hot pairs" },
                { id: "movers", label: "Top movers" },
                { id: "added", label: "Recently added" }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeSpotTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSpotTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Spot Pairs List */}
            <div className="space-y-2">
              {spotPairs.map((pair) => (
                <div 
                  key={pair.symbol}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {pair.symbol === "BTC" && "₿"}
                      {pair.symbol === "ETH" && "Ξ"}
                      {pair.symbol === "BNB" && "B"}
                      {pair.symbol === "TRX" && "T"}
                      {pair.symbol === "SOL" && "◎"}
                      {pair.symbol === "LTC" && "Ł"}
                    </div>
                    <span className="font-medium">{pair.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${pair.price.toLocaleString()}</div>
                  </div>
                  <div className={`text-sm font-medium ${pair.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pair.change >= 0 ? '+' : ''}{pair.change}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Promotions Card */}
        <h2 className="text-xl font-bold mb-4">Check out our promotions</h2>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-3xl font-bold mb-2">Save up to</h3>
            <p className="text-4xl font-bold text-orange-100 mb-4">20% on gift cards</p>
            <p className="text-sm mb-6 opacity-90">
              Exclusive discounts on the gift cards you love—shop now and save more!
            </p>
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              🎁 Buy a gift card
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
