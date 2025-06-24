export interface ForumQuestion {
  id: string
  title: string
  description: string
  author_id: string
  course_id: string
  tags: string[]
  status: "open" | "closed"
  vote_count: number
  answer_count: number
  accepted_answer_id?: string
  created_at: string
  updated_at: string
  votes: Vote[]
}

export interface ForumAnswer {
  id: string
  content: string
  author_id: string
  vote_count: number
  is_accepted: boolean
  created_at: string
  updated_at: string
  votes: Vote[]
}

export interface Vote {
  user_id: string
  vote_type: 1 | -1
}

export interface UserRole {
  uid: string
  name: string
  surname: string
  role: "teacher" | "aux_teacher" | "student"
}

export interface ForumSearchResponse {
  questions: ForumQuestion[]
  total: number
}

export type VoteType = 1 | -1

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
