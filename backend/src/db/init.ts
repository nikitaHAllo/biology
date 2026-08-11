import { sequelize } from './sequelize';
import '../models';

export async function initDatabase() {
	try {
		await sequelize.authenticate();
		console.log('✅ Database connection established successfully.');

		// Add open_ended to question_type ENUM if not present (Postgres ALTER TYPE)
		await sequelize.query(`
			DO $$ BEGIN
				IF EXISTS (
					SELECT 1 FROM pg_type t
					JOIN pg_enum e ON e.enumtypid = t.oid
					WHERE t.typname = 'enum_quiz_questions_question_type'
					  AND e.enumlabel = 'single_choice'
				) AND NOT EXISTS (
					SELECT 1 FROM pg_type t
					JOIN pg_enum e ON e.enumtypid = t.oid
					WHERE t.typname = 'enum_quiz_questions_question_type'
					  AND e.enumlabel = 'open_ended'
				) THEN
					ALTER TYPE "enum_quiz_questions_question_type" ADD VALUE 'open_ended';
				END IF;
			END $$;
		`).catch(() => {/* table may not exist yet on first run */});

		await sequelize.sync({ alter: true });
		console.log('✅ Database synchronized successfully.');
	} catch (error) {
		console.error('❌ Unable to connect to the database:', error);
		throw error;
	}
}
