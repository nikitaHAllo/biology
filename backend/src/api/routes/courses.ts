import express from 'express';
import { coursesService } from '../../features/courses.service';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await coursesService.list();
    res.json(data);
  } catch (e) { next(e as Error); }
});

router.get('/:id/lessons', async (req, res, next) => {
  try {
    const data = await coursesService.lessons(req.params.id);
    res.json(data);
  } catch (e) { next(e as Error); }
});

export const coursesRouter = router;
