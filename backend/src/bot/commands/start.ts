import { Context } from 'grammy';
import { usersService } from '../../services/users.service';

export async function startCommand(ctx: Context): Promise<void> {
	const user = ctx.from;
	if (!user) return;

	try {
		// Регистрируем/обновляем пользователя в базе
		const dbUser = await usersService.registerOrUpdateUser(
			user.id,
			user.username
		);

		const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
		const baseUrl = rawUrl.replace(/\/+$/, '');
		const isHttps = baseUrl.startsWith('https://');

		// Красивое приветственное сообщение
		const welcomeMessage = `🎓 *Добро пожаловать в БиоЛаб, ${
			user.first_name || 'друг'
		}!*

Приветствуем тебя в интерактивной платформе для подготовки к ЕГЭ по биологии! 

🌟 *Что тебя ждет:*
• 📚 Структурированные материалы по всем темам ЕГЭ
• 🧪 Интерактивные викторины и тесты
• 🔬 Уникальные игровые модули
• 📝 Задания 2-й части с проверкой
• 🎮 Система репкоинов за прогресс

💫 *Твой стартовый бонус:* 10 репкоинов!

*Быстрый доступ к функциям:*`;

		const buttons = [
			[
				{
					text: '🚀 Открыть учебный центр',
					web_app: isHttps
						? { url: baseUrl }
						: { url: 'http://localhost:3000' },
				},
			],
			[
				{ text: '📚 Курсы', callback_data: 'show_courses' },
				{ text: '📊 Прогресс', callback_data: 'show_progress' },
			],
			[
				{ text: '🎯 Викторины', callback_data: 'show_quizzes' },
				{ text: '🔬 Задания', callback_data: 'show_assignments' },
			],
			[
				{ text: '💰 Мои репкоины', callback_data: 'show_coins' },
				{ text: '❓ Помощь', callback_data: 'show_help' },
			],
		];

		await ctx.reply(welcomeMessage, {
			parse_mode: 'Markdown',
			reply_markup: { inline_keyboard: buttons },
		});

		// Дополнительное сообщение с инструкциями
		const instructions = `💡 *Как пользоваться ботом:*

• Используй кнопки выше для быстрой навигации
• Нажми "Открыть учебный центр" для полного доступа ко всем материалам
• Команда /progress - твой прогресс обучения
• Команда /help - помощь и поддержка

🎯 *Совет:* Начни с первого модуля и постепенно продвигайся по темам!`;

		await ctx.reply(instructions, {
			parse_mode: 'Markdown',
		});
	} catch (error) {
		console.error('Error in start command:', error);
		await ctx.reply(
			'❌ Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.'
		);
	}
}
