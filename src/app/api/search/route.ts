// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server"
import { findUserByCode } from "@/db/user"
import { getConnection } from "@/db/connect"
import { embeddingService } from "@/lib/embeddings"

export async function POST(req: NextRequest) {
  try {
    const { query, userCode } = await req.json()

    if (!query?.trim() || !userCode?.trim()) {
      return NextResponse.json({ error: "Query and user code are required" }, { status: 400 })
    }

    const user = await findUserByCode(userCode.trim())
    if (!user) {
      return NextResponse.json({ error: "Invalid user code" }, { status: 404 })
    }

    const conn = await getConnection()
    const trimmedQuery = query.trim()
    
    // Run both searches in parallel
    const [semanticResults, keywordResults] = await Promise.allSettled([
      // SEMANTIC SEARCH - Only return results with >50% relevance
      (async () => {
        try {
          const queryEmbedding = await embeddingService.generateEmbedding(trimmedQuery)
          if (queryEmbedding.length > 0) {
            const embeddingVector = `[${queryEmbedding.join(',')}]`
            
            // Get more results initially to filter down to >50%
            const [rows]: [any[], any] = await conn.execute(
              `SELECT *, 
               (1 - VEC_COSINE_DISTANCE(embedding_vec, ?)) * 100 as relevance_score
               FROM feedback 
               WHERE code = ? AND embedding_vec IS NOT NULL
               ORDER BY relevance_score DESC
               LIMIT 20`, // Get more to filter down
              [embeddingVector, userCode]
            );
            
            // Filter to only include results with >50% relevance
            return Array.isArray(rows) ? rows.filter(item => item.relevance_score > 50) : [];
          }
          return [];
        } catch (error) {
          console.warn("Semantic search failed:", error);
          return [];
        }
      })(),
      
      // KEYWORD SEARCH - Only return results with >50% relevance
      (async () => {
        try {
          const searchQuery = `%${trimmedQuery}%`;
          
          // Get results and score them, then filter client-side
          const [rows]: [any[], any] = await conn.execute(
            `SELECT *,
               CASE 
                 WHEN LOWER(feedback) LIKE LOWER(?) THEN 80
                 WHEN LOWER(name) LIKE LOWER(?) THEN 60
                 ELSE 40
               END as relevance_score
             FROM feedback 
             WHERE code = ? 
               AND (LOWER(feedback) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?))
             ORDER BY created_at DESC
             LIMIT 20`, // Get more to filter down
            [searchQuery, searchQuery, userCode, searchQuery, searchQuery]
          );
          
          // Filter to only include results with >50% relevance
          return Array.isArray(rows) ? rows.filter(item => item.relevance_score > 50) : [];
        } catch (error) {
          console.warn("Keyword search failed:", error);
          return [];
        }
      })()
    ]);

    const semantic = semanticResults.status === 'fulfilled' ? semanticResults.value : [];
    const keyword = keywordResults.status === 'fulfilled' ? keywordResults.value : [];
    
    // Combine and deduplicate results (both should already be >50% relevance)
    const allResults = [...semantic, ...keyword];
    const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    
    // Sort by relevance score (highest first)
    const sortedResults = uniqueResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    return NextResponse.json({
      semanticResults: semantic,
      keywordResults: keyword,
      allResults: sortedResults,
      total: sortedResults.length,
      semanticCount: semantic.length,
      keywordCount: keyword.length,
      query: trimmedQuery
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}