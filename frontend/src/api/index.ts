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
import type { CompleteQuizPayload, QuizCategoriesResponse } from '../models/quiz';
import type { TopicAccessCheck } from '../models/material';
import type {
	CurrentQuestionResponse,
	EgeReadinessResponse,
	PlantProgressResponse,
	PlantsListResponse,
	ProgressResponse,
	ReviveAnswerResponse,
	ReviveQuestionResponse,
	ReviveResponse,
	StartPlantResponse,
	StatsResponse,
	SubmitAnswerResponse,
	WaterPlantResponse,
} from '../models/biogarden';
import type { GeneticScenario } from '../models/genetics';
import type { VirusCase, SubmitAnswerResponse, CompleteVirusCaseResponse } from '../models/virus';
import { clearAuthToken, getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from '../lib/authStorage';

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

export interface AuthResult {
	accessToken: string;
	refreshToken: string;
	user: AuthUser;
}

// backward-compat alias
export type AuthLoginResult = AuthResult;

class ApiService {
	private api;
	private _refreshing = false;

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
			async err => {
				const original = err.config;
				if (
					err.response?.status === 401 &&
					!original._retry &&
					original.url !== '/auth/refresh'
				) {
					original._retry = true;
					const refreshToken = getRefreshToken();
					if (refreshToken && !this._refreshing) {
						this._refreshing = true;
						try {
							const res = await this.api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
								'/auth/refresh',
								{ refreshToken },
							);
							const { accessToken, refreshToken: newRefresh } = res.data.data;
							setAuthToken(accessToken);
							setRefreshToken(newRefresh);
							original.headers.Authorization = `Bearer ${accessToken}`;
							return this.api(original);
						} catch {
							clearAuthToken();
							window.location.href = '/login';
						} finally {
							this._refreshing = false;
						}
					} else {
						clearAuthToken();
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

	async register(email: string, password: string, username?: string): Promise<AuthResult> {
		const response = await this.api.post<ApiResponse<AuthResult>>(
			'/auth/register',
			{ email, password, username },
		);
		return response.data.data;
	}

	async login(email: string, password: string): Promise<AuthResult> {
		const response = await this.api.post<ApiResponse<AuthResult>>(
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

	async getUserBalance(telegramId?: number): Promise<number> {
		const path = getAuthToken()
			? '/users/me/balance'
			: `/users/${telegramId}/balance`;
		const response = await this.api.get<ApiResponse<BalanceResponse>>(path);
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
		telegramId: number | undefined,
		topicId: number,
	): Promise<PurchaseTopicResult> {
		const body = telegramId ? { telegramId } : {};
		const response = await this.api.post<ApiResponse<PurchaseTopicResult>>(
			`/materials/topics/${topicId}/purchase`,
			body,
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

	async getQuizCategories(): Promise<QuizCategoriesResponse> {
		const response = await this.api.get<ApiResponse<QuizCategoriesResponse>>('/quizzes/categories');
		return response.data.data;
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
		telegramId?: number | string,
	): Promise<PlantsListResponse> {
		const params = telegramId && !isNaN(Number(telegramId)) ? { telegramId } : {};
		const response = await this.api.get('/biogarden/plants', { params });
		return response.data.data;
	}

	async startPlant(
		telegramId: number | undefined,
		plantId: number,
		slotIndex: number,
	): Promise<StartPlantResponse> {
		const body: Record<string, unknown> = { slotIndex };
		if (telegramId && !isNaN(telegramId)) body.telegramId = telegramId;
		const response = await this.api.post(`/biogarden/plants/${plantId}/start`, body);
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

	async revivePlant(
		telegramId: number,
		plantId: number,
		mode: 'coins' | 'question',
	): Promise<ReviveResponse> {
		const response = await this.api.post(`/biogarden/plants/${plantId}/revive`, {
			telegramId,
			mode,
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

	async getEgeReadiness(telegramId: number): Promise<EgeReadinessResponse> {
		const response = await this.api.get('/biogarden/ege-readiness', {
			params: { telegramId },
		});
		return response.data.data;
	}

	async getCurrentQuestion(plantId: number, telegramId?: number): Promise<CurrentQuestionResponse> {
		const params = telegramId && !isNaN(telegramId) ? { telegramId } : {};
		const response = await this.api.get(`/biogarden/plants/${plantId}/current-question`, { params });
		return response.data.data;
	}

	async submitBiogardenAnswer(
		plantId: number,
		questionId: number,
		answerId: number,
		telegramId?: number,
	): Promise<SubmitAnswerResponse> {
		const body: Record<string, unknown> = { questionId, answerId };
		if (telegramId && !isNaN(telegramId)) body.telegramId = telegramId;
		const response = await this.api.post(`/biogarden/plants/${plantId}/answer`, body);
		return response.data.data;
	}

	async getBiogardenReviveQuestion(plantId: number, telegramId?: number): Promise<ReviveQuestionResponse> {
		const params = telegramId && !isNaN(telegramId) ? { telegramId } : {};
		const response = await this.api.get(`/biogarden/plants/${plantId}/revive-question`, { params });
		return response.data.data;
	}

	async submitReviveAnswer(
		plantId: number,
		questionId: number,
		answerId: number,
		telegramId?: number,
	): Promise<ReviveAnswerResponse> {
		const body: Record<string, unknown> = { questionId, answerId };
		if (telegramId && !isNaN(telegramId)) body.telegramId = telegramId;
		const response = await this.api.post(`/biogarden/plants/${plantId}/revive-answer`, body);
		return response.data.data;
	}

	// ── Genetics ────────────────────────────────────────────────────────────
	async getGeneticScenarios(): Promise<{ scenarios: GeneticScenario[] }> {
		const response = await this.api.get('/genetics/scenarios');
		return response.data.data;
	}

	async getGeneticScenario(id: number): Promise<{ scenario: GeneticScenario }> {
		const response = await this.api.get(`/genetics/scenarios/${id}`);
		return response.data.data;
	}

	async completeGeneticScenario(id: number, score: number): Promise<{ coins_earned: number; score: number }> {
		const response = await this.api.post(`/genetics/scenarios/${id}/complete`, { score });
		return response.data.data;
	}

	// ── Virus ────────────────────────────────────────────────────────────────
	async getVirusCases(telegramId?: number): Promise<{ cases: VirusCase[] }> {
		const params = telegramId ? { telegramId } : {};
		const response = await this.api.get('/virus/cases', { params });
		return response.data.data;
	}

	async getVirusCase(id: number): Promise<{ case: VirusCase }> {
		const response = await this.api.get(`/virus/cases/${id}`);
		return response.data.data;
	}

	async submitVirusAnswer(caseId: number, chapterId: number, optionId: number): Promise<SubmitAnswerResponse> {
		const response = await this.api.post(`/virus/cases/${caseId}/chapters/${chapterId}/answer`, { optionId });
		return response.data.data;
	}

	async completeVirusCase(caseId: number, correctAnswers: number, totalChapters: number, telegramId?: number): Promise<CompleteVirusCaseResponse> {
		const body: Record<string, unknown> = { correct_answers: correctAnswers, total_chapters: totalChapters };
		if (telegramId) body.telegramId = telegramId;
		const response = await this.api.post(`/virus/cases/${caseId}/complete`, body);
		return response.data.data;
	}
}

export const apiService = new ApiService();
