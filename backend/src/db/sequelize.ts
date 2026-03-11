import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
	console.error('❌ DATABASE_URL не задан в .env — добавь строку подключения к PostgreSQL');
}

const sequelize = new Sequelize(dbUrl ?? 'postgres://postgres:postgres@localhost:5432/biology', {
	dialect: 'postgres',
	logging: false,
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
	define: {
		timestamps: true,
		underscored: true,
	},
});

export { sequelize };
