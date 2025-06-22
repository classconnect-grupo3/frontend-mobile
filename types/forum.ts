export interface ForumQuestion {
  id: string
  title: string
  description: string
  author_id: string
  course_id: string
  created_at: string
  updated_at: string
  status: "open" | "closed"
  tags: string[]
  vote_count: number
  answer_count: number
  accepted_answer_id?: string
  answers?: ForumAnswer[]
}

export interface ForumAnswer {
  id: string
  content: string
  author_id: string
  created_at: string
  updated_at: string
  vote_count: number
  is_accepted: boolean
}

export interface ForumSearchResponse {
  questions: ForumQuestion[]
  total: number
}

export interface UserRole {
  uid: string
  name: string
  surname: string
  role: "teacher" | "aux_teacher" | "student"
}

export type VoteType = 1 | -1 // 1 for upvote, -1 for downvote

export interface CreateQuestionRequest {
  title: string
  description: string
  author_id: string
  course_id: string
  tags: string[]
}

export interface CreateAnswerRequest {
  content: string
  author_id: string
}

export interface VoteRequest {
  user_id: string
  vote_type: VoteType
}
