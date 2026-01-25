// User types
export interface User {
  id: number;
  telegram_id: string;
  username?: string;
  repcoins_balance: number;
  created_at: string;
  lessons_completed?: number;
  achievements_count?: number;
}

// Quiz types
export interface Quiz {
  id: number;
  title: string;
  description: string;
  total_questions: number;
  total_points: number;
  estimated_minutes?: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  order_index: number;
  points: number;
  timer_seconds?: number;
  explanation?: string;
}

// Assignment types
export interface Assignment {
  id: number;
  lesson_id: number;
  lesson_title?: string;
  title: string;
  requirements: string;
  created_at: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  assignment_title?: string;
  user_id: number;
  user_telegram_id?: string;
  user_username?: string;
  file_url: string;
  status: 'pending' | 'reviewing' | 'graded' | 'rejected';
  score?: number;
  comment?: string;
  submitted_at: string;
}

// Quiz Result types
export interface QuizResult {
  id: number;
  user_id: number;
  user_telegram_id?: string;
  user_username?: string;
  quiz_id: number;
  quiz_title?: string;
  score: number;
  total_points: number;
  repcoins_earned: number;
  completed_at: string;
  passed: boolean;
}

// Dashboard types
export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_courses: number;
  total_lessons: number;
  total_quizzes: number;
  total_repcoins: number;
  pending_assignments: number;
  graded_assignments: number;
}

export interface UserRegistrationStats {
  date: string;
  count: number;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: 'super_admin' | 'admin' | 'moderator';
    created_at: string;
  };
}

// API Error types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
