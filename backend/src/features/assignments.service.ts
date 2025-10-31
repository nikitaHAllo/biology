import { query } from '../db';

export const assignmentsService = {
  async getByLesson(lessonId: string) {
    const res = await query('SELECT * FROM assignments WHERE lesson_id = $1', [lessonId]);
    return res.rows[0] || null;
  },
  async createSubmission(assignmentId: string, userTelegramId: string, fileId: string, fileType: string) {
    const userRes = await query('SELECT id, coins FROM users WHERE telegram_id = $1', [userTelegramId]);
    const user = userRes.rows[0];
    if (!user) throw new Error('User not found');

    const price = Number(process.env.ASSIGNMENT_PRICE || 10);

    await query('BEGIN');
    try {
      // re-check balance in tx
      const fresh = await query('SELECT id, coins FROM users WHERE id = $1 FOR UPDATE', [user.id]);
      const coins = fresh.rows[0].coins || 0;
      if (coins < price) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      const ins = await query(
        'INSERT INTO assignment_submissions (assignment_id, user_id, file_id, file_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [assignmentId, user.id, fileId, fileType, 'pending']
      );

      await query('UPDATE users SET coins = coins - $1 WHERE id = $2', [price, user.id]);
      await query(
        'INSERT INTO wallet_transactions (user_id, type, amount, source, meta) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'debit', price, 'assignment_submission', JSON.stringify({ assignmentId })]
      );

      await query('COMMIT');
      return ins.rows[0];
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  },
  async listSubmissionsByUser(telegramId: string) {
    const res = await query(
      `SELECT s.* FROM assignment_submissions s
       JOIN users u ON u.id = s.user_id
       WHERE u.telegram_id = $1
       ORDER BY s.id DESC`,
      [telegramId]
    );
    return res.rows;
  },
};
