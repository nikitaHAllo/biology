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

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
	private api = axios.create({
		baseURL: API_BASE_URL,
	});

	async getUserProfile(telegramId: number): Promise<UserProfile> {
		const response = await this.api.get<ApiResponse<UserProfileResponse>>(
			`/users/${telegramId}/profile`
		);
		return response.data.data.profile;
	}

	async getUserStats(telegramId: number): Promise<UserStats> {
		const response = await this.api.get<ApiResponse<UserStatsResponse>>(
			`/users/${telegramId}/stats`
		);
		return response.data.data.stats;
	}

	async getUserBalance(telegramId: number): Promise<number> {
		const response = await this.api.get<ApiResponse<BalanceResponse>>(
			`/users/${telegramId}/balance`
		);
		return response.data.data.coins;
	}

	async getUserProgress(telegramId: number): Promise<LessonProgress[]> {
		const response = await this.api.get<ApiResponse<CourseProgressResponse>>(
			`/users/${telegramId}/course-progress`
		);
		const courses = response.data.data.courses || [];
		return courses.flatMap((course: CourseProgress) => course.lessons || []);
	}

	async getUserAchievements(telegramId: number): Promise<Achievement[]> {
		const response = await this.api.get<ApiResponse<AchievementsResponse>>(
			`/users/${telegramId}/achievements`
		);
		return response.data.data.achievements;
	}

	async updateUserProfile(telegramId: number, username: string): Promise<void> {
		await this.api.patch(`/users/${telegramId}/profile`, { username });
	}

	async getMaterialsCatalog(
		telegramId?: number
	): Promise<MaterialsCatalogResponse> {
		const response = await this.api.get<ApiResponse<MaterialsCatalogResponse>>(
			'/materials/catalog',
			{
				params: telegramId ? { telegramId } : undefined,
			}
		);
		return response.data.data;
	}

	async purchaseTopic(
		telegramId: number,
		topicId: number
	): Promise<PurchaseTopicResult> {
		const response = await this.api.post<ApiResponse<PurchaseTopicResult>>(
			`/materials/topics/${topicId}/purchase`,
			{ telegramId }
		);
		return response.data.data;
	}

	async getQuizzesList(): Promise<Quiz[]> {
		const response = await this.api.get<ApiResponse<QuizzesListResponse>>(
			'/quizzes'
		);
		return response.data.data.quizzes;
	}

	async getQuizDetails(quizId: number): Promise<Quiz> {
		const response = await this.api.get<ApiResponse<QuizDetailsResponse>>(
			`/quizzes/${quizId}`
		);
		return response.data.data.quiz;
	}

	async getDownloadableTasks(): Promise<TasksListResponse> {
		const response = await this.api.get<ApiResponse<TasksListResponse>>(
			'/tasks/downloads'
		);
		return response.data.data;
	}
	async completeQuiz(quizId: number, payload: CompleteQuizPayload) {
		const response = await this.api.post<ApiResponse<CompleteQuizResponse>>(
			`/quizzes/${quizId}/complete`,
			payload
		);
		return response.data.data;
	}
}

export const apiService = new ApiService();
