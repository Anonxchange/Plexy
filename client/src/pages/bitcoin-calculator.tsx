
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PexlyFooter } from "@/components/pexly-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bitcoin, TrendingUp } from "lucide-react";
import { getCryptoPrices, getExchangeRates, formatPrice } from "@/lib/crypto-prices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

const POPULAR_CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
];

const POPULAR_CONVERSIONS = [
  "BTC to EUR",
  "BTC to CAD",
  "BTC to NZD",
  "BTC to INR",
  "BTC to CHF",
  "BTC to IDR",
  "BTC to NGN",
  "BTC to AUD",
  "BTC to GBP",
  "BTC to PHP",
  "BTC to CNY",
];

const BTC_DENOMINATIONS = [
  { btc: 1, label: "1 BTC" },
  { btc: 0.1, label: "0.1 BTC" },
  { btc: 0.05, label: "0.05 BTC" },
  { btc: 0.01, label: "0.01 BTC" },
  { btc: 0.0001, label: "0.0001 BTC" },
];

const FIAT_DENOMINATIONS = [
  { amount: 1, label: "1" },
  { amount: 10, label: "10" },
  { amount: 50, label: "50" },
  { amount: 100, label: "100" },
  { amount: 1000, label: "1,000" },
];

export function BitcoinCalculator() {
  const [btcAmount, setBtcAmount] = useState("1");
  const [fiatAmount, setFiatAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [chartInterval, setChartInterval] = useState("1m");
  const [chartData, setChartData] = useState<Array<{ date: string; price: number }>>([]);

  useEffect(() => {
    // Fetch historical price data
    const fetchChartData = async () => {
      try {
        const days = chartInterval === "1m" ? 30 : 
                    chartInterval === "1h" ? 1 :
                    chartInterval === "1d" ? 1 :
                    chartInterval === "1w" ? 7 :
                    chartInterval === "1M" ? 30 : 365;
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();
        
        if (data.prices) {
          const formattedData = data.prices.map((item: [number, number]) => ({
            date: new Date(item[0]).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric" 
            }),
            price: item[1]
          }));
          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchChartData();
  }, [chartInterval]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [cryptoPrices, rates] = await Promise.all([
          getCryptoPrices(["BTC"]),
          getExchangeRates(),
        ]);

        if (cryptoPrices.BTC) {
          setBtcPrice(cryptoPrices.BTC.current_price);
          setPriceChange(cryptoPrices.BTC.price_change_percentage_24h);
        }

        setExchangeRates(rates);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching prices:", error);
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (btcPrice && exchangeRates[selectedCurrency]) {
      const btc = parseFloat(btcAmount) || 0;
      const priceInUSD = btc * btcPrice;
      const priceInCurrency = priceInUSD * exchangeRates[selectedCurrency];
      setFiatAmount(priceInCurrency.toFixed(2));
    }
  }, [btcAmount, btcPrice, selectedCurrency, exchangeRates]);

  const handleBtcChange = (value: string) => {
    setBtcAmount(value);
  };

  const handleFiatChange = (value: string) => {
    setFiatAmount(value);
    if (btcPrice && exchangeRates[selectedCurrency]) {
      const fiat = parseFloat(value) || 0;
      const priceInUSD = fiat / exchangeRates[selectedCurrency];
      const btc = priceInUSD / btcPrice;
      setBtcAmount(btc.toFixed(8));
    }
  };

  const currentPriceInCurrency = btcPrice * (exchangeRates[selectedCurrency] || 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">Bitcoin Price Calculator</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Use Pexly's Bitcoin calculator to find out exactly how much your Bitcoin is worth in any
            of the supported global currencies, using accurate, up-to-date exchange rates. Get real-time
            and historical trends in the BTC value for your selected currency.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Column - Chart and Calculator */}
          <div className="lg:col-span-8 space-y-8">
            {/* Calculator Card */}
            <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-primary" />
                  BTC Converter
                </h2>
              </div>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 mb-8 relative">
                  {/* BTC Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Amount in Bitcoin</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <Bitcoin className="h-5 w-5" />
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        value={btcAmount}
                        onChange={(e) => handleBtcChange(e.target.value)}
                        className="pl-16 pr-16 h-16 text-xl font-bold focus:ring-primary border-2"
                        step="0.00000001"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="font-bold text-muted-foreground">BTC</span>
                      </div>
                    </div>
                  </div>

                  {/* Fiat Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Amount in {selectedCurrency}</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0"
                        value={fiatAmount}
                        onChange={(e) => handleFiatChange(e.target.value)}
                        className="pr-36 h-16 text-xl font-bold focus:ring-primary border-2"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger className="w-28 h-12 font-bold bg-muted border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POPULAR_CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.flag} {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <span className="mr-2">Quick select:</span>
                  {POPULAR_CURRENCIES.slice(0, 8).map((currency) => (
                    <Button
                      key={currency.code}
                      variant={selectedCurrency === currency.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCurrency(currency.code)}
                      className="px-4 font-semibold"
                    >
                      {currency.code}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bitcoin Price History Chart */}
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Bitcoin Price History</h2>
                    <p className="text-sm text-muted-foreground">Real-time BTC to {selectedCurrency} market trends</p>
                  </div>
                  <div className="flex bg-muted p-1 rounded-lg">
                    {["1m", "1h", "1d", "1w", "1M", "1y"].map((interval) => (
                      <Button
                        key={interval}
                        variant={chartInterval === interval ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setChartInterval(interval)}
                        className="px-4 font-semibold h-8"
                      >
                        {interval}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-[450px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          domain={['auto', 'auto']}
                          tickFormatter={(value) => `${selectedCurrency} ${(value / 1000).toFixed(0)}k`}
                          dx={-10}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background border border-border rounded-xl p-4 shadow-xl">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{payload[0].payload.date}</p>
                                  <p className="text-xl font-bold text-primary">
                                    {selectedCurrency} {payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#a3e635" 
                          strokeWidth={3}
                          fill="url(#colorPrice)"
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground font-medium">Loading chart data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Popular Conversions Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-sm">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6 border-b pb-4">Popular conversions</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {POPULAR_CONVERSIONS.map((conversion) => (
                      <button
                        key={conversion}
                        className="text-sm font-medium text-primary hover:underline text-left flex items-center group"
                        onClick={() => {
                          const currencyCode = conversion.split(" to ")[1];
                          setSelectedCurrency(currencyCode);
                          setBtcAmount("1");
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 mr-2 group-hover:bg-primary transition-colors"></span>
                        {conversion}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-primary/5 border-primary/20">
                <CardContent className="p-8 flex flex-col justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                    <TrendingUp className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Start trading now</h3>
                  <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                    Join thousands of traders on Pexly. Buy and sell Bitcoin securely with over 500 payment methods.
                  </p>
                  <Button size="lg" className="w-full font-bold h-12 rounded-xl" asChild>
                    <Link href="/p2p">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar Column - Price and Stats */}
          <div className="lg:col-span-4 space-y-8">
            {/* Real-time Price Card */}
            <Card className="border-2 border-primary shadow-lg shadow-primary/5 overflow-hidden sticky top-8">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold uppercase tracking-widest opacity-80">Bitcoin Live Price</span>
                  <div className="bg-primary-foreground/20 px-2 py-1 rounded text-[10px] font-black uppercase">Live</div>
                </div>
                <div className="text-4xl font-black mb-2 tracking-tight">
                  {isLoading ? "..." : `${formatPrice(currentPriceInCurrency)}`}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold opacity-90">{selectedCurrency}</span>
                  {!isLoading && (
                    <div className={`px-2 py-1 rounded-md text-sm font-bold bg-white/20 flex items-center gap-1`}>
                      <TrendingUp className={`h-4 w-4 ${priceChange < 0 ? 'rotate-180' : ''}`} />
                      {Math.abs(priceChange).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="p-6">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Price Conversions</h4>
                    <div className="space-y-5">
                      {BTC_DENOMINATIONS.map(({ btc, label }) => {
                        const value = btc * currentPriceInCurrency;
                        return (
                          <div key={label} className="flex justify-between items-center group">
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{label}</span>
                            <span className="text-sm font-black text-foreground">
                              {selectedCurrency} {value.toLocaleString(undefined, { minimumFractionDigits: value < 1 ? 4 : 2, maximumFractionDigits: value < 1 ? 6 : 2 })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-muted/30">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">{selectedCurrency} to BTC</h4>
                    <div className="space-y-5">
                      {FIAT_DENOMINATIONS.map(({ amount, label }) => {
                        const btcValue = amount / currentPriceInCurrency;
                        return (
                          <div key={label} className="flex justify-between items-center group">
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{label} {selectedCurrency}</span>
                            <span className="text-sm font-black text-foreground">{btcValue.toFixed(8)} BTC</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Info */}
            <Card className="bg-muted/50 border-none shadow-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Market Insight</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The current market price of Bitcoin is updated every 3 minutes and is automatically sourced from global exchanges. Prices in other currencies are based on current market exchange rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
