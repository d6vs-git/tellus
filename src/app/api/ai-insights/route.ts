import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getConnection } from "@/db/connect";
import nodemailer from 'nodemailer';

// Types
interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface FeedbackData {
  id: number;
  name: string;
  feedback: string;
  rating: number;
  created_at: Date;
}

interface VectorSearchResult {
  feedback: string;
  similarity: number;
  rating: number;
  name: string;
}

interface InsightsSummary {
  totalFeedback: number;
  averageRating: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    positivePercentage: number;
  };
  ratingDistribution: Record<number, number>;
}

// Email utility function with better error handling
async function sendEmail(
  to: string,
  subject: string,
  text: string,
  attachments: EmailAttachment[] = []
) {
  try {
    // Validate email configuration
    if (!process.env.SENDER_EMAIL || !process.env.SENDER_PASS) {
      throw new Error('Email configuration missing. Please set SENDER_EMAIL and SENDER_PASS environment variables.');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS,
      },
    });

    // Verify connection
    await transporter.verify();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${text.replace(/\n/g, '<br>')}</div>`,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: att.content
      })),
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Vector search for similar feedback with proper fallback
async function performVectorSearch(
  conn: any, 
  userCode: string, 
  queryText: string, 
  limit = 5
): Promise<VectorSearchResult[]> {
  try {
    // Check if vector search is available
    const [vectorResults] = await conn.execute(`
      SELECT 
        feedback,
        rating,
        name,
        VEC_COSINE_DISTANCE(embedding_vec, ?) as similarity
      FROM feedback 
      WHERE code = ? AND embedding_vec IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ?
    `, [queryText, userCode, limit]) as any;

    return vectorResults.map((row: any) => ({
      feedback: row.feedback,
      similarity: Math.max(0, Math.min(1, 1 - row.similarity)), // Ensure similarity is between 0-1
      rating: row.rating,
      name: row.name
    }));
  } catch (vectorError) {
    console.log('Vector search not available, using text search fallback:', vectorError);
    
    try {
      // Fallback to text search using LIKE pattern matching
      const searchPattern = `%${queryText}%`;
      const [textResults] = await conn.execute(`
        SELECT feedback, rating, name
        FROM feedback 
        WHERE code = ? AND (
          feedback LIKE ? OR 
          name LIKE ?
        )
        ORDER BY 
          CASE 
            WHEN feedback LIKE ? THEN 1 
            WHEN name LIKE ? THEN 2 
            ELSE 3 
          END,
          created_at DESC
        LIMIT ?
      `, [userCode, searchPattern, searchPattern, searchPattern, searchPattern, limit]) as any;

      return textResults.map((row: any) => ({
        feedback: row.feedback,
        similarity: 0.7, // Default similarity for text matches
        rating: row.rating,
        name: row.name
      }));
    } catch (textError) {
      console.error('Text search also failed:', textError);
      return [];
    }
  }
}

// Enhanced AI analysis with better error handling and rate limiting
async function generateEnhancedInsights(
  feedbacks: FeedbackData[],
  summary: InsightsSummary,
  similarFeedback: VectorSearchResult[]
): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.warn("Gemini API key not configured, using basic analysis");
    return generateBasicInsights(summary, feedbacks);
  }

  // Limit feedback texts to prevent token overflow
  const maxFeedbackLength = 4000; // Conservative limit for API
  const feedbackTexts = feedbacks
    .slice(0, 50) // Limit to 50 most recent feedbacks
    .map((f: any) => `Rating: ${f.rating}/5 - ${f.feedback} (by ${f.name})`)
    .join("\n\n")
    .substring(0, maxFeedbackLength); // Truncate if too long

  const initialPrompt = `
You are an expert feedback analyst. Provide a comprehensive analysis of this customer feedback data.

FEEDBACK DATA (${feedbacks.length} total entries):
${feedbackTexts}

STATISTICS:
- Total feedback: ${summary.totalFeedback}
- Average rating: ${summary.averageRating.toFixed(2)}/5
- Rating distribution: ${JSON.stringify(summary.ratingDistribution)}
- Positive sentiment: ${summary.sentiment.positivePercentage}%

${similarFeedback.length > 0 ? `SIMILAR PATTERNS FOUND:
${similarFeedback.map(sf => `- "${sf.feedback}" (${sf.rating}/5, similarity: ${(sf.similarity * 100).toFixed(1)}%)`).join('\n')}` : ''}

Provide analysis in this structure:
## Executive Summary
## Key Strengths
## Critical Issues
## Patterns & Trends
## Actionable Recommendations
## Risk Assessment

Keep the response under 1500 words and focus on actionable insights.
`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

    const initialResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: initialPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1536, // Reduced to prevent overflow
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text().catch(() => 'Unknown error');
      throw new Error(`Gemini API error: ${initialResponse.status} - ${errorText}`);
    }

    const initialData = await initialResponse.json();
    
    if (!initialData.candidates || !initialData.candidates[0] || !initialData.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const initialInsights = initialData.candidates[0].content.parts[0].text;

    // Step 2: Enhanced analysis with follow-up (only if initial analysis was successful)
    const enhancementPrompt = `
Based on this initial analysis:

${initialInsights}

Provide additional strategic insights focusing on:
1. Competitive advantages identified
2. Market positioning implications  
3. Customer retention strategies
4. Product development priorities
5. Communication strategy recommendations

Keep response under 800 words and make it actionable for business decision-making.
`;

    try {
      const enhancementResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: enhancementPrompt }] }],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1024,
            },
          }),
          signal: controller.signal
        }
      );

      if (enhancementResponse.ok) {
        const enhancementData = await enhancementResponse.json();
        if (enhancementData.candidates?.[0]?.content?.parts?.[0]?.text) {
          const strategicInsights = enhancementData.candidates[0].content.parts[0].text;

          return `# Comprehensive Feedback Analysis Report

${initialInsights}

## Strategic Business Insights
${strategicInsights}

---
*Analysis generated using advanced AI with vector similarity matching and multi-step reasoning*`;
        }
      }
    } catch (enhancementError) {
      console.warn('Enhancement step failed, using initial analysis:', enhancementError);
    }

    return `# Comprehensive Feedback Analysis Report

${initialInsights}

---
*Analysis generated using advanced AI reasoning*`;

  } catch (error) {
    console.error("Enhanced AI analysis failed:", error);
    // Fallback to basic analysis
    return generateBasicInsights(summary, feedbacks);
  }
}

function generateBasicInsights(summary: InsightsSummary, feedbacks?: FeedbackData[]): string {
  const topRating = Math.max(...Object.keys(summary.ratingDistribution).map(Number));
  const worstRating = Math.min(...Object.keys(summary.ratingDistribution).map(Number));
  const mostCommonRating = Object.entries(summary.ratingDistribution)
    .reduce((a, b) => summary.ratingDistribution[Number(a[0])] > summary.ratingDistribution[Number(b[0])] ? a : b)[0];

  return `# Feedback Analysis Summary

## Executive Summary
Your feedback analysis reveals **${summary.totalFeedback} total reviews** with an average rating of **${summary.averageRating.toFixed(1)}/5 stars**. **${summary.sentiment.positivePercentage}% of feedback is positive**, indicating ${summary.sentiment.positivePercentage > 70 ? 'strong customer satisfaction' : summary.sentiment.positivePercentage > 50 ? 'moderate satisfaction with room for improvement' : 'significant areas requiring attention'}.

## Key Metrics
- **Positive feedback**: ${summary.sentiment.positive} reviews (${summary.sentiment.positivePercentage}%)
- **Neutral feedback**: ${summary.sentiment.neutral} reviews (${((summary.sentiment.neutral / summary.totalFeedback) * 100).toFixed(1)}%)
- **Negative feedback**: ${summary.sentiment.negative} reviews (${((summary.sentiment.negative / summary.totalFeedback) * 100).toFixed(1)}%)
- **Most common rating**: ${mostCommonRating} stars (${summary.ratingDistribution[Number(mostCommonRating)]} reviews)

## Rating Distribution Analysis
${Object.entries(summary.ratingDistribution)
  .sort(([a], [b]) => Number(b) - Number(a))
  .map(([rating, count]) => `- **${rating} stars**: ${count} reviews (${((count / summary.totalFeedback) * 100).toFixed(1)}%)`)
  .join('\n')}

## Recommendations
${summary.sentiment.positivePercentage > 80 
  ? '- **Maintain Excellence**: Continue current practices that drive high satisfaction\n- **Leverage Success**: Use positive feedback for marketing and testimonials\n- **Monitor Consistency**: Ensure quality remains consistent across all touchpoints'
  : summary.sentiment.positivePercentage > 60
  ? '- **Address Pain Points**: Focus on issues mentioned in neutral and negative feedback\n- **Enhance Strengths**: Build upon what customers already appreciate\n- **Improve Communication**: Keep customers informed about improvements being made'
  : '- **Urgent Action Required**: Prioritize addressing critical issues in negative feedback\n- **Customer Outreach**: Consider reaching out to dissatisfied customers\n- **Process Review**: Conduct comprehensive review of customer journey and pain points'
}

## Next Steps
1. **Deep Dive Analysis**: Review individual feedback comments for specific improvement areas
2. **Action Plan**: Develop targeted improvement strategies based on common themes
3. **Follow-up**: Implement changes and monitor feedback trends over time
4. **Customer Engagement**: Consider direct outreach to customers for detailed insights

*Basic analysis provided. For enhanced AI insights with pattern recognition and strategic recommendations, configure advanced AI services.*`;
}

export async function POST(req: NextRequest) {
  let conn;
  
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle email sending with PDF attachment
      const formData = await req.formData();
      const action = formData.get('action') as string;
      
      if (action === 'send_email') {
        const emailAddress = formData.get('email') as string;
        const subject = formData.get('subject') as string;
        const text = formData.get('text') as string;
        const pdfFile = formData.get('pdf') as File;
        
        // Validate required fields
        if (!emailAddress || !subject || !text || !pdfFile) {
          return NextResponse.json(
            { message: 'Missing required fields: email, subject, text, and pdf are required' }, 
            { status: 400 }
          );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailAddress)) {
          return NextResponse.json(
            { message: 'Invalid email address format' }, 
            { status: 400 }
          );
        }

        // Validate PDF file
        if (pdfFile.type !== 'application/pdf') {
          return NextResponse.json(
            { message: 'Invalid file type. PDF required.' }, 
            { status: 400 }
          );
        }

        // Check file size (limit to 10MB)
        if (pdfFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { message: 'File too large. Maximum size is 10MB.' }, 
            { status: 400 }
          );
        }
        
        try {
          const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
          const filename = pdfFile.name || 'insights-report.pdf';
          
          await sendEmail(emailAddress, subject, text, [
            { filename, content: pdfBuffer }
          ]);
          
          return NextResponse.json({ 
            message: 'Email sent successfully',
            recipient: emailAddress 
          });
        } catch (emailError) {
          console.error('Email sending error:', emailError);
          return NextResponse.json(
            { 
              message: 'Failed to send email',
              error: emailError instanceof Error ? emailError.message : 'Unknown email error'
            }, 
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json({ message: 'Invalid action specified' }, { status: 400 });
    } else {
      // Normal JSON request for insights generation
      // Authentication
      const session = await getServerSession();
      if (!session?.user?.email) {
        return NextResponse.json({ message: "Authentication required" }, { status: 401 });
      }

      const body = await req.json();
      const { 
        userCode, 
        timeframe = "30", 
        searchQuery 
      } = body;

      // Validate required fields
      if (!userCode) {
        return NextResponse.json(
          { message: "User code is required" },
          { status: 400 }
        );
      }

      if (typeof userCode !== 'string' || userCode.trim().length === 0) {
        return NextResponse.json(
          { message: "Invalid user code format" },
          { status: 400 }
        );
      }

      // Validate timeframe
      const timeframeDays = parseInt(timeframe);
      if (isNaN(timeframeDays) || timeframeDays < 1 || timeframeDays > 365) {
        return NextResponse.json(
          { message: "Timeframe must be between 1 and 365 days" },
          { status: 400 }
        );
      }

      // Step 1: Establish database connection
      try {
        conn = await getConnection();
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        return NextResponse.json(
          { message: "Database connection failed" },
          { status: 500 }
        );
      }

      // Verify user access
      try {
        const [userRows] = (await conn.execute(
          "SELECT id, code FROM users WHERE email = ?",
          [session.user.email]
        )) as any;

        const user = userRows?.[0];
        if (!user || user.code !== userCode.trim()) {
          return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }
      } catch (userError) {
        console.error('User verification failed:', userError);
        return NextResponse.json(
          { message: "User verification failed" },
          { status: 500 }
        );
      }

      // Step 2: Calculate date range and fetch feedback
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      let feedbacks: FeedbackData[] = [];
      try {
        const [feedbackRows] = (await conn.execute(
          `SELECT id, name, feedback, rating, created_at 
           FROM feedback 
           WHERE code = ? AND created_at >= ? 
           ORDER BY created_at DESC`,
          [userCode.trim(), startDate]
        )) as any;

        feedbacks = feedbackRows || [];
      } catch (feedbackError) {
        console.error('Feedback fetch failed:', feedbackError);
        return NextResponse.json(
          { message: "Failed to fetch feedback data" },
          { status: 500 }
        );
      }

      if (feedbacks.length === 0) {
        return NextResponse.json({
          insights: "No feedback data available for analysis in the selected timeframe.",
          summary: {
            totalFeedback: 0,
            averageRating: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0, positivePercentage: 0 },
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          visualData: {
            sentimentChart: [
              { name: "Positive", value: 0, color: "#10b981" },
              { name: "Neutral", value: 0, color: "#f59e0b" },
              { name: "Negative", value: 0, color: "#ef4444" }
            ],
            ratingTrends: [],
            wordCloud: [],
          },
          metadata: {
            processedAt: new Date().toISOString(),
            timeframe: `${timeframe} days`,
            searchQuery: searchQuery || null,
          }
        });
      }

      // Calculate basic statistics
      const totalFeedback = feedbacks.length;
      const averageRating = parseFloat(
        (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
      );

      const ratingDistribution = feedbacks.reduce((acc: Record<number, number>, f) => {
        const rating = Math.floor(Math.max(1, Math.min(5, f.rating))); // Ensure rating is 1-5
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
      const neutralCount = feedbacks.filter(f => f.rating === 3).length;
      const negativeCount = feedbacks.filter(f => f.rating <= 2).length;
      const positivePercentage = totalFeedback > 0 ? 
        parseFloat(((positiveCount / totalFeedback) * 100).toFixed(1)) : 0;

      const summary: InsightsSummary = {
        totalFeedback,
        averageRating,
        sentiment: { 
          positive: positiveCount, 
          neutral: neutralCount, 
          negative: negativeCount, 
          positivePercentage 
        },
        ratingDistribution,
      };

      // Step 3: Vector/similarity search if query provided
      let similarFeedback: VectorSearchResult[] = [];
      if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
        try {
          similarFeedback = await performVectorSearch(conn, userCode.trim(), searchQuery.trim(), 5);
        } catch (searchError) {
          console.error("Search failed:", searchError);
          // Continue without search results
        }
      }

      // Step 4: Enhanced AI analysis
      let aiInsights: string;
      try {
        aiInsights = await generateEnhancedInsights(feedbacks, summary, similarFeedback);
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        aiInsights = generateBasicInsights(summary, feedbacks);
      }

      // Generate visual data
      const visualData = {
        sentimentChart: [
          { name: "Positive", value: positiveCount, color: "#10b981" },
          { name: "Neutral", value: neutralCount, color: "#f59e0b" },
          { name: "Negative", value: negativeCount, color: "#ef4444" },
        ],
        ratingTrends: Object.entries(ratingDistribution).map(([rating, count]) => ({
          rating: parseInt(rating),
          count: count as number,
          percentage: totalFeedback > 0 ? 
            parseFloat((((count as number) / totalFeedback) * 100).toFixed(1)) : 0,
        })),
        wordCloud: generateWordCloudData(feedbacks),
      };

      // Step 5: Return comprehensive response
      const response = {
        insights: aiInsights,
        summary,
        visualData,
        searchResults: similarFeedback.length > 0 ? similarFeedback : undefined,
        metadata: {
          processedAt: new Date().toISOString(),
          timeframe: `${timeframe} days`,
          searchQuery: searchQuery || null,
        }
      };

      return NextResponse.json(response);
    }
  } catch (error: any) {
    console.error("AI Insights error:", error);
    
    // Return appropriate error based on error type
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { message: "Request timed out. Please try again." },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      {
        message: "Failed to process request",
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch (error) {
        console.error("Error closing database connection:", error);
      }
    }
  }
}

// Helper function to generate word cloud data from feedback with better text processing
function generateWordCloudData(feedbacks: FeedbackData[]): any[] {
  const words: Record<string, number> = {};
  const stopWords = new Set([
    "the", "and", "is", "in", "it", "to", "for", "with", "on", "at", 
    "this", "that", "was", "were", "are", "am", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "just", "now",
    "but", "or", "if", "while", "when", "where", "why", "how", "what",
    "who", "which", "their", "there", "they", "them", "these", "those",
    "i", "me", "my", "you", "your", "he", "him", "his", "she", "her",
    "we", "us", "our"
  ]);

  feedbacks.forEach((feedback) => {
    const text = feedback.feedback.toLowerCase();
    // Split by whitespace and punctuation
    const tokens = text.split(/[\s\W]+/).filter(token => token.length > 0);
    
    tokens.forEach((word: string) => {
      // Clean word and check if it's valid
      word = word.replace(/[^\w]/g, "").toLowerCase();
      if (word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word)) {
        words[word] = (words[word] || 0) + 1;
      }
    });
  });

  return Object.entries(words)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([text, value]) => ({ text, value }))
    .filter(item => item.value > 1); // Only include words that appear more than once
}