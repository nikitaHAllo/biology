// src/bot/commands/courses.ts
import { Context } from 'grammy';
import { coursesService } from '../../features/courses.service';

export async function listCourses(ctx: Context) {
	const courses = await coursesService.list();
	if (!courses.length) return ctx.reply('Курсы пока не созданы.');
	const message = courses.map(c => `${c.id}. ${c.title}`).join('\n'); // <-- вместо c.name используем c.title
	return ctx.reply(`Список курсов:\n${message}`);
}

export async function listLessons(ctx: Context, courseId: string) {
	const lessons = await coursesService.lessons(courseId);
	if (!lessons.length) return ctx.reply('Уроки для курса пока не созданы.');
	const message = lessons.map(l => `${l.id}. ${l.title}`).join('\n');
	return ctx.reply(`Уроки курса:\n${message}`);
}

export async function showLesson(ctx: Context, lessonId: string) {
	const lesson = await coursesService.lessonById(lessonId);
	if (!lesson) return ctx.reply('Урок не найден.');
	await ctx.reply(
		`Урок: ${lesson.title}\nСодержание: ${lesson.content || '—'}` // <-- используем content вместо description
	);
}
