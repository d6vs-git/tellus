import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RatingBarChartProps {
  data: Array<{ rating: number; count: number; percentage: number }>;
}

const ratingColors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'];

export function RatingBarChart({ data }: RatingBarChartProps) {
  const chartData = data.map(item => ({
    rating: `${item.rating}★`,
    count: item.count,
    percentage: item.percentage,
    fullRating: item.rating
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} reviews`, '']}
            labelFormatter={(label) => `Rating: ${label}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={ratingColors[entry.fullRating - 1]}
                strokeWidth={2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-5 gap-2 text-center">
        {data.map((item) => (
          <div key={item.rating} className="p-2 rounded-lg bg-muted/50">
            <div className="text-lg font-bold text-foreground">{item.count}</div>
            <div className="text-xs text-muted-foreground">{item.rating}★</div>
            <div className="text-xs font-medium text-foreground/70">
              {Number.isFinite(item.percentage) ? item.percentage : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}