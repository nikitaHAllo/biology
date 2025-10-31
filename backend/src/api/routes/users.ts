// src/bot/commands/users.ts
import { Context } from 'grammy';
import { usersService } from '../../features/users.service';

export async function registerUser(ctx: Context) {
	const tgId = String(ctx.from?.id || '');
	const username = ctx.from?.username || null;

	if (!tgId) return ctx.reply('Не удалось определить ваш Telegram ID');

	const user = await usersService.registerOrUpdate(tgId, username ?? undefined);

	await ctx.reply(`Вы зарегистрированы. Ваш ID: ${tgId}`);
	return user;
}

export async function showProfile(ctx: Context) {
	const tgId = String(ctx.from?.id || '');
	const profile = await usersService.profile(tgId);
	if (!profile)
		return ctx.reply(
			'Профиль не найден. Зарегистрируйтесь через /start или Mini App'
		);

	const completed = profile.progress.completedLessons ?? 0;
	const coins = profile.coins ?? 0;
	await ctx.reply(
		`Прогресс: ${completed} уроков завершено\nРепкоины: ${coins}`
	);
}
