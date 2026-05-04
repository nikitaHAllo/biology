import { auth } from './auth';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api') + '/admin';

async function req<T = unknown>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data as T;
}

export interface AdminUser {
  id: number;
  email: string | null;
  username: string | null;
  telegram_id: number | null;
  coins: number;
  created_at: string;
}

export interface AdminFile {
  id: number;
  topic_id: number;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
}

export interface AdminTopic {
  id: number;
  section_id: number;
  title: string;
  slug: string;
  description: string | null;
  price_repcoins: number;
  is_default_unlocked: boolean;
  order_index: number;
  files: AdminFile[];
}

export interface AdminTask {
  id: number;
  title: string;
  source: 'ege' | 'fipi' | 'other';
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  year: number | null;
  subject: string | null;
  created_at: string;
}

export interface AdminCollection {
  id: number;
  title: string;
  source: 'ege' | 'fipi' | 'other';
  description: string | null;
  tasks: AdminTask[];
  created_at: string;
}

export interface AdminSection {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  topics: AdminTopic[];
}

export interface AdminQuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface AdminQuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false';
  order_index: number;
  points: number;
  timer_seconds: number | null;
  explanation: string | null;
  options?: AdminQuizOption[];
}

export interface AdminQuiz {
  id: number;
  title: string;
  description: string | null;
  coins_reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic_tag: string | null;
  total_questions: number;
  total_points: number;
  estimated_minutes: number | null;
  is_active: boolean;
  created_at: string;
  questions?: AdminQuizQuestion[];
}

export interface AdminGeneticOption {
  id: number;
  step_id: number;
  option_text: string;
  is_correct: boolean;
  feedback: string | null;
  order_index: number;
}

export interface AdminGeneticStep {
  id: number;
  scenario_id: number;
  order_index: number;
  step_type: 'info' | 'question' | 'result';
  title: string;
  content: string;
  points: number;
  explanation: string | null;
  options?: AdminGeneticOption[];
}

export interface AdminGeneticScenario {
  id: number;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  coins_reward: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  steps?: AdminGeneticStep[];
}

export const api = {
  login: (password: string) =>
    req<{ token: string }>('POST', '/login', { password }),

  getUsers: () =>
    req<{ users: AdminUser[] }>('GET', '/users'),

  getSections: () =>
    req<{ sections: AdminSection[] }>('GET', '/sections'),

  createSection: (body: { title: string; slug: string; description?: string; icon?: string; order_index?: number }) =>
    req('POST', '/sections', body),

  deleteSection: (id: number) =>
    req('DELETE', `/sections/${id}`),

  createTopic: (body: { section_id: number; title: string; slug: string; description?: string; price_repcoins?: number; is_default_unlocked?: boolean; order_index?: number }) =>
    req('POST', '/topics', body),

  deleteTopic: (id: number) =>
    req('DELETE', `/topics/${id}`),

  createFile: (body: { topic_id: number; name: string; file_url: string; file_type?: string; file_size?: number }) =>
    req('POST', '/files', body),

  deleteFile: (id: number) =>
    req('DELETE', `/files/${id}`),

  // Tasks
  getTasks: () =>
    req<{ tasks: AdminTask[] }>('GET', '/tasks'),

  createTask: (body: {
    title: string; source: 'ege' | 'fipi' | 'other'; file_url: string;
    description?: string; file_type?: string; file_size?: number; year?: number; subject?: string;
  }) => req('POST', '/tasks', body),

  deleteTask: (id: number) =>
    req('DELETE', `/tasks/${id}`),

  // Collections
  getCollections: () =>
    req<{ collections: AdminCollection[] }>('GET', '/collections'),

  createCollection: (body: { title: string; source: 'ege' | 'fipi' | 'other'; description?: string }) =>
    req('POST', '/collections', body),

  deleteCollection: (id: number) =>
    req('DELETE', `/collections/${id}`),

  addTaskToCollection: (collectionId: number, taskId: number) =>
    req('POST', `/collections/${collectionId}/tasks`, { task_id: taskId }),

  removeTaskFromCollection: (collectionId: number, taskId: number) =>
    req('DELETE', `/collections/${collectionId}/tasks/${taskId}`),

  // Quizzes
  getQuizzes: () =>
    req<{ quizzes: AdminQuiz[] }>('GET', '/quizzes'),

  getQuiz: (id: number) =>
    req<{ quiz: AdminQuiz }>('GET', `/quizzes/${id}`),

  createQuiz: (body: { title: string; description?: string; coins_reward?: number; difficulty?: string; topic_tag?: string; estimated_minutes?: number; is_active?: boolean }) =>
    req<{ quiz: AdminQuiz }>('POST', '/quizzes', body),

  updateQuiz: (id: number, body: Partial<{ title: string; description: string | null; coins_reward: number; difficulty: string; topic_tag: string | null; estimated_minutes: number | null; is_active: boolean }>) =>
    req<{ quiz: AdminQuiz }>('PUT', `/quizzes/${id}`, body),

  deleteQuiz: (id: number) =>
    req('DELETE', `/quizzes/${id}`),

  // Questions
  createQuestion: (quizId: number, body: { question_text: string; question_type: string; points?: number; timer_seconds?: number | null; explanation?: string; order_index?: number }) =>
    req<{ question: AdminQuizQuestion }>('POST', `/quizzes/${quizId}/questions`, body),

  updateQuestion: (id: number, body: Partial<{ question_text: string; question_type: string; points: number; timer_seconds: number | null; explanation: string | null; order_index: number }>) =>
    req<{ question: AdminQuizQuestion }>('PUT', `/questions/${id}`, body),

  deleteQuestion: (id: number) =>
    req('DELETE', `/questions/${id}`),

  // Options
  createOption: (questionId: number, body: { option_text: string; is_correct?: boolean; order_index?: number }) =>
    req<{ option: AdminQuizOption }>('POST', `/questions/${questionId}/options`, body),

  updateOption: (id: number, body: Partial<{ option_text: string; is_correct: boolean; order_index: number }>) =>
    req<{ option: AdminQuizOption }>('PUT', `/options/${id}`, body),

  deleteOption: (id: number) =>
    req('DELETE', `/options/${id}`),

  // Genetics
  getGeneticScenarios: () =>
    req<{ scenarios: AdminGeneticScenario[] }>('GET', '/genetics/scenarios'),

  getGeneticScenario: (id: number) =>
    req<{ scenario: AdminGeneticScenario }>('GET', `/genetics/scenarios/${id}`),

  createGeneticScenario: (body: { title: string; description?: string; difficulty?: string; coins_reward?: number; order_index?: number; is_active?: boolean }) =>
    req<{ scenario: AdminGeneticScenario }>('POST', '/genetics/scenarios', body),

  updateGeneticScenario: (id: number, body: Partial<{ title: string; description: string | null; difficulty: string; coins_reward: number; order_index: number; is_active: boolean }>) =>
    req<{ scenario: AdminGeneticScenario }>('PUT', `/genetics/scenarios/${id}`, body),

  deleteGeneticScenario: (id: number) =>
    req('DELETE', `/genetics/scenarios/${id}`),

  createGeneticStep: (scenarioId: number, body: { title: string; content: string; step_type: string; points?: number; explanation?: string; order_index?: number }) =>
    req<{ step: AdminGeneticStep }>('POST', `/genetics/scenarios/${scenarioId}/steps`, body),

  updateGeneticStep: (id: number, body: Partial<{ title: string; content: string; step_type: string; points: number; explanation: string | null; order_index: number }>) =>
    req<{ step: AdminGeneticStep }>('PUT', `/genetics/steps/${id}`, body),

  deleteGeneticStep: (id: number) =>
    req('DELETE', `/genetics/steps/${id}`),

  createGeneticOption: (stepId: number, body: { option_text: string; is_correct?: boolean; feedback?: string; order_index?: number }) =>
    req<{ option: AdminGeneticOption }>('POST', `/genetics/steps/${stepId}/options`, body),

  updateGeneticOption: (id: number, body: Partial<{ option_text: string; is_correct: boolean; feedback: string | null; order_index: number }>) =>
    req<{ option: AdminGeneticOption }>('PUT', `/genetics/options/${id}`, body),

  deleteGeneticOption: (id: number) =>
    req('DELETE', `/genetics/options/${id}`),
};
