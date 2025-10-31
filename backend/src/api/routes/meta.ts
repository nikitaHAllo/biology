// src/bot/commands/meta.ts
import { Context } from 'grammy';

export async function botHealth(ctx: Context) {
	if (process.env.BOT_TOKEN)
		return ctx.reply('Бот запущен и готов к работе ✅');
	return ctx.reply('BOT_TOKEN не настроен ❌');
}

export async function config(ctx: Context) {
	const price = Number(process.env.ASSIGNMENT_PRICE || 10);
	return ctx.reply(`Стоимость отправки задания: ${price} репкоинов`);
}
