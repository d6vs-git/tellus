import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/db/connect";

export async function GET(req: NextRequest) {
  let conn;
  try {
    const url = new URL(req.url);
    const userCode = url.searchParams.get('code');

    if (!userCode) {
      return NextResponse.json(
        { message: "Code parameter is required" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    // Get all feedback for this user code
    const [feedbackRows] = await conn.execute(
      `SELECT name, feedback, rating, created_at 
       FROM feedback 
       WHERE code = ? 
       ORDER BY created_at DESC`,
      [userCode]
    ) as any;

    const feedbacks = feedbackRows;

    // Calculate statistics
    const uniqueUsers = new Set(feedbacks.map((f: any) => f.name)).size;
    const totalFeedback = feedbacks.length;
    const averageRating = totalFeedback > 0 
      ? feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / totalFeedback 
      : 0;

    // Simple sentiment analysis (count positive ratings >= 4 as positive sentiment)
    const positiveFeedbackCount = feedbacks.filter((f: any) => f.rating >= 4).length;
    const positivePercentage = totalFeedback > 0 
      ? Math.round((positiveFeedbackCount / totalFeedback) * 100) 
      : 0;

    // Return only the required data
    return NextResponse.json({
      uniqueUsers,
      totalFeedback,
      averageRating: parseFloat(averageRating.toFixed(1)),
      positivePercentage
    });

  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { 
        message: "Failed to fetch dashboard stats",
        error: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch (e) {
        // Ignore errors if connection is already closed
      }
    }
  }
}