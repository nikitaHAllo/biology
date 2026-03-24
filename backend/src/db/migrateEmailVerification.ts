import { sequelize } from './sequelize';

/** Колонки подтверждения email + бэкап: старые веб-пользователи считаются подтверждёнными */
export async function migrateEmailVerification(): Promise<void> {
	const dialect = sequelize.getDialect();
	if (dialect !== 'postgres') {
		console.warn('⚠️  migrateEmailVerification: пропуск (не Postgres).');
		return;
	}

	const run = async (sql: string) => sequelize.query(sql);

	try {
		await run(`
			ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
			ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code_hash TEXT;
			ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP WITH TIME ZONE;
		`);

		// Уже зарегистрированные по email+паролю в прошлом без полей подтверждения — считаем почту подтверждённой.
		// Важно: новых пользователей, которые только что зарегистрировались и ждут код (code_hash заполнен),
		// не трогаем.
		await run(`
			UPDATE users
			SET email_verified_at = COALESCE(email_verified_at, created_at)
			WHERE password_hash IS NOT NULL
				AND email IS NOT NULL
				AND trim(email) <> ''
				AND email_verification_code_hash IS NULL
				AND email_verification_expires_at IS NULL
				AND email_verified_at IS NULL;
		`);

		console.log('✅ Email verification columns + backfill applied.');
	} catch (e) {
		console.error('❌ migrateEmailVerification failed:', e);
		throw e;
	}
}
