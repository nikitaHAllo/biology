import { apiClient } from './client'
import {
  User,
  Quiz,
  QuizQuestion,
  QuizResult,
  Assignment,
  AssignmentSubmission,
  DashboardStats,
  UserRegistrationStats,
  PaginatedResponse,
  AuthResponse,
  LoginCredentials,
} from '@/lib/types'

// Auth
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),
  
  logout: () => apiClient.post('/auth/logout'),
  
  me: () => apiClient.get('/auth/me'),
}

// Dashboard
export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  
  getUserRegistrations: (days: number = 30) =>
    apiClient.get<UserRegistrationStats[]>('/dashboard/registrations', { days }),
}

// Users
export const usersApi = {
  getUsers: (params?: {
    page?: number
    page_size?: number
    telegram_id?: string
    username?: string
    min_balance?: number
    max_balance?: number
  }) => apiClient.get<PaginatedResponse<User>>('/users', params),
  
  getUser: (id: number) => apiClient.get<User>(`/users/${id}`),
  
  updateUser: (id: number, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${id}`, data),
  
  updateUserBalance: (id: number, balance: number) =>
    apiClient.patch<User>(`/users/${id}/balance`, { balance }),
}

// Quizzes
export const quizzesApi = {
  getQuizzes: (params?: {
    page?: number
    page_size?: number
    is_active?: boolean
    search?: string
  }) => apiClient.get<PaginatedResponse<Quiz>>('/quizzes', params),
  
  getQuiz: (id: number) => apiClient.get<Quiz>(`/quizzes/${id}`),
  
  createQuiz: (data: Partial<Quiz>) => apiClient.post<Quiz>('/quizzes', data),
  
  updateQuiz: (id: number, data: Partial<Quiz>) =>
    apiClient.patch<Quiz>(`/quizzes/${id}`, data),
  
  deleteQuiz: (id: number) => apiClient.delete(`/quizzes/${id}`),
  
  toggleQuizActive: (id: number) =>
    apiClient.patch<Quiz>(`/quizzes/${id}/toggle-active`),
  
  getQuizQuestions: (quizId: number) =>
    apiClient.get<QuizQuestion[]>(`/quizzes/${quizId}/questions`),
  
  createQuizQuestion: (quizId: number, data: Partial<QuizQuestion>) =>
    apiClient.post<QuizQuestion>(`/quizzes/${quizId}/questions`, data),
  
  updateQuizQuestion: (quizId: number, questionId: number, data: Partial<QuizQuestion>) =>
    apiClient.patch<QuizQuestion>(`/quizzes/${quizId}/questions/${questionId}`, data),
  
  deleteQuizQuestion: (quizId: number, questionId: number) =>
    apiClient.delete(`/quizzes/${quizId}/questions/${questionId}`),
  
  getQuizResults: (params?: {
    page?: number
    page_size?: number
    quiz_id?: number
    user_id?: number
    passed?: boolean
  }) => apiClient.get<PaginatedResponse<QuizResult>>('/quizzes/results', params),
}

// Assignments
export const assignmentsApi = {
  getAssignments: (params?: {
    page?: number
    page_size?: number
    lesson_id?: number
    search?: string
  }) => apiClient.get<PaginatedResponse<Assignment>>('/assignments', params),
  
  getAssignment: (id: number) => apiClient.get<Assignment>(`/assignments/${id}`),
  
  createAssignment: (data: Partial<Assignment>) =>
    apiClient.post<Assignment>('/assignments', data),
  
  updateAssignment: (id: number, data: Partial<Assignment>) =>
    apiClient.patch<Assignment>(`/assignments/${id}`, data),
  
  deleteAssignment: (id: number) => apiClient.delete(`/assignments/${id}`),
  
  getSubmissions: (params?: {
    page?: number
    page_size?: number
    assignment_id?: number
    user_id?: number
    status?: string
  }) => apiClient.get<PaginatedResponse<AssignmentSubmission>>('/assignments/submissions', params),
  
  getSubmission: (id: number) =>
    apiClient.get<AssignmentSubmission>(`/assignments/submissions/${id}`),
  
  reviewSubmission: (id: number, data: {
    score: number
    comment?: string
    checklist?: Record<string, unknown>
    status: 'graded' | 'rejected'
  }) => apiClient.patch<AssignmentSubmission>(`/assignments/submissions/${id}/review`, data),
}
