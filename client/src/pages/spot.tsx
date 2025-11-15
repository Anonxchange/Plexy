

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Search,
  ArrowUpDown,
  BookOpen,
  Clock,
  BarChart3,
  Flame,
  Sparkles,
  DollarSign,
  Activity,
} from "lucide-react";
import { getCryptoPrices, type CryptoPrice } from "@/lib/crypto-prices";

export default function Spot() {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>(initialTradingPairs);
  
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = initialTradingPairs.map(pair => pair.symbol);
        const prices = await getCryptoPrices(symbols);
        
        if (prices && Object.keys(prices).length > 0) {
          setTradingPairs(prevPairs => 
            prevPairs.map(pair => {
              const priceData = prices[pair.symbol];
              if (priceData) {
                return {
                  ...pair,
                  price: priceData.current_price,
                  change: priceData.price_change_percentage_24h,
                };
              }
              return pair;
            })
          );
        }
      } catch (error) {
        console.error("Error updating prices:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

interface TradingPair {
  pair: string;
  price: number;
  change: number;
  volume: string;
  high: number;
  low: number;
  favorite: boolean;
  leverage: string;
  symbol: string;
}

const initialTradingPairs: TradingPair[] = [
  { pair: "BTC/USDT", symbol: "BTC", price: 95234.12, change: 2.45, volume: "28.5B", high: 96000, low: 94500, favorite: true, leverage: "10x" },
  { pair: "ETH/USDT", symbol: "ETH", price: 3456.78, change: -1.23, volume: "12.3B", high: 3500, low: 3400, favorite: true, leverage: "10x" },
  { pair: "SOL/USDT", symbol: "SOL", price: 187.45, change: 5.67, volume: "2.8B", high: 190, low: 175, favorite: true, leverage: "10x" },
  { pair: "BNB/USDT", symbol: "BNB", price: 645.32, change: 1.89, volume: "1.5B", high: 650, low: 630, favorite: true, leverage: "10x" },
  { pair: "USDC/USDT", symbol: "USDC", price: 1.00, change: 0.01, volume: "8.2B", high: 1.001, low: 0.999, favorite: false, leverage: "3x" },
  { pair: "XRP/USDT", symbol: "XRP", price: 2.45, change: 3.21, volume: "3.1B", high: 2.5, low: 2.35, favorite: false, leverage: "10x" },
  { pair: "TON/USDT", symbol: "TON", price: 5.23, change: 2.15, volume: "890M", high: 5.3, low: 5.1, favorite: false, leverage: "10x" },
  { pair: "TRX/USDT", symbol: "TRX", price: 0.34, change: -0.45, volume: "1.2B", high: 0.35, low: 0.33, favorite: false, leverage: "10x" },
  { pair: "LTC/USDT", symbol: "LTC", price: 116.75, change: 0.89, volume: "780M", high: 118, low: 115, favorite: false, leverage: "10x" },
];

const orderBook = {
  asks: [
    { price: 122260.50, amount: 0.524, total: 64064.54 },
    { price: 122259.00, amount: 1.243, total: 151964.00 },
    { price: 122258.50, amount: 0.892, total: 109054.58 },
    { price: 122257.00, amount: 2.156, total: 263578.09 },
    { price: 122256.50, amount: 0.673, total: 82258.62 },
  ],
  bids: [
    { price: 122255.50, amount: 1.234, total: 150863.49 },
    { price: 122254.00, amount: 0.756, total: 92424.02 },
    { price: 122253.50, amount: 2.145, total: 262234.01 },
