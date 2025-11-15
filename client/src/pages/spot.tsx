

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
  { pair: "BTC/USDT", symbol: "BTC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "ETH/USDT", symbol: "ETH", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "SOL/USDT", symbol: "SOL", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "BNB/USDT", symbol: "BNB", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: true, leverage: "10x" },
  { pair: "USDC/USDT", symbol: "USDC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "3x" },
  { pair: "XRP/USDT", symbol: "XRP", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TON/USDT", symbol: "TON", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "TRX/USDT", symbol: "TRX", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
  { pair: "LTC/USDT", symbol: "LTC", price: 0, change: 0, volume: "0", high: 0, low: 0, favorite: false, leverage: "10x" },
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
