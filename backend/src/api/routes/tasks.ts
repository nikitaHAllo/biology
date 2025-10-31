import express from 'express';
import { tasksService } from '../../features/tasks.service';
import { rateLimit } from '../middleware/rateLimit';

const router = express.Router();

router.get('/lesson/:id', async (req, res, next) => {
  try {
    const data = await tasksService.byLesson(req.params.id);
    res.json(data);
  } catch (e) { next(e as Error); }
});

router.post('/:id/submit', rateLimit('task_submit'), async (req, res, next) => {
  try {
    const { telegram_id, answer } = req.body;
    const result = await tasksService.submit(req.params.id, telegram_id, answer);
    res.json(result);
  } catch (e) { next(e as Error); }
});

export const tasksRouter = router;
