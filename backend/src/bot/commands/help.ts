import { Context } from 'grammy';

export async function helpCommand(ctx: Context) {
  return ctx.reply('Команды:\n/start — открыть Mini App\n/progress — показать ваш прогресс и баланс\n/help — помощь');
}
