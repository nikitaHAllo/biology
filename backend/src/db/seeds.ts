import { query } from './index';
import fs from 'fs';
import path from 'path';

async function runSqlFile(file: string) {
	const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
	await query(sql);
}

export async function seedDatabase() {
	console.log('Seeding minimal data...');
	await runSqlFile('001_seed_minimal.sql');
	console.log('Seeding extra lessons/tasks...');
	await runSqlFile('002_seed_more.sql');
	console.log('Seeding completed.');
}
