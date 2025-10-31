import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

if (
	process.env.DATABASE_URL &&
	process.env.DATABASE_URL !== 'your_database_url_here'
) {
	pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
	console.warn('DATABASE_URL is not set — database will not be initialized.');
}

// Указываем, что T всегда наследует QueryResultRow
export async function query<T extends QueryResultRow = any>(
	text: string,
	params?: any[]
): Promise<QueryResult<T>> {
	if (!pool) throw new Error('No database connection configured');
	return pool.query<T>(text, params);
}

export async function initDatabase() {
	if (!pool)
		return console.warn('Skipping DB init: DATABASE_URL not configured');

	const initSql = fs.readFileSync(
		path.join(__dirname, 'migrations', '000_init.sql'),
		'utf8'
	);
	await pool.query(initSql);
	console.log('Database schema initialized.');
}
