interface SummaryStatsProps {
  totalFeedback: number;
  averageRating: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    positivePercentage: number;
  };
}

export function SummaryStats({ totalFeedback, averageRating, sentiment }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Feedback */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
        <div className="text-2xl font-bold text-blue-600">{totalFeedback}</div>
        <div className="text-sm text-blue-700 font-medium">Total Reviews</div>
        <div className="text-xs text-blue-600/70 mt-1">All feedback collected</div>
      </div>

      {/* Average Rating */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-600">{averageRating.toFixed(1)}/5</div>
        <div className="text-sm text-green-700 font-medium">Avg Rating</div>
        <div className="text-xs text-green-600/70 mt-1">Overall satisfaction</div>
      </div>

      {/* Positive */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div className="text-2xl font-bold text-green-600">{sentiment.positive}</div>
        <div className="text-sm text-green-700 font-medium">Positive</div>
        <div className="text-xs text-green-600/70 mt-1">4-5 star reviews</div>
      </div>

      {/* Critical */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
        <div className="text-2xl font-bold text-red-600">{sentiment.negative}</div>
        <div className="text-sm text-red-700 font-medium">Critical</div>
        <div className="text-xs text-red-600/70 mt-1">1-2 star reviews</div>
      </div>
    </div>
  );
}