import { query } from '../db';

export type Course = { id: number; title: string; description?: string };
export type Lesson = {
	id: number;
	course_id: number;
	title: string;
	content?: string;
	order_index: number;
};

export const coursesService = {
	async list(): Promise<Course[]> {
		const res = await query<Course>(
			'SELECT id, title, description FROM courses ORDER BY id'
		);
		return res.rows;
	},

	async lessons(courseId: string): Promise<Lesson[]> {
		const res = await query<Lesson>(
			'SELECT id, title, content, order_index FROM lessons WHERE course_id = $1 ORDER BY order_index',
			[courseId]
		);
		return res.rows;
	},

	async lessonById(id: string): Promise<Lesson | null> {
		const res = await query<Lesson>(
			'SELECT id, course_id, title, content, order_index FROM lessons WHERE id = $1',
			[id]
		);
		return res.rows[0] || null;
	},
};
