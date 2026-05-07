import { Router } from 'express';
import { usersRouter } from './users.routes';
import { authRouter } from './auth.routes';
import { materialsRouter } from './materials.routes';
import { quizzesRouter } from './quizzes.routes';
import { tasksRouter } from './tasks.routes';
import { downloadsRouter } from './downloads.routes';
import { biogardenRouter } from './biogarden.routes';
import { geneticsRouter } from './genetics.routes';
import { virusRouter } from './virus.routes';
import { adminRouter } from './admin.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/materials', materialsRouter);
router.use('/quizzes', quizzesRouter);
router.use('/tasks', tasksRouter);
router.use('/downloads', downloadsRouter);
router.use('/biogarden', biogardenRouter);
router.use('/genetics', geneticsRouter);
router.use('/virus', virusRouter);
router.use('/admin', adminRouter);

export { router as apiRouter };
