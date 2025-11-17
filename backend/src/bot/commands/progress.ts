import { Context } from 'grammy';
import { User, UserProgress } from '../../models';

export async function progressCommand(ctx: Context): Promise<void> {
	try {
		const tgId = ctx.from?.id;
		if (!tgId) {
			await ctx.reply('❌ Не удалось определить ваш Telegram ID');
			return;
		}

		// Ищем пользователя с прогрессом
		const user = (await User.findOne({
			where: { telegram_id: tgId },
			attributes: ['id', 'telegram_id', 'username', 'coins', 'created_at'],
			include: [
				{
					model: UserProgress,
					as: 'progress',
					attributes: ['lesson_id', 'status', 'updated_at'],
				},
			],
		})) as any;

		const userData = user.dataValues;
		if (!userData) {
			await ctx.reply(
				'👋 Профиль не найден. Используйте команду /start для регистрации.'
			);
			return;
		}

		const userProgress = userData.progress || [];
		const completedLessons = userProgress.filter(
			(p: any) => p.status === 'completed'
		).length;
		const inProgressLessons = userProgress.filter(
			(p: any) => p.status === 'in_progress'
		).length;
		const totalLessons = userProgress.length;
		const coins = userData.coins || 0;

		// Форматируем дату регистрации
		const registrationDate = new Date(userData.created_at).toLocaleDateString(
			'ru-RU'
		);

		// Создаем красивое сообщение с прогрессом
		let progressMessage = `🎓 *Ваш учебный прогресс*\n\n`;

		// Основная статистика
		progressMessage += `📊 *Основная статистика:*\n`;
		progressMessage += `✅ Завершено уроков: *${completedLessons}*\n`;
		progressMessage += `🔄 В процессе: *${inProgressLessons}*\n`;
		progressMessage += `📚 Всего уроков: *${totalLessons}*\n`;
		progressMessage += `💰 Репкоины: *${coins}*\n\n`;

		// Прогресс в процентах
		if (totalLessons > 0) {
			const completionRate = Math.round(
				(completedLessons / totalLessons) * 100
			);
			progressMessage += `📈 *Общий прогресс:* ${completionRate}%\n\n`;
		}

		// Достижения (если есть)
		if (completedLessons >= 10) {
			progressMessage += `🏆 *Достижения:*\n`;
			if (completedLessons >= 10)
				progressMessage += `• 📚 Начинающий (10 уроков)\n`;
			if (completedLessons >= 25)
				progressMessage += `• 🎯 Опытный (25 уроков)\n`;
			if (completedLessons >= 50)
				progressMessage += `• 🏅 Мастер (50 уроков)\n`;
			if (completedLessons >= 100)
				progressMessage += `• 👑 Эксперт (100 уроков)\n`;
			progressMessage += `\n`;
		}

		// Советы в зависимости от прогресса
		if (completedLessons === 0) {
			progressMessage += `💡 *Совет:* Начните с первого урока в разделе "Курсы"!\n`;
		} else if (completedLessons < 5) {
			progressMessage += `💡 *Совет:* Продолжайте в том же духе! Каждый урок приближает вас к цели.\n`;
		} else if (completedLessons < 20) {
			progressMessage += `💡 *Совет:* Отличные результаты! Не забывайте повторять пройденный материал.\n`;
		} else {
			progressMessage += `💡 *Совет:* Вы на правильном пути! Рассмотрите задания 2-й части для углубления знаний.\n`;
		}

		progressMessage += `\n👤 Зарегистрирован: ${registrationDate}`;

		await ctx.reply(progressMessage, {
			parse_mode: 'Markdown',
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: '🚀 Открыть учебный центр',
							web_app: {
								url: process.env.FRONTEND_URL || 'http://localhost:3000',
							},
						},
					],
					[
						{ text: '📚 Мои курсы', callback_data: 'show_my_courses' },
						{ text: '🎯 Продолжить', callback_data: 'continue_learning' },
					],
				],
			},
		});
	} catch (error) {
		console.error('Error in progress command:', error);
		await ctx.reply(
			'❌ Произошла ошибка при получении прогресса. Пожалуйста, попробуйте позже.'
		);
	}
}
