
import { useState, useEffect } from "react";
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Bitcoin Price Calculator</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Use Pexly's Bitcoin calculator to find out exactly how much your Bitcoin is worth in any
            of the supported global currencies, using accurate, up-to-date exchange rates. Get real-time
            and historical trends in the BTC value for your selected currency.
          </p>
        </div>

        {/* Current Price Card */}
        <Card className="mb-8 border-2">
          <CardContent className="p-6">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-2">
              Current Bitcoin price in {selectedCurrency} ({POPULAR_CURRENCIES.find(c => c.code === selectedCurrency)?.name})
            </h2>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {isLoading ? (
                  <span>Loading...</span>
                ) : (
                  <span>
                    {formatPrice(currentPriceInCurrency)} {selectedCurrency}
                  </span>
                )}
              </div>
              {!isLoading && (
                <div className={`flex items-center justify-center gap-2 text-lg ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-5 w-5" />
                  <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bitcoin Price History Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">See the chart below for Bitcoin price history.</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={chartInterval === "1m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1m")}
                >
                  1m
                </Button>
                <Button
                  variant={chartInterval === "1h" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1h")}
                >
                  1h
                </Button>
                <Button
                  variant={chartInterval === "1d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1d")}
                >
                  1d
                </Button>
                <Button
                  variant={chartInterval === "1w" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1w")}
                >
                  1w
                </Button>
                <Button
                  variant={chartInterval === "1M" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1M")}
                >
                  1M
                </Button>
                <Button
                  variant={chartInterval === "1y" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartInterval("1y")}
                >
                  1y
                </Button>
              </div>
            </div>

            <div className="h-[400px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                      tickLine={{ stroke: '#9ca3af' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af' }}
                      tickLine={{ stroke: '#9ca3af' }}
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.date}</p>
                              <p className="text-lg font-bold text-primary">
                                ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calculator */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* BTC Input */}
          <Card>
            <CardContent className="p-6">
              <label className="text-sm font-medium mb-3 block">Amount in Bitcoin</label>
              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <Bitcoin className="h-5 w-5" />
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={btcAmount}
                  onChange={(e) => handleBtcChange(e.target.value)}
                  className="pl-14 pr-16 h-14 text-lg font-semibold"
                  step="0.00000001"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="font-semibold">BTC</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fiat Input */}
          <Card>
            <CardContent className="p-6">
              <label className="text-sm font-medium mb-3 block">Amount in selected currency</label>
              <div className="relative mb-4">
                <Input
                  type="number"
                  placeholder="0"
                  value={fiatAmount}
                  onChange={(e) => handleFiatChange(e.target.value)}
                  className="pr-32 h-14 text-lg font-semibold"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="w-24 h-10 font-semibold border-2">
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

              {/* Quick Currency Selection */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_CURRENCIES.slice(0, 6).map((currency) => (
                  <Button
                    key={currency.code}
                    variant={selectedCurrency === currency.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCurrency(currency.code)}
                    className="text-xs"
                  >
                    {currency.code}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Conversions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Popular currency conversions</h2>
            <div className="grid grid-cols-2 gap-4">
              {POPULAR_CONVERSIONS.map((conversion) => (
                <button
                  key={conversion}
                  className="text-primary hover:underline text-left py-2"
                  onClick={() => {
                    const currencyCode = conversion.split(" to ")[1];
                    setSelectedCurrency(currencyCode);
                    setBtcAmount("1");
                  }}
                >
                  {conversion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Tables */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bitcoin className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-center">Bitcoin price conversions on Pexly</h2>
            </div>
            
            <p className="text-muted-foreground text-sm text-center mb-6">
              The current market price of Bitcoin is updated every 3 minutes and is automatically sourced
              in USD. Bitcoin prices in other currencies are based on their corresponding USD exchange
              rates. Below, you'll also find popular converter value denominations in USD.
            </p>

            {/* BTC to Fiat Table */}
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-4 mb-2 font-semibold">
                <div>BTC</div>
                <div className="text-right">{selectedCurrency}</div>
              </div>
              {BTC_DENOMINATIONS.map(({ btc, label }) => {
                const value = btc * currentPriceInCurrency;
                return (
                  <div key={label} className="grid grid-cols-2 gap-4 py-3 border-t">
                    <div>{label}</div>
                    <div className="text-right font-medium">
                      {formatPrice(value)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fiat to BTC Table */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-2 font-semibold">
                <div>{selectedCurrency}</div>
                <div className="text-right">BTC</div>
              </div>
              {FIAT_DENOMINATIONS.map(({ amount, label }) => {
                const btcValue = amount / currentPriceInCurrency;
                return (
                  <div key={label} className="grid grid-cols-2 gap-4 py-3 border-t">
                    <div>{label}</div>
                    <div className="text-right font-medium">
                      {btcValue.toFixed(8)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <PexlyFooter />
    </div>
  );
}
