import { sequelize } from './sequelize';
import '../models';

export async function initDatabase() {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connection established successfully.');

		await sequelize.sync({ alter: true });
		console.log('✅ Database synchronized successfully.');
	} catch (error) {
		console.error('❌ Unable to connect to the database:', error);
		throw error;
	}
}
