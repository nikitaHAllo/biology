import { query } from '../db';

export const usersService = {
  async registerOrUpdate(telegram_id: string, username?: string) {
    const insertText = `INSERT INTO users (telegram_id, username) VALUES ($1, $2)
      ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username RETURNING *`;
    const result = await query(insertText, [telegram_id, username]);
    return result.rows[0];
  },

  async getByTelegramId(telegram_id: string) {
    const result = await query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    return result.rows[0] || null;
  },

  async adjustCoins(telegram_id: string, delta: number) {
    const result = await query(
      'UPDATE users SET coins = coins + $1 WHERE telegram_id = $2 RETURNING *',
      [delta, telegram_id]
    );
    return result.rows[0] || null;
  },

  async profile(telegram_id: string) {
    const user = await this.getByTelegramId(telegram_id);
    if (!user) return null;
    // TODO: aggregate progress/achievements later
    return { user, progress: { completedLessons: 0 }, achievements: [], coins: user.coins };
  },
};
