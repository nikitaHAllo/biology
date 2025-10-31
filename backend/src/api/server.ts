// src/api/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from '../db';
import { errorHandler } from './middleware/error';
import { usersRouter } from './routes/users'
import { coursesRouter } from './routes/courses';
import { lessonsRouter } from './routes/lessons';
import { tasksRouter } from './routes/tasks';
import { progressRouter } from './routes/progress';
import { assignmentsRouter } from './routes/assignments';
import { adminRouter } from './routes/admin';
import { metaRouter } from './routes/meta';
import { initBot } from '../bot/index';
import { webhookCallback } from 'grammy';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// REST API
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/progress', progressRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/meta', metaRouter);

// Health check
app.get('/api/health', (_req, res) => {
	res.json({ status: 'OK' });
});
app.get('/api/health/db', async (_req, res) => {
	try {
		await query('SELECT 1');
		res.json({ db: 'ok' });
	} catch (err) {
		console.error('DB health check failed', err);
		res.status(503).json({ db: 'down', error: String(err) });
	}
});

// Error handler
app.use(errorHandler);

// ====================
// Bot initialization
// ====================
const bot = initBot(); // вернет объект Bot без запуска start()

if (process.env.BOT_MODE === 'webhook') {
	const botUrl = process.env.BOT_WEBHOOK_URL;
	if (!botUrl) throw new Error('BOT_WEBHOOK_URL is required in webhook mode');

	// Webhook через Express
	app.use(
		`/${process.env.BOT_SECRET_PATH || 'bot'}`,
		webhookCallback(bot, {
			onError: err => console.error('Bot webhook error', err),
		})
	);

	console.log(`🤖 Bot running in webhook mode at ${botUrl}`);
} else {
	// Polling (локальная разработка)
	bot.start();
	console.log('🤖 Bot running in polling mode');
}

// Start Express
app.listen(PORT, () => {
	console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
