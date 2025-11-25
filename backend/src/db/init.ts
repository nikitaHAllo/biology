import { sequelize } from './sequelize';
import {
	User,
	WalletTransaction,
	Course,
	Lesson,
	Task,
	UserTaskResult,
	UserProgress,
	Achievement,
	UserAchievement,
	Assignment,
	AssignmentSubmission,
	AssignmentReview,
} from '../models';
import { seedCatalogData } from './seedCatalog';

export async function initDatabase() {
	try {
		// Проверяем подключение
		await sequelize.authenticate();
		console.log('✅ Database connection established successfully.');

		// Синхронизируем модели с базой данных
		await sequelize.sync({ force: false }); // force: true удаляет таблицы и создает заново (только для разработки!)
		console.log('✅ Database synchronized successfully.');

		await seedCatalogData();
		console.log('✅ Catalog data ensured.');
	} catch (error) {
		console.error('❌ Unable to connect to the database:', error);
		throw error;
	}
}
