import { query } from '../db';

export type User = {
	id: number;
	telegram_id: string;
	username?: string;
	coins: number;
};

export const usersService = {
	async registerOrUpdate(
		telegram_id: string,
		username?: string
	): Promise<User> {
		const result = await query<User>(
			`INSERT INTO users (telegram_id, username) VALUES ($1, $2)
       ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username RETURNING *`,
			[telegram_id, username ?? undefined]
		);

		const user = result.rows[0];
		if (!user) throw new Error('Failed to register or update user');
		return user;
	},

	async getByTelegramId(telegram_id: string): Promise<User | null> {
		const result = await query<User>(
			'SELECT * FROM users WHERE telegram_id = $1',
			[telegram_id]
		);
		return result.rows[0] || null;
	},

	async adjustCoins(telegram_id: string, delta: number): Promise<User | null> {
		const result = await query<User>(
			'UPDATE users SET coins = coins + $1 WHERE telegram_id = $2 RETURNING *',
			[delta, telegram_id]
		);
		return result.rows[0] || null;
	},

	async profile(telegram_id: string): Promise<{
		user: User;
		progress: { completedLessons: number };
		achievements: any[];
		coins: number;
	} | null> {
		const user = await this.getByTelegramId(telegram_id);
		if (!user) return null;
		return {
			user,
			progress: { completedLessons: 0 },
			achievements: [],
			coins: user.coins,
		};
	},
};
