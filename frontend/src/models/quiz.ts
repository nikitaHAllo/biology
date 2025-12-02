export interface QuizQuestion {
	id: number;
	quiz_id: number;
	question_text: string;
	question_type: 'single_choice' | 'multiple_choice' | 'true_false';
	options: QuizOption[];
	correct_answer_ids: number[];
	explanation?: string;
	points: number;
	order: number;
	timer_seconds?: number | null;
}

export interface QuizOption {
	id: number;
	question_id: number;
	option_text: string;
	is_correct: boolean;
	order: number;
}

export interface Quiz {
	id: number;
	title: string;
	description?: string;
	total_questions: number;
	total_points: number;
	estimated_minutes?: number | null;
	is_completed?: boolean;
	completed_at?: string | null;
	questions: QuizQuestion[];
}

export interface QuizAttempt {
	id: number;
	quiz_id: number;
	user_id: number;
	started_at: string;
	completed_at?: string | null;
	score: number;
	total_points: number;
	earned_coins: number;
	answers: QuizAnswer[];
}

export interface QuizAnswer {
	id: number;
	attempt_id: number;
	question_id: number;
	selected_option_ids: number[];
	is_correct: boolean;
	answered_at: string;
}

export interface QuizProgress {
	quiz_id: number;
	quiz_title: string;
	current_question_index: number;
	total_questions: number;
	answers: Record<number, number[]>; // question_id -> selected_option_ids
	started_at: string;
}

export interface QuizResult {
	attempt: QuizAttempt;
	quiz: Quiz;
	earned_coins: number;
	correct_answers: number;
	total_questions: number;
	percentage: number;
}

export interface QuizzesListResponse {
	quizzes: Quiz[];
}

export interface QuizDetailsResponse {
	quiz: Quiz;
}

export interface SubmitQuizAnswerRequest {
	question_id: number;
	selected_option_ids: number[];
}

export interface SubmitQuizAnswerResponse {
	is_correct: boolean;
	explanation?: string;
	earned_coins: number;
	correct_answer_ids: number[];
}

export interface SubmitQuizRequest {
	quiz_id: number;
	answers: SubmitQuizAnswerRequest[];
}

export interface SubmitQuizResponse {
	result: QuizResult;
}

export interface CompleteQuizPayload {
	telegramId: number;
	score: number;
	earned_coins: number;
}