// app/api/search/route.ts - Fixed for standard MySQL without vector search
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { AIService } from "@/lib/ai";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// Cosine similarity function for JavaScript
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
        const { query, limit = 5, userCode } = body;

        if (!query) {
            return NextResponse.json(
                { message: "Query is required" },
                { status: 400 }
            );
        }

        // Verify user has access to this code
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (userCode && user.code !== userCode)) {
            return NextResponse.json(
                { message: "Access denied" },
                { status: 403 }
            );
        }

        // Perform text-based search first (always available)
        const textSearchResults = await prisma.feedback.findMany({
            where: {
                code: user.code,
                OR: [
                    { feedback: { contains: query } },
                    { name: { contains: query } }
                ]
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                feedback: true,
                rating: true,
                createdAt: true,
                code: true
            }
        });

        // Attempt semantic search if embeddings are available
        let vectorSearchResults: any[] = [];
        try {
            // Generate query embedding
            const queryEmbedding = await AIService.generateEmbedding(query);
            // Get all feedbacks for this user
            const allFeedback = await prisma.feedback.findMany({
                where: { code: user.code },
                select: {
                    id: true,
                    name: true,
                    feedback: true,
                    rating: true,
                    createdAt: true,
                    code: true,
                    // embedding is not in Prisma schema, but we will access it dynamically
                }
            });
            // Calculate similarity scores in JavaScript
            const scoredFeedback = allFeedback
                .map(item => {
                    // @ts-ignore: embedding is not in type but exists in DB
                    const embeddingRaw = (item as any).embedding;
                    if (!embeddingRaw) return null;
                    try {
                        const embeddingData = typeof embeddingRaw === 'string' 
                            ? JSON.parse(embeddingRaw)
                            : embeddingRaw;
                        if (!Array.isArray(embeddingData) || embeddingData.length === 0) {
                            return null;
                        }
                        const similarity = cosineSimilarity(queryEmbedding, embeddingData);
                        return {
                            ...item,
                            similarity_score: 1 - similarity // Convert to distance for consistency
                        };
                    } catch (e) {
                        console.warn('Failed to parse embedding for feedback:', item.id);
                        return null;
                    }
                })
                .filter((item): item is any => item !== null && typeof item.similarity_score === 'number' && item.similarity_score < 0.8)
                .sort((a, b) => {
                    if (!a || !b) return 0;
                    return a.similarity_score - b.similarity_score;
                })
                .slice(0, limit);
            vectorSearchResults = scoredFeedback;
        } catch (embeddingError: any) {
            console.warn('Semantic search failed, using text search only:', embeddingError?.message);
        }

        return NextResponse.json({
            vectorSearch: vectorSearchResults,
            textSearch: textSearchResults.map(item => ({
                ...item,
                createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt
            })),
            query,
            totalResults: {
                vector: vectorSearchResults.length,
                text: textSearchResults.length
            }
        });

    } catch (error: any) {
        console.error("Search error:", error);
        return NextResponse.json(
            { message: "Search failed", error: error.message },
            { status: 500 }
        );
    }
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
        const query = url.searchParams.get('q');
        const limit = parseInt(url.searchParams.get('limit') || '10');

        if (!query) {
            return NextResponse.json(
                { message: "Query parameter 'q' is required" },
                { status: 400 }
            );
        }

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

        // Perform combined search by calling POST handler directly
        const fakePostReq = {
            json: async () => ({ query, userCode: user.code, limit })
        } as unknown as NextRequest;
        // @ts-ignore
        const postResult = await POST(fakePostReq);
        const searchData = await postResult.json();
        return NextResponse.json({
            results: [...(searchData.vectorSearch || []), ...(searchData.textSearch || [])],
            query,
            totalResults: (searchData.totalResults?.vector || 0) + (searchData.totalResults?.text || 0)
        });

    } catch (error: any) {
        console.error("Search error:", error);
        return NextResponse.json(
            { message: "Search failed", error: error.message },
            { status: 500 }
        );
    }
}