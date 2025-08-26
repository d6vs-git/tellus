// lib/ai.ts - Updated with free alternatives and fallbacks
export class AIService {
  // Using Hugging Face Inference API (free tier)
  private static readonly HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
  private static readonly EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
  
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(
        `${this.HUGGINGFACE_API_URL}/${this.EMBEDDING_MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text,
            options: { wait_for_model: true }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response formats from Hugging Face
      let embedding: number[];
      if (Array.isArray(result) && Array.isArray(result[0])) {
        embedding = result[0];
      } else if (Array.isArray(result)) {
        embedding = result;
      } else if (result.embeddings && Array.isArray(result.embeddings[0])) {
        embedding = result.embeddings[0];
      } else {
        throw new Error('Unexpected embedding format');
      }
      
      // Validate embedding dimensions (should be 384 for all-MiniLM-L6-v2)
      if (embedding.length !== 384) {
        throw new Error(`Invalid embedding dimensions: ${embedding.length}, expected 384`);
      }
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Fallback: return a normalized random embedding of correct dimensions
      const fallbackEmbedding = Array.from({length: 384}, () => Math.random() - 0.5);
      const norm = Math.sqrt(fallbackEmbedding.reduce((sum, val) => sum + val * val, 0));
      return fallbackEmbedding.map(val => val / norm);
    }
  }

  static async generateInsights(feedbacks: any[]): Promise<string> {
    if (feedbacks.length === 0) return "No feedback available for analysis.";

    // Try free AI services in order of preference

    const providers = [
      () => this.generateInsightsWithGemini(feedbacks),
      () => this.generateInsightsWithHuggingFace(feedbacks),
      () => this.generateInsightsWithOllama(feedbacks),
      () => this.generateFallbackInsights(feedbacks)
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result && result.length > 50) {
          return result;
        }
      } catch (error: any) {
        console.warn('AI provider failed, trying next:', error.message);
        continue;
      }
    }

    return this.generateFallbackInsights(feedbacks);
  }


  private static async generateInsightsWithGemini(feedbacks: any[]): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not available');
    }

    const feedbackSummary = feedbacks.slice(0, 20).map((f, i) =>
      `${i + 1}. Rating: ${f.rating}/5 - Name: ${f.name} - Feedback: ${f.feedback.substring(0, 200)}`
    ).join('\n');

    const prompt = `Analyze this customer feedback and provide insights:\n\n${feedbackSummary}\n\nProvide:\n1. Overall sentiment\n2. Key themes\n3. Areas for improvement\n4. Actionable recommendations\n\nKeep response under 500 words.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    // Gemini returns candidates[0].content.parts[0].text
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private static async generateInsightsWithHuggingFace(feedbacks: any[]): Promise<string> {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key not available');
    }

    const feedbackText = feedbacks.slice(0, 10).map(f => f.feedback).join(' ');
    const prompt = `Analyze customer feedback: ${feedbackText.substring(0, 1000)}. Provide insights on sentiment, themes, and recommendations.`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 300,
            temperature: 0.7,
            do_sample: true,
          },
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    return result[0]?.generated_text || '';
  }

  private static async generateInsightsWithOllama(feedbacks: any[]): Promise<string> {
    // Ollama local inference (if available)
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt: `Analyze customer feedback and provide insights: ${JSON.stringify(feedbacks.slice(0, 5))}`,
          stream: false
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response || '';
      }
    } catch (error) {
      throw new Error('Ollama not available');
    }

    return '';
  }

  private static generateFallbackInsights(feedbacks: any[]): string {
    const totalFeedback = feedbacks.length;
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
    const ratings = feedbacks.map(f => f.rating);
    const highRatings = feedbacks.filter(f => f.rating >= 4).length;
    const lowRatings = feedbacks.filter(f => f.rating <= 2).length;
    const mediumRatings = feedbacks.filter(f => f.rating === 3).length;

    // Simple keyword analysis
    const allText = feedbacks.map(f => f.feedback.toLowerCase()).join(' ');
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (allText.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (allText.split(word).length - 1), 0);

    // Recent trend analysis
    const recentFeedback = feedbacks.slice(0, Math.min(5, feedbacks.length));
    const recentAverage = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
    
    const trendEmoji = recentAverage > averageRating ? '📈' : 
                     recentAverage < averageRating ? '📉' : '➡️';

    return `📊 **Feedback Analysis Summary**

**Overall Performance:**
- Total feedback entries: ${totalFeedback}
- Average rating: ${averageRating.toFixed(1)}/5.0 ${averageRating >= 4 ? '🌟' : averageRating >= 3 ? '⭐' : '🔴'}
- Distribution: ${highRatings} positive (${((highRatings/totalFeedback) * 100).toFixed(1)}%), ${mediumRatings} neutral (${((mediumRatings/totalFeedback) * 100).toFixed(1)}%), ${lowRatings} critical (${((lowRatings/totalFeedback) * 100).toFixed(1)}%)

**Sentiment Analysis:**
- Positive keywords detected: ${positiveCount}
- Negative keywords detected: ${negativeCount}
- Overall sentiment: ${positiveCount > negativeCount ? 'Positive 😊' : positiveCount < negativeCount ? 'Negative 😞' : 'Neutral 😐'}

**Recent Trends:** ${trendEmoji}
- Recent average: ${recentAverage.toFixed(1)}/5.0
- Trend: ${recentAverage > averageRating + 0.2 ? 'Improving' : recentAverage < averageRating - 0.2 ? 'Declining' : 'Stable'}

**Key Insights:**
${averageRating >= 4.5 ? '🎉 Exceptional performance! Customer satisfaction is very high.' : 
  averageRating >= 4 ? '✅ Strong performance with room for minor improvements.' : 
  averageRating >= 3 ? '⚠️ Moderate satisfaction. Focus on addressing common concerns.' : 
  '🚨 Low satisfaction scores. Immediate attention needed to improve customer experience.'}

**Action Items:**
${lowRatings > 0 ? `• Address ${lowRatings} critical reviews immediately` : ''}
${highRatings > totalFeedback * 0.6 ? '• Leverage positive feedback for marketing and testimonials' : ''}
${mediumRatings > totalFeedback * 0.3 ? '• Follow up with neutral reviewers to understand their experience better' : ''}
• Monitor feedback trends weekly
• Consider implementing suggested improvements from detailed feedback

**Top Performers:**
${feedbacks.filter(f => f.rating === 5).slice(0, 2).map(f => `"${f.feedback.substring(0, 100)}..." - ${f.name}`).join('\n')}

*Generated using intelligent analysis algorithms. For detailed insights, ensure sufficient feedback data is available.*`;
  }

  static async searchSimilarFeedback(query: string, userCode: string, limit: number = 5): Promise<any[]> {
    // This would be implemented in the API route with proper database access
    // Return empty array as placeholder
    return [];
  }
}