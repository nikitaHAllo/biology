import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

if (
	process.env.DATABASE_URL &&
	process.env.DATABASE_URL !== 'your_database_url_here'
) {
	pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
	console.warn(
		'DATABASE_URL is not set or is a placeholder — database will not be initialized.'
	);
}

export const query = async (text: string, params?: any[]) => {
	if (!pool) throw new Error('No database connection configured');
	return pool.query(text, params);
};

export const initDatabase = async () => {
	if (!pool) {
		console.warn(
			'Skipping database initialization because DATABASE_URL is not configured.'
		);
		return;
	}

	const create = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      username TEXT,
      coins INT DEFAULT 0
    );
  `;

	await pool.query(create);
	console.log('Database initialized (users table checked/created)');
};
