// src/bot/commands/admin.ts
import { Bot, Context } from 'grammy';
import { query } from '../../db';
import { assignmentsService } from '../../features/assignments.service';

export async function listSubmissions(ctx: Context) {
	const status = String(ctx.match || 'pending');
	const r = await query(
		'SELECT * FROM assignment_submissions WHERE status = $1 ORDER BY id',
		[status]
	);
	if (!r.rowCount) return ctx.reply('Нет заявок с таким статусом.');
	return ctx.reply(JSON.stringify(r.rows, null, 2));
}

export async function reviewSubmission(
	ctx: Context,
	submissionId: string,
	score: number,
	comment?: string,
	checklist?: Record<string, boolean>
) {
	await query('BEGIN');
	try {
		await query('UPDATE assignment_submissions SET status=$1 WHERE id=$2', [
			'graded',
			submissionId,
		]);
		const ins = await query(
			'INSERT INTO assignment_reviews (submission_id, reviewer_id, score, comment, checklist) VALUES ($1,$2,$3,$4,$5) RETURNING *',
			[submissionId, null, score ?? 0, comment ?? '', checklist ?? null]
		);
		await query('COMMIT');

		// Notify user
		const r = await query(
			`SELECT u.telegram_id FROM assignment_submissions s
       JOIN users u ON u.id=s.user_id WHERE s.id=$1`,
			[submissionId]
		);
		const tgId = r.rows[0]?.telegram_id;
		if (tgId && process.env.BOT_TOKEN) {
			const bot = new Bot(process.env.BOT_TOKEN);
			await bot.api.sendMessage(
				Number(tgId),
				`Результат проверки: ${score ?? 0}/100\nКомментарий: ${comment ?? '—'}`
			);
		}

		return ins.rows[0];
	} catch (err) {
		await query('ROLLBACK');
		throw err;
	}
}
