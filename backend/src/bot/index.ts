import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';
import { progressCommand } from './commands/progress';
import { helpCommand } from './commands/help';
import { assignmentsService } from '../features/assignments.service';
import { query } from '../db';

dotenv.config();

// Расширяем Context для TS, если нужно добавить свои поля
interface MyContext extends Context {}

const bot = new Bot<MyContext>(process.env.BOT_TOKEN || '');

// Глобальный обработчик ошибок
bot.catch(err => {
	console.error('BotError', err);
});

// Команда /start
bot.command('start', async ctx => {
	const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
	const baseUrl = rawUrl.replace(/\/+$/, '');
	const isHttps = baseUrl.startsWith('https://');

	const buttons = [
		[
			{
				text: 'Открыть',
				web_app: isHttps ? { url: baseUrl } : undefined,
				url: isHttps ? undefined : baseUrl,
			},
		],
		[{ text: 'Курсы', url: `${baseUrl}/?tab=courses` }],
		[{ text: 'Мой прогресс', url: `${baseUrl}/?tab=progress` }],
		[{ text: 'Задания 2-й части', url: `${baseUrl}/?tab=assignments` }],
	];

	try {
		await ctx.reply('🔗 Mini App и быстрые ссылки', {
			reply_markup: { inline_keyboard: buttons as any },
		});
	} catch (e) {
		console.error('Failed to send start message', e);
	}
});

// Команды /progress и /help
bot.command('progress', progressCommand);
bot.command('help', helpCommand);

// Обработчик фото/документов для заданий
bot.on(['message:photo', 'message:document'], async ctx => {
	const caption = ctx.msg?.caption || '';
	const match = caption.match(/assignment:(\d+)/i);
	if (!match) return ctx.reply('Добавьте подпись вида: assignment:<lessonId>');

	const lessonId = match[1];
	const file =
		(ctx.msg as any)?.document || (ctx.msg as any)?.photo?.slice(-1)[0];
	const fileId = file?.file_id;
	const fileType = (ctx.msg as any)?.document ? 'document' : 'photo';
	const userTelegramId = String(ctx.from?.id || '');

	if (!fileId) return ctx.reply('Не удалось получить файл.');

	try {
		// Проверка задания
		const aRes = await query(
			'SELECT a.* FROM assignments a WHERE a.lesson_id = $1 LIMIT 1',
			[lessonId]
		);
		if (!aRes.rowCount) return ctx.reply('Задание для этого урока не создано.');
		const assignment = aRes.rows[0];

		// Авт-регистрация пользователя
		const uRes = await query(
			'INSERT INTO users (telegram_id, username) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING RETURNING *',
			[userTelegramId, ctx.from?.username || null]
		);
		let user = uRes.rows[0];
		if (!user) {
			const g = await query('SELECT * FROM users WHERE telegram_id = $1', [
				userTelegramId,
			]);
			user = g.rows[0];
		}

		// Проверка баланса
		const price = Number(process.env.ASSIGNMENT_PRICE || 10);
		if ((user.coins || 0) < price) {
			return ctx.reply(
				`Недостаточно репкоинов. Требуется: ${price}, у вас: ${user.coins}`
			);
		}

		// Создание submission
		const submission = await assignmentsService.createSubmission(
			String(assignment.id),
			userTelegramId,
			fileId,
			fileType
		);

		await ctx.reply('Работа зарегистрирована и отправлена на проверку.');

		// Уведомление админа
		const adminChat = process.env.ADMIN_CHAT_ID;
		if (adminChat) {
			await ctx.api.sendMessage(
				Number(adminChat),
				`Новая работа #${submission.id} от @${
					ctx.from?.username || userTelegramId
				} по уроку ${lessonId}`
			);
		}
	} catch (e) {
		console.error('Assignment submit failed', e);
		await ctx.reply('Не удалось зарегистрировать работу. Попробуйте позже.');
	}
});

// Экспорт функции для старта бота
export const initBot = () => {
	bot.start();
	console.log('Bot started successfully');
};

export { bot };
