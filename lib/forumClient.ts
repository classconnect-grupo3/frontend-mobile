import { courseClient } from "./courseClient"
import type {
  Question,
  Answer,
  ForumSearchResponse,
  CreateQuestionRequest,
  CreateAnswerRequest,
  VoteRequest,
} from "@/types/forum"

export const forumClient = {
  // Get all questions for a course
  getQuestions: async (courseId: string, token: string): Promise<Question[]> => {
    const { data } = await courseClient.get(`/forum/courses/${courseId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Search questions with filters
  searchQuestions: async (
    courseId: string,
    token: string,
    query?: string,
    tags?: string[],
    status?: string,
  ): Promise<ForumSearchResponse> => {
    const params = new URLSearchParams()
    if (query) params.append("query", query)
    if (tags?.length) tags.forEach((tag) => params.append("tags", tag))
    if (status) params.append("status", status)

    const { data } = await courseClient.get(`/forum/courses/${courseId}/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Create a new question
  createQuestion: async (questionData: CreateQuestionRequest, token: string): Promise<Question> => {
    const { data } = await courseClient.post("/forum/questions", questionData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Get question by ID with answers
  getQuestion: async (questionId: string, token: string): Promise<Question> => {
    const { data } = await courseClient.get(`/forum/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Update question
  updateQuestion: async (
    questionId: string,
    updates: { title?: string; description?: string; tags?: string[] },
    token: string,
  ): Promise<Question> => {
    const { data } = await courseClient.put(`/forum/questions/${questionId}`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Delete question
  deleteQuestion: async (questionId: string, authorId: string, token: string): Promise<void> => {
    await courseClient.delete(`/forum/questions/${questionId}?authorId=${authorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Create answer
  createAnswer: async (questionId: string, answerData: CreateAnswerRequest, token: string): Promise<Answer> => {
    const { data } = await courseClient.post(`/forum/questions/${questionId}/answers`, answerData, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  // Update answer
  updateAnswer: async (questionId: string, answerId: string, content: string, token: string): Promise<Answer> => {
    const { data } = await courseClient.put(
      `/forum/questions/${questionId}/answers/${answerId}`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return data
  },

  // Delete answer
  deleteAnswer: async (questionId: string, answerId: string, authorId: string, token: string): Promise<void> => {
    await courseClient.delete(`/forum/questions/${questionId}/answers/${answerId}?authorId=${authorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Accept answer
  acceptAnswer: async (questionId: string, answerId: string, authorId: string, token: string): Promise<void> => {
    await courseClient.post(
      `/forum/questions/${questionId}/answers/${answerId}/accept?authorId=${authorId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
  },

  // Vote on question
  voteQuestion: async (questionId: string, voteData: VoteRequest, token: string): Promise<void> => {
    await courseClient.post(`/forum/questions/${questionId}/vote`, voteData, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Remove vote from question
  removeQuestionVote: async (questionId: string, userId: string, token: string): Promise<void> => {
    await courseClient.delete(`/forum/questions/${questionId}/vote?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Vote on answer
  voteAnswer: async (questionId: string, answerId: string, voteData: VoteRequest, token: string): Promise<void> => {
    await courseClient.post(`/forum/questions/${questionId}/answers/${answerId}/vote`, voteData, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Remove vote from answer
  removeAnswerVote: async (questionId: string, answerId: string, userId: string, token: string): Promise<void> => {
    await courseClient.delete(`/forum/questions/${questionId}/answers/${answerId}/vote?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
