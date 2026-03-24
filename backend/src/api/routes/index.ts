import { Router } from 'express';
import { usersRouter } from './users.routes';
import { authRouter } from './auth.routes';
import { materialsRouter } from './materials.routes';
import { quizzesRouter } from './quizzes.routes';
import { tasksRouter } from './tasks.routes';
import { downloadsRouter } from './downloads.routes';
import { biogardenRouter } from './biogarden.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/materials', materialsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/tasks', tasksRouter);
router.use('/downloads', downloadsRouter);
router.use('/biogarden', biogardenRouter);

export { router as apiRouter };
