// app/api/feedback/route.ts - Fixed for standard MySQL
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { AIService } from "@/lib/ai";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, feedback, rating, code } = body;

        if (!name || !feedback || !rating || !code) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate rating
        const numRating = parseFloat(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return NextResponse.json(
                { message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Check if user exists with the given code
        const user = await prisma.user.findUnique({
            where: { code: code as string }
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid code" },
                { status: 404 }
            );
        }

        // Generate embedding for the feedback text (store as JSON string)
        let embeddingData: string;
        try {
            const embedding = await AIService.generateEmbedding(feedback);
            embeddingData = JSON.stringify(embedding);
        } catch (error) {
            console.warn('Failed to generate embedding, using fallback:', error);
            // Fallback: store empty array as JSON
            embeddingData = JSON.stringify([]);
        }

        // Create the feedback entry
        const feedbackEntry = await prisma.feedback.create({
            data: {
                name,
                feedback,
                rating: numRating,
                code: user.code,
                // Store embedding as JSON string since MySQL doesn't have native vector support
                // We'll need to update the Prisma schema to use String instead of Unsupported
                embedding: embeddingData as any,
            }
        });

        return NextResponse.json(
            { 
                message: "Feedback submitted successfully", 
                feedback: {
                    id: feedbackEntry.id,
                    name: feedbackEntry.name,
                    feedback: feedbackEntry.feedback,
                    rating: feedbackEntry.rating,
                    createdAt: feedbackEntry.createdAt.toISOString()
                }
            },
            { status: 201 }
        );
    } catch (e: any) {
        const errorMessage = e && e.message ? e.message : "Unknown error";
        console.error("Feedback submission error:", errorMessage);

        // Handle Prisma errors
        if (e.code === 'P2002') {
            return NextResponse.json(
                { message: "Duplicate feedback submission" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: "Failed to submit feedback", error: errorMessage },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { message: "Code parameter is required" },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { code }
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid code" },
                { status: 404 }
            );
        }

        // Get all feedback for this user
        const feedbacks = await prisma.feedback.findMany({
            where: { code },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                feedback: true,
                rating: true,
                createdAt: true,
                updatedAt: true
                // Don't select embedding in general queries
            }
        });

        // Format response
        const formattedFeedbacks = feedbacks.map(fb => ({
            ...fb,
            createdAt: fb.createdAt.toISOString(),
            updatedAt: fb.updatedAt.toISOString()
        }));

        return NextResponse.json(formattedFeedbacks);
    } catch (e: any) {
        const errorMessage = e?.message || "Unknown error";
        console.error("Failed to get feedback:", errorMessage);

        return NextResponse.json(
            { message: "Failed to get feedback", error: errorMessage },
            { status: 500 }
        );
    }
}