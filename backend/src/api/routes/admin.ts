import express from 'express';
import { query } from '../../db';

const router = express.Router();

router.get('/submissions', async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending');
    const r = await query('SELECT * FROM assignment_submissions WHERE status = $1 ORDER BY id', [status]);
    res.json(r.rows);
  } catch (e) { next(e as Error); }
});

router.post('/submissions/:id/review', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { score, comment, checklist } = req.body;

    await query('BEGIN');
    try {
      await query('UPDATE assignment_submissions SET status = $1 WHERE id = $2', ['graded', id]);
      const ins = await query(
        'INSERT INTO assignment_reviews (submission_id, reviewer_id, score, comment, checklist) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, null, score ?? 0, comment ?? '', checklist ?? null]
      );
      await query('COMMIT');

      // Notify user via bot
      try {
        const r = await query(
          `SELECT u.telegram_id FROM assignment_submissions s
           JOIN users u ON u.id = s.user_id WHERE s.id = $1`, [id]
        );
        const tgId = r.rows[0]?.telegram_id;
        if (tgId && process.env.BOT_TOKEN) {
          const { Bot } = await import('grammy');
          const bot = new Bot(process.env.BOT_TOKEN);
          await bot.api.sendMessage(Number(tgId), `Результат проверки: ${score ?? 0}/100\nКомментарий: ${comment ?? '—'}`);
        }
      } catch (e) {
        console.error('Failed to notify user about review', e);
      }

      res.json({ ok: true, review: ins.rows[0] });
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  } catch (e) { next(e as Error); }
});

export const adminRouter = router;
