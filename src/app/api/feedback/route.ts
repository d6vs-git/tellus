import { NextRequest, NextResponse } from "next/server"
import { findUserByCode } from "@/db/user"
import { createFeedback, getFeedbacksByCode } from "@/db/feedback"
import { embeddingService } from "@/lib/embeddings"

interface FeedbackRequestBody {
  name: string
  feedback: string
  rating: number | string
  code: string
}

interface FeedbackResponse {
  message: string
  feedback?: {
    id: number
    name: string
    feedback: string
    rating: number
    createdAt: string
  }
  error?: string
}


export async function POST(req: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {

    const body: FeedbackRequestBody = await req.json();
    const { name, feedback, rating, code } = body;

    // Input validation
    if (!name?.trim() || !feedback?.trim() || !rating) {
      return NextResponse.json(
        { message: "Missing required fields. Please provide name, feedback, and rating." },
        { status: 400 }
      );
    }
    
    const trimmedName = name.trim();
    const trimmedFeedback = feedback.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        { message: "Name must be between 2 and 100 characters long." },
        { status: 400 }
      );
    }
    
    if (trimmedFeedback.length < 10 || trimmedFeedback.length > 5000) {
      return NextResponse.json(
        { message: "Feedback must be between 10 and 5000 characters long." },
        { status: 400 }
      );
    }
    
    const numRating = parseFloat(rating.toString());
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || numRating % 1 !== 0) {
      return NextResponse.json(
        { message: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    // userCode is optional
    let user = null;
    let userId = null;
    let userCodeValue = null;
    if (code && code.toString().trim()) {
      user = await findUserByCode(code.toString().trim());
      if (user) {
        userId = user.id;
        userCodeValue = user.code;
      }
    }

    // Generate embedding (non-blocking, fire and forget)
    let embedding: number[] = [];
    try {
      // Don't await this to avoid blocking the response
      embeddingService.generateEmbedding(trimmedFeedback)
        .then((embeddingResult) => {
          if (embeddingResult && embeddingResult.length > 0) {
            // Update the feedback with embedding in the background
            // This would require an additional function in your DB module
            // updateFeedbackEmbedding(feedbackId, embeddingResult);
          }
        })
        .catch((err) => {
          console.error("Failed to generate embedding:", err);
          // Non-critical error, just log it
        });
    } catch (err) {
      console.error("Error setting up embedding generation:", err);
      // Non-critical error, continue without embedding
    }

    // Create feedback record
    const feedbackId = await createFeedback({
      name: trimmedName,
      feedback: trimmedFeedback,
      rating: numRating,
      code: userCodeValue ?? "",
      user_id: userId ?? "",
      // Don't include embedding in initial create to avoid blocking
    });

    return NextResponse.json(
      {
        message: "Thank you for your feedback! It has been submitted successfully.",
        feedback: {
          id: feedbackId,
          name: trimmedName,
          feedback: trimmedFeedback,
          rating: numRating,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    
    // Handle specific database errors
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Duplicate feedback detected. Please try again." },
        { status: 409 }
      );
    }
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        message: "Failed to submit feedback. Please try again later.",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code?.trim()) {
      return NextResponse.json(
        { message: "Code parameter is required" },
        { status: 400 }
      );
    }
    
    const user = await findUserByCode(code.trim());
    if (!user) {
      return NextResponse.json(
        { message: "Invalid code" },
        { status: 404 }
      );
    }
    
    const feedbacks = await getFeedbacksByCode(user.code);
    const transformedFeedbacks = feedbacks.map((feedback) => ({
      id: feedback.id.toString(),
      name: feedback.name,
      feedback: feedback.feedback,
      rating: feedback.rating,
      createdAt: feedback.created_at.toISOString(),
    }));
    
    // Set cache headers for GET requests (5 minutes)
    return NextResponse.json(transformedFeedbacks, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59',
      },
    });
  } catch (error: any) {
    console.error("Feedback fetch error:", error);
    
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      return NextResponse.json(
        { message: "Database connection error" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        message: "Failed to fetch feedback",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}