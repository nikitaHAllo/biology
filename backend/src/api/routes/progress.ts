// src/bot/commands/progress.ts
import { Context } from 'grammy';
import { usersService } from '../../features/users.service';

export async function progressCommand(ctx: Context) {
	const tgId = String(ctx.from?.id || '');
	if (!tgId) return ctx.reply('Не удалось определить ваш Telegram ID');

	const profile = await usersService.profile(tgId);
	if (!profile)
		return ctx.reply('Профиль не найден. Зарегистрируйтесь через /start');

	const completed = profile.progress.completedLessons ?? 0;
	const coins = profile.coins ?? 0;
	return ctx.reply(
		`Прогресс: ${completed} уроков завершено\nРепкоины: ${coins}`
	);
}
