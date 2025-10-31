import express from 'express';
import { assignmentsService } from '../../features/assignments.service';

const router = express.Router();

router.get('/:lesson_id', async (req, res, next) => {
  try {
    const data = await assignmentsService.getByLesson(req.params.lesson_id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { next(e as Error); }
});

router.post('/:assignment_id/submit', async (req, res, next) => {
  try {
    const { telegram_id, file_id, file_type } = req.body;
    const s = await assignmentsService.createSubmission(req.params.assignment_id, telegram_id, file_id, file_type || 'photo');
    res.json({ ok: true, submission: s });
  } catch (e) { next(e as Error); }
});

router.get('/submissions/:telegram_id', async (req, res, next) => {
  try {
    const data = await assignmentsService.listSubmissionsByUser(req.params.telegram_id);
    res.json(data);
  } catch (e) { next(e as Error); }
});

export const assignmentsRouter = router;
