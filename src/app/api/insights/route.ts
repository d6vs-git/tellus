// app/api/insights/route.ts - Fixed for standard MySQL
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { AIService } from "@/lib/ai";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// Simple keyword-based sentiment analysis
function analyzeSentiment(text: string): { positive: boolean; negative: boolean; neutral: boolean } {
    const positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic',
        'wonderful', 'outstanding', 'brilliant', 'superb', 'pleased', 'satisfied', 'happy',
        'impressed', 'recommend', 'quality', 'fast', 'professional', 'helpful'
    ];
    
    const negativeWords = [
        'bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing',
        'slow', 'expensive', 'rude', 'unprofessional', 'broken', 'difficult', 'problem',
        'issue', 'wrong', 'failed', 'error', 'disappointed', 'frustrated', 'angry'
    ];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => 
        count + (lowerText.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
        count + (lowerText.split(word).length - 1), 0);

    if (positiveCount > negativeCount) return { positive: true, negative: false, neutral: false };
    if (negativeCount > positiveCount) return { positive: false, negative: true, neutral: false };
    return { positive: false, negative: false, neutral: true };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const userCode = url.searchParams.get('code');
        const timeframe = url.searchParams.get('timeframe') || '30'; // days

        // Verify user access
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (userCode && user.code !== userCode)) {
            return NextResponse.json(
                { message: "Access denied" },
                { status: 403 }
            );
        }

        // Calculate date range
        const daysAgo = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Fetch feedback data
        const feedbacks = await prisma.feedback.findMany({
            where: {
                code: user.code,
                createdAt: {
                    gte: startDate
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                feedback: true,
                rating: true,
                createdAt: true
            }
        });

        if (feedbacks.length === 0) {
            return NextResponse.json({
                insights: "No feedback data available for the selected timeframe.",
                summary: {
                    totalFeedback: 0,
                    averageRating: 0,
                    ratingDistribution: {},
                    sentiment: {
                        positive: 0,
                        neutral: 0,
                        negative: 0,
                        positivePercentage: 0
                    },
                    trends: {
                        recent_average: 0,
                        improving: false,
                        declining: false
                    },
                    timeframe: `${timeframe} days`
                }
            });
        }

        // Generate AI insights
        let aiInsights: string;
        try {
            aiInsights = await AIService.generateInsights(feedbacks);
        } catch (error) {
            console.warn('AI insights generation failed, using fallback');
            aiInsights = "Unable to generate AI insights at this time. Please see summary statistics below.";
        }

        // Calculate summary statistics
        const totalFeedback = feedbacks.length;
        const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
        
        const ratingDistribution = feedbacks.reduce((acc, f) => {
            const rating = Math.floor(f.rating);
            acc[rating] = (acc[rating] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Enhanced sentiment analysis using both ratings and text
        let positiveCount = 0;
        let neutralCount = 0;
        let negativeCount = 0;

        feedbacks.forEach(feedback => {
            const textSentiment = analyzeSentiment(feedback.feedback);
            const ratingBased = feedback.rating >= 4 ? 'positive' : 
                               feedback.rating === 3 ? 'neutral' : 'negative';
            
            // Combine text sentiment with rating-based sentiment
            if (textSentiment.positive || ratingBased === 'positive') {
                positiveCount++;
            } else if (textSentiment.negative || ratingBased === 'negative') {
                negativeCount++;
            } else {
                neutralCount++;
            }
        });

        // Trend analysis
        const recentFeedbacks = feedbacks.slice(0, Math.min(10, feedbacks.length));
        const olderFeedbacks = feedbacks.slice(10, Math.min(20, feedbacks.length));
        
        const recentAverage = recentFeedbacks.length > 0 
            ? recentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / recentFeedbacks.length
            : averageRating;
        
        const olderAverage = olderFeedbacks.length > 0
            ? olderFeedbacks.reduce((sum, f) => sum + f.rating, 0) / olderFeedbacks.length
            : averageRating;

        const trends = {
            recent_average: parseFloat(recentAverage.toFixed(2)),
            improving: recentAverage > olderAverage + 0.2,
            declining: recentAverage < olderAverage - 0.2
        };

        // Top feedback examples
        const topFeedback = {
            highest: feedbacks
                .filter(f => f.rating === 5)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3),
            lowest: feedbacks
                .filter(f => f.rating <= 2)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
        };

        return NextResponse.json({
            insights: aiInsights,
            summary: {
                totalFeedback,
                averageRating: parseFloat(averageRating.toFixed(2)),
                ratingDistribution,
                sentiment: {
                    positive: positiveCount,
                    neutral: neutralCount,
                    negative: negativeCount,
                    positivePercentage: parseFloat(((positiveCount / totalFeedback) * 100).toFixed(1))
                },
                trends,
                timeframe: `${timeframe} days`
            },
            topFeedback: {
                highest: topFeedback.highest.map(f => ({
                    ...f,
                    createdAt: f.createdAt.toISOString()
                })),
                lowest: topFeedback.lowest.map(f => ({
                    ...f,
                    createdAt: f.createdAt.toISOString()
                }))
            }
        });

    } catch (error: any) {
        console.error("Insights generation error:", error);
        return NextResponse.json(
            { message: "Failed to generate insights", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { userCode, customQuery, timeframe = '30' } = body;

        // Verify user access
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (userCode && user.code !== userCode)) {
            return NextResponse.json(
                { message: "Access denied" },
                { status: 403 }
            );
        }

        // Calculate date range
        const daysAgo = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        let feedbacks;

        if (customQuery) {
            // For custom queries, do text-based filtering first
            const allFeedbacks = await prisma.feedback.findMany({
                where: {
                    code: user.code,
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    feedback: true,
                    rating: true,
                    createdAt: true,
                    embedding: true
                }
            });

            // Filter by text relevance
            const textFilteredFeedbacks = allFeedbacks.filter(f => 
                f.feedback.toLowerCase().includes(customQuery.toLowerCase()) ||
                f.name.toLowerCase().includes(customQuery.toLowerCase())
            );

            // If we have embeddings, try semantic search
            try {
                const queryEmbedding = await AIService.generateEmbedding(customQuery);
                const semanticResults = [];

                for (const feedback of allFeedbacks) {
                    if (feedback.embedding) {
                        try {
                            const embeddingData = JSON.parse(feedback.embedding);
                            if (Array.isArray(embeddingData) && embeddingData.length > 0) {
                                const similarity = cosineSimilarity(queryEmbedding, embeddingData);
                                if (similarity > 0.3) { // Threshold for relevance
                                    semanticResults.push({
                                        ...feedback,
                                        similarity,
                                        embedding: undefined
                                    });
                                }
                            }
                        } catch (e) {
                            // Skip invalid embeddings
                        }
                    }
                }

                // Combine results, prioritizing semantic matches
                const combinedResults = new Map();
                semanticResults.forEach(item => combinedResults.set(item.id, item));
                textFilteredFeedbacks.forEach(item => {
                    if (!combinedResults.has(item.id)) {
                        combinedResults.set(item.id, { ...item, embedding: undefined });
                    }
                });

                feedbacks = Array.from(combinedResults.values())
                    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
                    .slice(0, 20);

            } catch (embeddingError) {
                const err = embeddingError as Error;
                console.warn('Semantic search failed, using text search:', err.message);
                feedbacks = textFilteredFeedbacks.slice(0, 20);
            }
        } else {
            feedbacks = await prisma.feedback.findMany({
                where: {
                    code: user.code,
                    createdAt: { gte: startDate }
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    feedback: true,
                    rating: true,
                    createdAt: true
                }
            });
        }

        if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
            return NextResponse.json({
                insights: customQuery 
                    ? `No feedback found related to "${customQuery}" in the selected timeframe.`
                    : "No feedback data available for the selected timeframe.",
                customQuery,
                relevantFeedback: [],
                totalAnalyzed: 0
            });
        }

        // Generate focused insights
        let aiInsights: string;
        try {
            const contextualFeedbacks = customQuery
                ? feedbacks.map(f => ({ ...f, feedback: `[Query: ${customQuery}] ${f.feedback}` }))
                : feedbacks;

            aiInsights = await AIService.generateInsights(contextualFeedbacks);
        } catch (error) {
            console.warn('AI insights generation failed, using fallback');

            // Ensure totalFeedback is in scope
            const totalFeedback = feedbacks.length;
            if (customQuery) {
                const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
                const positiveCount = feedbacks.filter(f => f.rating >= 4).length;

                aiInsights = `Analysis for "${customQuery}":

Found ${feedbacks.length} relevant feedback entries.
Average rating: ${avgRating.toFixed(1)}/5.0
Positive feedback: ${positiveCount} (${((positiveCount/feedbacks.length) * 100).toFixed(1)}%)

This represents ${((feedbacks.length/totalFeedback) * 100).toFixed(1)}% of all feedback in the selected timeframe.`;
            } else {
                aiInsights = "Standard analysis completed. See summary statistics for detailed breakdown.";
            }
        }

        return NextResponse.json({
            insights: aiInsights,
            customQuery,
            relevantFeedback: feedbacks.slice(0, 5).map(f => ({
                ...f,
                createdAt: f.createdAt?.toISOString() || new Date().toISOString(),
                embedding: undefined
            })),
            totalAnalyzed: feedbacks.length
        });

    } catch (error: any) {
        console.error("Custom insights error:", error);
        return NextResponse.json(
            { message: "Failed to generate custom insights", error: error.message },
            { status: 500 }
        );
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