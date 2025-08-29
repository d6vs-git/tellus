import { getConnection } from "@/db/connect";

async function populateEmbeddings() {
  let conn;
  try {
    conn = await getConnection();
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set');
      return;
    }

    // Get feedback without embeddings
    const [feedbackRows] = await conn.execute(`
      SELECT id, feedback 
      FROM feedback 
      WHERE embedding_vec IS NULL 
      ORDER BY created_at DESC
      LIMIT 100
    `) as any;

    console.log(`Found ${feedbackRows.length} feedback entries without embeddings`);

    for (const row of feedbackRows) {
      try {
        console.log(`Processing feedback ID: ${row.id}`);
        
        // Generate embedding
        const embeddingResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': geminiApiKey
            },
            body: JSON.stringify({
              model: "models/embedding-001",
              content: {
                parts: [{ text: row.feedback }]
              }
            })
          }
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.embedding?.values;

          if (embedding && Array.isArray(embedding)) {
            // Update the feedback with embedding
            await conn.execute(`
              UPDATE feedback 
              SET embedding_vec = ? 
              WHERE id = ?
            `, [JSON.stringify(embedding), row.id]);
            
            console.log(`✓ Updated embedding for feedback ID: ${row.id}`);
          } else {
            console.warn(`✗ No embedding returned for feedback ID: ${row.id}`);
          }
        } else {
          console.error(`✗ Embedding API error for feedback ID: ${row.id}:`, await embeddingResponse.text());
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing feedback ID ${row.id}:`, error);
        continue;
      }
    }

    console.log('Embedding population completed');

  } catch (error) {
    console.error('Failed to populate embeddings:', error);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Alternative: Update your feedback creation API to include embedding generation
export async function createFeedbackWithEmbedding(feedbackData: any) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let embedding = null;

  if (geminiApiKey && feedbackData.feedback) {
    try {
      const embeddingResponse = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            model: "models/embedding-001",
            content: {
              parts: [{ text: feedbackData.feedback }]
            }
          })
        }
      );

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        embedding = embeddingData.embedding?.values;
      }
    } catch (error) {
      console.warn('Failed to generate embedding:', error);
    }
  }

  return {
    ...feedbackData,
    embedding_vec: embedding ? JSON.stringify(embedding) : null
  };
}

// For checking embedding dimensions in your database
export async function checkEmbeddingDimensions(userCode: string) {
  let conn;
  try {
    conn = await getConnection();
    
    const [results] = await conn.execute(`
      SELECT 
        id,
        CHAR_LENGTH(embedding_vec) as embedding_length,
        (CHAR_LENGTH(embedding_vec) - CHAR_LENGTH(REPLACE(embedding_vec, ',', ''))) + 1 as estimated_dimensions
      FROM feedback 
      WHERE code = ? AND embedding_vec IS NOT NULL
      LIMIT 10
    `, [userCode]) as any;

    console.log('Embedding dimensions check:');
    results.forEach((row: any) => {
      console.log(`ID: ${row.id}, Length: ${row.embedding_length}, Est. Dimensions: ${row.estimated_dimensions}`);
    });

  } catch (error) {
    console.error('Failed to check dimensions:', error);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  populateEmbeddings();
}