import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';
import { progressCommand } from './commands/progress';
import { helpCommand } from './commands/help';
import { User } from '../models';
import { startCommand } from './commands/start';

dotenv.config();

interface MyContext extends Context {}

const bot = new Bot<MyContext>(process.env.BOT_TOKEN || '');

// Глобальный обработчик ошибок
bot.catch(err => {
	console.error('BotError', err);
});

// Обработчики callback-кнопок
bot.on('callback_query', async ctx => {
	const callbackData = ctx.callbackQuery?.data;

	switch (callbackData) {
		case 'show_coins':
			await ctx.answerCallbackQuery();
			try {
				const user = await User.findOne({
					where: { telegram_id: ctx.from?.id },
				});
				const coins = user?.get('coins') || 0;
				await ctx.reply(`💰 На вашем счету: *${coins} репкоинов*`, {
					parse_mode: 'Markdown',
				});
			} catch (error) {
				await ctx.reply('❌ Не удалось получить информацию о репкоинах');
			}
			break;

		case 'show_progress':
			await ctx.answerCallbackQuery();
			await progressCommand(ctx);
			break;

		case 'show_help':
			await ctx.answerCallbackQuery();
			await helpCommand(ctx);
			break;

		case 'show_courses':
			await ctx.answerCallbackQuery();
			await ctx.reply(
				'📚 Переходи в учебный центр чтобы увидеть все доступные курсы!'
			);
			break;

		case 'show_quizzes':
			await ctx.answerCallbackQuery();
			await ctx.reply(
				'🎯 Викторины доступны в учебном центре! Нажми "Открыть учебный центр" чтобы начать тренироваться.'
			);
			break;

		case 'show_assignments':
			await ctx.answerCallbackQuery();
			await ctx.reply(
				'🔬 Для работы с заданиями 2-й части перейди в учебный центр → раздел "Задания".'
			);
			break;

		default:
			await ctx.answerCallbackQuery();
			break;
	}
});

// Команды /progress и /help
bot.command('start', startCommand);
bot.command('progress', progressCommand);
bot.command('help', helpCommand);

// Запускает polling — ошибки не роняют сервер
export const initBot = (): void => {
	bot.start().catch(err => {
		console.error('⚠️  Bot polling error (сервер продолжает работу):', (err as Error).message);
	});
	console.log('🤖 Bot started in polling mode');
};

export { bot };
