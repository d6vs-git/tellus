import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { getConnection } from "@/db/connect";

export async function POST(req: NextRequest) {
  let conn;
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userCode, message, chatHistory = [] } = body;

    if (!userCode || !message) {
      return NextResponse.json(
        { message: "User code and message are required" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    // Verify user access
    const [userRows] = await conn.execute(
      'SELECT id, code FROM users WHERE email = ?',
      [session.user.email]
    ) as any;

    const user = userRows[0];
    if (!user || user.code !== userCode) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // Step 1: Ingest & Index Data - Fetch relevant feedback
    const [feedbackRows] = await conn.execute(
      `SELECT id, name, feedback, rating, created_at, embedding_vec 
       FROM feedback 
       WHERE code = ? 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userCode]
    ) as any;

    const feedbacks = feedbackRows;

    // Step 2: Search Your Data - Semantic search using embeddings
    let relevantFeedbacks = [];
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey && message.trim().length > 3) {
      try {
        // Generate embedding for the query
        const embeddingResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': geminiApiKey
            },
            body: JSON.stringify({
              model: "models/embedding-001",
              content: {
                parts: [{ text: message }]
              }
            })
          }
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.embedding?.values;

          if (queryEmbedding && Array.isArray(queryEmbedding)) {
            // Semantic search through feedbacks
            for (const feedback of feedbacks) {
              if (feedback.embedding_vec) {
                try {
                  const embeddingStr = feedback.embedding_vec.replace(/[\[\]]/g, '');
                  const feedbackEmbedding = embeddingStr.split(',').map(Number);
                  
                  if (feedbackEmbedding.length === queryEmbedding.length) {
                    const similarity = cosineSimilarity(queryEmbedding, feedbackEmbedding);
                    if (similarity > 0.3) {
                      relevantFeedbacks.push({
                        ...feedback,
                        similarity,
                        embedding_vec: undefined // Remove embedding from response
                      });
                    }
                  }
                } catch (e) {
                  // Skip invalid embeddings
                }
              }
            }

            // Sort by similarity and limit results
            relevantFeedbacks.sort((a, b) => b.similarity - a.similarity);
            relevantFeedbacks = relevantFeedbacks.slice(0, 10);
          }
        }
      } catch (embeddingError) {
        console.warn('Semantic search failed, using text search:', embeddingError);
      }
    }

    // Fallback to text search if no semantic results
    if (relevantFeedbacks.length === 0) {
      relevantFeedbacks = feedbacks.filter((f: any) =>
        f.feedback.toLowerCase().includes(message.toLowerCase()) ||
        f.name.toLowerCase().includes(message.toLowerCase())
      ).slice(0, 10);
    }

    // Step 3: Chain LLM Calls - Generate response with context
    const feedbackContext = relevantFeedbacks.length > 0
      ? relevantFeedbacks.map((f: any) => 
          `Rating: ${f.rating}/5 - "${f.feedback}" (by ${f.name})`
        ).join('\n\n')
      : 'No specific feedback matches your query.';

    const prompt = `
You are a helpful AI assistant analyzing customer feedback data. The user is asking about their feedback collection.

**User Query:** "${message}"

**Relevant Feedback Context:**
${feedbackContext}

**Overall Statistics:**

**Chat History:**
${chatHistory.slice(-5).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Please provide a helpful, analytical response that:
1. Answers the user's question directly
2. References specific feedback when relevant
3. Provides insights and patterns from the data
4. Suggests actionable recommendations
5. Maintains a conversational, helpful tone

If the query is a greeting or unrelated to feedback, respond appropriately while gently guiding back to feedback topics.
`;

    // Step 4: Generate AI response
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey!
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "I apologize, but I'm having trouble generating a response right now.";

    // Step 5: Prepare response with potential external tool integrations
    const responseData = {
      message: aiResponse,
      relevantFeedback: relevantFeedbacks.map((f: any) => ({
        id: f.id,
        name: f.name,
        feedback: f.feedback,
        rating: f.rating,
        created_at: f.created_at
      })),
      suggestedActions: generateSuggestedActions(message, relevantFeedbacks),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { 
        message: "Failed to process your message", 
        error: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Helper function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate suggested actions based on query and feedback
function generateSuggestedActions(query: string, feedback: any[]): string[] {
  const actions: string[] = [];
  const queryLower = query.toLowerCase();

  if (queryLower.includes('export') || queryLower.includes('download')) {
    actions.push('EXPORT_CSV');
    actions.push('EXPORT_PDF');
  }

  if (queryLower.includes('contact') || queryLower.includes('follow up')) {
    actions.push('CREATE_FOLLOWUP_TASK');
  }

  if (queryLower.includes('trend') || queryLower.includes('analyze')) {
    actions.push('GENERATE_REPORT');
  }

  if (feedback.some(f => f.rating <= 2)) {
    actions.push('REVIEW_CRITICAL_FEEDBACK');
  }

  if (feedback.some(f => f.rating >= 4)) {
    actions.push('HIGHLIGHT_POSITIVE_FEEDBACK');
  }

  return actions;
}