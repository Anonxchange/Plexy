import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, ChevronDown, RefreshCw, Calendar, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { getCryptoPrices, convertToNGN, formatPrice } from "@/lib/crypto-prices";
import type { CryptoPrice } from "@/lib/crypto-prices";
import { createClient } from "@/lib/supabase";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { PexlyFooter } from "@/components/pexly-footer";

// ============= HEADER =============
const tabs = ["Assets", "Spot", "Perps & Futures", "Options"];

interface AnalysisHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
}

function AnalysisHeader({ activeTab, onTabChange, onBack }: AnalysisHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground lg:text-xl">Analysis</h1>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ExternalLink className="w-5 h-5 text-foreground" />
        </button>
      </div>
      
      <nav className="flex gap-6 px-4 lg:px-6 lg:gap-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ============= ASSETS OVERVIEW =============
interface AssetsOverviewProps {
  todayPnL: number;
  todayPnLPercent: number;
  historicalPnL: number;
  historicalPnLPercent: number;
  lastUpdated: string;
}

function AssetsOverview({
  todayPnL,
  todayPnLPercent,
  historicalPnL,
  historicalPnLPercent,
  lastUpdated,
}: AssetsOverviewProps) {
  const formatValue = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? formatted : `-${formatted}`;
  };

  const formatPercent = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  return (
    <div className="px-4 py-5 animate-fade-in lg:px-6">
      <button className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors">
        <span>Assets Overview</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1 border-b border-dashed border-muted-foreground/30 pb-1 inline-block">
            Today's P&L (USD)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-semibold ${todayPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatValue(todayPnL)}
            </span>
            <span className={`text-sm ${todayPnLPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
              ({formatPercent(todayPnLPercent)})
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1 border-b border-dashed border-muted-foreground/30 pb-1 inline-block">
            Historical P&L (USD)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-semibold ${historicalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatValue(historicalPnL)}
            </span>
            <span className={`text-sm ${historicalPnLPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
              ({formatPercent(historicalPnLPercent)})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Last updated: {lastUpdated}</span>
        <button className="p-1 hover:bg-secondary rounded transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ============= TIME PERIOD SELECTOR =============
const periods = ["7d", "30d", "60d", "90d", "180d", "Custom"];

interface TimePeriodSelectorProps {
  selected: string;
  onSelect: (period: string) => void;
  lastUpdated?: string;
}

function TimePeriodSelector({ selected, onSelect, lastUpdated }: TimePeriodSelectorProps) {
  return (
    <div className="px-4 py-3 lg:px-6">
      <div className="flex items-center gap-2">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => onSelect(period)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
              selected === period
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {period}
          </button>
        ))}
      </div>
      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
  );
}

// ============= CUMULATIVE PNL CHART =============
interface DataPoint {
  date: string;
  value: number;
}

interface CumulativePnLChartProps {
  data: DataPoint[];
  currentValue: number;
  currentDate: string;
  showDollar: boolean;
  onToggleUnit: (dollar: boolean) => void;
}

function CumulativePnLChart({
  data,
  currentValue,
  currentDate,
  showDollar,
  onToggleUnit,
}: CumulativePnLChartProps) {
  const formatValue = (value: number) => {
    if (showDollar) {
      return value >= 0 ? value.toFixed(2) : `-${Math.abs(value).toFixed(2)}`;
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <div className="px-4 py-4 animate-fade-in lg:px-0 lg:bg-card lg:rounded-xl lg:p-6 lg:border lg:border-border" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Cumulative P&L(USD)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{currentDate}</p>
          <p className={`text-xl font-semibold mt-1 ${currentValue >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatValue(currentValue)}
          </p>
        </div>
        
        <div className="flex items-center bg-secondary rounded-full p-0.5">
          <button
            onClick={() => onToggleUnit(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              showDollar 
                ? "bg-foreground text-background" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            $
          </button>
          <button
            onClick={() => onToggleUnit(false)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              !showDollar 
                ? "bg-foreground text-background" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            %
          </button>
        </div>
      </div>

      <div className="h-48 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
              tickFormatter={(value) => value}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatValue(value), 'P&L']}
            />
            <ReferenceLine y={0} stroke="hsl(220, 13%, 91%)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============= DAILY PNL CALENDAR =============
interface DayData {
  day: number;
  pnl: number | null;
}

interface DailyPnLCalendarProps {
  month: string;
  year: number;
  monthPnL: number;
  monthROI: number;
  days: DayData[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

function DailyPnLCalendar({
  month,
  year,
  monthPnL,
  monthROI,
  days,
  onPrevMonth,
  onNextMonth,
}: DailyPnLCalendarProps) {
  const formatPnL = (value: number) => {
    if (value === 0) return "0.00";
    return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  const firstDayOffset = new Date(year, parseInt(month) - 1, 1).getDay();
  
  return (
    <div className="px-4 py-4 animate-fade-in lg:px-0 lg:bg-card lg:rounded-xl lg:p-6 lg:border lg:border-border" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground border-b border-dashed border-muted-foreground/30 pb-1">
          Daily P&L(USD)
        </h3>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-secondary rounded-full hover:bg-muted transition-colors">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button onClick={onPrevMonth} className="p-1 hover:bg-secondary rounded transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">{year}-{month}</span>
        <button onClick={onNextMonth} className="p-1 hover:bg-secondary rounded transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex gap-4">
          <span className="text-muted-foreground">{month} PnL(USD)</span>
          <span className="text-muted-foreground">ROI</span>
        </div>
        <div className="flex gap-4">
          <span className={monthPnL >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {formatPnL(monthPnL)}
          </span>
          <span className={monthROI >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {monthROI >= 0 ? "+" : ""}{monthROI.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {days.map((dayData) => (
          <div
            key={dayData.day}
            className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
              dayData.pnl === null
                ? "bg-transparent"
                : dayData.pnl > 0
                ? "bg-green-500/30 text-green-600 dark:text-green-400"
                : dayData.pnl < 0
                ? "bg-red-500/30 text-red-600 dark:text-red-400"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            <span className="font-medium">{dayData.day}</span>
            {dayData.pnl !== null && (
              <span className="text-[9px] mt-0.5 opacity-90">
                {dayData.pnl > 0 ? "+" : ""}{dayData.pnl.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= ASSET TREND CHART =============
interface AssetTrendChartProps {
  data: DataPoint[];
  currentValue: number;
  currentDate: string;
}

function AssetTrendChart({ data, currentValue, currentDate }: AssetTrendChartProps) {
  return (
    <div className="px-4 py-4 animate-fade-in lg:px-0 lg:bg-card lg:rounded-xl lg:p-6 lg:border lg:border-border" style={{ animationDelay: "0.3s" }}>
      <h3 className="text-base font-semibold text-foreground mb-1">Total asset trend(USD)</h3>
      <p className="text-xs text-muted-foreground">{currentDate}</p>
      <p className="text-xl font-semibold text-foreground mt-1">{currentValue.toFixed(2)}</p>

      <div className="h-40 mt-4 lg:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(25, 95%, 53%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAsset)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============= ASSET DISTRIBUTION =============
interface Asset {
  name: string;
  value: number;
  color: string;
}

interface AssetDistributionProps {
  assets: Asset[];
  totalValue: number;
  lastUpdated: string;
  showDollar: boolean;
  onToggleUnit: (dollar: boolean) => void;
}

function AssetDistribution({
  assets,
  totalValue,
  lastUpdated,
  showDollar,
  onToggleUnit,
}: AssetDistributionProps) {
  return (
    <div className="px-4 py-4 animate-fade-in lg:px-0 lg:bg-card lg:rounded-xl lg:p-6 lg:border lg:border-border" style={{ animationDelay: "0.4s" }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-semibold text-foreground">Asset distribution</h3>
          <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
        
        <div className="flex items-center bg-secondary rounded-full p-0.5">
          <button
            onClick={() => onToggleUnit(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              showDollar 
                ? "bg-foreground text-background" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            $
          </button>
          <button
            onClick={() => onToggleUnit(false)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              !showDollar 
                ? "bg-foreground text-background" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            %
          </button>
        </div>
      </div>

      <div className="relative h-52 flex items-center justify-center lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assets}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {assets.map((asset, index) => (
                <Cell key={`cell-${index}`} fill={asset.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total Assets (USD)</span>
          <span className="text-2xl font-semibold text-foreground">{totalValue.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 mt-2">
        {assets.map((asset) => (
          <div key={asset.name} className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: asset.color }} 
            />
            <span className="text-sm text-foreground">{asset.name}</span>
            <span className="text-sm text-muted-foreground">
              {showDollar ? `${asset.value.toFixed(2)}USD` : `${((asset.value / totalValue) * 100).toFixed(0)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= DISCLAIMER =============
function Disclaimer() {
  return (
    <div className="px-4 py-6 border-t border-border mt-4 lg:px-6 lg:max-w-3xl lg:mx-auto lg:text-center">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Today's P&L and asset breakdown are real-time. Other data includes values up to the previous day only.
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
        Due to data complexity, delays or minor discrepancies may occur. All data is for reference only.
      </p>
    </div>
  );
}

// ============= MOCK DATA =============
const cumulativePnLData = [
  { date: "10-01", value: 40.80 },
  { date: "10-15", value: 40.80 },
  { date: "11-01", value: 40.80 },
  { date: "11-15", value: 35.00 },
  { date: "12-01", value: -79.28 },
  { date: "12-07", value: -180.00 },
  { date: "12-10", value: -199.36 },
  { date: "12-15", value: -319.44 },
  { date: "12-19", value: -384.09 },
];

const assetTrendData = [
  { date: "10-01", value: 0.00 },
  { date: "10-15", value: 0.00 },
  { date: "11-01", value: 0.00 },
  { date: "11-15", value: 0.00 },
  { date: "12-01", value: 0.95 },
  { date: "12-05", value: 0.20 },
  { date: "12-10", value: 0.15 },
  { date: "12-15", value: 0.12 },
  { date: "12-19", value: 0.10 },
];

const dailyPnLData = [
  { day: 1, pnl: -0.13 },
  { day: 2, pnl: -1.70 },
  { day: 3, pnl: -0.22 },
  { day: 4, pnl: 0.00 },
  { day: 5, pnl: 6.32 },
  { day: 6, pnl: -0.15 },
  { day: 7, pnl: -8.83 },
  { day: 8, pnl: -91.94 },
  { day: 9, pnl: -16.33 },
  { day: 10, pnl: 0.14 },
  { day: 11, pnl: -42.78 },
  { day: 12, pnl: 10.90 },
  { day: 13, pnl: -2.51 },
  { day: 14, pnl: 0.30 },
  { day: 15, pnl: 6.77 },
  { day: 16, pnl: -5.15 },
  { day: 17, pnl: 3.86 },
  { day: 18, pnl: 9.71 },
  { day: 19, pnl: -8.50 },
  { day: 20, pnl: null },
  { day: 21, pnl: null },
  { day: 22, pnl: null },
  { day: 23, pnl: null },
  { day: 24, pnl: null },
  { day: 25, pnl: null },
  { day: 26, pnl: null },
  { day: 27, pnl: null },
  { day: 28, pnl: null },
  { day: 29, pnl: null },
  { day: 30, pnl: null },
  { day: 31, pnl: null },
];

const assetDistribution = [
  { name: "BTC", value: 0.08, color: "hsl(142, 71%, 45%)" },
  { name: "BNB", value: 0.01, color: "hsl(25, 95%, 53%)" },
];

// ============= MAIN PAGE =============
export default function Analysis() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Assets");
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [showPnLDollar, setShowPnLDollar] = useState(true);
  const [showDistributionDollar, setShowDistributionDollar] = useState(true);
  const [currentMonth, setCurrentMonth] = useState({ month: "12", year: 2025 });
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [totalPnLPercentage, setTotalPnLPercentage] = useState(0);

  const handlePrevMonth = () => {
    if (currentMonth.month === "01") {
      setCurrentMonth({ month: "12", year: currentMonth.year - 1 });
    } else {
      setCurrentMonth({ 
        month: String(parseInt(currentMonth.month) - 1).padStart(2, "0"), 
        year: currentMonth.year 
      });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth.month === "12") {
      setCurrentMonth({ month: "01", year: currentMonth.year + 1 });
    } else {
      setCurrentMonth({ 
        month: String(parseInt(currentMonth.month) + 1).padStart(2, "0"), 
        year: currentMonth.year 
      });
    }
  };

  const handleBack = () => {
    setLocation("/wallet");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <AnalysisHeader activeTab={activeTab} onTabChange={setActiveTab} onBack={handleBack} />
          
          <main className="pb-8">
            <AssetsOverview
              todayPnL={totalPnL}
              todayPnLPercent={totalPnLPercentage}
              historicalPnL={-384.09}
              historicalPnLPercent={-1.35}
              lastUpdated={new Date().toLocaleString()}
            />

            <TimePeriodSelector
              selected={selectedPeriod}
              onSelect={setSelectedPeriod}
              lastUpdated={new Date().toLocaleString()}
            />

            <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-4">
              <CumulativePnLChart
                data={cumulativePnLData}
                currentValue={totalPnL}
                currentDate={new Date().toLocaleDateString()}
                showDollar={showPnLDollar}
                onToggleUnit={setShowPnLDollar}
              />

              <DailyPnLCalendar
                month={currentMonth.month}
                year={currentMonth.year}
                monthPnL={-140.25}
                monthROI={-0.71}
                days={dailyPnLData}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>

            <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-4">
              <AssetTrendChart
                data={assetTrendData}
                currentValue={totalBalance}
                currentDate={new Date().toLocaleDateString()}
              />

              <AssetDistribution
                assets={assetDistribution}
                totalValue={totalBalance}
                lastUpdated={new Date().toLocaleString()}
                showDollar={showDistributionDollar}
                onToggleUnit={setShowDistributionDollar}
              />
            </div>

            <Disclaimer />
          </main>
        </div>
      </div>
      <PexlyFooter />
    </div>
  );
}
