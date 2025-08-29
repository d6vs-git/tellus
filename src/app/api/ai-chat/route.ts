import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/db/connect";
import { cohereService } from "@/lib/cohere";
import { geminiService } from "@/lib/gemini";

// Database schema information for the LLM
const SCHEMA_INFO = `
-- Table: users
-- Description: Stores user account information.
-- Columns: id, username, email, code, created_at, updated_at

-- Table: feedback
-- Description: Stores feedback submissions from users, linked by code.
-- Columns: id, name, feedback, rating, code, user_id, created_at, updated_at, embedding_vec
`;

export async function POST(req: NextRequest) {
  let conn;
  try {
    const body = await req.json();
    const { userCode, message } = body;

    if (!userCode || !message) {
      return NextResponse.json(
        { message: "User code and message are required" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    // Verify user exists with this code
    const [userRows] = await conn.execute(
      'SELECT id, username FROM users WHERE code = ?',
      [userCode]
    ) as any;

    if (!userRows || userRows.length === 0) {
      return NextResponse.json(
        { message: "Invalid user code" },
        { status: 404 }
      );
    }

    // Check if this is a semantic search question
    const isSemanticQuery = message.toLowerCase().includes("similar to") || 
                           message.toLowerCase().includes("like this") || 
                           message.toLowerCase().includes("about");

    let responseData;
    if (isSemanticQuery) {
      responseData = await handleVectorSearch(conn, userCode, message);
    } else {
      responseData = await handleStructuredQuery(conn, userCode, message);
    }

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

async function handleVectorSearch(conn: any, userCode: string, message: string): Promise<any> {
  try {
    // Extract search phrase from message
    let searchPhrase = message;
    if (message.includes("'")) {
      searchPhrase = message.split("'")[1];
    } else if (message.toLowerCase().includes("similar to")) {
      searchPhrase = message.toLowerCase().split("similar to")[1].trim();
    }

    // Perform semantic search
    const similarFeedback = await cohereService.searchSimilarFeedback(searchPhrase, userCode, conn);
    
    // Get analytics for context
    const analytics = await getAnalytics(conn, userCode);
    
    // Generate natural language response
    const aiResponse = await geminiService.generateNaturalResponse(
      userCode, 
      message, 
      similarFeedback, 
      analytics
    );

    return {
      message: aiResponse,
      relevantFeedback: similarFeedback,
      analytics: analytics
    };

  } catch (error) {
    console.error("Vector search handling failed:", error);
    // Natural fallback response
    return {
      message: "I'm having trouble finding similar feedback right now. Could you try asking in a different way?",
      error: "Vector search failed"
    };
  }
}

async function handleStructuredQuery(conn: any, userCode: string, message: string): Promise<any> {
  try {
    // Check if this is a request for a report/analysis
    const isReportRequest = message.toLowerCase().includes("report") || 
                           message.toLowerCase().includes("analyse") || 
                           message.toLowerCase().includes("analyze") ||
                           message.toLowerCase().includes("summary");
    
    // Generate SQL query using Gemini
    const sqlQuery = await geminiService.generateSQLQuery(userCode, message, SCHEMA_INFO);
    
    // Execute the query
    const [results] = await conn.execute(sqlQuery) as any;
    
    // Get analytics for context
    const analytics = await getAnalytics(conn, userCode);
    
    let aiResponse;
    if (isReportRequest) {
      // Generate comprehensive report
      aiResponse = await geminiService.generateReportResponse(userCode, results, analytics);
    } else {
      // Generate natural response
      aiResponse = await geminiService.generateNaturalResponse(userCode, message, results, analytics);
    }

    return {
      message: aiResponse,
      query: sqlQuery, // Keep for debugging but frontend won't show this
      results: results, // Keep for debugging
      analytics: analytics
    };

  } catch (error) {
    console.error("Structured query handling failed:", error);
    // Natural fallback response
    return {
      message: "I encountered an issue processing your request. Could you please try rephrasing your question?",
      error: "Query execution failed"
    };
  }
}

async function getAnalytics(conn: any, userCode: string): Promise<any> {
  const [analytics] = await conn.execute(`
    SELECT 
      COUNT(*) as total,
      AVG(rating) as avgRating,
      COUNT(CASE WHEN rating >= 4 THEN 1 END) as positiveCount,
      COUNT(CASE WHEN rating <= 2 THEN 1 END) as criticalCount
    FROM feedback 
    WHERE code = ?
  `, [userCode]) as any;

  return {
    total: analytics[0]?.total || 0,
    avgRating: analytics[0]?.avgRating ? Number(analytics[0].avgRating).toFixed(1) : "N/A",
    positiveCount: analytics[0]?.positiveCount || 0,
    criticalCount: analytics[0]?.criticalCount || 0
  };
}