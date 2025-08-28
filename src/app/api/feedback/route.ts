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
    const body: FeedbackRequestBody = await req.json()
    const { name, feedback, rating, code } = body

    // Enhanced logging for debugging
    console.log("Received feedback submission:", {
      name: name?.slice(0, 20) + "...",
      feedbackLength: feedback?.length,
      rating,
      code,
      codeType: typeof code,
      codeLength: code?.toString().length
    })

    // Input validation
    if (!name?.trim() || !feedback?.trim() || !rating || !code?.trim()) {
      console.log("Missing fields validation failed:", {
        hasName: !!name?.trim(),
        hasFeedback: !!feedback?.trim(),
        hasRating: !!rating,
        hasCode: !!code?.trim()
      })
      return NextResponse.json(
        { message: "Missing required fields. Please provide name, feedback, rating, and code." },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { message: "Name must be between 2 and 100 characters long." },
        { status: 400 }
      )
    }

    // Validate feedback length
    if (feedback.trim().length < 10 || feedback.trim().length > 5000) {
      return NextResponse.json(
        { message: "Feedback must be between 10 and 5000 characters long." },
        { status: 400 }
      )
    }

    // Validate rating
    const numRating = parseFloat(rating.toString())
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || numRating % 1 !== 0) {
      return NextResponse.json(
        { message: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      )
    }

    // Relaxed code validation - accept any non-empty string
    const trimmedCode = code.toString().trim()
    if (!trimmedCode) {
      return NextResponse.json(
        { message: "Code cannot be empty." },
        { status: 400 }
      )
    }

    // Verify user exists
    console.log("Looking for user with code:", trimmedCode)
    const user = await findUserByCode(trimmedCode)
    if (!user) {
      console.log("User not found for code:", trimmedCode)
      return NextResponse.json(
        { message: "Invalid code. Please check your code and try again." },
        { status: 404 }
      )
    }

    console.log("User found:", { id: user.id, code: user.code })

    // Generate embedding with retry logic
    let embedding: number[] = []
    let embeddingAttempts = 0
    const maxEmbeddingAttempts = 3

    while (embeddingAttempts < maxEmbeddingAttempts && embedding.length === 0) {
      try {
        embeddingAttempts++
        embedding = await embeddingService.generateEmbedding(feedback.trim())
        break
      } catch (err) {
        console.warn(`Embedding generation attempt ${embeddingAttempts} failed:`, err)
        if (embeddingAttempts === maxEmbeddingAttempts) {
          console.error("All embedding generation attempts failed, proceeding without embedding")
        } else {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    // Create feedback record
    const feedbackId = await createFeedback({
      name: name.trim(),
      feedback: feedback.trim(),
      rating: numRating,
      code: user.code,
      user_id: user.id,
      embedding: embedding.length > 0 ? embedding : undefined
    })

    // Log successful submission
    console.log(`Feedback submitted successfully: ID ${feedbackId}, User: ${user.code}, Rating: ${numRating}, Embedding: ${embedding.length > 0 ? 'generated' : 'failed'}`)

    return NextResponse.json(
      {
        message: "Thank you for your feedback! It has been submitted successfully.",
        feedback: {
          id: feedbackId,
          name: name.trim(),
          feedback: feedback.trim(),
          rating: numRating,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Feedback submission error:", error)
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: "Duplicate feedback detected. Please try again." },
        { status: 409 }
      )
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        message: "Failed to submit feedback. Please try again later.",
        error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}


export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    // Enhanced logging for debugging
    console.log("Received feedback fetch request:", {
      code,
      codeType: typeof code,
      codeLength: code?.toString().length
    })

    // Input validation
    if (!code?.trim()) {
      console.log("Missing code parameter")
      return NextResponse.json(
        { message: "Code parameter is required" },
        { status: 400 }
      )
    }

    // Verify user exists
    console.log("Looking for user with code:", code)
    const user = await findUserByCode(code.trim())
    if (!user) {
      console.log("User not found for code:", code)
      return NextResponse.json(
        { message: "Invalid code" },
        { status: 404 }
      )
    }

    console.log("User found, fetching feedback for code:", user.code)

    // Fetch feedback for this user code
    const feedbacks = await getFeedbacksByCode(user.code)

    // Transform the data to match the frontend expectations
    const transformedFeedbacks = feedbacks.map(feedback => ({
      id: feedback.id,
      name: feedback.name,
      feedback: feedback.feedback,
      rating: feedback.rating,
      createdAt: feedback.created_at,
      // Include other fields if needed
    }))

    console.log(`Found ${transformedFeedbacks.length} feedback entries for code: ${user.code}`)

    return NextResponse.json(transformedFeedbacks)

  } catch (error: any) {
    console.error("Feedback fetch error:", error)
    
    // Handle specific database errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { message: "Database connection error" },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        message: "Failed to fetch feedback",
        error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
