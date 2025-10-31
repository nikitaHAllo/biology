import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from '../db';
import { errorHandler } from './middleware/error';
import { initBot, bot } from '../bot/index';
import { webhookCallback } from 'grammy';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// ------------------ REST API routes ------------------
// app.use('/api/users', usersRouter);
// app.use('/api/courses', coursesRouter);
// ...

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'OK' }));
app.get('/api/health/db', async (_req, res) => {
	try {
		await query('SELECT 1');
		res.json({ db: 'ok' });
	} catch (err: any) {
		console.error('DB health check failed', err);
		res.status(503).json({ db: 'down', error: String(err) });
	}
});

// Error handler
app.use(errorHandler);

// ------------------ Bot setup ------------------
if (process.env.BOT_MODE === 'webhook') {
	const botUrl = process.env.BOT_WEBHOOK_URL;
	if (!botUrl) throw new Error('BOT_WEBHOOK_URL is required in webhook mode');

	app.use(
		`/${process.env.BOT_SECRET_PATH || 'bot'}`,
		webhookCallback(bot, 'callback')
	);

	console.log(`🤖 Bot running in webhook mode at ${botUrl}`);
} else {
	// Polling
	initBot();
	console.log('🤖 Bot running in polling mode');
}

// Start Express server
app.listen(PORT, () => {
	console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export { app };
