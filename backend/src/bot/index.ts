import { Bot } from 'grammy';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN || '');

// Global error handler so the bot doesn't crash
bot.catch(err => {
	console.error('BotError', err);
});

// Обработчик команды /start — отправляет кнопку открытия Mini App
bot.command('start', async ctx => {
	const url = process.env.FRONTEND_URL || 'http://localhost:3000/mini';
	const isHttps = url.startsWith('https://');

	try {
		if (isHttps) {
			// Send Web App button (only allowed for HTTPS)
			await ctx.reply('🔗 Открыть Mini App', {
				reply_markup: {
					inline_keyboard: [[{ text: 'Открыть', web_app: { url } }]],
				},
			});
		} else {
			// Fallback: send a normal URL button and an explanatory message
			await ctx.reply(
				'Внимание: Web App требует HTTPS. Пока используется не-HTTPS URL. Для полноценной работы откройте ссылку в браузере или используйте ngrok (см. README).'
			);
			await ctx.reply('Открыть Mini App в браузере', {
				reply_markup: {
					inline_keyboard: [[{ text: 'Открыть в браузере', url }]],
				},
			});
		}
	} catch (e) {
		console.error('Failed to send start message', e);
	}
});

export const initBot = () => {
	bot.start();
	console.log('Bot started successfully');
};
