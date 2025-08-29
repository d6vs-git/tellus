import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/db/connect";

export async function GET(req: NextRequest) {
  let conn;
  try {
    const url = new URL(req.url);
    const userCode = url.searchParams.get("code");
    if (!userCode) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 }
      );
    }
    conn = await getConnection();
    const [feedbackRows] = await conn.execute(
      `SELECT name, feedback, rating, created_at FROM feedback WHERE code = ? ORDER BY created_at DESC`,
      [userCode]
    ) as any;
    const feedbacks = Array.isArray(feedbackRows) ? feedbackRows : [];
    // Defensive checks for stats
    const uniqueUsers = feedbacks.length > 0 ? new Set(feedbacks.map((f: any) => f.name)).size : 0;
    const totalFeedback = feedbacks.length;
    const averageRating = totalFeedback > 0
      ? feedbacks.reduce((sum: number, f: any) => sum + (typeof f.rating === "number" ? f.rating : 0), 0) / totalFeedback
      : 0;
    const positiveFeedbackCount = feedbacks.filter((f: any) => typeof f.rating === "number" && f.rating >= 4).length;
    const positivePercentage = totalFeedback > 0
      ? Math.round((positiveFeedbackCount / totalFeedback) * 100)
      : 0;
    return NextResponse.json({
      uniqueUsers,
      totalFeedback,
      averageRating: parseFloat(averageRating.toFixed(1)),
      positivePercentage,
    });
  } catch (error: any) {
    // No console.log in production; return error response
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {}
    }
  }
}