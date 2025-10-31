import { Context } from 'grammy';
import { usersService } from '../../features/users.service';

export async function progressCommand(ctx: Context): Promise<void> {
	const tgId = ctx.from?.id?.toString();
	if (!tgId) {
		await ctx.reply('Не удалось определить ваш Telegram ID');
		return;
	}

	const profile = await usersService.profile(tgId);
	if (!profile) {
		await ctx.reply(
			'Профиль не найден. Откройте Mini App и зарегистрируйтесь.'
		);
		return;
	}

	const completed = profile.progress?.completedLessons ?? 0;
	const coins = profile.coins ?? 0;

	await ctx.reply(
		`Ваш прогресс: уроков завершено: ${completed}\nРепкоины: ${coins}`
	);
}
