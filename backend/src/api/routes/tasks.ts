// src/bot/commands/tasks.ts
import { Context } from 'grammy';
import { tasksService } from '../../features/tasks.service';

export async function listTasks(ctx: Context, lessonId: string) {
	const tasks = await tasksService.byLesson(lessonId);
	if (!tasks.length)
		return ctx.reply('Задания для этого урока пока не созданы.');
	const message = tasks.map(t => `${t.id}. ${t.question}`).join('\n'); // <-- вместо t.title используем t.question
	return ctx.reply(`Задания:\n${message}`);
}

export async function submitTask(ctx: Context, taskId: string, answer: string) {
	const tgId = String(ctx.from?.id || '');
	if (!tgId) return ctx.reply('Не удалось определить ваш Telegram ID');

	const result = await tasksService.submit(taskId, tgId, answer);
	return ctx.reply(`Ваш ответ принят. Результат: ${JSON.stringify(result)}`);
}
