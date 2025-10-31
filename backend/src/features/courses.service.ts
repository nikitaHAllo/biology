import { query } from '../db';

export const coursesService = {
  async list() {
    const res = await query('SELECT id, title, description FROM courses ORDER BY id');
    return res.rows;
  },
  async lessons(courseId: string) {
    const res = await query(
      'SELECT id, title, content, order_index FROM lessons WHERE course_id = $1 ORDER BY order_index',
      [courseId]
    );
    return res.rows;
  },
  async lessonById(id: string) {
    const res = await query('SELECT id, course_id, title, content, order_index FROM lessons WHERE id = $1', [id]);
    return res.rows[0] || null;
  },
};
