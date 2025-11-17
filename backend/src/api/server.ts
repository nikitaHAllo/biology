import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error';
import { initBot, bot } from '../bot/index';
import { webhookCallback } from 'grammy';
import { apiRouter } from './routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(
	cors({
		origin: (origin, callback) => {
			// Разрешаем все origins или конкретные домены
			const allowedOrigins = [
				process.env.FRONTEND_URL,
				'https://glsxnl83-5173.euw.devtunnels.ms',
				'http://localhost:5173',
				'http://localhost:3000',
			];

			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Id'],
	})
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health checks
app.get('/api/health', (_req, res) =>
	res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.get('/api/health/db', async (_req, res) => {
	try {
		// Простая проверка подключения к БД через Sequelize
		const { sequelize } = await import('../models');
		await sequelize.authenticate();
		res.json({ db: 'ok', timestamp: new Date().toISOString() });
	} catch (err: any) {
		console.error('DB health check failed', err);
		res.status(503).json({
			db: 'down',
			error: err.message,
			timestamp: new Date().toISOString(),
		});
	}
});

// API Routes
app.use('/api', apiRouter);

// Bot webhook route (если используется webhook mode)
if (process.env.BOT_MODE === 'webhook') {
	const botUrl = process.env.BOT_WEBHOOK_URL;
	if (!botUrl) throw new Error('BOT_WEBHOOK_URL is required in webhook mode');

	const secretPath = process.env.BOT_SECRET_PATH || 'bot';
	app.use(`/${secretPath}`, webhookCallback(bot, 'express'));

	console.log(`🤖 Bot running in webhook mode at ${botUrl}`);
} else {
	// Polling mode
	initBot();
	console.log('🤖 Bot running in polling mode');
}


// Error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
	app.listen(PORT, () => {
		console.log(`🚀 Server is running on http://localhost:${PORT}`);
		console.log(`📊 API available at http://localhost:${PORT}/api`);
		console.log(`❤️ Health check at http://localhost:${PORT}/api/health`);
	});
}

export { app };
