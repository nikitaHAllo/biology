import { Router } from 'express';
import { usersRouter } from './users.routes';
import { materialsRouter } from './materials.routes';
import { quizzesRouter } from './quizzes.routes';
import { tasksRouter } from './tasks.routes';
import { downloadsRouter } from './downloads.routes';

const router = Router();

router.use('/users', usersRouter);
router.use('/materials', materialsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/tasks', tasksRouter);
router.use('/downloads', downloadsRouter);

export { router as apiRouter };
