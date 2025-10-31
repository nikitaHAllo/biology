// Общие типы для проекта
declare namespace App {
	interface User {
		id: number;
		telegram_id: string; // добавил для телеграм
		username?: string;
		coins: number;
		email?: string;
	}

	interface Lesson {
		id: number;
		course_id: number;
		title: string;
		content?: string;
		order_index: number;
	}

	interface Course {
		id: number;
		title: string;
		description?: string;
	}

	interface Task {
		id: number;
		lesson_id: number;
		type: 'single' | 'multiple' | 'text';
		question: string;
		options?: any;
		answer?: any;
		reward_coins?: number;
	}

	interface Assignment {
		id: number;
		lesson_id: number;
		title: string;
		requirements?: string;
		answer_elements?: any;
	}

	interface AssignmentSubmission {
		id: number;
		assignment_id: number;
		user_id: number;
		file_id: string;
		file_type: 'photo' | 'document';
		status: 'pending' | 'reviewing' | 'graded' | 'rejected';
		created_at: string;
	}
}
