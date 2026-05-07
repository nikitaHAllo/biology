export interface VirusClue {
	id: number;
	case_id: number;
	order_index: number;
	clue_text: string;
	clue_type: 'symptom' | 'lab' | 'observation';
}

export interface VirusSuspect {
	id: number;
	case_id: number;
	name: string;
	description: string | null;
	order_index: number;
}

export interface VirusCase {
	id: number;
	title: string;
	description: string | null;
	patient_info: string | null;
	difficulty: 'easy' | 'medium' | 'hard';
	coins_reward: number;
	order_index: number;
	is_completed?: boolean;
	score?: number | null;
	coins_earned?: number | null;
	clues?: VirusClue[];
	suspects?: VirusSuspect[];
}
