import mysql from 'mysql2/promise'
import { CreateFeedbackData, Feedback } from '@/lib/types'
import { getConnection } from './connect'

export async function createFeedback(feedbackData: CreateFeedbackData): Promise<number> {
  const conn = await getConnection()
  
  // Convert embedding array to TiDB VECTOR format
  const embeddingVector = feedbackData.embedding && feedbackData.embedding.length > 0 
    ? `[${feedbackData.embedding.join(',')}]` 
    : null
  
  const [result] = await conn.execute(
    `INSERT INTO feedback (name, feedback, rating, code, user_id, created_at, updated_at, embedding_vec) 
     VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
    [
      feedbackData.name,
      feedbackData.feedback,
      feedbackData.rating,
      feedbackData.code,
      feedbackData.user_id,
      embeddingVector
    ]
  ) as [mysql.ResultSetHeader, mysql.FieldPacket[]]
  
  return result.insertId
}

export async function getFeedbacksByUserId(userId: string): Promise<Feedback[]> {
  const conn = await getConnection()
  const [rows] = await conn.execute(
    'SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  ) as [mysql.RowDataPacket[], mysql.FieldPacket[]]
  
  return rows as Feedback[]
}

export async function getFeedbacksByCode(code: string): Promise<Feedback[]> {
  const conn = await getConnection()
  const [rows] = await conn.execute(
    'SELECT * FROM feedback WHERE code = ? ORDER BY created_at DESC',
    [code]
  ) as [mysql.RowDataPacket[], mysql.FieldPacket[]]
  
  return rows as Feedback[]
}
