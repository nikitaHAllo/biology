import { Bot, Context } from 'grammy';
import dotenv from 'dotenv';
import { progressCommand } from './commands/progress';
import { helpCommand } from './commands/help';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN || '');

// Global error handler so the bot doesn't crash
bot.catch(err => {
  console.error('BotError', err);
});

bot.command('start', async ctx => {
  const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const url = rawUrl.replace(/\/+$/, '');
  const isHttps = url.startsWith('https://');
  try {
    if (isHttps) {
      await ctx.reply('🔗 Открыть Mini App', {
        reply_markup: { inline_keyboard: [[{ text: 'Открыть', web_app: { url } }]] },
      });
    } else {
      await ctx.reply('Внимание: Web App требует HTTPS. Пок�� используется не-HTTPS URL.');
      await ctx.reply('Открыть Mini App в браузере', {
        reply_markup: { inline_keyboard: [[{ text: 'Открыть в браузере', url }]] },
      });
    }
  } catch (e) { console.error('Failed to send start message', e); }
});

bot.command('progress', progressCommand);
bot.command('help', helpCommand);

// Basic handler for photo/doc submissions (assignment flow)
bot.on(['message:photo','message:document'], async (ctx: Context) => {
  const caption = ctx.msg?.caption || '';
  const match = caption.match(/assignment:(\d+)/i);
  if (!match) return ctx.reply('Для отправки работы добавьте подпись вида: assignment:<lessonId>');

  const lessonId = match[1];
  const file = (ctx.msg as any)?.document || (ctx.msg as any)?.photo?.slice(-1)[0];
  const fileId = file?.file_id;
  const fileType = (ctx.msg as any)?.document ? 'document' : 'photo';

  if (!fileId) return ctx.reply('Не удалось получить файл. Попробуйте ещё раз.');

  await ctx.reply('Работа принята! Она будет зарегистрирована и передана на проверку.');
});

export const initBot = () => {
  bot.start();
  console.log('Bot started successfully');
};
