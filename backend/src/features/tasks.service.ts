import { query } from '../db';

export const tasksService = {
  async byLesson(lessonId: string) {
    const res = await query(
      'SELECT id, lesson_id, type, question, options, reward_coins FROM tasks WHERE lesson_id = $1 ORDER BY id',
      [lessonId]
    );
    return res.rows;
  },
  async submit(taskId: string, userTelegramId: string, answer: any) {
    // Fetch task
    const taskRes = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskRes.rows[0];
    if (!task) return { ok: false, message: 'Task not found' };

    // Fetch user
    const userRes = await query('SELECT * FROM users WHERE telegram_id = $1', [userTelegramId]);
    const user = userRes.rows[0];
    if (!user) return { ok: false, message: 'User not found' };

    let isCorrect = false;
    if (task.type === 'single' || task.type === 'multiple') {
      isCorrect = JSON.stringify(answer) === JSON.stringify(task.answer);
    } else if (task.type === 'text') {
      // naive text compare, TODO: more sophisticated later
      isCorrect = (String(answer || '').trim().toLowerCase() === String(task.answer || '').trim().toLowerCase());
    }

    // Prevent double reward for already solved task
    const exists = await query('SELECT 1 FROM user_task_results WHERE user_id = $1 AND task_id = $2 AND is_correct = true', [user.id, task.id]);
    if (exists.rowCount && exists.rowCount > 0) {
      // just record attempt without reward
      await query('INSERT INTO user_task_results (user_id, task_id, is_correct) VALUES ($1, $2, $3)', [user.id, task.id, isCorrect]);
      return { ok: true, correct: isCorrect, reward: 0 };
    }

    // Record attempt
    await query('INSERT INTO user_task_results (user_id, task_id, is_correct) VALUES ($1, $2, $3)', [user.id, task.id, isCorrect]);

    let reward = 0;
    if (isCorrect) {
      reward = task.reward_coins || 0;
      await query('UPDATE users SET coins = coins + $1 WHERE id = $2', [reward, user.id]);
      await query('INSERT INTO wallet_transactions (user_id, type, amount, source) VALUES ($1, $2, $3, $4)', [user.id, 'credit', reward, 'quiz']);
    }

    return { ok: true, correct: isCorrect, reward };
  },
};
