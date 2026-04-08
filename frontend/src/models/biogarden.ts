// models/biogarden.ts
export interface BioGardenPlant {
	id: number;
	name: string;
	scientific_name: string;
	description: string;
	image_url: string;
	growth_stages: number;
	required_experience: number;
	difficulty_level: number;
	biology_topics: string[];
	is_unlocked: boolean;
	current_stage: number;
	experience_points: number;
	health_points: number;
	max_health_points: number;
	hp_state?: 'healthy' | 'medium' | 'low' | 'critical' | 'dead';
	is_completed: boolean;
	planted_at: string | null;
	is_wilted?: boolean;
	revive_sleep_until?: string | null;
}

export interface BioGardenProgress {
	plant_id: number;
	plant_name: string;
	current_stage: number;
	total_stages: number;
	experience_points: number;
	health_points: number;
	is_completed: boolean;
	planted_at: string;
	completed_at: string | null;
}

export interface BioGardenStatistics {
	total_plants_started: number;
	total_plants_completed: number;
	total_attempts: number;
	correct_answers: number;
	accuracy: number;
	topic_stats: Record<string, { total: number; correct: number }>;
	current_streak?: number;
	longest_streak?: number;
}

export interface BioGardenPlantProgress {
	plant_id: number;
	plant_name: string;
	current_stage: number;
	total_stages: number;
	experience_points: number;
	health_points: number;
	max_health_points: number;
	is_completed: boolean;
	is_unlocked: boolean;
	planted_at: string;
	last_watered_at: string | null;
	recent_attempts: Array<{
		id: number;
		stage_number: number;
		question_text: string;
		biology_topic: string;
		ege_code: string;
		is_correct: boolean;
		earned_experience: number;
		earned_coins: number;
		answered_at: string;
	}>;
}

export interface BioGardenOverview {
	total_plants_started: number;
	total_plants_completed: number;
	total_attempts: number;
	total_experience_earned: number;
	total_coins_earned: number;
	current_streak?: number;
	longest_streak?: number;
}

export interface TopPlant {
	plant_id: number;
	plant_name: string;
	experience_points: number;
	current_stage: number;
	is_completed: boolean;
}

// Response interfaces
export interface PlantsListResponse {
	plants: BioGardenPlant[];
	user_coins: number;
	total_experience: number;
}

export interface StartPlantResponse {
	plant: {
		id: number;
		name: string;
		scientific_name: string;
	};
	progress: {
		current_stage: number;
		experience_points: number;
		health_points: number;
		max_health_points: number;
	};
}

export interface ReviveResponse {
	revived: boolean;
	health_points?: number;
	coins_spent?: number;
	message?: string;
}

export interface EgeReadinessResponse {
	overall_ege_readiness: number;
	accuracy_per_ege_code: Record<
		string,
		{
			accuracy: number;
			mastery_level: string;
		}
	>;
	weak_topics: string[];
	strong_topics: string[];
	sections: Array<{
		plant_id: number;
		name: string;
		difficulty_level: number;
	}>;
}

export interface WaterPlantResponse {
	health_points: number;
	last_watered_at: string;
	coins_spent: number;
}

export interface ProgressResponse {
	progress: BioGardenProgress[];
	statistics: BioGardenStatistics;
}

export interface PlantProgressResponse {
	progress: Omit<BioGardenPlantProgress, 'recent_attempts'>;
	recent_attempts: BioGardenPlantProgress['recent_attempts'];
}

export interface StatsResponse {
	overview: BioGardenOverview;
	top_plants: TopPlant[];
}
