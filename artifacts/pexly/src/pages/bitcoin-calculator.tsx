
import { useHead } from "@unhead/react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw } from "lucide-react";
import { FaBitcoin } from "react-icons/fa";
import { PexlyFooter } from "@/components/pexly-footer";
import { getCryptoPrices, getExchangeRates, formatPrice } from "@/lib/crypto-prices";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const CHART_INTERVALS = [
  { key: "1h", label: "1H" },
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "1y", label: "1Y" },
];

export function BitcoinCalculator() {
  useHead({ title: "Bitcoin Calculator | Pexly", meta: [{ name: "description", content: "Convert Bitcoin to fiat or other cryptocurrencies using live exchange rates." }] });
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
    const fetchChartData = async () => {
      try {
        const days =
          chartInterval === "1h" ? 1 :
          chartInterval === "1d" ? 1 :
          chartInterval === "1w" ? 7 :
          chartInterval === "1m" ? 30 : 365;

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();

        if (data.prices) {
          const formattedData = data.prices.map((item: [number, number]) => ({
            date: new Date(item[0]).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            price: item[1],
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
    const interval = setInterval(fetchPrices, 30000);
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
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">

        {/* Page Header */}
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            <span className="w-6 h-px bg-primary" />
            Live Converter
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Bitcoin Price Calculator
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Convert Bitcoin to any currency using real-time exchange rates. Prices update every 30 seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          {/* ── Left Column ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Calculator Card */}
            <Card className="border border-border shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center">
                    <FaBitcoin className="h-5 w-5 text-[#F7931A]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base">BTC Converter</h2>
                    <p className="text-xs text-muted-foreground">Live rates · Updates every 30s</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    Live
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bitcoin amount
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                        <FaBitcoin className="h-4 w-4 text-[#F7931A]" />
                        <span className="text-xs font-bold text-muted-foreground">BTC</span>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00000000"
                        value={btcAmount}
                        onChange={(e) => handleBtcChange(e.target.value)}
                        className="pl-16 h-14 text-lg font-semibold"
                        step="0.00000001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {selectedCurrency} amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={fiatAmount}
                        onChange={(e) => handleFiatChange(e.target.value)}
                        className="pr-36 h-14 text-lg font-semibold"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                          <SelectTrigger className="w-28 h-10 font-semibold border-border">
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

                {/* Quick Select */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2.5">Quick select currency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CURRENCIES.slice(0, 8).map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => setSelectedCurrency(currency.code)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                          selectedCurrency === currency.code
                            ? "border-primary text-primary bg-primary/8"
                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        {currency.code}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart Card */}
            <Card className="border border-border shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-semibold text-base">Price History</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      BTC / {selectedCurrency} · Market data
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-border p-1 w-fit">
                    {CHART_INTERVALS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setChartInterval(key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          chartInterval === key
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[380px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a3e635" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#a3e635" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickLine={false}
                          axisLine={false}
                          domain={["auto", "auto"]}
                          tickFormatter={(value) =>
                            `${selectedCurrency} ${(value / 1000).toFixed(0)}k`
                          }
                          dx={-8}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#a3e635"
                          strokeWidth={2}
                          fill="url(#colorPrice)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#a3e635", strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary" />
                      <p className="text-sm text-muted-foreground">Loading chart…</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Row */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Popular Conversions */}
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-sm mb-4 pb-3 border-b border-border">
                    Popular conversions
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {POPULAR_CONVERSIONS.map((conversion) => (
                      <button
                        key={conversion}
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-1.5 group"
                        onClick={() => {
                          const currencyCode = conversion.split(" to ")[1];
                          setSelectedCurrency(currencyCode);
                          setBtcAmount("1");
                        }}
                      >
                        <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors shrink-0" />
                        {conversion}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Card — dark, no lime background */}
              <Card className="border border-border shadow-sm bg-foreground text-background dark:bg-foreground dark:text-background overflow-hidden">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-10 h-10 rounded-lg border border-background/20 flex items-center justify-center mb-5">
                      <TrendingUp className="h-5 w-5 text-background/80" />
                    </div>
                    <h3 className="text-lg font-bold text-background mb-2">Start trading now</h3>
                    <p className="text-sm text-background/60 leading-relaxed mb-6">
                      Join thousands of traders on Pexly. Buy and sell Bitcoin with 500+ payment methods worldwide.
                    </p>
                  </div>
                  <Button
                    size="default"
                    className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 border-0 gap-2"
                    asChild
                  >
                    <Link href="/p2p">
                      Browse offers
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Live Price Card — clean, no full green bg */}
            <Card className="border border-border shadow-sm overflow-hidden sticky top-8">
              {/* Thin accent top stripe */}
              <div className="h-0.5 w-full bg-primary" />
              <CardContent className="p-6">

                {/* Header row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Bitcoin live price
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30 rounded px-1.5 py-0.5">
                    Live
                  </span>
                </div>

                {/* Price */}
                <div className="mt-4 mb-1">
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {isLoading ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatPrice(currentPriceInCurrency)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedCurrency}</p>
                </div>

                {/* 24h change badge */}
                {!isLoading && (
                  <div
                    className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {isPositive ? "+" : ""}
                    {priceChange.toFixed(2)}% · 24h
                  </div>
                )}

                <div className="border-t border-border mt-6 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    BTC → {selectedCurrency}
                  </p>
                  <div className="space-y-3.5">
                    {BTC_DENOMINATIONS.map(({ btc, label }) => {
                      const value = btc * currentPriceInCurrency;
                      return (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-semibold tabular-nums">
                            {selectedCurrency}{" "}
                            {value.toLocaleString(undefined, {
                              minimumFractionDigits: value < 1 ? 4 : 2,
                              maximumFractionDigits: value < 1 ? 6 : 2,
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border mt-5 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    {selectedCurrency} → BTC
                  </p>
                  <div className="space-y-3.5">
                    {FIAT_DENOMINATIONS.map(({ amount, label }) => {
                      const btcValue = amount / currentPriceInCurrency;
                      return (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {label} {selectedCurrency}
                          </span>
                          <span className="text-sm font-semibold tabular-nums">
                            {btcValue.toFixed(8)} BTC
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Insight */}
            <Card className="border border-border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Market data</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Prices are sourced from global exchanges and updated every 30 seconds. Currency rates reflect current forex markets.
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
