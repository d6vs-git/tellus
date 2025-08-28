export interface User {
  id: string
  username: string
  email: string
  code: string
  created_at: Date
  updated_at: Date
}

export interface Feedback {
  id: number
  name: string
  feedback: string
  rating: number
  code: string
  created_at: Date
  updated_at: Date
  embedding_vec: number[] | null
  user_id: string
}

export interface CreateFeedbackData {
  name: string
  feedback: string
  rating: number
  code: string
  user_id: string
  embedding?: number[]
}