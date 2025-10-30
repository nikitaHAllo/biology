import { app } from './api/server';
import { initBot } from './bot/index';
import { initDatabase } from './db/index';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Инициализируем базу и запускаем сервер + бот
initDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});

		// Запускаем бота
		initBot();
	})
	.catch(err => {
		console.error('Failed to initialize database', err);
		process.exit(1);
	});
