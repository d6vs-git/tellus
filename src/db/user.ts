import mysql from 'mysql2/promise'
import { createId } from '@paralleldrive/cuid2'

import { User } from "@/lib/types"
import { getConnection } from "./connect"


export async function findUserByEmail(email: string): Promise<User | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]]
    return rows[0] ? (rows[0] as User) : null
  } finally {
    if (conn) {
      try { await conn.end(); } catch {}
    }
  }
}

export async function findUserByCode(code: string): Promise<User | null> {
  const conn = await getConnection()
  try {
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE code = ?',
      [code]
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]]
    return rows[0] ? (rows[0] as User) : null
  } finally {
    if (conn) {
      try { await conn.end(); } catch {}
    }
  }
}

export async function createUser(userData: {
  email: string
  username: string
  code: string
}): Promise<User> {
  const conn = await getConnection()
  const userId = createId()
  
  await conn.execute(
    'INSERT INTO users (id, email, username, code, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [userId, userData.email, userData.username, userData.code]
  )
  
  return {
    id: userId,
    ...userData,
    created_at: new Date(),
    updated_at: new Date()
  }
}

