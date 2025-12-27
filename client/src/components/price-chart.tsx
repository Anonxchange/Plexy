import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

const generateChartData = () => {
  const data = [];
  const startDate = new Date("2024-12-29");
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulated Bitcoin and Ethereum performance data
    const btcBase = Math.sin(i / 30) * 20 + Math.random() * 15 - 5;
    const ethBase = Math.sin(i / 25) * 25 + Math.random() * 20 - 10;
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      bitcoin: btcBase + (i > 180 ? -10 : 10),
      ethereum: ethBase + (i > 180 ? -15 : 5),
    });
  }
  
  return data;
};

const chartData = generateChartData();

export const PriceChart = () => {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Chart</h2>
        <Button variant="outline" size="sm" className="rounded-full text-xs px-4">
          1Y
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-1">
          <span className="text-sm font-medium text-foreground">Bitcoin</span>
          <span className="text-sm text-red-500">-7.439%</span>
        </div>
        <div className="flex items-center gap-4 mb-1">
          <span className="text-sm font-medium text-foreground">Ethereum</span>
          <span className="text-sm text-red-500">-12.391%</span>
        </div>
        <span className="text-sm text-muted-foreground">December 20, 2025</span>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value, index) => {
                if (index === 0) return "December 29, 2024";
                if (index === Math.floor(chartData.length / 2)) return "June 29, 2025";
                return "";
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `${value > 0 ? "+" : ""}${value}%`}
              domain={[-40, 60]}
              ticks={[-40, -20, 0, 20, 40, 60]}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="bitcoin" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="ethereum" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
