export class EmbeddingService {
  private readonly cohereApiKey: string

  constructor() {
    const apiKey = process.env.COHERE_API_KEY
    if (!apiKey) {
      throw new Error("COHERE_API_KEY is not set in environment")
    }
    this.cohereApiKey = apiKey
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty")
    }

    // Limit text length for Cohere API (max 512 tokens roughly = ~2000 characters)
    const trimmedText = text.length > 2000 ? text.substring(0, 2000) + "..." : text

    try {
      const resp = await fetch("https://api.cohere.ai/v1/embed", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.cohereApiKey}`,
          "Content-Type": "application/json",
          "Cohere-Version": "2022-12-06"
        },
        body: JSON.stringify({
          texts: [trimmedText],
          model: "embed-english-v3.0",
          input_type: "search_document",
          embedding_types: ["float"]
        }),
      })

      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`Cohere API error: ${resp.status} ${resp.statusText} - ${errText}`)
      }

      const data = await resp.json()
      
      if (!data.embeddings || !data.embeddings.float || !data.embeddings.float.length) {
        throw new Error("Invalid embedding structure from Cohere API")
      }

      const embedding = data.embeddings.float[0]
      
      // Validate embedding dimensions (Cohere v3.0 should return 1024-dimensional vectors)
      if (!Array.isArray(embedding) || embedding.length !== 1024) {
        throw new Error(`Invalid embedding dimensions: expected 1024, got ${embedding.length}`)
      }

      return embedding
    } catch (error) {
      console.error("Cohere embedding generation failed:", error)
      throw error
    }
  }

  async generateMultipleEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return []
    }

    // Process in batches to avoid rate limits (Cohere allows up to 96 texts per request)
    const batchSize = 50
    const results: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const trimmedBatch = batch.map(text => 
        text.length > 2000 ? text.substring(0, 2000) + "..." : text
      )

      try {
        const resp = await fetch("https://api.cohere.ai/v1/embed", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.cohereApiKey}`,
            "Content-Type": "application/json",
            "Cohere-Version": "2022-12-06"
          },
          body: JSON.stringify({
            texts: trimmedBatch,
            model: "embed-english-v3.0",
            input_type: "search_document",
            embedding_types: ["float"]
          }),
        })

        if (!resp.ok) {
          const errText = await resp.text()
          throw new Error(`Cohere API error: ${resp.status} ${resp.statusText} - ${errText}`)
        }

        const data = await resp.json()
        
        if (data.embeddings?.float) {
          results.push(...data.embeddings.float)
        }
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error)
        // Add empty arrays for failed batch
        results.push(...new Array(batch.length).fill([]))
      }
    }

    return results
  }
}

export const embeddingService = new EmbeddingService()
