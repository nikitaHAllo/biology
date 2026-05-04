export interface GeneticOption {
	id: number;
	step_id: number;
	option_text: string;
	is_correct: boolean;
	feedback: string | null;
	order_index: number;
}

export interface GeneticStep {
	id: number;
	scenario_id: number;
	order_index: number;
	step_type: 'info' | 'question' | 'result';
	title: string;
	content: string;
	points: number;
	explanation: string | null;
	options?: GeneticOption[];
}

export interface GeneticScenario {
	id: number;
	title: string;
	description: string | null;
	difficulty: 'easy' | 'medium' | 'hard';
	coins_reward: number;
	order_index: number;
	is_completed?: boolean;
	score?: number | null;
	coins_earned?: number | null;
	steps?: GeneticStep[];
}
