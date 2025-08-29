import { embeddingService } from './embeddings';

export class CohereService {
  async generateEmbedding(text: string): Promise<number[]> {
    return embeddingService.generateEmbedding(text);
  }

  async searchSimilarFeedback(query: string, userCode: string, conn: any, limit: number = 5): Promise<any[]> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Format the vector for TiDB SQL
      const vectorStr = JSON.stringify(queryEmbedding);
      
      // Execute semantic search query
      const [results] = await conn.execute(`
        SELECT id, name, feedback, rating, created_at
        FROM feedback
        WHERE code = ? 
        AND VEC_DISTANCE(embedding_vec, JSON_ARRAY_PACK(?)) < 0.8
        ORDER BY VEC_DISTANCE(embedding_vec, JSON_ARRAY_PACK(?)) ASC
        LIMIT ?
      `, [userCode, vectorStr, vectorStr, limit]) as any;

      return results;
    } catch (error) {
      console.error("Cohere semantic search failed:", error);
      return [];
    }
  }
}

export const cohereService = new CohereService();