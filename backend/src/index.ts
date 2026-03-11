import { app } from './api/server';
import { initBot } from './bot/index';
import { initDatabase } from './db/init';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function main() {
	// Сервер стартует сразу — даже если БД или бот недоступны,
	// API будет работать (вернёт 500 при запросах к БД, но не упадёт)
	app.listen(PORT, () => {
		console.log(`🚀 Server running on http://localhost:${PORT}`);
		console.log(`📊 API: http://localhost:${PORT}/api`);
		console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
	});

	// БД — не блокируем запуск сервера
	try {
		await initDatabase();
		console.log('✅ Database initialized');
	} catch (err) {
		console.error('⚠️  Database init failed (API работает без БД):', err);
	}

	// Бот — не блокируем запуск сервера
	if (process.env.BOT_MODE !== 'webhook') {
		try {
			initBot();
		} catch (err) {
			console.error('⚠️  Bot start failed:', err);
		}
	}
}

main();
