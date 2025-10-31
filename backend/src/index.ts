import { app } from './api/server';
import { initBot } from './bot/index';
import { initDatabase } from './db/index';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function main() {
	try {
		// Инициализация базы данных
		await initDatabase();

		// Запуск сервера
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});

		// Запуск бота
		initBot();
	} catch (err) {
		console.error('Failed to initialize database', err);
		process.exit(1);
	}
}

main();
