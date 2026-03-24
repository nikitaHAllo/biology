import axios from 'axios';
import type {
	UserProfile,
	UserStats,
	LessonProgress,
	Achievement,
	UserProfileResponse,
	UserStatsResponse,
	AchievementsResponse,
	BalanceResponse,
	CourseProgressResponse,
	ApiResponse,
	CourseProgress,
	MaterialsCatalogResponse,
	Quiz,
	QuizzesListResponse,
	QuizDetailsResponse,
	TasksListResponse,
	PurchaseTopicResult,
} from '../models';
import type { CompleteQuizResponse } from '../models/task';
import type { CompleteQuizPayload } from '../models/quiz';
import type { TopicAccessCheck } from '../models/material';
import type {
	AnswerResponse,
	PlantProgressResponse,
	PlantsListResponse,
	ProgressResponse,
	QuestionResponse,
	StartPlantResponse,
	StatsResponse,
	WaterPlantResponse,
} from '../models/biogarden';
import { clearAuthToken, getAuthToken } from '../lib/authStorage';

// В режиме разработки через dev tunnel используем переменную окружения,
// иначе — localhost (для прямого запуска в браузере)
const API_BASE_URL =
	import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export interface AuthUser {
	id: number;
	email: string | null;
	telegram_id: number | null;
	username: string | null;
	coins: number;
	created_at?: string;
}

export interface AuthLoginResult {
	token: string;
	user: AuthUser;
}

/** Регистрация без токена — нужно подтвердить email */
export interface RegisterPendingResult {
	needsVerification: true;
	email: string;
}

class ApiService {
	private api;

	constructor() {
		this.api = axios.create({
			baseURL: API_BASE_URL,
		});

		this.api.interceptors.request.use(config => {
			const token = getAuthToken();
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		});

		this.api.interceptors.response.use(
			r => r,
			err => {
				if (err.response?.status === 401 && getAuthToken()) {
					clearAuthToken();
					if (typeof window !== 'undefined') {
						const p = window.location.pathname;
						if (p !== '/login' && p !== '/register') {
							window.location.href = '/login';
						}
					}
				}
				return Promise.reject(err);
			},
		);
	}

	async register(
		email: string,
		password: string,
		username?: string,
	): Promise<RegisterPendingResult> {
		const response = await this.api.post<
			ApiResponse<RegisterPendingResult>
		>('/auth/register', { email, password, username });
		return response.data.data;
	}

	async verifyEmail(email: string, code: string): Promise<AuthLoginResult> {
		const response = await this.api.post<
			ApiResponse<AuthLoginResult>
		>('/auth/verify-email', { email: email.trim(), code });
		return response.data.data;
	}

	async resendVerificationCode(email: string): Promise<void> {
		await this.api.post('/auth/resend-code', { email: email.trim() });
	}

	async login(email: string, password: string): Promise<AuthLoginResult> {
		const response = await this.api.post<ApiResponse<AuthLoginResult>>(
			'/auth/login',
			{ email, password },
		);
		return response.data.data;
	}

	async getAuthMe(): Promise<AuthUser> {
		const response = await this.api.get<ApiResponse<{ user: AuthUser }>>(
			'/auth/me',
		);
		return response.data.data.user;
	}

	private userPath(telegramId: number, me: string, legacy: string): string {
		return getAuthToken() ? me : legacy.replace(':id', String(telegramId));
	}

	async getUserProfile(telegramId: number): Promise<UserProfile> {
		const response = await this.api.get<ApiResponse<UserProfileResponse>>(
			this.userPath(telegramId, '/users/me/profile', '/users/:id/profile'),
		);
		return response.data.data.profile;
	}

	async getUserStats(telegramId: number): Promise<UserStats> {
		const response = await this.api.get<ApiResponse<UserStatsResponse>>(
			this.userPath(telegramId, '/users/me/stats', '/users/:id/stats'),
		);
		return response.data.data.stats;
	}

	async getUserBalance(telegramId: number): Promise<number> {
		const response = await this.api.get<ApiResponse<BalanceResponse>>(
			this.userPath(telegramId, '/users/me/balance', '/users/:id/balance'),
		);
		return response.data.data.coins;
	}

	async getUserProgress(telegramId: number): Promise<LessonProgress[]> {
		const response = await this.api.get<ApiResponse<CourseProgressResponse>>(
			this.userPath(
				telegramId,
				'/users/me/course-progress',
				'/users/:id/course-progress',
			),
		);
		const courses = response.data.data.courses || [];
		return courses.flatMap((course: CourseProgress) => course.lessons || []);
	}

	async getUserAchievements(telegramId: number): Promise<Achievement[]> {
		const response = await this.api.get<ApiResponse<AchievementsResponse>>(
			this.userPath(telegramId, '/users/me/achievements', '/users/:id/achievements'),
		);
		return response.data.data.achievements;
	}

	async updateUserProfile(telegramId: number, username: string): Promise<void> {
		await this.api.patch(
			this.userPath(telegramId, '/users/me/profile', '/users/:id/profile'),
			{ username },
		);
	}

	async getMaterialsCatalog(
		telegramId?: number,
	): Promise<MaterialsCatalogResponse> {
		const response = await this.api.get<ApiResponse<MaterialsCatalogResponse>>(
			'/materials/catalog',
			{
				params: telegramId ? { telegramId } : undefined,
			},
		);
		return response.data.data;
	}

	async checkTopicAccess(
		telegramId: number,
		topicId: number,
	): Promise<TopicAccessCheck> {
		const response = await this.api.get<ApiResponse<TopicAccessCheck>>(
			'/materials/access/check',
			{
				params: { telegramId, topicId },
			},
		);
		return response.data.data;
	}

	async purchaseTopic(
		telegramId: number,
		topicId: number,
	): Promise<PurchaseTopicResult> {
		const response = await this.api.post<ApiResponse<PurchaseTopicResult>>(
			`/materials/topics/${topicId}/purchase`,
			{ telegramId },
		);
		return response.data.data;
	}

	async getQuizzesList(telegramId?: string | number): Promise<Quiz[]> {
		const config = telegramId ? { params: { telegramId } } : {};

		const response = await this.api.get<ApiResponse<QuizzesListResponse>>(
			'/quizzes',
			config,
		);
		return response.data.data.quizzes;
	}

	async getQuizDetails(quizId: number): Promise<Quiz> {
		const response = await this.api.get<ApiResponse<QuizDetailsResponse>>(
			`/quizzes/${quizId}`,
		);
		return response.data.data.quiz;
	}

	async getDownloadableTasks(): Promise<TasksListResponse> {
		const response =
			await this.api.get<ApiResponse<TasksListResponse>>('/tasks/downloads');
		return response.data.data;
	}
	async completeQuiz(quizId: number, payload: CompleteQuizPayload) {
		const response = await this.api.post<ApiResponse<CompleteQuizResponse>>(
			`/quizzes/${quizId}/complete`,
			payload,
		);
		return response.data.data;
	}

	async getPlantsList(
		telegramId: number | string,
	): Promise<PlantsListResponse> {
		const response = await this.api.get('/biogarden/plants', {
			params: { telegramId },
		});
		return response.data.data;
	}

	async startPlant(
		telegramId: number,
		plantId: number,
	): Promise<StartPlantResponse> {
		const response = await this.api.post(`/biogarden/plants/${plantId}/start`, {
			telegramId,
		});
		return response.data.data;
	}

	async getCurrentQuestion(
		telegramId: number,
		plantId: number,
	): Promise<QuestionResponse> {
		const response = await this.api.get(
			`/biogarden/plants/${plantId}/current-question`,
			{
				params: { telegramId },
			},
		);
		return response.data.data;
	}

	async submitAnswer(
		telegramId: number,
		plantId: number,
		questionId: number,
		answerId: number,
	): Promise<AnswerResponse> {
		const response = await this.api.post(
			`/biogarden/plants/${plantId}/answer`,
			{
				telegramId,
				questionId,
				answerId,
			},
		);
		return response.data.data;
	}

	async waterPlant(
		telegramId: number,
		plantId: number,
	): Promise<WaterPlantResponse> {
		const response = await this.api.post(`/biogarden/plants/${plantId}/water`, {
			telegramId,
		});
		return response.data.data;
	}

	async getBiogardenProgress(telegramId: number): Promise<ProgressResponse> {
		const response = await this.api.get('/biogarden/progress', {
			params: { telegramId },
		});
		return response.data.data;
	}

	async getPlantProgress(
		telegramId: number,
		plantId: number,
	): Promise<PlantProgressResponse> {
		const response = await this.api.get(
			`/biogarden/plants/${plantId}/progress`,
			{
				params: { telegramId },
			},
		);
		return response.data.data;
	}

	async getBiogardenStats(telegramId: number): Promise<StatsResponse> {
		const response = await this.api.get('/biogarden/stats', {
			params: { telegramId },
		});
		return response.data.data;
	}
}

export const apiService = new ApiService();
