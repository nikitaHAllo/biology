export interface Achievement {
	id: number;
	code: string;
	title: string;
	description: string;
	achieved: boolean;
	awarded_at: string | null;
}

export interface AchievementsResponse {
	achievements: Achievement[];
	summary: {
		total: number;
		achieved: number;
		progress_percentage: number;
	};
}

export interface WalletTransaction {
	id: number;
	type: 'credit' | 'debit';
	amount: number;
	source: string;
	meta: Record<string, unknown>;
	created_at: string;
}

