import { sequelize } from './sequelize';

/**
 * Идемпотентная миграция для веб-авторизации (PostgreSQL):
 * — колонки email, password_hash
 * — telegram_id может быть NULL (веб-пользователи)
 * — частичные UNIQUE-индексы вместо глобального UNIQUE на telegram_id
 */
export async function migrateUserAuth(): Promise<void> {
	const dialect = sequelize.getDialect();
	if (dialect !== 'postgres') {
		console.warn(
			'⚠️  migrateUserAuth: ожидается PostgreSQL, пропускаем миграцию.',
		);
		return;
	}

	const run = async (sql: string) => sequelize.query(sql);

	try {
		await run(`
			ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
			ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
		`);

		await run(`
			DO $$
			BEGIN
				IF EXISTS (
					SELECT 1 FROM pg_constraint
					WHERE conrelid = 'users'::regclass
						AND contype = 'u'
						AND conname = 'users_telegram_id_key'
				) THEN
					ALTER TABLE users DROP CONSTRAINT users_telegram_id_key;
				END IF;
			END $$;
		`);

		await run(`
			ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;
		`);

		await run(`
			CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_id_unique
			ON users (telegram_id) WHERE telegram_id IS NOT NULL;
		`);

		await run(`
			CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
			ON users (lower(trim(email)))
			WHERE email IS NOT NULL AND trim(email) <> '';
		`);

		console.log('✅ Auth migration (users email / partial uniques) applied.');
	} catch (e) {
		console.error('❌ migrateUserAuth failed:', e);
		throw e;
	}
}
