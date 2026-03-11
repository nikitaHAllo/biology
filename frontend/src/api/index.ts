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

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
	private api = axios.create({
		baseURL: API_BASE_URL,
	});

	async getUserProfile(telegramId: number): Promise<UserProfile> {
		const response = await this.api.get<ApiResponse<UserProfileResponse>>(
			`/users/${telegramId}/profile`,
		);
		return response.data.data.profile;
	}

	async getUserStats(telegramId: number): Promise<UserStats> {
		const response = await this.api.get<ApiResponse<UserStatsResponse>>(
			`/users/${telegramId}/stats`,
		);
		return response.data.data.stats;
	}

	async getUserBalance(telegramId: number): Promise<number> {
		const response = await this.api.get<ApiResponse<BalanceResponse>>(
			`/users/${telegramId}/balance`,
		);
		return response.data.data.coins;
	}

	async getUserProgress(telegramId: number): Promise<LessonProgress[]> {
		const response = await this.api.get<ApiResponse<CourseProgressResponse>>(
			`/users/${telegramId}/course-progress`,
		);
		const courses = response.data.data.courses || [];
		return courses.flatMap((course: CourseProgress) => course.lessons || []);
	}

	async getUserAchievements(telegramId: number): Promise<Achievement[]> {
		const response = await this.api.get<ApiResponse<AchievementsResponse>>(
			`/users/${telegramId}/achievements`,
		);
		return response.data.data.achievements;
	}

	async updateUserProfile(telegramId: number, username: string): Promise<void> {
		await this.api.patch(`/users/${telegramId}/profile`, { username });
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
