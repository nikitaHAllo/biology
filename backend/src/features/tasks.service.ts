// src/features/tasks.service.ts
import { query } from '../db';

export type Task = {
	id: number;
	lesson_id: number;
	type: 'single' | 'multiple' | 'text';
	question: string;
	options?: any;
	answer?: any;
	reward_coins?: number;
};

export type User = {
	id: number;
	coins: number;
};

export const tasksService = {
	async byLesson(lessonId: string): Promise<Task[]> {
		const res = await query<Task>(
			'SELECT id, lesson_id, type, question, options, reward_coins FROM tasks WHERE lesson_id = $1 ORDER BY id',
			[lessonId]
		);
		return res.rows;
	},

	async submit(
		taskId: string,
		userTelegramId: string,
		answer: any
	): Promise<{
		ok: boolean;
		correct?: boolean;
		reward?: number;
		message?: string;
	}> {
		// Получаем задание
		const taskRes = await query<Task>('SELECT * FROM tasks WHERE id = $1', [
			taskId,
		]);
		const task = taskRes.rows[0];
		if (!task) return { ok: false, message: 'Task not found' };

		// Получаем пользователя
		const userRes = await query<User>(
			'SELECT id, coins FROM users WHERE telegram_id = $1',
			[userTelegramId]
		);
		const user = userRes.rows[0];
		if (!user) return { ok: false, message: 'User not found' };

		// Проверяем правильность ответа
		let isCorrect = false;
		if (task.type === 'single' || task.type === 'multiple') {
			isCorrect = JSON.stringify(answer) === JSON.stringify(task.answer);
		} else if (task.type === 'text') {
			isCorrect =
				String(answer || '')
					.trim()
					.toLowerCase() ===
				String(task.answer || '')
					.trim()
					.toLowerCase();
		}

		// Проверка, решал ли пользователь задание ранее
		const existsRes = await query<{ dummy: number }>(
			'SELECT 1 FROM user_task_results WHERE user_id = $1 AND task_id = $2 AND is_correct = true',
			[user.id, task.id]
		);
		if ((existsRes?.rowCount ?? 0) > 0) {
			await query(
				'INSERT INTO user_task_results (user_id, task_id, is_correct) VALUES ($1, $2, $3)',
				[user.id, task.id, isCorrect]
			);
			return { ok: true, correct: isCorrect, reward: 0 };
		}

		// Записываем результат
		await query(
			'INSERT INTO user_task_results (user_id, task_id, is_correct) VALUES ($1, $2, $3)',
			[user.id, task.id, isCorrect]
		);

		let reward = 0;
		if (isCorrect) {
			reward = task.reward_coins ?? 0;
			await query('UPDATE users SET coins = coins + $1 WHERE id = $2', [
				reward,
				user.id,
			]);
			await query(
				'INSERT INTO wallet_transactions (user_id, type, amount, source) VALUES ($1, $2, $3, $4)',
				[user.id, 'credit', reward, 'quiz']
			);
		}

		return { ok: true, correct: isCorrect, reward };
	},
};
