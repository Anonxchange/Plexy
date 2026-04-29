import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
}

export function Sparkline({ 
  data, 
  color = '#10b981', 
  height = 40,
  strokeWidth = 2 
}: SparklineProps) {
  const formattedData = data.map((value, index) => ({
    value,
    index
  }));

  const isPositive = data.length >= 2 && data[data.length - 1] > data[0];
  const lineColor = color === 'auto' ? (isPositive ? '#10b981' : '#ef4444') : color;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={strokeWidth}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
