export class GeminiService {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment");
    }
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey,
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
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I couldn't generate a response at this time.";
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw error;
    }
  }

  async generateSQLQuery(userCode: string, question: string, schemaInfo: string): Promise<string> {
    const prompt = `
You are an expert at converting natural language questions into precise SQL queries for a TiDB database.
You must ONLY use the following tables and columns. Never make up columns that don't exist.

### Database Schema:
${schemaInfo}

### The Most Important Rule:
- EVERY query against the \`feedback\` table MUST include a filter on the \`code\` column.
- The current user's code is: ${userCode}
- Therefore, you MUST always include \`WHERE code = '${userCode}'\` (or a JOIN using this code).
- This is non-negotiable. If the question doesn't specify a code, use the one provided above.

### How to handle different questions:
1. For questions about ratings, counts, or dates: Use normal SQL WHERE clauses.
2. Always use LIMIT 10 unless otherwise specified.

Only generate SELECT queries. You are forbidden from generating INSERT, UPDATE, DELETE, or DROP statements.

### Question:
${question}

### SQL Query:
`;

    try {
      const sqlQuery = await this.generateResponse(prompt);
      // Clean up the response to extract just the SQL
      return sqlQuery.replace(/```sql|```/g, '').trim();
    } catch (error) {
      console.error("Failed to generate SQL query:", error);
      throw error;
    }
  }

  async generateNaturalResponse(userCode: string, message: string, results: any, analytics: any): Promise<string> {
    const prompt = `
You are a friendly, helpful feedback analysis assistant. You're talking to a user who has provided feedback using code ${userCode}.

The user asked: "${message}"

Here's the data you found:
${JSON.stringify(results, null, 2)}

Here's some analytics context:
- Total feedback: ${analytics.total}
- Average rating: ${analytics.avgRating}
- Positive feedback (4-5 stars): ${analytics.positiveCount}
- Critical feedback (1-2 stars): ${analytics.criticalCount}

Please provide a natural, conversational response that:
1. Answers the question directly and helpfully
2. Does NOT mention codes, IDs, or technical database details
3. Sounds like a real person talking, not a report
4. Focuses on insights and actionable information
5. If appropriate, suggests follow-up questions or actions

Write your response as if you're having a friendly conversation:
`;
    try {
      const response = await this.generateResponse(prompt);
      return response;
    } catch (error) {
      console.error("Failed to generate natural response:", error);
      return "I've analyzed your feedback data. Could you please rephrase your question?";
    }
  }

  async generateReportResponse(userCode: string, results: any, analytics: any): Promise<string> {
    const prompt = `
You are a helpful feedback analysis assistant. Generate a comprehensive but conversational report based on the following data.

Data for analysis:
${JSON.stringify(results, null, 2)}

Analytics context:
- Total feedback entries: ${analytics.total}
- Average rating: ${analytics.avgRating}
- Positive feedback (4-5 stars): ${analytics.positiveCount}
- Critical feedback (1-2 stars): ${analytics.criticalCount}

Please create a report that:
1. Is comprehensive but doesn't sound like a technical document
2. Highlights key trends, patterns, and insights
3. Provides actionable recommendations
4. Uses a friendly, conversational tone
5. Does NOT mention codes, IDs, or technical database details
6. Structures the response with clear sections but without markdown formatting

Write the report as if you're explaining it to someone in a meeting:
`;
    try {
      const response = await this.generateResponse(prompt);
      return response;
    } catch (error) {
      console.error("Failed to generate report response:", error);
      return "I've prepared an analysis of your feedback data. Overall, you've received a mix of positive and constructive feedback that provides good insights for improvement.";
    }
  }
}

export const geminiService = new GeminiService();