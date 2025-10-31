// src/bot/commands/assignments.ts
import { Context } from 'grammy';
import { query } from '../../db';
import { assignmentsService } from '../../features/assignments.service';

export async function submitAssignment(ctx: Context) {
	const caption = ctx.msg?.caption || '';
	const match = caption.match(/assignment:(\d+)/i);
	if (!match) return ctx.reply('Добавьте подпись вида assignment:<lessonId>');

	const lessonId = match[1];
	const file =
		(ctx.msg as any)?.document || (ctx.msg as any)?.photo?.slice(-1)[0];
	if (!file?.file_id) return ctx.reply('Не удалось получить файл.');

	const fileId = file.file_id;
	const fileType = (ctx.msg as any)?.document ? 'document' : 'photo';
	const tgId = String(ctx.from?.id || '');

	// Ensure assignment exists
	const aRes = await query(
		'SELECT * FROM assignments WHERE lesson_id=$1 LIMIT 1',
		[lessonId]
	);
	if (!aRes.rowCount)
		return ctx.reply('Задание для этого урока пока не создано.');
	const assignment = aRes.rows[0];

	// Ensure user exists
	let user = (
		await query(
			'INSERT INTO users (telegram_id, username) VALUES ($1,$2) ON CONFLICT (telegram_id) DO NOTHING RETURNING *',
			[tgId, ctx.from?.username || null]
		)
	).rows[0];

	if (!user) {
		user = (await query('SELECT * FROM users WHERE telegram_id=$1', [tgId]))
			.rows[0];
	}

	const price = Number(process.env.ASSIGNMENT_PRICE || 10);
	if ((user.coins || 0) < price) {
		return ctx.reply(
			`Недостаточно репкоинов. Нужно: ${price}, на счету: ${user.coins}`
		);
	}

	const submission = await assignmentsService.createSubmission(
		String(assignment.id),
		tgId,
		fileId,
		fileType
	);

	await ctx.reply('Работа зарегистрирована и отправлена на проверку.');

	if (process.env.ADMIN_CHAT_ID) {
		await ctx.api.sendMessage(
			Number(process.env.ADMIN_CHAT_ID),
			`Новая работа #${submission.id} от @${
				ctx.from?.username || tgId
			} по уроку ${lessonId}`
		);
	}
}
