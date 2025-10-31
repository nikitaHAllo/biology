import express from 'express';
import { coursesService } from '../../features/courses.service';

const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const data = await coursesService.lessonById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (e) { next(e as Error); }
});

export const lessonsRouter = router;
