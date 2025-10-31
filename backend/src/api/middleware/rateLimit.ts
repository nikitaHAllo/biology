import { query } from '../../db';
import { Request, Response, NextFunction } from 'express';

// Simple DB-backed rate limiter per user+action window (per 10 minutes)
// Requires actions_log table; we fallback to in-memory if table not present.

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 10;

// naive in-memory fallback
const mem: Record<string, number[]> = {};

export async function rateLimit(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = String((req.body?.telegram_id) || (req.params?.telegram_id) || '');
      if (!user) return res.status(400).json({ error: 'telegram_id required for rate limit' });

      const now = Date.now();
      const key = `${action}:${user}`;
      const windowStart = now - WINDOW_MS;

      // Try DB-backed log
      try {
        await query('CREATE TABLE IF NOT EXISTS actions_log (id SERIAL PRIMARY KEY, user_telegram_id TEXT, action TEXT, created_at TIMESTAMP DEFAULT NOW())');
        await query('DELETE FROM actions_log WHERE created_at < NOW() - INTERVAL ' + `'${WINDOW_MS/1000} seconds'`);
        const count = await query('SELECT COUNT(*)::int AS cnt FROM actions_log WHERE user_telegram_id = $1 AND action = $2 AND created_at >= NOW() - INTERVAL ' + `'${WINDOW_MS/1000} seconds'`, [user, action]);
        if ((count.rows[0]?.cnt || 0) >= MAX_ATTEMPTS) {
          return res.status(429).json({ error: 'Too many requests. Try later.' });
        }
        await query('INSERT INTO actions_log (user_telegram_id, action) VALUES ($1, $2)', [user, action]);
        return next();
      } catch {}

      // Fallback in-memory
      if (!mem[key]) mem[key] = [];
      mem[key] = mem[key].filter(ts => ts > windowStart);
      if (mem[key].length >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many requests. Try later.' });
      }
      mem[key].push(now);
      next();
    } catch (e) {
      next(e);
    }
  }
}
