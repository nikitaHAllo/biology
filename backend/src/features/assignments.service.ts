// src/features/assignments.service.ts
import { query } from '../db'; // <-- импорт функции query

// Типы
export type Assignment = {
	id: number;
	lesson_id: number;
	title: string;
	requirements?: string;
	answer_elements?: any;
};

export type AssignmentSubmission = {
	id: number;
	assignment_id: number;
	user_id: number;
	file_id: string;
	file_type: string;
	status: 'pending' | 'reviewing' | 'graded' | 'rejected';
	created_at: string;
};

// Сервис
export const assignmentsService = {
	async getByLesson(lessonId: string): Promise<Assignment | null> {
		const res = await query<Assignment>(
			'SELECT * FROM assignments WHERE lesson_id = $1',
			[lessonId]
		);
		return res.rows[0] ?? null;
	},

	async createSubmission(
		assignmentId: string,
		userTelegramId: string,
		fileId: string,
		fileType: string
	): Promise<AssignmentSubmission> {
		const userRes = await query<{ id: number; coins: number }>(
			'SELECT id, coins FROM users WHERE telegram_id = $1',
			[userTelegramId]
		);
		const user = userRes.rows[0];
		if (!user) throw new Error('User not found');

		const price = Number(process.env.ASSIGNMENT_PRICE || 10);

		await query('BEGIN');
		try {
			const fresh = await query<{ id: number; coins: number }>(
				'SELECT id, coins FROM users WHERE id = $1 FOR UPDATE',
				[user.id]
			);
			const coins = fresh.rows[0]?.coins ?? 0;
			if (coins < price) throw new Error('INSUFFICIENT_FUNDS');

			const ins = await query<AssignmentSubmission>(
				'INSERT INTO assignment_submissions (assignment_id, user_id, file_id, file_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
				[assignmentId, user.id, fileId, fileType, 'pending']
			);

			if (!ins.rows[0]) throw new Error('Failed to create submission');

			await query('UPDATE users SET coins = coins - $1 WHERE id = $2', [
				price,
				user.id,
			]);
			await query(
				'INSERT INTO wallet_transactions (user_id, type, amount, source, meta) VALUES ($1, $2, $3, $4, $5)',
				[
					user.id,
					'debit',
					price,
					'assignment_submission',
					JSON.stringify({ assignmentId }),
				]
			);

			await query('COMMIT');
			return ins.rows[0];
		} catch (e) {
			await query('ROLLBACK');
			throw e;
		}
	},

	async listSubmissionsByUser(
		telegramId: string
	): Promise<AssignmentSubmission[]> {
		const res = await query<AssignmentSubmission>(
			`SELECT s.* FROM assignment_submissions s
       JOIN users u ON u.id = s.user_id
       WHERE u.telegram_id = $1
       ORDER BY s.id DESC`,
			[telegramId]
		);
		return res.rows ?? [];
	},
};
