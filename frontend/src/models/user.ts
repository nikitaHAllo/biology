import type { LessonProgress } from './lesson';

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

export interface BalanceResponse {
	telegram_id: number;
	username: string | null;
	coins: number;
}

