import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getConnection } from "@/db/connect";

export async function POST(req: NextRequest) {
  let conn;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userCode, timeframe = "30" } = body;

    if (!userCode) {
      return NextResponse.json(
        { message: "User code is required" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    // Verify user access
    const [userRows] = (await conn.execute(
      "SELECT id, code FROM users WHERE email = ?",
      [session.user.email]
    )) as any;

    const user = userRows[0];
    if (!user || user.code !== userCode) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Calculate date range
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch feedback data with ratings
    const [feedbackRows] = (await conn.execute(
      `SELECT name, feedback, rating, created_at 
       FROM feedback 
       WHERE code = ? AND created_at >= ? 
       ORDER BY created_at DESC`,
      [userCode, startDate]
    )) as any;

    const feedbacks = feedbackRows;

    if (feedbacks.length === 0) {
      return NextResponse.json({
        insights:
          "No feedback data available for analysis in the selected timeframe.",
        summary: {
          totalFeedback: 0,
          averageRating: 0,
          sentiment: {
            positive: 0,
            neutral: 0,
            negative: 0,
            positivePercentage: 0,
          },
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        visualData: {
          sentimentChart: [],
          ratingTrends: [],
          wordCloud: [],
        },
      });
    }

    // Calculate basic statistics
    const totalFeedback = feedbacks.length;
    const averageRating = parseFloat(
      (
        feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) /
        totalFeedback
      ).toFixed(2)
    );

    const ratingDistribution = feedbacks.reduce(
      (acc: Record<number, number>, f: any) => {
        const rating = Math.floor(f.rating);
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    );

    // Sentiment analysis
    const positiveCount = feedbacks.filter((f: any) => f.rating >= 4).length;
    const neutralCount = feedbacks.filter((f: any) => f.rating === 3).length;
    const negativeCount = feedbacks.filter((f: any) => f.rating <= 2).length;
    const positivePercentage = parseFloat(
      ((positiveCount / totalFeedback) * 100).toFixed(1)
    );

    // Prepare data for Gemini AI
    const feedbackTexts = feedbacks
      .map((f: any) => `Rating: ${f.rating}/5 - ${f.feedback} (by ${f.name})`)
      .join("\n\n");

    // Generate AI insights using Gemini with robust error handling
    const geminiApiKey = process.env.GEMINI_API_KEY;
    let aiInsights = "";
    try {
      if (!geminiApiKey) {
        throw new Error("Gemini API key not configured");
      }
      // Update the prompt to get better structured output
      const prompt = `
You are an expert feedback analyst. Analyze the following customer feedback data and provide a structured analysis in MARKDOWN format with these exact sections:

# Comprehensive Feedback Analysis

## 📊 Executive Summary
[Brief overview of overall sentiment and key findings]

## 🌟 Strengths & Positive Feedback
[What users love about the platform - list specific features and compliments]

## 🎯 Areas for Improvement  
[Specific issues and pain points mentioned by users - be concrete]

## 📈 Trends & Patterns
[Noticable patterns in feedback timing, user behavior, or specific features]

## 💡 Actionable Recommendations
[Specific, practical suggestions for improvement - use bullet points]

## 😊 Customer Sentiment Overview
[Summary of emotional tone and overall satisfaction]

Feedback Data:
${feedbackTexts}

Total feedback: ${totalFeedback}
Average rating: ${averageRating}/5
Rating distribution: ${JSON.stringify(ratingDistribution)}

Provide clear, specific, and actionable insights. Use emojis in section headers for better readability.
`;

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${geminiResponse.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const geminiData = await geminiResponse.json();
      if (
        !geminiData.candidates ||
        !geminiData.candidates[0]?.content?.parts?.[0]?.text
      ) {
        throw new Error("Invalid response format from Gemini API");
      }
      aiInsights = geminiData.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API call failed:", error);
      // Provide fallback insights instead of failing completely
      aiInsights = `## AI Analysis Summary\n\n**Overall Sentiment**: ${positivePercentage}% positive feedback\n**Average Rating**: ${averageRating}/5 stars\n**Total Reviews**: ${totalFeedback}\n\n**Key Observations**:\n- ${positiveCount} positive reviews (4-5 stars)\n- ${neutralCount} neutral reviews (3 stars)  \n- ${negativeCount} critical reviews (1-2 stars)\n\n**Recommendation**: Consider collecting more detailed feedback to enable deeper analysis.`;
    }

    // Generate visual data suggestions
    const visualData = {
      sentimentChart: [
        { name: "Positive", value: positiveCount, color: "#10b981" },
        { name: "Neutral", value: neutralCount, color: "#f59e0b" },
        { name: "Negative", value: negativeCount, color: "#ef4444" },
      ],
      ratingTrends: Object.entries(ratingDistribution).map(
        ([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: parseFloat(
            (((count as number) / totalFeedback) * 100).toFixed(1)
          ),
        })
      ),
      wordCloud: generateWordCloudData(feedbacks),
    };

    return NextResponse.json({
      insights: aiInsights,
      summary: {
        totalFeedback,
        averageRating,
        sentiment: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
          positivePercentage,
        },
        ratingDistribution,
      },
      visualData,
    });
  } catch (error: any) {
    console.error("AI Insights generation error:", error);
    return NextResponse.json(
      {
        message: "Failed to generate AI insights",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Helper function to generate word cloud data from feedback
function generateWordCloudData(feedbacks: any[]): any[] {
  const words: Record<string, number> = {};
  const stopWords = new Set([
    "the",
    "and",
    "is",
    "in",
    "it",
    "to",
    "for",
    "with",
    "on",
    "at",
    "this",
    "that",
    "was",
    "were",
    "are",
    "am",
    "be",
    "been",
    "being",
  ]);

  feedbacks.forEach((feedback: any) => {
    const text = feedback.feedback.toLowerCase();
    text.split(/\s+/).forEach((word: string) => {
      word = word.replace(/[^\w]/g, "");
      if (word.length > 3 && !stopWords.has(word)) {
        words[word] = (words[word] || 0) + 1;
      }
    });
  });

  return Object.entries(words)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([text, value]) => ({ text, value }));
}
