import express from 'express';
import { query } from '../../db/index';

const router = express.Router();

// Register or get user (by telegram_id)
router.post('/register', async (req, res) => {
	try {
		const { telegram_id, username } = req.body;
		if (!telegram_id)
			return res.status(400).json({ error: 'telegram_id is required' });

		const insertText = `INSERT INTO users (telegram_id, username) VALUES ($1, $2) ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username RETURNING *`;
		const result = await query(insertText, [telegram_id, username]);
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'DB error' });
	}
});

// Get user by telegram_id
router.get('/:telegram_id', async (req, res) => {
	try {
		const { telegram_id } = req.params;
		const result = await query('SELECT * FROM users WHERE telegram_id = $1', [
			telegram_id,
		]);
		if (result.rows.length === 0)
			return res.status(404).json({ error: 'Not found' });
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'DB error' });
	}
});

// Adjust coins
router.post('/:telegram_id/coins', async (req, res) => {
	try {
		const { telegram_id } = req.params;
		const { delta } = req.body;
		const result = await query(
			'UPDATE users SET coins = coins + $1 WHERE telegram_id = $2 RETURNING *',
			[delta || 0, telegram_id]
		);
		if (result.rows.length === 0)
			return res.status(404).json({ error: 'Not found' });
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'DB error' });
	}
});

export const usersRouter = router;
