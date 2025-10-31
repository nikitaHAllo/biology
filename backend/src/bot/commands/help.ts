import { Context } from 'grammy';

export async function helpCommand(ctx: Context): Promise<void> {
	const message = `
Команды:
/start — открыть Mini App
/progress — показать ваш прогресс и баланс
/help — помощь
  `.trim();

	await ctx.reply(message);
}
