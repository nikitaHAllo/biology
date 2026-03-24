import { sequelize } from './sequelize';
import {
	User,
	WalletTransaction,
	Course,
	Lesson,
	Task,
	UserQuizResult,
	UserProgress,
	Achievement,
	UserAchievement,
	Assignment,
	AssignmentSubmission,
	AssignmentReview,
} from '../models';
import { seedCatalogData } from './seedCatalog';
import { seedBioGardenData } from './seedBiogarden';
import { migrateUserAuth } from './migrateUserAuth';
import { migrateEmailVerification } from './migrateEmailVerification';

export async function initDatabase() {
	try {
		// Проверяем подключение
		await sequelize.authenticate();
		console.log('✅ Database connection established successfully.');

		// Синхронизируем модели с базой данных
		await sequelize.sync({ force: false }); // force: true удаляет таблицы и создает заново (только для разработки!)
		console.log('✅ Database synchronized successfully.');

		await migrateUserAuth();
		await migrateEmailVerification();

		await seedCatalogData();
		console.log('✅ Catalog data ensured.');
		 await seedBioGardenData();
		console.log('✅ BioGardenData data ensured.');
	} catch (error) {
		console.error('❌ Unable to connect to the database:', error);
		throw error;
	}
}
