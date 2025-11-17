export interface UserProfile {
	id: number;
	telegram_id: number;
	username: string | null;
	coins: number;
	created_at: string;
}

export interface UserStats {
	total_lessons: number;
	completed_lessons: number;
	completion_rate: number;
	total_achievements: number;
	total_coins: number;
}

export interface LessonProgress {
	lesson_id: number;
	lesson_title: string;
	course_title: string;
	status: string;
	updated_at: string;
}

export interface CourseProgress {
	course_id: number;
	course_title: string;
	course_description: string;
	total_lessons: number;
	completed_lessons: number;
	in_progress_lessons: number;
	progress_percentage: number;
	lessons: LessonProgress[];
}

export interface Achievement {
	id: number;
	code: string;
	title: string;
	description: string;
	achieved: boolean;
	awarded_at: string | null;
}

export interface WalletTransaction {
	id: number;
	type: 'credit' | 'debit';
	amount: number;
	source: string;
	meta: Record<string, unknown>;
	created_at: string;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
}

export interface UserProfileResponse {
	profile: UserProfile;
	statistics: {
		completed_lessons: number;
		in_progress_lessons: number;
		total_achievements: number;
		total_coins: number;
	};
	progress: LessonProgress[];
	achievements: Array<{
		code: string;
		title: string;
		description: string;
		awarded_at: string;
	}>;
}

export interface UserStatsResponse {
	profile: {
		telegram_id: number;
		username: string | null;
		coins: number;
		member_since: string;
	};
	stats: UserStats;
}

export interface AchievementsResponse {
	achievements: Achievement[];
	summary: {
		total: number;
		achieved: number;
		progress_percentage: number;
	};
}

export interface BalanceResponse {
	telegram_id: number;
	username: string | null;
	coins: number;
}

export interface CourseProgressResponse {
	courses: CourseProgress[];
}
