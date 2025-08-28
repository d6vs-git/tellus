interface WordCloudProps {
  data: Array<{ text: string; value: number }>;
}

export function WordCloud({ data }: WordCloudProps) {
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));

  return (
    <div className="flex flex-wrap justify-center gap-3 p-4">
      {data.map((word, index) => {
        const size = 14 + ((word.value - minValue) / (maxValue - minValue)) * 30;
        const opacity = 0.6 + ((word.value - minValue) / (maxValue - minValue)) * 0.4;
        
        return (
          <span
            key={index}
            className="inline-block px-3 py-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm transition-all hover:scale-105 hover:shadow-md"
            style={{
              fontSize: `${size}px`,
              opacity: opacity,
              fontWeight: 500 + (word.value * 100)
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}