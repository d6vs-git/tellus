import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SentimentPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

const sentimentColors = ['#ef4444', '#f59e0b', '#10b981'];

export function SentimentPieChart({ data }: SentimentPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={sentimentColors[index]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value} reviews`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        {data.map((item, index) => (
          <div key={item.name} className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
            <div className="text-lg font-bold" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-xs text-muted-foreground capitalize">{item.name}</div>
            <div className="text-xs font-medium" style={{ color: item.color }}>
              {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}